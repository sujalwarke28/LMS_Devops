'use strict';

const User = require('../models/User');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');

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

module.exports = { getMe, updateMe };
