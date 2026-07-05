import redis from '../config/redis.js';

/**
 * Enqueue a task for background processing by the Python worker
 * @param {string} taskId - The MongoDB Task ID
 * @param {object} taskData - Data of the task (inputText, operationType, title)
 */
export const enqueueTask = async (taskId, taskData) => {
  try {
    const queuePayload = JSON.stringify({
      taskId,
      inputText: taskData.inputText,
      operationType: taskData.operationType,
      title: taskData.title,
    });

    await redis.lpush('task_queue', queuePayload);
    console.log(`Task ${taskId} successfully enqueued to task_queue`);
    return true;
  } catch (error) {
    console.error(`Failed to enqueue task ${taskId}: ${error.message}`);
    throw error;
  }
};
