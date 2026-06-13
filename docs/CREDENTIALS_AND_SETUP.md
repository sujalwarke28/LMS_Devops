# 🔑 Credentials & Setup Guide — DevOPS LMS

This guide lists all the credentials, configuration steps, and setup details needed to configure the DevOPS LMS project for local development, CI/CD pipelines, and production Kubernetes deployment.

---

## 📋 Table of Contents
1. [Missing Credentials (To Be Provided by User)](#1-missing-credentials-to-be-provided-by-user)
2. [Firebase Console Configuration (Google Sign-In)](#2-firebase-console-configuration-google-sign-in)
3. [AWS IAM & S3 Configuration](#3-aws-iam--s3-configuration)
4. [MongoDB Atlas IP Whitelisting](#4-mongodb-atlas-ip-whitelisting)
5. [Jenkins CI/CD Pipeline Setup](#5-jenkins-cicd-pipeline-setup)
6. [Kubernetes Secrets Generation](#6-kubernetes-secrets-generation)

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

> [!IMPORTANT]
> Keep your `AWS_SECRET_ACCESS_KEY` private. Never commit files containing AWS access keys to git.

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

## 3. AWS IAM & S3 Configuration

To support course video and image uploads, the backend requires a dedicated S3 bucket.

### Step 1: Create an IAM User for the LMS App
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to **IAM** -> **Users** and click **Create user**.
3. Set the name to `lms-app-user-dev`.
4. Skip Console Access (programmatic access only).
5. Attach the following custom inline IAM Policy to grant access *only* to the LMS S3 bucket:

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
        }
    ]
}
```
6. Complete user creation, go to the **Security credentials** tab, and click **Create access key**.
7. Choose **Application running outside AWS** and download the generated `Access Key ID` and `Secret Access Key`.

### Step 2: Configure CORS on the S3 Bucket
Go to the **Permissions** tab of your S3 Bucket, scroll to **Cross-origin resource sharing (CORS)**, and paste the configuration:

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

---

## 4. MongoDB Atlas IP Whitelisting

By default, MongoDB Atlas blocks all incoming network requests. You must whitelist target IPs so that local servers and AWS clusters can connect.

1. Log in to the [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Select your project and click **Network Access** in the sidebar.
3. Click **Add IP Address**.
4. **For Local Development**: Click **Add Current IP Address** to whitelist your home network.
5. **For Sandbox Testing**: You can add `0.0.0.0/0` (Allow Access from Anywhere) temporarily.
6. **For Production**: Whitelist the Elastic IP addresses of the NAT Gateways created in your AWS VPC.

---

## 5. Jenkins CI/CD Pipeline Setup

The automated pipeline ([Jenkinsfile](file:///Users/sujalwarke/Desktop/devOPS_LMS/jenkins/Jenkinsfile)) builds Docker images, pushes them to AWS ECR, and deploys them to AWS EKS.

### Credentials to Configure in Jenkins (Manage Jenkins -> Credentials):
1. **`git-private-key`** (SSH Username with private key):
   - Private key generated on your local machine.
   - Corresponding public key added as a **Deploy Key** on GitHub ([LMS_Devops repo](https://github.com/sujalwarke28/LMS_Devops.git)).
2. **`aws-credentials-id`** (AWS Credentials):
   - Enter your programmatic access key ID and secret access key.
3. **`mongodb-uri-id`** (Secret text):
   - Your MongoDB connection string: `mongodb+srv://sungjinwoo281106_db_user:suJAL28112006@lmsdevops.nfpfpzb.mongodb.net/lms?retryWrites=true&w=majority`
4. **`firebase-service-account`** (Secret file):
   - Upload the Firebase Admin Service Account JSON file.

---

## 6. Kubernetes Secrets Generation

When deploying to AWS EKS, you must run the following command on your management console (or let Jenkins run it) to provision secrets securely:

```bash
kubectl create namespace lms

kubectl create secret generic lms-backend-secrets \
  --from-literal=MONGODB_URI='mongodb+srv://sungjinwoo281106_db_user:suJAL28112006@lmsdevops.nfpfpzb.mongodb.net/lms?retryWrites=true&w=majority' \
  --from-literal=FIREBASE_PROJECT_ID='devopslms-12411' \
  --from-literal=FIREBASE_PRIVATE_KEY_ID='87219a4c4566481f0391418a14ad7e5f5dab9e7f' \
  --from-literal=FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCVczD4vJ0mAdWI\nL6G4+oZlX4i4HPG1gLcD194gdbT65x5MpznJfqALDs/w11k6e0WbuDiomPytn1A/\nNOYLwIRcYNLq1IzecLQfKTVqyiYlIqTSGYL1df6SJUdAJ1dj791glPu6YlIZFB5/\ntKVVXmUgTJO4X2FwIpFbN2hlBJFkTCB/CLgY0+9xkMeg12pVgVUGSXtglxeH52Uy\nP/ptk5VNBIOdqk3+RxOdcqCCF83TNT+wMJjslaBCPKIN9hC5Fdygf1WEPq2Jfx6O\nVYouhYdluUpPeVDotz+tqkmwch2pUOjo74gRYlOO8hfYNCuWp5z8g06eWH96YMY1\nzsGn/dGJAgMBAAECggEAFbRFta4AvZMRHYbbXAeoKoNCEgkEEmm3yotYY0rs5m5X\nwGad1hU5bXmwecfwmbVq4cdSlSuosJddOly2lxjVsCvQndGSBsED662aqCBlA0oh\neTDCy96fwr4+t4KvJqCgfCUO3N3oEePR3RaRV1FO6u6sGl/hwP0IMqDcnKUZ72CF\nHFUodn9c9dMVZFpikQxHv4mSyshRL54frVRjP05bGleBijtCnOaRsr45xwH4NO4/\nsAIaZT8ZlwWtTtTPmZb6V1IA+9uCMCJMGVHjr/M+ctha7NO2etmg90Cs7jLah5Ot\naaWOlyXsVKihodmW0whKyltCsP0P8aStsV+otWiALQKBgQDECFZSoUQIU/UGuTwC\nMvOKAtNIhvHVj2cwrjYmLii7knu8diEPDrM0t0aHBk1KExIt7Pp5yGuGWQchq8HW\ny2XW29X+TSWd/52vngUkJwD77tMAKB7UtQ/61P2hfYkzLHM6d9nHFM1bOoAJW433\numtinhfFqu11lj2fEzDJyuf1JQKBgQDDKuMIJmlXFwtZvhcz8WPb8z2m6/yGtvpS\n1H/WjkADOAbNAvmQzmwKRpf/LAHxnwcgd+X9suFzJUUQ6IZmGKBxuaa67utxJPaI\n25AxC97GHHhTtfOWtsKs4YGfmhYTqZHyNrgUChczH+/JOjNfxfYZOkMiW8rSMfX4\nWl89732nlQKBgGmv6QJRiYFH6nF+injRCXYdwdV3U4iE8OhQ9EavWiyOdAGOWpJo\npXtFWFPRtPe7wnBaNExWHopnEy43EKGCNVyaVwvsgdxmBJi7BCCSmrg48S9DciPR\nnlToYfmf2clqLJGYLiRj9bc6me7xml+19NFNVJmwZqefoYdS7FnO+DG1AoGAax+r\nJdoPj+HyNPwFuFkSurO0b16waTEeDUDeOmIx+JJUCUtMuJLU8n71BvacyobDXqrw\n7mO1I4Kdej5nJrr1tfZ08b4aNSxYtZ3ucz1UteECmtAQN/VwvXu5rmThIUG9/fjS\n6Qzw1vr8nrL3Z+Y8wnQcTUuc8+rAW+UeydweWFECgYEAmEGAFKnkz+JXHNmqjIsa\ndNQdEppMTF85nKiuuI4obU0EWwpLYRszNub6zuamDPz+4JENi0QS/7YBizXaxC6H\nksx6cG9NZh4tPTZYkeM7uWZGUM/mGUb6sHxls5IWXMEHajsCjcpLK3fhudfrCgCn\nBY84y2v9zT5mTuukazX+MFo=\n-----END PRIVATE KEY-----\n' \
  --from-literal=FIREBASE_CLIENT_EMAIL='firebase-adminsdk-fbsvc@devopslms-12411.iam.gserviceaccount.com' \
  --from-literal=FIREBASE_CLIENT_ID='104648143904427340228' \
  --from-literal=AWS_ACCESS_KEY_ID='<your-aws-access-key-id>' \
  --from-literal=AWS_SECRET_ACCESS_KEY='<your-aws-secret-access-key>' \
  --from-literal=AWS_S3_BUCKET_NAME='<your-s3-bucket-name>' \
  -n lms
```
