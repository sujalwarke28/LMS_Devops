# SETUP.md — Local Development Setup Guide

## Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | 18.x | https://nodejs.org |
| npm | 9.x | Included with Node |
| Docker | 24.x | https://docker.com |
| Docker Compose | 2.x | Included with Docker Desktop |
| Git | 2.x | https://git-scm.com |

---

## Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Authentication → Google Sign-In**
4. Get web app config:
   - Project Settings → Your apps → Add web app
   - Copy `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`
5. Create service account for backend:
   - Project Settings → Service Accounts → Generate new private key
   - This gives you the JSON with `private_key`, `client_email`, etc.

---

## Step 2: MongoDB Atlas Setup

1. Create account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create database user (username + password)
4. Whitelist your IP (or 0.0.0.0/0 for development)
5. Get connection string: Connect → Drivers → Copy URI
   - Format: `mongodb+srv://user:pass@cluster.mongodb.net/lms?retryWrites=true&w=majority`

---

## Step 3: AWS S3 Setup (Optional for local dev)

1. Create AWS account at [aws.amazon.com](https://aws.amazon.com)
2. Create S3 bucket in your preferred region
3. Create IAM user with S3 access:
   - IAM → Users → Create User
   - Attach policy: `AmazonS3FullAccess` (or restrict to bucket)
   - Generate Access Keys
4. Note: Without S3, file uploads will fail but all other features work.

---

## Step 4: Configure Environment Files

### Backend
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-bucket
FRONTEND_URL=http://localhost:3000
```

### Frontend
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## Step 5: Add Your Domain to Firebase Auth

In Firebase Console:
- Authentication → Settings → Authorized domains
- Add `localhost` (usually pre-added)

---

## Step 6A: Run with Docker Compose (Recommended)

```bash
# From project root
docker-compose up --build

# In background
docker-compose up --build -d

# Check logs
docker-compose logs -f lms-backend
docker-compose logs -f lms-frontend
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health: http://localhost:5000/health

---

## Step 6B: Run Without Docker

```bash
# Backend
cd backend
npm install
npm run dev
# Backend runs at http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

> **Note**: When running without Docker, set `VITE_API_BASE_URL=http://localhost:5000/api/v1` in frontend `.env`.

---

## Step 7: Create First Admin

After signing in with Google, your account defaults to `student`.

To promote to admin (use MongoDB Atlas or MongoDB Compass):
```js
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

Or use the backend directly:
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/users/<userId>/role \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "instructor"}'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Firebase token error | Check FIREBASE_PRIVATE_KEY has `\n` literal newlines |
| MongoDB connection refused | Check IP whitelist in Atlas, verify URI |
| CORS error | Ensure `FRONTEND_URL` matches your frontend URL |
| S3 upload fails | Check IAM permissions and bucket region |
| Port conflict | Stop other services using ports 3000/5000 |
