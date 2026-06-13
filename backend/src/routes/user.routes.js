'use strict';

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Stub — user profile management (extended by auth.routes)
// Additional user-specific routes go here (e.g., user bookmarks, notifications)
router.get('/profile', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
