import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [role, setRole] = useState('staff'); // Defaults to 'staff' tab
  const [username, setUsername] = useState(''); // Holds username or 'staff'
  const [password, setPassword] = useState(''); // Holds password or PIN
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(false);

    // Prepare payload fields exactly how your server.js logic parses them
    const loginPayload = {
      role: role,
      username: role === 'staff' ? 'staff' : username, // Auto-sets 'staff' if in staff tab
      password: password, // Raw input string processed as PIN for staff, password for admin
      pin: role === 'staff' ? password : '' // Redundancy safety fallback for emergency bypasses
    };

    try {
      setLoading(true);
      
      // Dispatch authentication request to backend
      const response = await axios.post('http://localhost:5000/api/auth/login', loginPayload);
      
      if (response.data && response.data.token) {
        // Save authorization token into client browser local context
        localStorage.setItem('token', response.data.token);
        
        // Return verification payload up to App.js (handleLogin)
        onLogin({
          token: response.data.token,
          role: response.data.role,
          username: response.data.username
        });
      }
    } catch (err) {
      console.error("Login component transmission failure:", err);
      setError(err.response?.data?.message || 'Authentication rejected. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setPassword('');
    setUsername(selectedRole === 'staff' ? 'staff' : '');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* ROLE SELECTION TABS */}
        <div style={styles.tabContainer}>
          <button
            type="button"
            onClick={() => handleTabChange('staff')}
            style={{
              ...styles.tabButton,
              backgroundColor: role === 'staff' ? '#2c3e50' : '#f4f6f7',
              color: role === 'staff' ? '#fff' : '#7f8c8d',
            }}
          >
            📱 Staff Login
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            style={{
              ...styles.tabButton,
              backgroundColor: role === 'admin' ? '#007bff' : '#f4f6f7',
              color: role === 'admin' ? '#fff' : '#7f8c8d',
            }}
          >
            🔑 Admin Login
          </button>
        </div>

        {/* COMPONENT TITLE DESCRIPTIONS */}
        <h2 style={styles.title}>
          {role === 'admin' ? 'Administrative Portal' : 'Hams Lounge Staff'}
        </h2>
        <p style={styles.subtitle}>
          {role === 'admin' ? 'Enter administrative security credentials' : 'Enter access PIN number'}
        </p>

        {error && <div style={styles.errorBanner}>❌ {error}</div>}

        {/* AUTHENTICATION FORM INPUT SHIFT */}
        <form onSubmit={handleSubmit}>
          
          {role === 'admin' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Admin Username</label>
              <input
                type="text"
                required
                placeholder="e.g., admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              {role === 'staff' ? 'Access PIN' : 'Password'}
            </label>
            <input
              type="password"
              required
              placeholder={role === 'staff' ? '••••' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              backgroundColor: role === 'admin' ? '#007bff' : '#2c3e50'
            }}
          >
            {loading ? 'Authenticating Session...' : `Authorize Session as ${role.toUpperCase()}`}
          </button>
        </form>

      </div>
    </div>
  );
};

// COMPACT STYLING RULES FOR PROPER DISPLAY RENDER
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#ecf0f1',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    padding: '35px',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: '#f4f6f7',
    borderRadius: '6px',
    padding: '4px',
    marginBottom: '25px',
    border: '1px solid #dcdde1'
  },
  tabButton: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  title: {
    textAlign: 'center',
    margin: '0 0 5px 0',
    color: '#2c3e50',
    fontSize: '1.4rem'
  },
  subtitle: {
    textAlign: 'center',
    margin: '0 0 25px 0',
    color: '#7f8c8d',
    fontSize: '0.85rem'
  },
  errorBanner: {
    backgroundColor: '#fde8e8',
    color: '#e74c3c',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginBottom: '20px',
    border: '1px solid #f8b4b4',
    fontWeight: '500'
  },
  inputGroup: {
    marginBottom: '18px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#34495e',
    fontSize: '0.85rem',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #cccccc',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'opacity 0.2s'
  }
};

export default Login;