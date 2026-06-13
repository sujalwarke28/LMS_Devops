'use strict';

const express = require('express');
const { getCourseProgress, markLectureComplete, getCourseStudentProgress } = require('../controllers/progress.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/:courseId', authenticate, getCourseProgress);
router.post('/:courseId/lecture/:lectureId', authenticate, authorize('student'), markLectureComplete);
router.get('/instructor/:courseId', authenticate, authorize('instructor', 'admin'), getCourseStudentProgress);

module.exports = router;
