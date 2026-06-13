'use strict';

const express = require('express');
const {
  getCourseQuizzes, getQuiz, createQuiz, updateQuiz, deleteQuiz, submitQuiz, getMyAttempts,
} = require('../controllers/quiz.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/course/:courseId', authenticate, getCourseQuizzes);
router.get('/:id', authenticate, getQuiz);
router.post('/', authenticate, authorize('instructor', 'admin'), createQuiz);
router.put('/:id', authenticate, authorize('instructor', 'admin'), updateQuiz);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), deleteQuiz);
router.post('/:id/submit', authenticate, authorize('student'), submitQuiz);
router.get('/:id/attempts', authenticate, authorize('student'), getMyAttempts);

module.exports = router;
