'use strict';

const express = require('express');
const { getMe, updateMe, loginWithEmail, registerWithEmail } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', loginWithEmail);
router.post('/register', registerWithEmail);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);

module.exports = router;
