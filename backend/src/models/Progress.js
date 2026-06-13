'use strict';

const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
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
    completedLectures: [
      {
        lectureId: { type: mongoose.Schema.Types.ObjectId },
        completedAt: { type: Date, default: Date.now },
        watchedSeconds: { type: Number, default: 0 },
      },
    ],
    percentageComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastAccessedLecture: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

progressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
