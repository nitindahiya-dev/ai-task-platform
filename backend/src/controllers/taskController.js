// backend/src/controllers/taskController.js

import Task from '../models/Task.js';
import { enqueueTask } from '../services/queueService.js';

// @desc    Create a new AI task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  try {
    const { title, inputText, operationType } = req.body;

    if (!title || !inputText || !operationType) {
      return res.status(400).json({ success: false, message: 'Please provide title, inputText and operationType' });
    }

    if (!['uppercase', 'lowercase', 'reverse', 'wordcount'].includes(operationType)) {
      return res.status(400).json({ success: false, message: 'Invalid operation type' });
    }

    // Create the task record with status pending and initial log
    const task = await Task.create({
      userId: req.user.id,
      title,
      inputText,
      operationType,
      status: 'pending',
      executionLogs: [{
        message: 'Task created and queued for processing',
      }],
    });

    // Enqueue the task
    await enqueueTask(task._id, {
      title,
      inputText,
      operationType,
    });

    res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks of authenticated user with pagination
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const total = await Task.countDocuments({ userId: req.user.id });
    const tasks = await Task.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task details and status
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id, // Secure: users can only see their own tasks
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or access denied' });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};
