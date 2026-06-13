'use strict';

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  explanation: { type: String, default: '' },
  points: { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    questions: [questionSchema],
    passingScore: { type: Number, default: 70, min: 0, max: 100 }, // percentage
    timeLimit: { type: Number, default: 0 }, // minutes, 0 = no limit
    maxAttempts: { type: Number, default: 3 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
