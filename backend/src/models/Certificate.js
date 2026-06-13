'use strict';

const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    certificateId: {
      type: String,
      unique: true,
      required: true,
    },
    studentName: { type: String, required: true },
    courseName: { type: String, required: true },
    instructorName: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String, default: null },   // S3 URL
    pdfKey: { type: String, default: null },   // S3 key
    isValid: { type: Boolean, default: true },
  },
  { timestamps: true }
);

certificateSchema.index({ student: 1, course: 1 }, { unique: true });
certificateSchema.index({ certificateId: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
