# Enterprise LMS Project Architecture

This document provides a comprehensive overview of the Enterprise Learning Management System (LMS) architecture. The project leverages a modern microservices-oriented approach, utilizing cloud-native DevOps practices for scalability, reliability, and security.

## 1. High-Level System Architecture

The core system consists of a Frontend application communicating with a Node.js Backend API. The backend interfaces with multiple managed services for data persistence, authentication, and object storage.

```mermaid
graph TD
    User([User / Browser]) -->|HTTPS| Ingress[NGINX Ingress Controller]
    
    subgraph EKS [AWS EKS Cluster]
        Ingress -->|Route /| Frontend[Frontend - Vite/React]
        Ingress -->|Route /api/v1| Backend[Backend - Node.js/Express]
    end

    Backend -->|Read/Write| MongoDB[(MongoDB)]
    Backend -->|Auth| Firebase[Firebase Auth]
    Backend -->|Video/Image Uploads| S3[AWS S3 Bucket]
    
    classDef cluster fill:#f9f9f9,stroke:#333,stroke-width:2px;
    class EKS cluster;
```

### Key Components:
* **Frontend (Vite):** Delivers the User Interface. Runs in an NGINX container to serve static assets efficiently.
* **Backend (Node.js/Express):** Handles core business logic, course management, enrollments, quizzes, and video processing.
* **NGINX Ingress:** Acts as the API Gateway. Routes incoming internet traffic to the correct internal Kubernetes services based on the URL path.
* **MongoDB:** The primary NoSQL database used for fast, flexible, structured data storage (Users, Courses, Progress).
* **Firebase:** Manages user authentication and issues secure JWT tokens.
* **AWS S3:** Scalable object storage used specifically for storing heavy course materials and streaming video uploads.

---

## 2. Infrastructure & CI/CD Architecture

The application is deployed on Amazon Web Services (AWS) using Elastic Kubernetes Service (EKS). The entire infrastructure is provisioned dynamically as code.

```mermaid
graph LR
    Dev[Developer] -->|Git Push| GitHub[GitHub Repository]
    GitHub -->|Webhook| Jenkins[Jenkins CI/CD]
    
    subgraph CICD [CI/CD Pipeline]
        Jenkins -->|1. Build Image| Docker[Docker Build]
        Jenkins -->|2. Push| ECR[AWS ECR]
        Jenkins -->|3. Deploy| EKS[AWS EKS Cluster]
    end

    Terraform[Terraform] -->|Provisions| EKS
    Terraform -->|Provisions| ECR
    Terraform -->|Provisions| S3[AWS S3]
```

### Key Components:
* **Terraform:** Infrastructure-as-Code (IaC) tool that automates the creation of the VPC, Subnets, EKS Cluster, and ECR repositories without manual AWS console clicks.
* **AWS ECR:** A private container registry storing the versioned Docker images for both the frontend and backend.
* **Jenkins:** The CI/CD pipeline server that listens to GitHub pushes, automatically builds the latest Docker images, and applies updated Kubernetes manifests (`deployment.yaml`) to the cluster.

---

## 3. Observability & Monitoring Architecture

To ensure high availability and prevent downtime, the cluster implements a robust monitoring stack capable of tracking application health, hardware performance metrics, and bottlenecks.

```mermaid
graph TD
    subgraph EKS [AWS EKS Cluster]
        Backend[Backend Pods] -->|Exposes /metrics| Prometheus[Prometheus Scraper]
        Node[EKS Worker Nodes] -->|cAdvisor| Prometheus
        
        Prometheus -->|Data Source| Grafana[Grafana Dashboards]
    end
    
    Admin([DevOps Engineer]) -->|View| Grafana
```

### Key Components:
* **Prometheus:** A time-series database that continuously scrapes the `/metrics` endpoint from the Node.js backend (using the `prom-client` library) and records Kubernetes node health.
* **Grafana:** Visualizes the raw Prometheus data, providing beautiful, real-time dashboards for Process CPU usage, Event Loop Lag, Memory Consumption, and Active Handlers.

---

## 4. Video Upload & Data Flow Architecture

A critical component of the LMS is the ability to upload and stream large video files securely.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant AWS_S3 as AWS S3 Bucket
    
    User->>Frontend: Selects Video File
    Frontend->>Backend: POST /api/v1/upload (Multipart Form)
    Backend->>Backend: Validate File Type & Size Limit
    Backend->>AWS_S3: Stream directly to S3 via multer-s3
    AWS_S3-->>Backend: Return public S3 URL
    Backend-->>Frontend: 200 OK (Returns Video URL)
    Frontend->>User: Display Video Player
```
