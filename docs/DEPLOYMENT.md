# DEPLOYMENT.md — Production Deployment Guide

## Prerequisites

- AWS CLI configured (`aws configure`)
- Terraform 1.5+
- kubectl
- Docker

---

## Phase 1: Infrastructure Provisioning (Terraform)

```bash
cd terraform

# Initialize (downloads providers, configures S3 backend)
terraform init

# Review plan
terraform plan -var="environment=prod"

# Apply (creates EKS, S3, IAM, VPC)
terraform apply -var="environment=prod"
```

> ⚠️ This creates billable AWS resources. The EKS cluster costs ~$0.10/hr.

**Outputs to note:**
- `eks_cluster_name`
- `s3_bucket_name`
- `ecr_backend_url`
- `ecr_frontend_url`

---

## Phase 2: Configure kubectl

```bash
aws eks update-kubeconfig \
  --region ap-south-1 \
  --name lms-eks-cluster-prod
```

Verify:
```bash
kubectl get nodes
kubectl cluster-info
```

---

## Phase 3: Install Nginx Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml
```

---

## Phase 4: Install Metrics Server (for HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

## Phase 5: Create Kubernetes Secrets

```bash
kubectl apply -f k8s/namespace.yaml

kubectl create secret generic lms-backend-secrets \
  --from-literal=MONGODB_URI='mongodb+srv://...' \
  --from-literal=FIREBASE_PROJECT_ID='your-project-id' \
  --from-literal=FIREBASE_PRIVATE_KEY_ID='key-id' \
  --from-literal=FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n' \
  --from-literal=FIREBASE_CLIENT_EMAIL='firebase-adminsdk@project.iam.gserviceaccount.com' \
  --from-literal=FIREBASE_CLIENT_ID='client-id' \
  --from-literal=AWS_ACCESS_KEY_ID='AKIAXXXXXXXX' \
  --from-literal=AWS_SECRET_ACCESS_KEY='secret' \
  --from-literal=AWS_S3_BUCKET_NAME='lms-media-bucket-prod' \
  -n lms
```

---

## Phase 6: Build & Push Docker Images

```bash
# Set ECR registry
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com"

# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Build & push backend
docker build -t ${ECR_REGISTRY}/lms-backend:latest ./backend
docker push ${ECR_REGISTRY}/lms-backend:latest

# Build & push frontend (with Firebase config as build args)
docker build \
  --build-arg VITE_FIREBASE_API_KEY=... \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=... \
  --build-arg VITE_FIREBASE_PROJECT_ID=... \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=... \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=... \
  --build-arg VITE_FIREBASE_APP_ID=... \
  --build-arg VITE_API_BASE_URL=/api/v1 \
  -t ${ECR_REGISTRY}/lms-frontend:latest ./frontend
docker push ${ECR_REGISTRY}/lms-frontend:latest
```

---

## Phase 7: Update Image References

```bash
# Replace placeholder in manifests
sed -i "s|<AWS_ACCOUNT_ID>|${AWS_ACCOUNT_ID}|g" k8s/backend/deployment.yaml k8s/frontend/frontend.yaml
```

---

## Phase 8: Deploy to Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend/ -n lms
kubectl apply -f k8s/frontend/ -n lms
kubectl apply -f k8s/ingress/ -n lms
kubectl apply -f k8s/monitoring/ -n lms

# Verify
kubectl get pods -n lms
kubectl get svc -n lms
kubectl get ingress -n lms
```

---

## Phase 9: Configure Domain

1. Get Ingress ALB hostname:
```bash
kubectl get ingress lms-ingress -n lms -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

2. Create CNAME record in your DNS provider:
   - `lms.yourdomain.com` → ALB hostname

3. Update `k8s/ingress/ingress.yaml` with your domain and re-apply.

---

## Phase 10: Verify Deployment

```bash
# Check all pods running
kubectl get pods -n lms

# Check HPA
kubectl get hpa -n lms

# Test health endpoint
curl https://lms.yourdomain.com/health

# Test API
curl https://lms.yourdomain.com/api/v1/courses
```

---

## Monitoring Access

```bash
# Port-forward Grafana locally
kubectl port-forward svc/grafana 3001:3000 -n lms
# Open http://localhost:3001 (admin / lms-grafana-admin)

# Port-forward Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n lms
# Open http://localhost:9090
```

---

## Rollback

```bash
kubectl rollout undo deployment/lms-backend -n lms
kubectl rollout undo deployment/lms-frontend -n lms
```

---

## Destroy Infrastructure

```bash
cd terraform
terraform destroy -var="environment=prod"
```
