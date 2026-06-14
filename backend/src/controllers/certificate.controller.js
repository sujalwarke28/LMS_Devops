'use strict';

const Certificate = require('../models/Certificate');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/v1/certificates/generate/:courseId
 * Generate certificate for a completed course
 */
const generateCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // Check if already exists
  const existing = await Certificate.findOne({
    student: req.user._id,
    course: courseId,
  });
  if (existing) return ApiResponse.success(res, existing, 'Certificate already exists');

  const Quiz = require('../models/Quiz');
  const QuizAttempt = require('../models/QuizAttempt');

  // Verify student has passed the course quizzes
  const courseQuizzes = await Quiz.find({ course: courseId, isPublished: true });
  if (courseQuizzes.length === 0) {
    return ApiResponse.error(res, 'This course does not have a quiz required for certification.', 400);
  }

  for (const quiz of courseQuizzes) {
    const passedAttempt = await QuizAttempt.findOne({
      student: req.user._id,
      quiz: quiz._id,
      passed: true
    });
    if (!passedAttempt) {
      return ApiResponse.error(res, 'You must pass the course quiz to earn a certificate', 400);
    }
  }

  const course = await Course.findById(courseId).populate('instructor', 'name');
  if (!course) return ApiResponse.error(res, 'Course not found', 404);

  const certificateId = `LMS-${uuidv4().toUpperCase().slice(0, 8)}`;

  const certificate = await Certificate.create({
    student: req.user._id,
    course: courseId,
    certificateId,
    studentName: req.user.name,
    courseName: course.title,
    instructorName: course.instructor.name,
  });

  ApiResponse.created(res, certificate, 'Certificate generated successfully');
});

/**
 * GET /api/v1/certificates/my
 * Get all certificates for authenticated student
 */
const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ student: req.user._id })
    .populate('course', 'title thumbnailUrl category')
    .lean();
  ApiResponse.success(res, certificates);
});

/**
 * GET /api/v1/certificates/verify/:certificateId
 * Public verification endpoint
 */
const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certificateId })
    .populate('student', 'name')
    .populate('course', 'title')
    .lean();

  if (!cert || !cert.isValid) {
    return ApiResponse.error(res, 'Certificate not found or invalid', 404);
  }

  ApiResponse.success(res, cert, 'Certificate is valid');
});

module.exports = { generateCertificate, getMyCertificates, verifyCertificate };
