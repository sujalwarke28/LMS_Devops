'use strict';

const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const QuizAttempt = require('../models/QuizAttempt');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');

/**
 * GET /api/v1/admin/stats
 * Platform-wide analytics
 */
const getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    usersByRole,
    coursesByCategory,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Course.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt photoURL'),
  ]);

  ApiResponse.success(res, {
    totalUsers,
    totalCourses,
    totalEnrollments,
    usersByRole,
    coursesByCategory,
    recentUsers,
  }, 'Platform analytics');
});

/**
 * GET /api/v1/admin/users
 * List all users with pagination
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-__v').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    User.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, users, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * PATCH /api/v1/admin/users/:id/role
 * Change user role
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'instructor', 'admin'].includes(role)) {
    return ApiResponse.error(res, 'Invalid role', 400);
  }

  // Prevent self-demotion
  if (req.params.id === req.user._id.toString()) {
    return ApiResponse.error(res, 'Cannot change your own role', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );
  if (!user) return ApiResponse.error(res, 'User not found', 404);

  ApiResponse.success(res, user, `Role updated to ${role}`);
});

/**
 * PATCH /api/v1/admin/users/:id/status
 * Activate / deactivate user
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return ApiResponse.error(res, 'User not found', 404);

  user.isActive = !user.isActive;
  await user.save();

  ApiResponse.success(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`);
});

/**
 * DELETE /api/v1/admin/users/:id
 * Delete a user
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return ApiResponse.error(res, 'Cannot delete yourself', 400);
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return ApiResponse.error(res, 'User not found', 404);
  ApiResponse.success(res, null, 'User deleted');
});

/**
 * GET /api/v1/admin/courses
 * All courses including unpublished
 */
const getAllCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [courses, total] = await Promise.all([
    Course.find()
      .populate('instructor', 'name email')
      .select('-lectures.videoKey')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Course.countDocuments(),
  ]);
  ApiResponse.paginated(res, courses, {
    page: parseInt(page), limit: parseInt(limit), total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

module.exports = {
  getPlatformStats,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAllCourses,
};
