'use strict';

const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');

/**
 * POST /api/v1/enrollments/:courseId
 * Enroll authenticated student in a course
 */
const enrollInCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !course.isPublished) {
    return ApiResponse.error(res, 'Course not found or not available', 404);
  }

  const existing = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  });
  if (existing) {
    return ApiResponse.error(res, 'Already enrolled in this course', 409);
  }

  const [enrollment] = await Promise.all([
    Enrollment.create({ student: req.user._id, course: course._id }),
    Course.findByIdAndUpdate(course._id, { $inc: { enrollmentCount: 1 } }),
    User.findByIdAndUpdate(req.user._id, { $push: { enrolledCourses: course._id } }),
    Progress.create({ student: req.user._id, course: course._id }),
  ]);

  ApiResponse.created(res, enrollment, 'Successfully enrolled');
});

/**
 * GET /api/v1/enrollments/my
 * Get all enrollments for the authenticated student
 */
const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate('course', 'title thumbnailUrl slug category level totalDuration instructor')
    .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } })
    .lean();
  ApiResponse.success(res, enrollments);
});

/**
 * DELETE /api/v1/enrollments/:courseId
 * Drop (unenroll) from a course
 */
const dropCourse = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOneAndDelete({
    student: req.user._id,
    course: req.params.courseId,
  });
  if (!enrollment) return ApiResponse.error(res, 'Enrollment not found', 404);

  await Promise.all([
    Course.findByIdAndUpdate(req.params.courseId, { $inc: { enrollmentCount: -1 } }),
    User.findByIdAndUpdate(req.user._id, { $pull: { enrolledCourses: req.params.courseId } }),
    Progress.findOneAndDelete({ student: req.user._id, course: req.params.courseId }),
  ]);

  ApiResponse.success(res, null, 'Successfully unenrolled');
});

module.exports = { enrollInCourse, getMyEnrollments, dropCourse };
