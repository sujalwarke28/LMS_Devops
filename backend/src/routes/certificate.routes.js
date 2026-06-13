'use strict';

const express = require('express');
const { generateCertificate, getMyCertificates, verifyCertificate } = require('../controllers/certificate.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/verify/:certificateId', verifyCertificate);  // public
router.get('/my', authenticate, getMyCertificates);
router.post('/generate/:courseId', authenticate, authorize('student'), generateCertificate);

module.exports = router;
