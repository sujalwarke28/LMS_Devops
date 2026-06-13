'use strict';

const express = require('express');
const {
  getPlatformStats, getAllUsers, updateUserRole, toggleUserStatus, deleteUser, getAllCourses,
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/courses', getAllCourses);

module.exports = router;
