import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🤖 <span>AI Task Platform</span>
        </Link>
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <div className="navbar-user">
                Hi, <strong>{user?.name}</strong>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary navbar-logout-btn">
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
