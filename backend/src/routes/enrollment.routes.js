'use strict';

const express = require('express');
const { enrollInCourse, getMyEnrollments, dropCourse } = require('../controllers/enrollment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/:courseId', authenticate, authorize('student'), enrollInCourse);
router.get('/my', authenticate, authorize('student'), getMyEnrollments);
router.delete('/:courseId', authenticate, authorize('student'), dropCourse);

module.exports = router;
