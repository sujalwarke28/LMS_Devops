'use strict';

const User = require('../models/User');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');
const jwt = require('jsonwebtoken');

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('enrolledCourses', 'title thumbnailUrl slug')
    .lean();
  ApiResponse.success(res, user, 'Profile fetched');
});

/**
 * PUT /api/v1/auth/me
 * Update authenticated user's own profile (bio, name)
 */
const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'bio', 'photoURL'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  ApiResponse.success(res, user, 'Profile updated');
});

/**
 * POST /api/v1/auth/login
 * Authenticate user with email and password, returning custom JWT token
 */
const loginWithEmail = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return ApiResponse.error(res, 'Email and password are required', 400);
  }

  // Find user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return ApiResponse.error(res, 'Invalid email or password', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    return ApiResponse.error(res, 'Your account has been deactivated. Contact support.', 403);
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return ApiResponse.error(res, 'Invalid email or password', 401);
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_lms_devops_key_123456789_long_enough',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const userProfile = user.toObject();
  delete userProfile.password;

  ApiResponse.success(res, { token, user: userProfile }, 'Login successful');
});

module.exports = { getMe, updateMe, loginWithEmail };
