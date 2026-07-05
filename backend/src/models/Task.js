import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  inputText: {
    type: String,
    required: [true, 'Input text is required'],
  },
  operationType: {
    type: String,
    required: [true, 'Operation type is required'],
    enum: ['uppercase', 'lowercase', 'reverse', 'wordcount'],
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed'],
    default: 'pending',
  },
  result: {
    type: String,
    default: '',
  },
  executionLogs: [{
    timestamp: {
      type: Date,
      default: Date.now,
    },
    message: {
      type: String,
      required: true,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update updatedAt
taskSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Compound index for dashboard queries: fetching a user's tasks filtered/sorted
taskSchema.index({ userId: 1, status: 1, createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
