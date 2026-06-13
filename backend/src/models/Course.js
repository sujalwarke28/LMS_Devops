'use strict';

const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, default: null },   // S3 URL
  videoKey: { type: String, default: null },   // S3 key for deletion
  duration: { type: Number, default: 0 },       // seconds
  order: { type: Number, required: true },
  isPreview: { type: Boolean, default: false },
  resources: [
    {
      name: { type: String },
      url: { type: String },
      key: { type: String },
      fileType: { type: String },
    },
  ],
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    shortDescription: {
      type: String,
      maxlength: 300,
      default: '',
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'DevOps',
        'Cloud',
        'Programming',
        'Data Science',
        'Cybersecurity',
        'Design',
        'Business',
        'Other',
      ],
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    thumbnailUrl: { type: String, default: null },
    thumbnailKey: { type: String, default: null },
    price: { type: Number, default: 0, min: 0 },
    isFree: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    lectures: [lectureSchema],
    tags: [{ type: String, lowercase: true }],
    totalDuration: { type: Number, default: 0 }, // seconds
    enrollmentCount: { type: Number, default: 0 },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    requirements: [{ type: String }],
    outcomes: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from title
courseSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  // Recalculate total duration
  this.totalDuration = this.lectures.reduce((sum, l) => sum + (l.duration || 0), 0);
  next();
});

courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ slug: 1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Course', courseSchema);
