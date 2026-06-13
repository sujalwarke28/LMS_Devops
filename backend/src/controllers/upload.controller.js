'use strict';

const multer = require('multer');
const { uploadToS3 } = require('../services/s3.service');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');

// Store in memory for S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
      'application/zip', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

const FOLDER_MAP = {
  'video/mp4': 'videos',
  'video/webm': 'videos',
  'video/ogg': 'videos',
  'video/quicktime': 'videos',
  'application/pdf': 'resources',
  'image/jpeg': 'thumbnails',
  'image/png': 'thumbnails',
  'image/webp': 'thumbnails',
};

/**
 * POST /api/v1/upload/single
 * Upload a single file to S3
 */
const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, 'No file uploaded', 400);

  const folder = FOLDER_MAP[req.file.mimetype] || 'resources';
  const result = await uploadToS3({
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    folder,
  });

  ApiResponse.created(res, result, 'File uploaded successfully');
});

module.exports = { upload, uploadSingle };
