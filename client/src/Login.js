import React, { useState } from 'react';
import api from './api/axios';

const Login = ({ onLogin }) => {
  const [role, setRole] = useState('staff');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginPayload = { role, username };

    try {
      const response = await api.post('/api/auth/login', loginPayload);

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
        onLogin({
          token:    response.data.token,
          role:     response.data.role,
          username: response.data.username,
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (selectedRole) => {
    setRole(selectedRole);
    setUsername('');
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.tabContainer}>
          {['staff', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleTabChange(r)}
              style={{
                ...styles.tabButton,
                backgroundColor: role === r ? (r === 'admin' ? '#007bff' : '#2c3e50') : '#f4f6f7',
                color: role === r ? '#fff' : '#7f8c8d',
              }}
            >
              {r === 'staff' ? 'Staff Login' : 'Admin Login'}
            </button>
          ))}
        </div>

        <h2 style={styles.title}>
          {role === 'admin' ? 'Administrative Portal' : 'Hams Lounge Staff'}
        </h2>
        <p style={styles.subtitle}>Enter your username to continue</p>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              {role === 'staff' ? 'Staff Username' : 'Admin Username'}
            </label>
            <input
              type="text"
              required
              placeholder={role === 'staff' ? 'Your username' : 'e.g., admin'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              backgroundColor: role === 'admin' ? '#007bff' : '#2c3e50',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating...' : 'Login as ' + role.toUpperCase()}
          </button>
        </form>

      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#ecf0f1',
    fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },
  card: {
    width: '350px',
    padding: '30px',
    borderRadius: '8px',