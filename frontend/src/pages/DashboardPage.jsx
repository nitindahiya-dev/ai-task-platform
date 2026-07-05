import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiActivity, FiClock, FiCheckCircle, FiList } from 'react-icons/fi';
import { getTasks } from '../services/api';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import './DashboardPage.css';

const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, running: 0, completed: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const pollingIntervalRef = useRef(null);

  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getTasks(page, 9); // Limit to 9 tasks per page for clean grid
      setTasks(data.tasks);
      setTotalPages(data.pagination.pages);
      setTotalTasksCount(data.pagination.total);
      
      // Calculate basic stats for this page / context
      // Note: In production, stats would come from a dedicated API endpoint
      const statsObj = data.tasks.reduce(
        (acc, task) => {
          acc.total += 1;
          if (task.status === 'pending') acc.pending += 1;
          else if (task.status === 'running') acc.running += 1;
          else if (task.status === 'success') acc.completed += 1;
          return acc;
        },
        { total: data.pagination.total, pending: 0, running: 0, completed: 0 }
      );
      
      setStats(statsObj);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks. Please try reloading.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page]);

  // Set up polling if any task is pending or running
  useEffect(() => {
    const hasActiveTasks = tasks.some(
      (task) => task.status === 'pending' || task.status === 'running'
    );

    if (hasActiveTasks) {
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(() => {
          fetchTasks(false); // poll silently without full loading spinner
        }, 5000);
      }
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [tasks]);

  const handleTaskCreated = () => {
    setPage(1); // Go to first page
    fetchTasks(true);
  };

  return (
    <div className="container animate-slide-up">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Your Tasks</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus /> New Task
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats Bar */}
      <div className="stats-row">
        <div className="glass stat-card">
          <div className="stat-icon total">
            <FiList />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="stat-icon pending">
            <FiClock />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="stat-icon running">
            <FiActivity />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.running}</span>
            <span className="stat-label">Running</span>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="stat-icon completed">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner spinner-large"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass empty-state">
          <span className="empty-icon">🤖</span>
          <p className="empty-text">No tasks created yet</p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            Create Your First Task
          </button>
        </div>
      ) : (
        <>
          <div className="tasks-grid">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <div className="pagination-info">
              Showing Page {page} of {totalPages} ({totalTasksCount} tasks)
            </div>
            <div className="pagination-actions">
              <button
                className="btn btn-secondary pagination-btn"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary pagination-btn"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default DashboardPage;
