import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const normalizedStatus = status ? status.toLowerCase() : 'pending';

  return (
    <div className={`status-badge ${normalizedStatus}`}>
      <span className="status-dot"></span>
      <span className="status-text">{normalizedStatus}</span>
    </div>
  );
};

export default StatusBadge;
