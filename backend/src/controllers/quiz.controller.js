'use strict';

const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');

/**
 * GET /api/v1/quizzes/course/:courseId
 * Get all quizzes for a course (students see published only)
 */
const getCourseQuizzes = asyncHandler(async (req, res) => {
  const filter = { course: req.params.courseId };
  if (req.user.role === 'student') filter.isPublished = true;

  const quizzes = await Quiz.find(filter)
    .select(req.user.role === 'student' ? '-questions.options.isCorrect -questions.explanation' : '')
    .lean();

  ApiResponse.success(res, quizzes);
});

/**
 * GET /api/v1/quizzes/:id
 * Get single quiz (strips answers for students)
 */
const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return ApiResponse.error(res, 'Quiz not found', 404);

  if (req.user.role === 'student') {
    const sanitized = quiz.toObject();
    sanitized.questions = sanitized.questions.map((q) => ({
      ...q,
      options: q.options.map((o) => ({ text: o.text, _id: o._id })),
      explanation: undefined,
    }));
    return ApiResponse.success(res, sanitized);
  }

  ApiResponse.success(res, quiz);
});

/**
 * POST /api/v1/quizzes  [Instructor]
 * Create a quiz
 */
const createQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.create(req.body);
  ApiResponse.created(res, quiz, 'Quiz created');
});

/**
 * PUT /api/v1/quizzes/:id  [Instructor]
 */
const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!quiz) return ApiResponse.error(res, 'Quiz not found', 404);
  ApiResponse.success(res, quiz, 'Quiz updated');
});

/**
 * DELETE /api/v1/quizzes/:id  [Instructor/Admin]
 */
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findByIdAndDelete(req.params.id);
  if (!quiz) return ApiResponse.error(res, 'Quiz not found', 404);
  ApiResponse.success(res, null, 'Quiz deleted');
});

/**
 * POST /api/v1/quizzes/:id/submit  [Student]
 * Submit quiz answers and get scored
 */
const submitQuiz = asyncHandler(async (req, res) => {
  const { answers, timeTaken = 0 } = req.body;
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || !quiz.isPublished) return ApiResponse.error(res, 'Quiz not found', 404);

  // Check attempt count
  const attemptCount = await QuizAttempt.countDocuments({
    student: req.user._id,
    quiz: quiz._id,
  });
  if (attemptCount >= quiz.maxAttempts) {
    return ApiResponse.error(res, `Maximum ${quiz.maxAttempts} attempts reached`, 429);
  }

  // Score the quiz
  let totalPoints = 0;
  let earnedPoints = 0;
  const scoredAnswers = quiz.questions.map((q, idx) => {
    const selected = answers?.[idx]?.selectedOption;
    const correctIdx = q.options.findIndex((o) => o.isCorrect);
    const isCorrect = selected === correctIdx;
    const pts = isCorrect ? q.points : 0;
    totalPoints += q.points;
    earnedPoints += pts;
    return {
      questionId: q._id,
      selectedOption: selected,
      isCorrect,
      pointsEarned: pts,
    };
  });

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = percentage >= quiz.passingScore;

  const attempt = await QuizAttempt.create({
    student: req.user._id,
    quiz: quiz._id,
    course: quiz.course,
    answers: scoredAnswers,
    score: earnedPoints,
    percentage,
    passed,
    timeTaken,
    attemptNumber: attemptCount + 1,
  });

  ApiResponse.created(res, {
    attempt,
    correctAnswers: quiz.questions.map((q) => ({
      questionId: q._id,
      correctOption: q.options.findIndex((o) => o.isCorrect),
      explanation: q.explanation,
    })),
  }, passed ? '🎉 Quiz passed!' : 'Quiz submitted. Keep practicing!');
});

/**
 * GET /api/v1/quizzes/:id/attempts  [Student]
 */
const getMyAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({
    student: req.user._id,
    quiz: req.params.id,
  }).sort({ createdAt: -1 }).lean();
  ApiResponse.success(res, attempts);
});

module.exports = {
  getCourseQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getMyAttempts,
};
