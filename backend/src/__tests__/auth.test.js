'use strict';

require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');

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

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database or local DB
    // Use MONGODB_URI but customize DB name to prevent overwriting prod/dev data
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
    await User.deleteMany({});
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 if authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should authenticate user and return profile', async () => {
      const firebaseUser = {
        uid: 'test-firebase-uid',
        email: 'test@example.com',
        name: 'Test User',
      };

      verifyIdTokenMock.mockResolvedValue(firebaseUser);

      const user = await User.create({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.name,
        role: 'student',
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer mock-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(firebaseUser.email);
    });

    it('should auto-provision new user if not exists in DB', async () => {
      const firebaseUser = {
        uid: 'new-firebase-uid',
        email: 'newuser@example.com',
        name: 'New User',
      };

      verifyIdTokenMock.mockResolvedValue(firebaseUser);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer mock-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(firebaseUser.email);

      const dbUser = await User.findOne({ firebaseUid: firebaseUser.uid });
      expect(dbUser).not.toBeNull();
      expect(dbUser.email).toBe(firebaseUser.email);
    });
  });

  describe('PUT /api/v1/auth/me', () => {
    it('should update user bio and name', async () => {
      const firebaseUser = {
        uid: 'update-firebase-uid',
        email: 'update@example.com',
        name: 'Original Name',
      };

      verifyIdTokenMock.mockResolvedValue(firebaseUser);

      const user = await User.create({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.name,
        role: 'student',
      });

      const res = await request(app)
        .put('/api/v1/auth/me')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Updated Name',
          bio: 'I am learning DevOps',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.bio).toBe('I am learning DevOps');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully log in custom email user and return JWT', async () => {
      await User.create({
        firebaseUid: 'custom-jwt-test',
        email: 'sujal@stu.com',
        name: 'Sujal Student',
        role: 'student',
        password: '1234',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sujal@stu.com',
          password: '1234',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('sujal@stu.com');
    });

    it('should block login with wrong password', async () => {
      await User.create({
        firebaseUid: 'custom-jwt-test-fail',
        email: 'sujal@stu.com',
        name: 'Sujal Student',
        role: 'student',
        password: '1234',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sujal@stu.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('JWT Authenticated Requests', () => {
    it('should authenticate requests using custom JWT token', async () => {
      await User.create({
        firebaseUid: 'custom-jwt-verify-test',
        email: 'sujal@stu.com',
        name: 'Sujal Student',
        role: 'student',
        password: '1234',
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sujal@stu.com',
          password: '1234',
        });

      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('sujal@stu.com');
    });
  });
});
