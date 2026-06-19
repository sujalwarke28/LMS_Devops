# Project VIVA: Comprehensive DevOps & LMS Q&A

This document contains a comprehensive list of VIVA (Interview/Oral Exam) questions tailored specifically to your DevOps Learning Management System (LMS) project. It covers all the technologies, architectural decisions, and conceptual knowledge you will need.

---

## Table of Contents
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Git & GitHub](#2-git--github)
3. [Docker & Containerization](#3-docker--containerization)
4. [Kubernetes & AWS EKS](#4-kubernetes--aws-eks)
5. [Ingress & NGINX](#5-ingress--nginx)
6. [Jenkins & CI/CD](#6-jenkins--cicd)
7. [Terraform & Infrastructure as Code](#7-terraform--infrastructure-as-code)
8. [Prometheus, Grafana & Monitoring](#8-prometheus-grafana--monitoring)
9. [Elasticsearch & Kibana (Logging)](#9-elasticsearch--kibana-logging)
10. [HashiCorp Vault & Security](#10-hashicorp-vault--security)
11. [Disaster Recovery & High Availability](#11-disaster-recovery--high-availability)

---

## 1. Project Overview & Architecture

**Q1: What is the main objective of your DevOps LMS project?**  
**A:** To build a highly available, scalable Learning Management System and deploy it using modern DevOps practices. This includes automated CI/CD pipelines, container orchestration, infrastructure as code, and robust monitoring.

**Q2: Describe the architecture of your application.**  
**A:** It consists of a React/Vite frontend and a Node.js backend. Both are containerized using Docker, stored in AWS ECR, and deployed to an AWS EKS (Kubernetes) cluster. Traffic is routed via an NGINX Ingress Controller. The infrastructure is provisioned using Terraform, and deployments are automated via Jenkins.

**Q3: Why did you choose a Microservices/Multi-tier architecture over a Monolith?**  
**A:** It allows the frontend and backend to scale independently. If the backend API experiences heavy load during a quiz submission, it can scale via Horizontal Pod Autoscaler (HPA) without needing to duplicate the frontend frontend containers.

**Q4: How do the frontend and backend communicate?**  
**A:** The frontend makes HTTP REST API calls to the backend. In Kubernetes, the NGINX Ingress routes `/api` traffic to the backend service, and all other traffic `/` to the frontend service.

**Q5: What is the difference between Continuous Integration (CI) and Continuous Deployment (CD) in your project?**  
**A:** CI is handled partially by GitHub Actions (linting/testing) and Jenkins (building Docker images). CD is handled entirely by Jenkins, which takes the built image and automatically updates the Kubernetes deployment using `kubectl set image`.

**Q6: What AWS services did you use?**  
**A:** EKS (Elastic Kubernetes Service) for orchestration, ECR (Elastic Container Registry) for storing images, IAM for permissions, ELB (Elastic Load Balancing) provisioned by Ingress, and potentially S3 for Terraform state or asset storage.

**Q7: How do you handle environment variables in your deployment?**  
**A:** During the Docker build process in Jenkins, variables (like Firebase keys) are passed as build arguments. In Kubernetes, secrets and configmaps (or HashiCorp Vault) are used to inject runtime environment variables into the pods.

**Q8: If your cluster goes down, how fast can you spin it back up?**  
**A:** Because the entire infrastructure is codified in Terraform and the deployment in a Jenkinsfile, we can spin up a new cluster and deploy the application in a matter of minutes, achieving a very low Recovery Time Objective (RTO).

**Q9: What happens when a developer pushes code to the `main` branch?**  
**A:** GitHub Actions triggers a quick test. Then, a Jenkins webhook triggers the pipeline. Jenkins checks out the code, runs tests, builds Docker images, pushes them to AWS ECR, and runs `kubectl apply/set image` to deploy the new version to EKS.

**Q10: What were the biggest challenges you faced during this project?**  
**A:** (Personalize this) Common challenges include configuring IAM permissions for EKS, setting up the NGINX Ingress Controller correctly to provision an AWS Load Balancer, and managing Terraform state securely.

---

## 2. Git & GitHub

**Q11: What is Git and how is it different from GitHub?**  
**A:** Git is a distributed version control system used locally to track changes in code. GitHub is a cloud-based hosting service that manages Git repositories and adds collaboration features like Pull Requests and Actions.

**Q12: Explain the Git branching strategy you used.**  
**A:** We used a feature-branch workflow. Developers create branches like `feature/login`, commit changes, and open a Pull Request to `develop` or `main`.

**Q13: What is a Pull Request (PR)?**  
**A:** A mechanism to notify team members that a feature is complete. It allows for code review, automated CI checks, and discussion before merging the code into the main branch.

**Q14: How did you use GitHub Actions?**  
**A:** We created a `ci.yml` workflow that automatically runs Node.js linting and unit tests whenever a push or PR is made to main/develop branches.

**Q15: What is a merge conflict and how do you resolve it?**  
**A:** It happens when two branches modify the same line of a file. It is resolved manually by editing the conflicting file to keep the desired changes, then staging and committing the resolved file.

**Q16: What does `git rebase` do?**  
**A:** It rewrites commit history by moving the base of your feature branch to the tip of the target branch, creating a linear, cleaner history compared to `git merge`.

**Q17: Why do you need a `.gitignore` file?**  
**A:** To prevent unnecessary, sensitive, or generated files (like `node_modules`, `.env`, build artifacts) from being tracked and pushed to the remote repository.

**Q18: What is GitOps? Is your project using it?**  
**A:** GitOps uses Git as the single source of truth for declarative infrastructure and applications. While we use IAC (Terraform), full GitOps usually implies using tools like ArgoCD. We are using a push-based CI/CD via Jenkins.

**Q19: Explain `git stash`.**  
**A:** It temporarily shelves (saves) changes you've made to your working directory so you can work on something else, and then re-apply them later.

**Q20: How do you revert a bad commit that has already been pushed?**  
**A:** By using `git revert <commit-hash>`, which creates a new commit that undoes the changes of the bad commit without rewriting history.

---

## 3. Docker & Containerization

**Q21: What is Docker and why did you use it?**  
**A:** Docker is a platform for developing, shipping, and running applications in containers. It guarantees that our app runs the exact same way on a developer's laptop, in Jenkins, and in production on AWS EKS.

**Q22: What is the difference between a Container and a Virtual Machine?**  
**A:** VMs virtualize the hardware and require a full guest OS. Containers virtualize the operating system, sharing the host OS kernel, making them much lighter, faster to start, and less resource-intensive.

**Q23: Explain the structure of your Dockerfile.**  
**A:** It starts with a base image (e.g., `node:20`), sets a working directory, copies `package.json`, runs `npm install`, copies the source code, exposes a port, and defines the `CMD` to start the app.

**Q24: What are Docker image layers?**  
**A:** Each instruction in a Dockerfile creates a read-only layer. Layers are cached. If a file changes, only that layer and the ones below it are rebuilt. This is why we copy `package.json` before the rest of the source code—to cache npm dependencies.

**Q25: What is the difference between `COPY` and `ADD` in a Dockerfile?**  
**A:** Both copy files into the image, but `ADD` can also extract tar files and download files from URLs. `COPY` is preferred for standard file copying.

**Q26: What is a multi-stage Docker build?**  
**A:** Using multiple `FROM` statements in a Dockerfile. It allows you to build the application in one stage (which includes heavy build tools) and copy only the compiled artifacts to a tiny final runtime image, reducing image size.

**Q27: Where do you store your Docker images?**  
**A:** In Amazon Elastic Container Registry (ECR). It acts like a private Docker Hub integrated securely with AWS IAM.

**Q28: What is `docker-compose` used for in your project?**  
**A:** It's used for spinning up the entire stack locally for development or testing, allowing us to run the frontend, backend, and a local database with a single `docker-compose up` command.

**Q29: How do you handle persistent data in Docker?**  
**A:** By using Docker Volumes, which map a directory inside the container to a directory on the host machine, ensuring data survives container deletion.

**Q30: What is the purpose of the `.dockerignore` file?**  
**A:** Similar to `.gitignore`, it prevents unnecessary files (like `node_modules` from the host) from being sent to the Docker daemon during the build, speeding up the build process.

---

## 4. Kubernetes & AWS EKS

**Q31: What is Kubernetes (K8s)?**  
**A:** An open-source container orchestration engine for automating deployment, scaling, and management of containerized applications.

**Q32: Why did you choose AWS EKS?**  
**A:** EKS is a managed Kubernetes service. It handles the complexity of managing the Kubernetes control plane (Master nodes), allowing us to focus only on deploying worker nodes and our applications.

**Q33: What is a Pod?**  
**A:** The smallest, most basic deployable object in Kubernetes. A pod encapsulates one or more containers, storage resources, and a unique network IP.

**Q34: What is a Deployment in Kubernetes?**  
**A:** A controller that provides declarative updates for Pods. It ensures that a specified number of pod replicas are running at any given time and handles rolling updates.

**Q35: Explain Kubernetes Services. What types are there?**  
**A:** A Service provides a stable IP and DNS name to a set of pods. Types:
1. `ClusterIP`: Internal only (default).
2. `NodePort`: Exposes the service on a static port on each Node's IP.
3. `LoadBalancer`: Provisions a cloud provider load balancer (AWS ELB).

**Q36: In your project, your backend and frontend are `ClusterIP`. How do users access them?**  
**A:** Through the NGINX Ingress Controller. The Ingress Controller itself is exposed as a `LoadBalancer`, and it proxies traffic internally to the `ClusterIP` services based on routing rules.

**Q37: What is a Namespace?**  
**A:** A logical partition within a K8s cluster. In our project, we deployed our app in the `lms` namespace to isolate it from system components like `kube-system` or monitoring tools.

**Q38: How does Kubernetes handle auto-scaling?**  
**A:** Using HPA (Horizontal Pod Autoscaler). We configured HPA for our frontend deployment to scale between 2 and 6 replicas based on CPU utilization reaching 70%.

**Q39: What are Liveness and Readiness probes?**  
**A:** 
- **Liveness:** Checks if the app is alive. If it fails, K8s restarts the pod.
- **Readiness:** Checks if the app is ready to receive traffic. If it fails, K8s stops sending traffic to it via the Service.

**Q40: What is a ConfigMap and a Secret?**  
**A:** `ConfigMap` is used to store non-confidential configuration data in key-value pairs. `Secret` is used to store sensitive data like passwords and API keys (encoded in Base64).

**Q41: What is `kube-proxy`?**  
**A:** A network proxy that runs on each node. It maintains network rules on nodes that allow network communication to your Pods from network sessions inside or outside of your cluster.

**Q42: What is the Kubelet?**  
**A:** An agent that runs on each node in the cluster. It makes sure that containers are running in a Pod by communicating with the container runtime (e.g., containerd).

---

## 5. Ingress & NGINX

**Q43: What is a Kubernetes Ingress?**  
**A:** An API object that manages external access to the services in a cluster, typically HTTP/HTTPS. It provides load balancing, SSL termination, and name-based virtual hosting.

**Q44: What is the difference between an Ingress Resource and an Ingress Controller?**  
**A:** The Ingress Resource is just a set of routing rules (YAML). The Ingress Controller (like NGINX) is the actual software that reads those rules and implements the routing.

**Q45: Why use an Ingress instead of just making every service a LoadBalancer?**  
**A:** Cloud LoadBalancers cost money. If you have 10 microservices and use 10 LoadBalancer services, AWS will bill you for 10 ELBs. With Ingress, you provision ONE LoadBalancer (the controller) and route traffic to 10 services using paths.

**Q46: Explain your routing rules in `ingress.yaml`.**  
**A:** Any traffic going to `/api` or `/metrics` or `/health` is routed to the `lms-backend` service on port 5000. All other traffic (`/`) is routed to the `lms-frontend` service on port 80.

**Q47: How does NGINX know when a backend pod IP changes?**  
**A:** The NGINX Ingress Controller continually watches the Kubernetes API for changes to Endpoints. When a pod dies and is recreated, NGINX automatically updates its internal configuration to route to the new IP.

**Q48: What is SSL termination and how is it handled?**  
**A:** SSL termination decrypts HTTPS traffic at the edge. We can configure this in Ingress using tools like `cert-manager` to automatically issue Let's Encrypt certificates and attach them to the Ingress resource.

**Q49: What do annotations do in your Ingress file?**  
**A:** They pass specific configurations to the NGINX controller. For example, `nginx.ingress.kubernetes.io/proxy-body-size: "500m"` allows users to upload large files (like videos) to the LMS without NGINX throwing a 413 Entity Too Large error.

---

## 6. Jenkins & CI/CD

**Q50: What is Jenkins?**  
**A:** An open-source automation server used to build, test, and deploy software in continuous integration and continuous deployment pipelines.

**Q51: What is a Jenkinsfile?**  
**A:** A text file that contains the definition of a Jenkins Pipeline as code. It is checked into source control alongside the application code.

**Q52: Declarative vs Scripted Pipeline?**  
**A:** Declarative is a newer, more structured syntax that is easier to read and write (starts with `pipeline { }`). Scripted is the older, Groovy-based syntax (starts with `node { }`) that offers more complex programmatic logic but is harder to maintain. We used Declarative.

**Q53: Explain the stages in your Jenkins pipeline.**  
**A:** 
1. **Checkout:** Clones the Git repo.
2. **Backend/Frontend Install & Test:** Runs npm install, linting, and tests.
3. **Docker Build:** Builds backend and frontend images simultaneously (parallel stage).
4. **Push to ECR:** Logs into AWS and pushes the tagged images.
5. **Deploy to EKS:** Updates `kubeconfig`, modifies manifest files, and runs `kubectl apply`.
6. **Smoke Test:** Checks the live `/health` endpoint to ensure the deployment was successful.

**Q54: How does Jenkins authenticate with AWS?**  
**A:** We use Jenkins Credentials Binding to inject AWS IAM Access Keys as environment variables securely during the pipeline run.

**Q55: What does the `kubectl rollout status` command do in your pipeline?**  
**A:** It pauses the pipeline execution and waits to verify that the new pods are successfully running and healthy before marking the deployment stage as a success.

**Q56: How did you handle parallel execution in Jenkins?**  
**A:** By using the `parallel {}` block in the Jenkinsfile. We built the Frontend and Backend Docker images at the exact same time, cutting the build duration in half.

**Q57: What happens in the `post {}` block of your Jenkinsfile?**  
**A:** It executes actions after the pipeline finishes. For example, it prints Success/Failure messages, cleans the workspace (`cleanWs()`), and prunes dangling Docker images to save disk space on the Jenkins server.

**Q58: How did you securely inject Firebase credentials into the frontend build?**  
**A:** We stored the Firebase keys in Jenkins Credentials. During the Docker Build stage, we passed them as `--build-arg` to the Dockerfile, which baked them into the Vite build process.

---

## 7. Terraform & Infrastructure as Code

**Q59: What is Terraform?**  
**A:** An open-source Infrastructure as Code (IaC) tool created by HashiCorp. It allows you to define and provision cloud infrastructure using a declarative configuration language (HCL).

**Q60: Why use Terraform instead of clicking around in the AWS Console?**  
**A:** It provides consistency, repeatability, and version control. You can destroy and recreate the exact same infrastructure in minutes, and code reviews can prevent misconfigurations.

**Q61: What does `terraform init` do?**  
**A:** It initializes the working directory. It downloads the required provider plugins (like the AWS provider) and sets up the backend for state storage.

**Q62: What is the Terraform State file (`terraform.tfstate`)?**  
**A:** A JSON file where Terraform maps your real-world cloud resources to your configuration. It keeps track of resource IDs and metadata to know what to update, delete, or create on the next run.

**Q63: Why should you store the state file remotely (e.g., in an S3 bucket)?**  
**A:** If multiple developers use local state files, they will overwrite each other and cause infrastructure corruption. Remote state with DynamoDB state-locking ensures only one person applies changes at a time and state is shared.

**Q64: Explain `terraform plan` vs `terraform apply`.**  
**A:** `plan` does a dry-run; it compares the desired state (your code) with the actual state and shows you what it *will* do. `apply` actually executes those changes against the AWS API.

**Q65: What are Terraform Providers?**  
**A:** Plugins that allow Terraform to interact with cloud platforms, SaaS providers, and other APIs (e.g., AWS, Kubernetes, Helm).

**Q66: How did you structure your Terraform code?**  
**A:** We used variables (`variables.tf`) to make the code reusable. (e.g., passing in `project_name` or `environment`).

**Q67: What happens if someone manually deletes an EC2 node in the AWS console that Terraform created?**  
**A:** The next time you run `terraform plan`, Terraform will notice the discrepancy between the state file and the real world, and will propose creating a new EC2 node to replace the missing one to achieve the desired state.

---

## 8. Prometheus, Grafana & Monitoring

**Q68: What is Prometheus?**  
**A:** An open-source systems monitoring and alerting toolkit. It collects and stores metrics as time-series data.

**Q69: How does Prometheus collect data? (Push vs Pull)**  
**A:** Prometheus uses a **Pull model**. It actively scrapes HTTP endpoints (like `/metrics`) exposed by applications and services at a specified interval.

**Q70: What is Grafana?**  
**A:** An open-source analytics and interactive visualization web application. It connects to data sources like Prometheus and visualizes the data via charts, graphs, and dashboards.

**Q71: How do Prometheus and Grafana work together in your project?**  
**A:** Prometheus scrapes metrics from our Kubernetes cluster (CPU usage, memory, HTTP request rates). Grafana connects to Prometheus as a data source and displays these metrics on a dashboard for the DevOps team.

**Q72: What is an Exporter in Prometheus?**  
**A:** A piece of software that fetches metrics from an existing system and exposes them in Prometheus format. E.g., `Node Exporter` for hardware metrics, `Kube-state-metrics` for K8s object metrics.

**Q73: What is PromQL?**  
**A:** Prometheus Query Language. It allows you to select and aggregate time-series data in real-time. For example, calculating the rate of HTTP 500 errors over the last 5 minutes.

**Q74: What is the Alertmanager?**  
**A:** A Prometheus component that handles alerts sent by client applications. It takes care of deduplicating, grouping, and routing them to the correct receiver integration like Email, Slack, or PagerDuty.

**Q75: What specific metrics are critical to monitor for an LMS?**  
**A:** Server CPU/Memory to ensure uptime, HTTP response times to ensure quick page loads for students, API error rates (e.g., failed quiz submissions), and database connection limits.

---

## 9. Elasticsearch & Kibana (Logging)

*(Assuming ELK/EFK stack is implemented/discussed)*

**Q76: What is the difference between Monitoring and Logging?**  
**A:** Monitoring (Prometheus) tracks numerical metrics over time (e.g., CPU is at 90%). Logging (ELK) captures detailed, unstructured or JSON textual events (e.g., "User Sujal logged in at 10:00 AM from IP X").

**Q77: What does ELK/EFK stand for?**  
**A:** Elasticsearch, Logstash (or Fluentd/Fluentbit), and Kibana. 

**Q78: How do logs get from a K8s pod to Kibana?**  
**A:** A DaemonSet running Fluentd/Fluentbit on every K8s node collects standard output (stdout) logs from all containers. It parses them and forwards them to Elasticsearch, where they are indexed. Kibana then queries Elasticsearch to display them visually.

**Q79: What is Elasticsearch?**  
**A:** A distributed, RESTful search and analytics engine capable of solving a growing number of use cases. It acts as the database for the logs.

**Q80: What is Kibana?**  
**A:** Kibana is a free and open user interface that lets you visualize your Elasticsearch data and navigate the Elastic Stack. You use it to search through logs when debugging an application error.

**Q81: Why not just use `kubectl logs`?**  
**A:** `kubectl logs` only shows logs for currently running or recently crashed pods. If a pod is deleted or scaled down, the logs are gone. ELK provides centralized, persistent log storage and powerful search capabilities across all microservices simultaneously.

---

## 10. HashiCorp Vault & Security

**Q82: What is HashiCorp Vault?**  
**A:** A tool for securely accessing secrets. A secret is anything that you want to tightly control access to, such as API keys, passwords, or certificates.

**Q83: Why use Vault instead of Kubernetes Secrets?**  
**A:** Kubernetes secrets are merely base64 encoded by default, not encrypted at rest (unless specifically configured with a KMS). Vault encrypts data in transit and at rest, provides dynamic secrets, fine-grained access control policies, and detailed audit logs of who accessed what secret.

**Q84: How can a Kubernetes Pod authenticate with Vault?**  
**A:** Vault has a Kubernetes Auth Method. The pod provides its K8s Service Account JWT token to Vault. Vault verifies the token with the K8s API server and, if valid, returns a Vault token that the pod can use to read secrets.

**Q85: What are Dynamic Secrets?**  
**A:** Unlike static secrets (a hardcoded DB password), Vault can generate credentials on-demand. For example, it can dynamically create a MySQL user with a 1-hour TTL when the backend app starts, and automatically revoke it when it expires.

**Q86: How is Vault unsealed?**  
**A:** When Vault starts, it is sealed. It uses Shamir's Secret Sharing algorithm, splitting the master key into multiple shares. A threshold of shares (e.g., 3 out of 5) must be provided by trusted operators to unseal Vault. We often automate this using AWS KMS (Auto-unseal).

---

## 11. Disaster Recovery & High Availability

**Q87: What is High Availability (HA) in your project?**  
**A:** HA means the system remains accessible even if components fail. We achieved this by running multiple replicas of our pods (Deployments) across multiple EC2 instances, spread across different AWS Availability Zones.

**Q88: What is the difference between RTO and RPO?**  
**A:** 
- **RTO (Recovery Time Objective):** How much time it takes to restore the system after an outage. (Our Terraform/Jenkins setup makes this fast).
- **RPO (Recovery Point Objective):** How much data you can afford to lose. If DB backups run daily, your RPO is 24 hours.

**Q89: How does Kubernetes handle node failures?**  
**A:** If an EC2 node dies, the Kubelet stops responding. The Kubernetes Control Plane notices the node is `NotReady` and reschedules the pods that were on that node onto other healthy nodes in the cluster.

**Q90: How would you backup your EKS cluster?**  
**A:** The stateless app configuration is already backed up in Git (Manifests/Jenkinsfile). For stateful data, we would back up the persistent volumes (EBS snapshots) and use a tool like Velero to backup Kubernetes API objects.

**Q91: What is a Disaster Recovery Plan?**  
**A:** A documented process to recover and protect an IT infrastructure in the event of a disaster. For our LMS, it involves restoring the database from AWS RDS snapshots and triggering the Jenkins pipeline to spin up the EKS cluster in a completely different AWS region (e.g., moving from Mumbai to Singapore).

---
*End of Document. Good luck with your Viva!*
