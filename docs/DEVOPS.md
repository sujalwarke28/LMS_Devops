# DEVOPS.md — DevOps Implementation Reference

## Branching Strategy

```
main         ← Production deployments (protected)
develop      ← Integration branch
feature/*    ← Feature branches (PR → develop)
hotfix/*     ← Production hotfixes (PR → main + develop)
release/*    ← Release candidates
```

### Branch Protection Rules (GitHub)
- `main`: Require PR, require 1 review, require CI pass, no force push
- `develop`: Require PR, require CI pass

---

## CI/CD Pipeline (Jenkins)

### Pipeline Flow

```
GitHub Push
  → Jenkins Webhook Trigger
    → Stage 1: Checkout
    → Stage 2: Backend Test (npm ci, lint, jest)
    → Stage 3: Frontend Install (npm ci)
    → Stage 4: Docker Build (parallel: backend + frontend)
    → Stage 5: Push to ECR (main/develop only)
    → Stage 6: Deploy to EKS (main only)
    → Stage 7: Smoke Test
    → Post: Cleanup
```

### Required Jenkins Credentials

| Credential ID | Type | Value |
|--------------|------|-------|
| `aws-credentials` | AWS credentials | Access Key + Secret |
| `aws-account-id` | String | AWS Account ID |
| `vite-firebase-api-key` | String | Firebase API Key |
| `vite-firebase-auth-domain` | String | Firebase Auth Domain |
| `vite-firebase-project-id` | String | Firebase Project ID |
| `vite-firebase-storage-bucket` | String | Firebase Storage Bucket |
| `vite-firebase-sender-id` | String | Firebase Messaging Sender ID |
| `vite-firebase-app-id` | String | Firebase App ID |

### Jenkins Setup

1. Install Jenkins with plugins: Git, Pipeline, Docker Pipeline, AWS Credentials, Kubernetes CLI
2. Configure GitHub webhook: `http://<jenkins-url>/github-webhook/`
3. Create Pipeline job pointing to `jenkins/Jenkinsfile`
4. Add credentials in Jenkins Credentials Manager

---

## Kubernetes Architecture

```
Namespace: lms
├── Deployments
│   ├── lms-backend  (2→10 replicas, HPA)
│   └── lms-frontend (2→6 replicas, HPA)
├── Services
│   ├── lms-backend  (ClusterIP :5000)
│   └── lms-frontend (ClusterIP :80)
├── Ingress
│   └── lms-ingress  (Nginx → routes /api to backend, / to frontend)
├── ConfigMaps
│   └── lms-backend-config
├── Secrets
│   └── lms-backend-secrets
└── Monitoring
    ├── prometheus  (ClusterIP :9090)
    └── grafana     (ClusterIP :3000)
```

### HPA Configuration

**Backend HPA**:
- Min replicas: 2
- Max replicas: 10
- Scale up at: CPU > 60% or Memory > 70%
- Scale up: +2 pods per 60s
- Scale down: -1 pod per 120s (with 5min stabilization)

**Frontend HPA**:
- Min replicas: 2
- Max replicas: 6
- Scale up at: CPU > 70%

### Demonstrate Autoscaling

```bash
# Install load generator
kubectl run load-gen --image=busybox --restart=Never -it --rm -- \
  sh -c "while true; do wget -q -O- http://lms-backend:5000/health; done"

# Watch HPA
kubectl get hpa -n lms -w

# Watch pods scale
kubectl get pods -n lms -w
```

---

## Terraform Modules

```
terraform/
├── main.tf           # Module composition + S3 backend
├── variables.tf      # All configurable variables
├── outputs.tf        # Useful outputs
└── modules/
    ├── vpc/          # VPC, subnets, NAT, IGW, route tables
    ├── eks/          # EKS cluster, node group, IAM roles
    ├── s3/           # S3 bucket + security config
    └── iam/          # App user, S3 policy, ECR repos
```

### Common Commands

```bash
# Initialize
terraform init

# Validate
terraform validate

# Plan (dry run)
terraform plan

# Apply
terraform apply

# Destroy all
terraform destroy

# Show outputs
terraform output

# Import existing resource
terraform import aws_s3_bucket.example bucket-name
```

---

## Monitoring

### Prometheus Metrics Collected

| Metric | Description |
|--------|-------------|
| `lms_http_requests_total` | Total HTTP requests |
| `lms_http_request_duration_seconds` | Request duration histogram |
| `lms_nodejs_heap_size_total_bytes` | Node.js heap size |
| `lms_nodejs_active_handles_total` | Active async handles |
| `process_cpu_seconds_total` | CPU usage |
| `process_resident_memory_bytes` | Memory usage |

### Grafana Dashboards

Recommended dashboards to import (by ID):
- **Node.js Application**: 11159
- **Kubernetes Cluster**: 15661
- **Nginx Ingress**: 9614

### Alert Rules (Recommended)

```yaml
# Add to prometheus configmap
groups:
  - name: lms.rules
    rules:
      - alert: HighCPU
        expr: rate(process_cpu_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.pod }}"

      - alert: PodDown
        expr: kube_pod_status_ready{namespace="lms"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Pod {{ $labels.pod }} is not ready"
```

---

## Docker Image Strategy

| Image | Base | Size Target | Build Strategy |
|-------|------|-------------|----------------|
| lms-backend | node:20-alpine | ~180MB | Multi-stage |
| lms-frontend | nginx:1.25-alpine | ~30MB | Multi-stage Vite build |

### ECR Lifecycle Policy
- Keep last 10 images
- Auto-expire older images
- Scan on push enabled

---

## Security Checklist

- [x] Non-root containers
- [x] Read-only root filesystem where possible
- [x] K8s Secrets for sensitive values
- [x] S3 bucket public access blocked
- [x] S3 server-side encryption (AES256)
- [x] Firebase token verification (not just trusted)
- [x] Rate limiting on all API routes
- [x] Helmet.js security headers
- [x] CORS restricted to known origins
- [x] ECR image scanning enabled
- [x] EKS cluster logging enabled
- [ ] TLS/HTTPS via cert-manager (configure with your domain)
- [ ] Network policies (restrict inter-pod communication)
- [ ] Secrets encryption at rest (EKS KMS)
