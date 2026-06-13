# API Documentation — DevOPS LMS Backend

**Base URL**: `http://localhost:5000/api/v1`  
**Authentication**: Firebase ID Token via `Authorization: Bearer <token>`

---

## Authentication

### GET /auth/me
Returns authenticated user's profile.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "firebaseUid": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "photoURL": "...",
    "enrolledCourses": [],
    "isActive": true
  }
}
```

### PUT /auth/me
Update profile (name, bio, photoURL).

---

## Courses

### GET /courses
Browse published courses.

**Query params**: `page`, `limit`, `category`, `level`, `search`

### GET /courses/slug/:slug
Get course by slug.

### GET /courses/:id/lectures/:lectureId/stream *(auth)*
Get signed S3 URL for video streaming.

**Response**: `{ signedUrl: "...", expiresIn: 3600 }`

### POST /courses *(instructor/admin)*
Create a course.

**Body**:
```json
{
  "title": "Docker Masterclass",
  "description": "...",
  "shortDescription": "...",
  "category": "DevOps",
  "level": "Beginner",
  "isFree": true,
  "requirements": ["Linux basics"],
  "outcomes": ["Build Docker images"],
  "tags": ["docker", "containers"]
}
```

### PUT /courses/:id *(instructor/admin)*
Update course.

### DELETE /courses/:id *(instructor/admin)*
Delete course and all S3 assets.

### GET /courses/instructor/my-courses *(instructor/admin)*
List authenticated instructor's courses.

### GET /courses/:id/students *(instructor/admin)*
List enrolled students.

### POST /courses/:id/lectures *(instructor)*
Add lecture.

**Body**:
```json
{
  "title": "Introduction",
  "description": "...",
  "videoUrl": "https://s3...",
  "videoKey": "videos/xxx.mp4",
  "duration": 600,
  "isPreview": false
}
```

---

## Enrollments

### POST /enrollments/:courseId *(student)*
Enroll in a course.

### GET /enrollments/my *(student)*
Get all enrollments.

### DELETE /enrollments/:courseId *(student)*
Unenroll from a course.

---

## Progress

### GET /progress/:courseId *(auth)*
Get progress for a course.

**Response**:
```json
{
  "percentageComplete": 45,
  "completedLectures": [...],
  "isCompleted": false,
  "lastAccessedLecture": "..."
}
```

### POST /progress/:courseId/lecture/:lectureId *(student)*
Mark lecture as complete.

**Body**: `{ "watchedSeconds": 300 }`

### GET /progress/instructor/:courseId *(instructor/admin)*
Get all student progress for a course.

---

## Quizzes

### GET /quizzes/course/:courseId *(auth)*
Get all quizzes for a course.

### GET /quizzes/:id *(auth)*
Get single quiz. Answers stripped for students.

### POST /quizzes *(instructor/admin)*
Create quiz.

**Body**:
```json
{
  "course": "<courseId>",
  "title": "Module 1 Quiz",
  "questions": [
    {
      "questionText": "What is Docker?",
      "options": [
        { "text": "A containerization tool", "isCorrect": true },
        { "text": "A CI/CD tool", "isCorrect": false }
      ],
      "explanation": "Docker is a platform for building containers.",
      "points": 1
    }
  ],
  "passingScore": 70,
  "timeLimit": 15,
  "maxAttempts": 3,
  "isPublished": true
}
```

### POST /quizzes/:id/submit *(student)*
Submit quiz answers.

**Body**:
```json
{
  "answers": [{ "selectedOption": 0 }, { "selectedOption": 1 }],
  "timeTaken": 300
}
```

**Response**: Score, percentage, pass/fail, correct answers with explanations.

### GET /quizzes/:id/attempts *(student)*
Get all attempts for a quiz.

---

## Certificates

### GET /certificates/verify/:certificateId *(public)*
Verify a certificate by ID.

### GET /certificates/my *(auth)*
Get all certificates for authenticated student.

### POST /certificates/generate/:courseId *(student)*
Generate certificate after completing course.

---

## Admin

### GET /admin/stats *(admin)*
Platform analytics.

### GET /admin/users *(admin)*
List all users. Supports `?role=`, `?search=`, `?page=`, `?limit=`.

### PATCH /admin/users/:id/role *(admin)*
Change user role.

**Body**: `{ "role": "instructor" }`

### PATCH /admin/users/:id/status *(admin)*
Toggle user active/inactive.

### DELETE /admin/users/:id *(admin)*
Delete user.

### GET /admin/courses *(admin)*
All courses including drafts.

---

## Upload

### POST /upload/single *(instructor/admin)*
Upload file to S3.

**Content-Type**: `multipart/form-data`  
**Field**: `file`

**Supported types**: MP4, WebM, PDF, JPG, PNG, WebP, ZIP, DOC, DOCX  
**Max size**: 500MB

**Response**:
```json
{ "url": "https://s3.amazonaws.com/...", "key": "videos/uuid.mp4" }
```

---

## System Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /metrics` | Prometheus metrics |

---

## Error Responses

All errors follow the format:
```json
{
  "success": false,
  "message": "Error description"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (e.g. already enrolled) |
| 429 | Rate limited / max attempts reached |
| 500 | Internal server error |
