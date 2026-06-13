# 🎓 DevOPS LMS — Enterprise Learning Management Ecosystem

[![CI/CD](https://img.shields.io/badge/CI%2FCD-Jenkins-red?logo=jenkins)](jenkins/Jenkinsfile)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)](docker-compose.yml)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-EKS-326CE5?logo=kubernetes)](k8s/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-623CE4?logo=terraform)](terraform/)
[![Monitoring](https://img.shields.io/badge/Monitoring-Prometheus%20%2B%20Grafana-orange?logo=grafana)](k8s/monitoring/)

A **production-ready Learning Management System** demonstrating the complete DevOps lifecycle: from application development to containerization, CI/CD automation, cloud deployment, autoscaling, and observability.

---

## 🏗️ Architecture

```
User → ALB/Ingress → React Frontend (K8s)
                   → Node.js Backend (K8s) → MongoDB Atlas
                                           → Firebase Auth
                                           → AWS S3
```

Full architecture details: [ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🚀 Features

### 🎓 Student
- Google Sign-In via Firebase
- Browse & enroll in courses
- Watch HD video lectures (S3 signed URLs)
- Download notes & resources
- Attempt auto-graded quizzes
- Track course progress
- Download verifiable certificates

### 👨‍🏫 Instructor
- Create, edit, delete courses
- Upload video lectures & resources to AWS S3
- Create quizzes with multiple choice questions
- View enrolled students & progress

### 🔐 Admin
- Manage users & roles (student/instructor/admin)
- Activate/deactivate accounts
- View platform analytics with charts
- Access all courses

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express.js |
| Auth | Firebase Authentication (Google) |
| Database | MongoDB Atlas |
| Storage | AWS S3 |
| Container | Docker, Docker Compose |
| Orchestration | Kubernetes (AWS EKS) |
| CI/CD | Jenkins |
| IaC | Terraform |
| Monitoring | Prometheus + Grafana |

---

## 📁 Project Structure

```
devOPS_LMS/
├── frontend/          # React + Vite application
├── backend/           # Node.js + Express API
├── k8s/               # Kubernetes manifests
│   ├── frontend/
│   ├── backend/
│   ├── monitoring/
│   └── ingress/
├── terraform/         # Infrastructure as Code
│   └── modules/
│       ├── eks/
│       ├── s3/
│       ├── iam/
│       └── vpc/
├── jenkins/           # Jenkinsfile (CI/CD)
├── docs/              # Project documentation
└── docker-compose.yml
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Firebase project with Google Auth enabled
- MongoDB Atlas cluster
- AWS account (for S3)

### 1. Clone & Configure
```bash
git clone <repo-url>
cd devOPS_LMS

# Backend config
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend config
cp frontend/.env.example frontend/.env
# Edit frontend/.env with Firebase config
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health
- Metrics: http://localhost:5000/metrics

### 3. Run Locally (without Docker)
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

---

## 🌐 Deployment

Full deployment guide: [DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Quick Deploy
```bash
# 1. Provision infrastructure
cd terraform && terraform init && terraform plan && terraform apply

# 2. Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name lms-eks-cluster

# 3. Create K8s secrets
kubectl create secret generic lms-backend-secrets \
  --from-literal=MONGODB_URI='<uri>' \
  --from-literal=FIREBASE_PROJECT_ID='<id>' \
  # ... (see DEPLOYMENT.md)
  -n lms

# 4. Deploy workloads
kubectl apply -f k8s/
```

---

## 📊 Monitoring

- **Prometheus**: http://prometheus:9090 (cluster-internal)
- **Grafana**: http://grafana:3000 (cluster-internal)
  - Default credentials: admin / lms-grafana-admin
  - Preconfigured datasource: Prometheus
  - Dashboards: CPU, Memory, Pod count, Request rates

---

## 🔐 Credentials Required

The following must be provided before full functionality:

| Credential | Where Needed | How to Set |
|-----------|-------------|-----------|
| Firebase project config | Frontend `.env` | Firebase Console → Project Settings |
| Firebase Admin SDK | Backend `.env` | Firebase Console → Service Accounts |
| MongoDB Atlas URI | Backend `.env` | Atlas Dashboard → Connect |
| AWS Keys | Backend `.env` + Terraform | AWS IAM Console |

---

## 📚 Documentation

| Doc | Description |
|-----|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture & design decisions |
| [SETUP.md](docs/SETUP.md) | Step-by-step local setup guide |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment on AWS EKS |
| [DEVOPS.md](docs/DEVOPS.md) | CI/CD pipeline, Kubernetes, Terraform details |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Complete REST API reference |

---

## 📄 License

MIT License — see [LICENSE](LICENSE)
