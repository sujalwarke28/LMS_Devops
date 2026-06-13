# 🔑 Credentials & Setup Guide — DevOPS LMS

This guide lists all the credentials, configuration steps, and setup details needed to configure the DevOPS LMS project for local development, CI/CD pipelines, and production Kubernetes deployment.

---

## 📋 Table of Contents
1. [Missing Credentials (To Be Provided by User)](#1-missing-credentials-to-be-provided-by-user)
2. [Firebase Console Configuration (Google Sign-In)](#2-firebase-console-configuration-google-sign-in)
3. [AWS IAM Detailed Configuration](#3-aws-iam-detailed-configuration)
   - [IAM User 1: Terraform Infrastructure deployer (Admin)](#iam-user-1-terraform-infrastructure-deployer-admin)
   - [IAM User 2: LMS Application Service (S3-only)](#iam-user-2-lms-application-service-s3-only)
4. [AWS S3 Bucket & CORS Setup](#4-aws-s3-bucket--cors-setup)
5. [MongoDB Atlas Network & DB Access Configuration](#5-mongodb-atlas-network--db-access-configuration)
6. [GitHub SSH Deploy Keys & Webhooks for Jenkins](#6-github-ssh-deploy-keys--webhooks-for-jenkins)
7. [Jenkins CI/CD Pipeline Credentials Setup](#7-jenkins-cicd-pipeline-credentials-setup)
8. [Kubernetes Secrets & Local kubeconfig Verification](#8-kubernetes-secrets--local-kubeconfig-verification)

---

## 1. Missing Credentials (To Be Provided by User)

While the MongoDB Atlas URI and Firebase configurations are already successfully extracted and integrated into the project's local environment, the following AWS and DevOps integrations are required for **media storage** and **deployment**:

| Service | Credential Name | Purpose | Location to Configure |
| :--- | :--- | :--- | :--- |
| **AWS** | `AWS_ACCESS_KEY_ID` | Access S3 and provision EKS via Terraform | `backend/.env`, Jenkins Secrets, AWS CLI |
| **AWS** | `AWS_SECRET_ACCESS_KEY` | Secret access to AWS resources | `backend/.env`, Jenkins Secrets, AWS CLI |
| **AWS** | `AWS_REGION` | Regional location of resources (e.g. `ap-south-1`) | `.env` files, Terraform config |
| **AWS** | `AWS_S3_BUCKET_NAME` | Dedicated S3 bucket for course video/thumbnail uploads | `backend/.env`, Terraform variables |
| **GitHub** | `Jenkins SSH Deploy Key` | Allow Jenkins to checkout codebase | Jenkins Credentials, GitHub Deploy Keys |
| **GitHub** | `Webhook Secret` | Trigger automated CI/CD builds on git push | Jenkins Job, GitHub Repo Settings |

---

## 2. Firebase Console Configuration (Google Sign-In)

Since the frontend uses **Firebase Google Sign-In** for student/instructor login, you must enable and configure the authentication provider in the Firebase Console:

### Step-by-Step Enablement:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: `devopslms-12411`.
3. In the left sidebar, click **Build** -> **Authentication**.
4. Go to the **Sign-in method** tab.
5. Click **Add new provider** and select **Google**.
6. Toggle **Enable**, fill in the **Project support email**, and click **Save**.

### Configuring Authorized Domains:
1. Scroll down to **Authorized domains** (under Settings in Authentication).
2. For local development, ensure `localhost` is listed (it is added by default).
3. For production, click **Add domain** and input your cluster's ingress URL/domain name (e.g. `lms.yourdomain.com`).

---

## 3. AWS IAM Detailed Configuration

To manage deployments and S3 uploads cleanly, you must create **two separate IAM users**. This isolates deployment-level permissions (Terraform) from application-level runtime permissions (S3 uploads).

---

### IAM User 1: Terraform Infrastructure Deployer (Admin)
This user runs Terraform locally or in your CI/CD pipeline to provision EKS, VPC, S3, and IAM roles.

#### Step-by-Step IAM User Setup:
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Search for **IAM** in the top search bar and click on the **IAM** service.
3. In the left sidebar, click **Users**, then click **Create user** (top right).
4. Enter the user name: `lms-terraform-deployer`. Click **Next**.
5. Under **Permissions options**, select **Attach policies directly**.
6. Search the policy list for **`AdministratorAccess`** and check the box next to it.
   > [!WARNING]
   > Administrator access is required because Terraform needs to create roles, VPCs, subnets, and EKS clusters. Protect this key carefully.
7. Click **Next**, review the configuration, and click **Create user**.
8. Click on your newly created user name `lms-terraform-deployer` from the list.
9. Go to the **Security credentials** tab. Scroll down to the **Access keys** section and click **Create access key**.
10. Select **Command Line Interface (CLI)** as the use case. Check the confirmation box at the bottom and click **Next**.
11. (Optional) Provide a descriptive tag, then click **Create access key**.
12. **CRITICAL:** Copy the **Access Key ID** and **Secret Access Key** immediately, or download the `.csv` file. You will not be able to see the secret key again.
13. Set these credentials locally on your development system using the AWS CLI:
    ```bash
    aws configure
    # Input access key, secret key, region (e.g. ap-south-1), and output format (json)
    ```

---

### IAM User 2: LMS Application Service (S3-only)
This user is utilized by the Node.js backend to upload course thumbnails, upload video lectures, and delete resources.

#### Step-by-Step IAM User Setup:
1. In the AWS **IAM Console**, click **Users** -> **Create user**.
2. Enter the user name: `lms-s3-app-service`. Click **Next**.
3. Under **Permissions options**, select **Attach policies directly**.
4. Click **Create policy** (this opens a new browser window/tab).
5. In the Policy Editor, select the **JSON** tab and paste the following policy (replace `<your-s3-bucket-name>` with your actual bucket name):
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "s3:PutObject",
                   "s3:GetObject",
                   "s3:DeleteObject",
                   "s3:PutObjectAcl"
               ],
               "Resource": "arn:aws:s3:::<your-s3-bucket-name>/*"
           },
           {
               "Effect": "Allow",
               "Action": [
                   "s3:ListBucket"
               ],
               "Resource": "arn:aws:s3:::<your-s3-bucket-name>"
           }
       ]
   }
   ```
6. Click **Next**, enter the policy name `LMS_S3_App_Access`, and click **Create policy**.
7. Return to the User Creation tab, refresh the policies list, search for `LMS_S3_App_Access`, and check the box.
8. Click **Next** -> **Create user**.
9. Click on the user `lms-s3-app-service`, navigate to **Security credentials**, and click **Create access key**.
10. Select **Application running outside AWS** and generate the keys.
11. Paste these keys into your backend `.env` file under:
    * `AWS_ACCESS_KEY_ID`
    * `AWS_SECRET_ACCESS_KEY`

---

## 4. AWS S3 Bucket & CORS Setup

### Step 1: Create the S3 Bucket
1. Navigate to the **S3 console** in AWS.
2. Click **Create bucket**.
3. Enter a unique bucket name (e.g. `devops-lms-media-bucket`).
4. Select your region (must match your backend env variable, e.g. `ap-south-1`).
5. Keep **Block all public access** checked (access to media is governed via backend generated presigned URLs).
6. Click **Create bucket**.

### Step 2: Configure CORS on the S3 Bucket
In order for the frontend client (running in the browser) to retrieve video streams directly from the S3 pre-signed URLs without browser warnings, you must configure CORS:
1. Click on the name of your bucket.
2. Navigate to the **Permissions** tab.
3. Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
4. Paste the following configuration:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
           "AllowedOrigins": [
               "http://localhost:3000",
               "https://yourdomain.com"
           ],
           "ExposeHeaders": ["ETag"],
           "MaxAgeSeconds": 3000
       }
   ]
   ```
5. Click **Save changes**.

---

## 5. MongoDB Atlas Network & DB Access Configuration

### Step 1: Add Network Access (IP Whitelist)
1. Log in to the [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Select your project and click **Network Access** in the left sidebar.
3. Click **Add IP Address**.
4. Choose **Add Current IP Address** to whitelist your development network.
5. If deploying to EKS or Jenkins builds, select **Allow access from anywhere** (`0.0.0.0/0`) or enter the public Elastic IPs of your EKS cluster Nat Gateways / Jenkins runner.
6. Click **Confirm**.

### Step 2: Create DB User Credentials
1. Click **Database Access** under the Security section in the left sidebar.
2. Click **Add New Database User**.
3. Select **Password** authentication.
4. Input the database username and password (e.g., matching the details in `keys.txt`).
5. Under **Database User Privileges**, select **Read and write to any database**.
6. Click **Add User**.

---

## 6. GitHub SSH Deploy Keys & Webhooks for Jenkins

To trigger Jenkins automated builds when you push code to GitHub:

### Step 1: Generate SSH keys for Jenkins
1. Open a terminal on your local machine and run:
   ```bash
   ssh-keygen -t ed25519 -C "jenkins-lms-deploy" -f ./id_lms_jenkins
   # This generates a private key (id_lms_jenkins) and a public key (id_lms_jenkins.pub)
   ```

### Step 2: Configure Github Deploy Key
1. Go to your GitHub repository: [LMS_Devops](https://github.com/sujalwarke28/LMS_Devops.git).
2. Click **Settings** (top tabs) -> **Deploy keys** (left sidebar).
3. Click **Add deploy key**.
4. Name it `Jenkins CI Deploy Key`.
5. Open `id_lms_jenkins.pub`, copy the entire text, and paste it into the **Key** textarea.
6. Check **Allow write access** (required if Jenkins bumps versions or merges branches). Click **Add key**.

### Step 3: Add Webhook
1. In your GitHub repository **Settings**, click **Webhooks** -> **Add webhook**.
2. Set the **Payload URL** to your Jenkins instance webhook endpoint:
   `http://<your-jenkins-ip-or-domain>:8080/github-webhook/`
3. Set **Content type** to `application/json`.
4. Enter a secure string in the **Secret** input field.
5. Select **Just the push event** and click **Add webhook**.

---

## 7. Jenkins CI/CD Pipeline Credentials Setup

Log into your Jenkins dashboard, go to **Manage Jenkins** -> **Credentials** -> **System** -> **Global credentials (unrestricted)**, and click **Add Credentials** to configure:

1. **GitHub Deploy Private Key:**
   * **Kind**: `SSH Username with private key`
   * **ID**: `git-private-key`
   * **Username**: `git`
   * **Private Key**: Select **Enter directly**, click **Add**, and paste the contents of your local private key (`id_lms_jenkins`).
2. **AWS programmatic keys:**
   * **Kind**: `AWS Credentials`
   * **ID**: `aws-credentials-id`
   * **Access Key ID**: `<your-aws-terraform-deployer-access-key-id>`
   * **Secret Access Key**: `<your-aws-terraform-deployer-secret-access-key>`
3. **MongoDB Atlas URI:**
   * **Kind**: `Secret text`
   * **ID**: `mongodb-uri-id`
   * **Secret**: `mongodb+srv://sungjinwoo281106_db_user:suJAL28112006@lmsdevops.nfpfpzb.mongodb.net/lms?retryWrites=true&w=majority`
4. **Firebase Service Account:**
   * **Kind**: `Secret file`
   * **ID**: `firebase-service-account`
   * **File**: Upload the Firebase service account JSON file from `/Users/sujalwarke/Downloads/devopslms-12411-firebase-adminsdk-fbsvc-87219a4c45.json`.

---

## 8. Kubernetes Secrets & Local kubeconfig Verification

Once Terraform has provisioned your EKS cluster:

### Step 1: Update local kubeconfig to connect to EKS
Run this command from your local machine to point your `kubectl` CLI to the new cluster:
```bash
aws eks update-kubeconfig --name lms-eks-cluster-dev --region ap-south-1
```
Verify the connection is active:
```bash
kubectl get nodes
```

### Step 2: Deploy Secrets to Kubernetes
Paste the command below into your EKS management shell to secure all backend credentials:

```bash
kubectl create namespace lms

kubectl create secret generic lms-backend-secrets \
  --from-literal=MONGODB_URI='mongodb+srv://sungjinwoo281106_db_user:suJAL28112006@lmsdevops.nfpfpzb.mongodb.net/lms?retryWrites=true&w=majority' \
  --from-literal=FIREBASE_PROJECT_ID='devopslms-12411' \
  --from-literal=FIREBASE_PRIVATE_KEY_ID='87219a4c4566481f0391418a14ad7e5f5dab9e7f' \
  --from-literal=FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCVczD4vJ0mAdWI\nL6G4+oZlX4i4HPG1gLcD194gdbT65x5MpznJfqALDs/w11k6e0WbuDiomPytn1A/\nNOYLwIRcYNLq1IzecLQfKTVqyiYlIqTSGYL1df6SJUdAJ1dj791glPu6YlIZFB5/\ntKVVXmUgTJO4X2FwIpFbN2hlBJFkTCB/CLgY0+9xkMeg12pVgVUGSXtglxeH52Uy\nP/ptk5VNBIOdqk3+RxOdcqCCF83TNT+wMJjslaBCPKIN9hC5Fdygf1WEPq2Jfx6O\nVYouhYdluUpPeVDotz+tqkmwch2pUOjo74gRYlOO8hfYNCuWp5z8g06eWH96YMY1\nzsGn/dGJAgMBAAECggEAFbRFta4AvZMRHYbbXAeoKoNCEgkEEmm3yotYY0rs5m5X\nwGad1hU5bXmwecfwmbVq4cdSlSuosJddOly2lxjVsCvQndGSBsED662aqCBlA0oh\neTDCy96fwr4+t4KvJqCgfCUO3N3oEePR3RaRV1FO6u6sGl/hwP0IMqDcnKUZ72CF\nHFUodn9c9dMVZFpikQxHv4mSyshRL54frVRjP05bGleBijtCnOaRsr45xwH4NO4/\nsAIaZT8ZlwWtTtTPmZb6V1IA+9uCMCJMGVHjr/M+ctha7NO2etmg90Cs7jLah5Ot\naaWOlyXsVKihodmW0whKyltCsP0P8aStsV+otWiALQKBgQDECFZSoUQIU/UGuTwC\nMvOKAtNIhvHVj2cwrjYmLii7knu8diEPDrM0t0aHBk1KExIt7Pp5yGuGWQchq8HW\ny2XW29X+TSWd/52vngUkJwD77tMAKB7UtQ/61P2hfYkzLHM6d9nHFM1bOoAJW433\numtinhfFqu11lj2fEzDJyuf1JQKBgQDDKuMIJmlXFwtZvhcz8WPb8z2m6/yGtvpS\n1H/WjkADOAbNAvmQzmwKRpf/LAHxnwcgd+X9suFzJUUQ6IZmGKBxuaa67utxJPaI\n25AxC97GHHhTtfOWtsKs4YGfmhYTqZHyNrgUChczH+/JOjNfxfYZOkMiW8rSMfX4\nWl89732nlQKBgGmv6QJRiYFH6nF+injRCXYdwdV3U4iE8OhQ9EavWiyOdAGOWpJo\npXtFWFPRtPe7wnBaNExWHopnEy43EKGCNVyaVwvsgdxmBJi7BCCSmrg48S9DciPR\nnlToYfmf2clqLJGYLiRj9bc6me7xml+19NFNVJmwZqefoYdS7FnO+DG1AoGAax+r\nJdoPj+HyNPwFuFkSurO0b16waTEeDUDeOmIx+JJUCUtMuJLU8n71BvacyobDXqrw\n7mO1I4Kdej5nJrr1tfZ08b4aNSxYtZ3ucz1UteECmtAQN/VwvXu5rmThIUG9/fjS\n6Qzw1vr8nrL3Z+Y8wnQcTUuc8+rAW+UeydweWFECgYEAmEGAFKnkz+JXHNmqjIsa\ndNQdEppMTF85nKiuuI4obU0EWwpLYRszNub6zuamDPz+4JENi0QS/7YBizXaxC6H\nksx6cG9NZh4tPTZYkeM7uWZGUM/mGUb6sHxls5IWXMEHajsCjcpLK3fhudfrCgCn\nBY84y2v9zT5mTuukazX+MFo=\n-----END PRIVATE KEY-----\n' \
  --from-literal=FIREBASE_CLIENT_EMAIL='firebase-adminsdk-fbsvc@devopslms-12411.iam.gserviceaccount.com' \
  --from-literal=FIREBASE_CLIENT_ID='104648143904427340228' \
  --from-literal=AWS_ACCESS_KEY_ID='<your-s3-app-service-access-key-id>' \
  --from-literal=AWS_SECRET_ACCESS_KEY='<your-s3-app-service-secret-access-key>' \
  --from-literal=AWS_S3_BUCKET_NAME='<your-s3-bucket-name>' \
  -n lms
```
