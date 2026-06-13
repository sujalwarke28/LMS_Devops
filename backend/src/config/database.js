'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');

const seedTestUsers = async () => {
  try {
    const testUsers = [
      { email: 'sujal@stu.com', name: 'Sujal Student', role: 'student', password: '1234', firebaseUid: 'custom-sujal-stu' },
      { email: 'sujal@ins.com', name: 'Sujal Instructor', role: 'instructor', password: '1234', firebaseUid: 'custom-sujal-ins' },
      { email: 'sujal@admin.com', name: 'Sujal Admin', role: 'admin', password: '1234', firebaseUid: 'custom-sujal-admin' },
    ];

    for (const testUser of testUsers) {
      const exists = await User.findOne({ email: testUser.email });
      if (!exists) {
        await User.create(testUser);
        logger.info(`🌱 Seeded test user: ${testUser.email} (${testUser.role})`);
      }
    }
  } catch (error) {
    logger.error(`❌ Seeding failed: ${error.message}`);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
    // Seed test users
    await seedTestUsers();
  } catch (error) {
    logger.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('🔄 MongoDB reconnected');
  });
};

module.exports = connectDB;
