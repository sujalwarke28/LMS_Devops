'use strict';

const { admin, initializeFirebase } = require('../config/firebase');
const User = require('../models/User');
const logger = require('../utils/logger');

// Ensure Firebase is initialized
initializeFirebase();

/**
 * Verify Firebase ID token and attach user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // Auto-provision new user (first login)
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture || null,
        role: 'student',
        lastLoginAt: new Date(),
      });
      logger.info(`New user provisioned: ${user.email}`);
    } else {
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.',
      });
    }

    req.user = user;
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Token expired. Please sign in again.' });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ success: false, message: 'Invalid token format.' });
    }

    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

/**
 * Role-based authorization factory
 * Usage: authorize('admin') or authorize('instructor', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
