'use strict';

const express = require('express');
const { getMe, updateMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

module.exports = router;
