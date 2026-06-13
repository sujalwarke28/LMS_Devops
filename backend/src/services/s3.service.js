'use strict';

const { s3, S3_BUCKET } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Upload a file buffer to S3
 */
const uploadToS3 = async ({ buffer, originalname, mimetype, folder }) => {
  const ext = path.extname(originalname);
  const key = `${folder}/${uuidv4()}${ext}`;

  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    ServerSideEncryption: 'AES256',
  };

  const result = await s3.upload(params).promise();
  logger.info(`S3 upload success: ${key}`);

  return {
    url: result.Location,
    key: result.Key,
  };
};

/**
 * Delete a file from S3 by key
 */
const deleteFromS3 = async (key) => {
  if (!key) return;
  const params = { Bucket: S3_BUCKET, Key: key };
  await s3.deleteObject(params).promise();
  logger.info(`S3 delete success: ${key}`);
};

/**
 * Generate a pre-signed URL for temporary access (e.g. video streaming)
 */
const getSignedUrl = (key, expiresIn = 3600) => {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Expires: expiresIn,
  };
  return s3.getSignedUrl('getObject', params);
};

/**
 * Upload certificate PDF buffer
 */
const uploadCertificate = async ({ buffer, certificateId }) => {
  return uploadToS3({
    buffer,
    originalname: `${certificateId}.pdf`,
    mimetype: 'application/pdf',
    folder: 'certificates',
  });
};

module.exports = { uploadToS3, deleteFromS3, getSignedUrl, uploadCertificate };
