'use strict';

const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');

/**
 * GET /api/v1/progress/:courseId
 * Get progress for authenticated student in a course
 */
const getCourseProgress = asyncHandler(async (req, res) => {
  const progress = await Progress.findOne({
    student: req.user._id,
    course: req.params.courseId,
  }).lean();

  if (!progress) return ApiResponse.error(res, 'No progress record found', 404);

  ApiResponse.success(res, progress);
});

/**
 * POST /api/v1/progress/:courseId/lecture/:lectureId
 * Mark a lecture as completed and recalculate progress
 */
const markLectureComplete = asyncHandler(async (req, res) => {
  const { watchedSeconds = 0 } = req.body;
  const { courseId, lectureId } = req.params;

  // Verify enrollment
  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    status: 'active',
  });
  if (!enrolled) return ApiResponse.error(res, 'Not enrolled in this course', 403);

  const course = await Course.findById(courseId).select('lectures');
  if (!course) return ApiResponse.error(res, 'Course not found', 404);

  const totalLectures = course.lectures.length;

  let progress = await Progress.findOne({ student: req.user._id, course: courseId });
  if (!progress) {
    progress = new Progress({ student: req.user._id, course: courseId });
  }

  // Add lecture if not already completed
  const alreadyDone = progress.completedLectures.some(
    (l) => l.lectureId.toString() === lectureId
  );

  if (!alreadyDone) {
    progress.completedLectures.push({ lectureId, watchedSeconds });
  }

  progress.lastAccessedLecture = lectureId;
  progress.lastAccessedAt = new Date();
  progress.percentageComplete =
    totalLectures > 0
      ? Math.round((progress.completedLectures.length / totalLectures) * 100)
      : 0;

  if (progress.percentageComplete === 100 && !progress.isCompleted) {
    progress.isCompleted = true;
    progress.completedAt = new Date();
    await Enrollment.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      { status: 'completed', completedAt: new Date() }
    );
  }

  await progress.save();
  ApiResponse.success(res, progress, 'Progress updated');
});

/**
 * GET /api/v1/progress/instructor/:courseId
 * Get all student progress for a course [Instructor/Admin]
 */
const getCourseStudentProgress = asyncHandler(async (req, res) => {
  const progressList = await Progress.find({ course: req.params.courseId })
    .populate('student', 'name email photoURL')
    .lean();
  ApiResponse.success(res, progressList);
});

module.exports = { getCourseProgress, markLectureComplete, getCourseStudentProgress };
