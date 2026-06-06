const mongoose = require('mongoose');

const CATEGORIES = [
  'salary', 'freelance', 'investment', 'business',
  'food', 'transport', 'housing', 'utilities',
  'healthcare', 'entertainment', 'education', 'shopping', 'other',
];

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: { values: ['income', 'expense'], message: 'Type must be income or expense' },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: `Category must be one of: ${CATEGORIES.join(', ')}` },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attachments: [
      {
        fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

// Indexes for frequent query patterns (user-scoped lists use createdBy + date)
transactionSchema.index({ createdBy: 1, date: -1 });
transactionSchema.index({ createdBy: 1, type: 1, category: 1 });
transactionSchema.index({ isDeleted: 1 });

// Default filter: exclude soft-deleted records
transactionSchema.pre(/^find/, function (next) {
  if (!this._skipDeletedFilter) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
