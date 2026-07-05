import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import StatusBadge from './StatusBadge';
import './TaskCard.css';

// Helper function to format relative time
const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const TaskCard = ({ task }) => {
  return (
    <Link to={`/tasks/${task._id}`} className="glass task-card">
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <StatusBadge status={task.status} />
      </div>
      
      <div className="task-card-meta">
        <span className="task-card-op">{task.operationType}</span>
        <div className="task-card-time">
          <FiClock size={14} />
          {getRelativeTime(task.createdAt)}
        </div>
      </div>

      <div className="task-card-body">
        {task.inputText}
      </div>
    </Link>
  );
};

export default TaskCard;
