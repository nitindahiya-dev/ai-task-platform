import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiPlay } from 'react-icons/fi';
import { getTask } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import './TaskDetailPage.css';

const formatTimestamp = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
};

const formatTimeOnly = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toTimeString().split(' ')[0] + '.' + String(date.getMilliseconds()).padStart(3, '0');
};

const TaskDetailPage = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const pollingRef = useRef(null);

  const fetchTaskDetails = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getTask(id);
      setTask(data.task);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch task details.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  // Set up polling while task is active
  useEffect(() => {
    if (task && (task.status === 'pending' || task.status === 'running')) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchTaskDetails(false);
        }, 3000);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [task]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="spinner spinner-large"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container">
        <Link to="/" className="back-link">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <div className="alert alert-danger">{error || 'Task not found.'}</div>
      </div>
    );
  }

  return (
    <div className="container animate-slide-up">
      <Link to="/" className="back-link">
        <FiArrowLeft /> Back to Dashboard
      </Link>

      <div className="glass detail-card">
        <div className="detail-header">
          <div className="detail-title-section">
            <h1 className="detail-title">{task.title}</h1>
            <div className="detail-meta-row">
              <span className="detail-meta-item">
                <FiPlay size={14} style={{ color: '#00D4AA' }} />
                Operation: <strong style={{ color: '#00D4AA', marginLeft: '4px', textTransform: 'uppercase' }}>{task.operationType}</strong>
              </span>
              <span className="detail-meta-divider"></span>
              <span className="detail-meta-item">
                <FiClock size={14} />
                Created: {formatTimestamp(task.createdAt)}
              </span>
            </div>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {/* Input Text Section */}
        <div className="detail-section">
          <h4 className="detail-section-title">Input Text</h4>
          <div className="detail-text-block">{task.inputText}</div>
        </div>

        {/* Result Section */}
        <div className="detail-section">
          <h4 className="detail-section-title">Output Result</h4>
          {task.status === 'success' ? (
            <div className="detail-text-block detail-result-block success">{task.result}</div>
          ) : task.status === 'failed' ? (
            <div className="detail-text-block detail-result-block failed">
              {task.result || 'Execution failed. Check logs for details.'}
            </div>
          ) : (
            <div className="detail-text-block" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
              Processing task... waiting for background worker.
            </div>
          )}
        </div>

        {/* Logs Section */}
        <div className="detail-section">
          <h4 className="detail-section-title">Execution Logs</h4>
          {task.executionLogs && task.executionLogs.length > 0 ? (
            <div className="logs-timeline">
              {task.executionLogs.map((log, index) => {
                let statusClass = '';
                if (log.message.includes('successfully')) statusClass = 'success';
                else if (log.message.toLowerCase().includes('error') || log.message.toLowerCase().includes('failed')) statusClass = 'failed';

                return (
                  <div key={log._id || index} className={`log-item ${statusClass}`}>
                    <span className="log-dot"></span>
                    <div className="log-header">
                      <span className="log-time">{formatTimeOnly(log.timestamp)}</span>
                      <span className="log-msg">{log.message}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#555577', fontStyle: 'italic', fontSize: '0.9rem' }}>No execution logs available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
