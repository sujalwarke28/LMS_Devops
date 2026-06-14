'use strict';

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadToS3 } = require('../services/s3.service');
const { ApiResponse, asyncHandler } = require('../utils/apiResponse');

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = FOLDER_MAP[file.mimetype] || 'resources';
    const dir = path.join(__dirname, '../../uploads', folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowed = Object.keys(FOLDER_MAP).concat([
      'application/zip', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

/**
 * POST /api/v1/upload/single
 * Upload a single file (videos are kept local, others go to S3)
 */
const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) return ApiResponse.error(res, 'No file uploaded', 400);

  if (req.file.mimetype.startsWith('video/')) {
    // Keep locally
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const folder = FOLDER_MAP[req.file.mimetype] || 'videos';
    const localUrl = `${baseUrl}/uploads/${folder}/${req.file.filename}`;
    return ApiResponse.created(res, { url: localUrl, key: req.file.filename }, 'File uploaded successfully');
  }

  // Else, upload to S3
  const folder = FOLDER_MAP[req.file.mimetype] || 'resources';
  const buffer = fs.readFileSync(req.file.path);

  const result = await uploadToS3({
    buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    folder,
  });

  // Delete local temporary file
  try {
    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.error('Failed to delete temp local file:', err);
  }

  ApiResponse.created(res, result, 'File uploaded successfully');
});

module.exports = { upload, uploadSingle };
