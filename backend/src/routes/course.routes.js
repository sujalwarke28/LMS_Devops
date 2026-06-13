'use strict';

const express = require('express');
const {
  getCourses, getCourseBySlug, getCourseById, getLectureStream, createCourse, updateCourse,
  deleteCourse, getInstructorCourses, getEnrolledStudents, addLecture, updateLecture, deleteLecture,
} = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/slug/:slug', getCourseBySlug);

// Authenticated routes
router.get('/:id', authenticate, getCourseById);
router.get('/:id/lectures/:lectureId/stream', authenticate, getLectureStream);

// Instructor routes
router.get('/instructor/my-courses', authenticate, authorize('instructor', 'admin'), getInstructorCourses);
router.get('/:id/students', authenticate, authorize('instructor', 'admin'), getEnrolledStudents);
router.post('/', authenticate, authorize('instructor', 'admin'), createCourse);
router.put('/:id', authenticate, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), deleteCourse);
router.post('/:id/lectures', authenticate, authorize('instructor', 'admin'), addLecture);
router.put('/:id/lectures/:lectureId', authenticate, authorize('instructor', 'admin'), updateLecture);
router.delete('/:id/lectures/:lectureId', authenticate, authorize('instructor', 'admin'), deleteLecture);

module.exports = router;
