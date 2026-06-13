'use strict';

const express = require('express');
const { getMe, updateMe, loginWithEmail } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', loginWithEmail);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

module.exports = router;
