'use strict';

require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const verifyIdTokenMock = jest.fn();
  return {
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(() => ({
      name: '[DEFAULT]',
    })),
    auth: () => ({
      verifyIdToken: verifyIdTokenMock,
    }),
  };
});

const admin = require('firebase-admin');
const verifyIdTokenMock = admin.auth().verifyIdToken;

// Mock s3 service
jest.mock('../services/s3.service', () => ({
  uploadToS3: jest.fn(),
  deleteFromS3: jest.fn().mockResolvedValue(),
  getSignedUrl: jest.fn().mockReturnValue('https://mock-signed-url.com/video'),
  uploadCertificate: jest.fn(),
}));

describe('Course Endpoints', () => {
  let instructorUser;
  let studentUser;

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_test';
    const testUri = uri.includes('?') 
      ? uri.replace(/\/\?/, '/lms_test?') 
      : uri + '/lms_test';
    
    await mongoose.connect(testUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    verifyIdTokenMock.mockReset();
    await Course.deleteMany({});
    await User.deleteMany({});
    await Enrollment.deleteMany({});

    // Create seed users
    instructorUser = await User.create({
      firebaseUid: 'instructor-uid',
      email: 'instructor@test.com',
      name: 'Instructor Bob',
      role: 'instructor',
    });

    studentUser = await User.create({
      firebaseUid: 'student-uid',
      email: 'student@test.com',
      name: 'Student Alice',
      role: 'student',
    });
  });

  describe('POST /api/v1/courses', () => {
    it('should allow instructors to create courses', async () => {
      verifyIdTokenMock.mockResolvedValue({ uid: 'instructor-uid', email: 'instructor@test.com' });

      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', 'Bearer mock-token')
        .send({
          title: 'Introduction to Terraform',
          description: 'Learn IaC from scratch',
          category: 'DevOps',
          level: 'Beginner',
          price: 0,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Introduction to Terraform');
      expect(res.body.data.instructor.toString()).toBe(instructorUser._id.toString());
    });

    it('should deny students from creating courses', async () => {
      verifyIdTokenMock.mockResolvedValue({ uid: 'student-uid', email: 'student@test.com' });

      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', 'Bearer mock-token')
        .send({
          title: 'Forbidden Course',
          description: 'Should not create',
          category: 'DevOps',
          level: 'Beginner',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/courses', () => {
    it('should return empty list if no published courses exist', async () => {
      const res = await request(app).get('/api/v1/courses');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('should return published courses', async () => {
      await Course.create({
        title: 'Docker Masterclass',
        description: 'Deep dive into Docker containers',
        category: 'DevOps',
        level: 'Intermediate',
        instructor: instructorUser._id,
        isPublished: true,
      });

      await Course.create({
        title: 'Kubernetes in Action',
        description: 'Orchestrate container deployments',
        category: 'DevOps',
        level: 'Advanced',
        instructor: instructorUser._id,
        isPublished: false, // not published
      });

      const res = await request(app).get('/api/v1/courses');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Docker Masterclass');
    });
  });

  describe('GET /api/v1/courses/:slug', () => {
    it('should fetch course details by slug', async () => {
      const course = await Course.create({
        title: 'Jenkins Pipeline CI/CD',
        description: 'Automate build pipeline',
        category: 'DevOps',
        level: 'Intermediate',
        instructor: instructorUser._id,
        isPublished: true,
      });

      const res = await request(app).get(`/api/v1/courses/slug/${course.slug}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Jenkins Pipeline CI/CD');
    });
  });

  describe('POST /api/v1/courses/:id/lectures', () => {
    it('should allow course instructor to add lecture', async () => {
      verifyIdTokenMock.mockResolvedValue({ uid: 'instructor-uid', email: 'instructor@test.com' });

      const course = await Course.create({
        title: 'Ansible Basics',
        description: 'Config management',
        category: 'DevOps',
        level: 'Beginner',
        instructor: instructorUser._id,
      });

      const res = await request(app)
        .post(`/api/v1/courses/${course._id}/lectures`)
        .set('Authorization', 'Bearer mock-token')
        .send({
          title: '1. What is Ansible?',
          description: 'Introduction video',
          videoUrl: 'https://youtube.com/mock-video',
          isPreview: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('1. What is Ansible?');
    });
  });
});
