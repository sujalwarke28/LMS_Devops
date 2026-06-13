'use strict';

const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');
const { deleteFromS3, getSignedUrl } = require('../services/s3.service');

/**
 * GET /api/v1/courses
 * Browse published courses (with filters, pagination)
 */
const getCourses = asyncHandler(async (req, res) => {
  const { category, level, search, page = 1, limit = 12 } = req.query;
  const filter = { isPublished: true };

  if (category) filter.category = category;
  if (level) filter.level = level;
  if (search) filter.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select('-lectures.videoKey -lectures.resources.key')
      .populate('instructor', 'name photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Course.countDocuments(filter),
  ]);

  ApiResponse.paginated(res, courses, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /api/v1/courses/:slug
 * Get single course details
 */
const getCourseBySlug = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, isPublished: true })
    .populate('instructor', 'name photoURL bio')
    .lean();

  if (!course) {
    return ApiResponse.error(res, 'Course not found', 404);
  }

  // Strip S3 video URLs from lecture list for non-enrolled users (preview only)
  const sanitized = {
    ...course,
    lectures: course.lectures.map((l) => ({
      ...l,
      videoUrl: l.isPreview ? l.videoUrl : undefined,
      videoKey: undefined,
    })),
  };

  ApiResponse.success(res, sanitized, 'Course details');
});

/**
 * GET /api/v1/courses/:id
 * Get single course by ID (accessible for editing and details verification)
 */
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name photoURL bio');

  if (!course) {
    return ApiResponse.error(res, 'Course not found', 404);
  }

  // If course is not published, only instructor or admin can view it
  if (!course.isPublished) {
    if (!req.user) {
      return ApiResponse.error(res, 'Not authorized', 401);
    }
    const isInstructor = course.instructor && course.instructor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isInstructor && !isAdmin) {
      return ApiResponse.error(res, 'Not authorized to view this unpublished course', 403);
    }
  }

  ApiResponse.success(res, course, 'Course details');
});


/**
 * GET /api/v1/courses/:id/lectures/:lectureId/stream
 * Get signed S3 URL for video streaming (enrolled students only)
 */
const getLectureStream = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return ApiResponse.error(res, 'Course not found', 404);

  const lecture = course.lectures.id(req.params.lectureId);
  if (!lecture) return ApiResponse.error(res, 'Lecture not found', 404);

  // Verify enrollment
  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
    status: 'active',
  });
  if (!enrolled && req.user.role === 'student') {
    return ApiResponse.error(res, 'You are not enrolled in this course', 403);
  }

  if (!lecture.videoKey) return ApiResponse.error(res, 'No video available', 404);

  const signedUrl = getSignedUrl(lecture.videoKey, 3600);
  ApiResponse.success(res, { signedUrl, expiresIn: 3600 }, 'Stream URL generated');
});

/**
 * POST /api/v1/courses  [Instructor]
 * Create a new course
 */
const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create({
    ...req.body,
    instructor: req.user._id,
  });

  // Add to instructor's created courses
  await User.findByIdAndUpdate(req.user._id, {
    $push: { createdCourses: course._id },
  });

  ApiResponse.created(res, course, 'Course created');
});

/**
 * PUT /api/v1/courses/:id  [Instructor/Admin]
 */
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return ApiResponse.error(res, 'Course not found', 404);

  // Only instructor who owns it or admin can update
  if (
    req.user.role === 'instructor' &&
    course.instructor.toString() !== req.user._id.toString()
  ) {
    return ApiResponse.error(res, 'Not authorized to update this course', 403);
  }

  const forbidden = ['instructor', '_id', 'slug'];
  forbidden.forEach((f) => delete req.body[f]);

  Object.assign(course, req.body);
  await course.save();

  ApiResponse.success(res, course, 'Course updated');
});

/**
 * DELETE /api/v1/courses/:id  [Instructor/Admin]
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return ApiResponse.error(res, 'Course not found', 404);

  if (
    req.user.role === 'instructor' &&
    course.instructor.toString() !== req.user._id.toString()
  ) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  // Delete all S3 assets
  const deletions = [];
  if (course.thumbnailKey) deletions.push(deleteFromS3(course.thumbnailKey));
  course.lectures.forEach((l) => {
    if (l.videoKey) deletions.push(deleteFromS3(l.videoKey));
    l.resources.forEach((r) => { if (r.key) deletions.push(deleteFromS3(r.key)); });
  });
  await Promise.allSettled(deletions);

  await course.deleteOne();

  ApiResponse.success(res, null, 'Course deleted');
});

/**
 * GET /api/v1/courses/instructor/my-courses  [Instructor]
 */
const getInstructorCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id })
    .select('-lectures.videoKey')
    .lean();
  ApiResponse.success(res, courses);
});

/**
 * GET /api/v1/courses/:id/students  [Instructor/Admin]
 */
const getEnrolledStudents = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ course: req.params.id })
    .populate('student', 'name email photoURL lastLoginAt')
    .lean();
  ApiResponse.success(res, enrollments);
});

/**
 * POST /api/v1/courses/:id/lectures  [Instructor]
 * Add a lecture to a course
 */
const addLecture = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return ApiResponse.error(res, 'Course not found', 404);

  if (course.instructor.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  course.lectures.push({
    ...req.body,
    order: course.lectures.length + 1,
  });
  await course.save();

  ApiResponse.created(res, course.lectures[course.lectures.length - 1], 'Lecture added');
});

/**
 * PUT /api/v1/courses/:id/lectures/:lectureId  [Instructor]
 */
const updateLecture = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return ApiResponse.error(res, 'Course not found', 404);

  const lecture = course.lectures.id(req.params.lectureId);
  if (!lecture) return ApiResponse.error(res, 'Lecture not found', 404);

  Object.assign(lecture, req.body);
  await course.save();

  ApiResponse.success(res, lecture, 'Lecture updated');
});

/**
 * DELETE /api/v1/courses/:id/lectures/:lectureId  [Instructor]
 */
const deleteLecture = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return ApiResponse.error(res, 'Course not found', 404);

  const lecture = course.lectures.id(req.params.lectureId);
  if (!lecture) return ApiResponse.error(res, 'Lecture not found', 404);

  if (lecture.videoKey) await deleteFromS3(lecture.videoKey);
  lecture.deleteOne();
  await course.save();

  ApiResponse.success(res, null, 'Lecture deleted');
});

module.exports = {
  getCourses,
  getCourseBySlug,
  getCourseById,
  getLectureStream,
  createCourse,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
  getEnrolledStudents,
  addLecture,
  updateLecture,
  deleteLecture,
};
