import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { createTask } from '../services/api';
import './CreateTaskModal.css';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [operationType, setOperationType] = useState('uppercase');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !inputText.trim() || !operationType) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await createTask(title, inputText, operationType);
      // Reset form fields
      setTitle('');
      setInputText('');
      setOperationType('uppercase');
      onTaskCreated(); // Trigger dashboard reload
      onClose(); // Close modal
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <FiX />
        </button>

        <h2 className="modal-title">Create New Task</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Log processing task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Operation Type</label>
            <select
              className="form-control"
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              disabled={submitting}
              style={{ background: '#0a0e27' }}
            >
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="reverse">Reverse String</option>
              <option value="wordcount">Word Count</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Input Text</label>
            <textarea
              className="form-control"
              rows="6"
              placeholder="Enter the text to be processed..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
