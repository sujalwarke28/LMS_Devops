'use strict';

const express = require('express');
const { upload, uploadSingle } = require('../controllers/upload.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.post(
  '/single',
  authenticate,
  authorize('instructor', 'admin'),
  upload.single('file'),
  uploadSingle
);

module.exports = router;
