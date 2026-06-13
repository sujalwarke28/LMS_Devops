# 🎓 Chronological Setup & Credentials Guide — DevOPS LMS

This guide outlines the exact, step-by-step chronological pipeline to configure, run, and deploy the DevOPS LMS project from absolute scratch—first getting it running in a local dev sandbox, then provisioning AWS infrastructure, and finally setting up CI/CD to deploy to EKS.

---

## 📋 Table of Contents
* [Phase 1: Local Development Sandbox](#phase-1-local-development-sandbox)
* [Phase 2: AWS S3 Media Storage Setup (Local Integration)](#phase-2-aws-s3-media-storage-setup-local-integration)
* [Phase 3: Provision AWS Cloud Infrastructure (Terraform)](#phase-3-provision-aws-cloud-infrastructure-terraform)
* [Phase 4: Jenkins CI/CD & GitHub Webhooks Setup](#phase-4-jenkins-cicd--github-webhooks-setup)
* [Phase 5: Deploying to production (Kubernetes Secrets & Pipeline Execution)](#phase-5-deploying-to-production-kubernetes-secrets--pipeline-execution)

---

## Phase 1: Local Development Sandbox
*Goal: Get the frontend and backend running on your local computer using MongoDB Atlas and Firebase.*

### Step 1: Set up MongoDB Atlas Network & DB User
1. Log in to the [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Select your project and click **Network Access** in the left sidebar.
3. Click **Add IP Address** -> **Add Current IP Address** to whitelist your development network. Click **Confirm**.
4. Click **Database Access** -> **Add New Database User**.
5. Choose **Password** authentication, input username/password matching your connection string, set permissions to **Read and write to any database**, and click **Add User**.
6. Retrieve your MongoDB connection string under Database -> Connect -> Drivers.

### Step 2: Enable Firebase Google Sign-In
1. Go to the [Firebase Console](https://console.firebase.google.com/) and select your project `devopslms-12411`.
2. In the left sidebar, go to **Build** -> **Authentication**.
3. Under the **Sign-in method** tab, click **Add new provider** -> select **Google** -> toggle **Enable** -> choose support email -> click **Save**.
4. In **Settings** -> **Authorized domains**, verify `localhost` is present.

### Step 3: Populate Local Configuration Files
1. Copy [backend/.env.example](file:///Users/sujalwarke/Desktop/devOPS_LMS/backend/.env.example) to create `backend/.env`.
2. Copy [frontend/.env.example](file:///Users/sujalwarke/Desktop/devOPS_LMS/frontend/.env.example) to create `frontend/.env`.
3. Fill in your Firebase web config, Firebase Service Account parameters, and MongoDB Atlas URI inside the `.env` files (matching your credentials in `keys.txt`).

### Step 4: Verify Local Launch
1. Open a terminal, go to `backend` and run:
   ```bash
   npm install && npm start
   # You should see: ✅ MongoDB connected, ✅ Firebase Admin SDK initialized, 🚀 LMS Backend running on port 5001
   ```
2. Open another terminal, go to `frontend` and run:
   ```bash
   npm install && npm run dev
   # Open http://localhost:3000 in your browser. Verify you can sign in via custom credentials (e.g. sujal@stu.com / 1234).
   ```

---

## Phase 2: AWS S3 Media Storage Setup (Local Integration)
*Goal: Create an AWS S3 bucket for course videos and thumbnails, and attach S3 access credentials to your local backend.*

### Step 1: Create the S3 Bucket in AWS
1. Log in to the [AWS Console](https://console.aws.amazon.com/) and navigate to **S3** -> **Create bucket**.
2. Name it (e.g. `devops-lms-media-bucket`), select your region (e.g. `ap-south-1`), leave public access blocked (videos are streamed via backend pre-signed URLs), and click **Create bucket**.
3. Go to your new bucket -> **Permissions** -> **CORS** -> **Edit** -> Paste this configuration to allow web player playback:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
           "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
           "ExposeHeaders": ["ETag"],
           "MaxAgeSeconds": 3000
       }
   ]
   ```

### Step 2: Create IAM User for App S3 access (`lms-s3-app-service`)
1. In the AWS Console, go to **IAM** -> **Users** -> **Create user**.
2. Name it `lms-s3-app-service` and click **Next**.
3. Choose **Attach policies directly** -> click **Create policy** -> paste this policy (replace `<your-s3-bucket-name>` with your actual bucket name):
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:PutObjectAcl"],
               "Resource": "arn:aws:s3:::<your-s3-bucket-name>/*"
           },
           {
               "Effect": "Allow",
               "Action": ["s3:ListBucket"],
               "Resource": "arn:aws:s3:::<your-s3-bucket-name>"
           }
       ]
   }
   ```
4. Name the policy `LMS_S3_Access` and save. Back in the user tab, select it and create the user.
5. Under security credentials of the user `lms-s3-app-service`, create an Access Key (select **Application running outside AWS**) and retrieve:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
6. Paste these into your `backend/.env` file. Restart the backend. Video uploads will now work locally.

---

## Phase 3: Provision AWS Cloud Infrastructure (Terraform)
*Goal: Provision EKS Cluster, ECR Registries, VPC network, and cloud roles using Terraform.*

### Step 1: Create AWS Admin User (`lms-terraform-deployer`)
To build infrastructure, Terraform needs wide AWS permissions:
1. In AWS **IAM** -> **Users** -> **Create user** named `lms-terraform-deployer`.
2. Under Permissions options, attach policy **`AdministratorAccess`** directly. Complete creation.
3. Generate programmatic Access Keys (CLI use-case) for this user.
4. Set these credentials locally on your system:
   ```bash
   aws configure
   # Enter access keys for lms-terraform-deployer
   ```

### Step 2: Run Terraform Build
1. Go to the project root directory, navigate to `terraform` folder:
   ```bash
   cd terraform
   terraform init
   terraform apply -var="s3_bucket_name=devops-lms-media-bucket"
   # Verify and type 'yes' to provision the cluster, network, and registries
   ```

---

## Phase 4: Jenkins CI/CD & GitHub Webhooks Setup
*Goal: Enable automatic deployment pipelines. Jenkins triggers on code pushes, builds containers, and pushes them to AWS ECR.*

### Step 1: Link SSH Keys to GitHub
1. Generate an SSH deployment key pair locally:
   ```bash
   ssh-keygen -t ed25519 -C "jenkins-lms-deploy" -f ./id_lms_jenkins -N ""
   ```
2. Add the public key (`id_lms_jenkins.pub`) to your GitHub Repository -> **Settings** -> **Deploy keys** (Allow write access).

### Step 2: Set up GitHub Webhook
1. In your GitHub repository **Settings** -> **Webhooks** -> **Add webhook**.
2. Payload URL: `http://<your-jenkins-public-ip>:8080/github-webhook/` (use ngrok if running Jenkins locally).
3. Set Content type to `application/json` and click **Add webhook**.

### Step 3: Configure Jenkins Credentials
Go to Manage Jenkins -> Credentials inside your Jenkins instance and add:
1. **`git-private-key`** (SSH private key): Paste the text of your local private key (`id_lms_jenkins`).
2. **`aws-credentials-id`** (AWS credentials): Input your `lms-terraform-deployer` AWS access/secret keys.
3. **`mongodb-uri-id`** (Secret text): Input your Atlas MONGODB_URI.
4. **`firebase-service-account`** (Secret file): Upload your Firebase service account JSON key.

---

## Phase 5: Deploying to Production (Kubernetes Secrets & Pipeline Execution)
*Goal: Hook kubectl to the EKS cluster, load credentials, and run the pipeline.*

### Step 1: Connect kubectl to AWS EKS
Configure your local command line to interface with the EKS cluster:
```bash
aws eks update-kubeconfig --name lms-eks-cluster-dev --region ap-south-1
```
Verify cluster nodes:
```bash
kubectl get nodes
```

### Step 2: Load Production secrets in EKS
Create the required namespace and store secrets in Kubernetes so that your backend containers can read them:
```bash
kubectl create namespace lms

kubectl create secret generic lms-backend-secrets \
  --from-literal=MONGODB_URI='<your-mongodb-atlas-connection-string>' \
  --from-literal=FIREBASE_PROJECT_ID='devopslms-12411' \
  --from-literal=FIREBASE_PRIVATE_KEY_ID='87219a4c4566481f0391418a14ad7e5f5dab9e7f' \
  --from-literal=FIREBASE_PRIVATE_KEY='<your-firebase-private-key-with-newlines>' \
  --from-literal=FIREBASE_CLIENT_EMAIL='firebase-adminsdk-fbsvc@devopslms-12411.iam.gserviceaccount.com' \
  --from-literal=FIREBASE_CLIENT_ID='104648143904427340228' \
  --from-literal=AWS_ACCESS_KEY_ID='<your-lms-s3-app-service-access-key-id>' \
  --from-literal=AWS_SECRET_ACCESS_KEY='<your-lms-s3-app-service-secret-access-key>' \
  --from-literal=AWS_S3_BUCKET_NAME='<your-s3-bucket-name>' \
  -n lms
```

### Step 3: Run the Jenkins Pipeline
1. In Jenkins, create a new **Pipeline** job.
2. Select **Pipeline script from SCM** -> Git -> SCM URL: `git@github.com:sujalwarke28/LMS_Devops.git` -> Credentials: `git-private-key`.
3. Script path: `jenkins/Jenkinsfile`.
4. Trigger a manual build (Build Now), or push a git commit to trigger it automatically. Jenkins will complete the rollout onto AWS EKS!
