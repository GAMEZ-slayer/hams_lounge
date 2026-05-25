import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [role, setRole] = useState('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginPayload = {
      role,
      username,                              // Always use what the user typed
      password: role === 'admin' ? password : undefined,
      pin:      role === 'staff' ? password : undefined,
    };

    try {
      const response = await axios.post('REACT_APP_API_URL', loginPayload);

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
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (selectedRole) => {
    setRole(selectedRole);
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* ROLE TABS */}
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
              {r === 'staff' ? '📱 Staff Login' : '🔑 Admin Login'}
            </button>
          ))}
        </div>

        <h2 style={styles.title}>
          {role === 'admin' ? 'Administrative Portal' : 'Hams Lounge Staff'}
        </h2>
        <p style={styles.subtitle}>
          {role === 'admin' ? 'Enter your admin credentials' : 'Enter your username and PIN'}
        </p>

        {error && <div style={styles.errorBanner}>❌ {error}</div>}

        <form onSubmit={handleSubmit}>

          {/* Username — shown for both roles now */}
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
              backgroundColor: role === 'admin' ? '#007bff' : '#2c3e50',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating...' : `Login as ${role.toUpperCase()}`}
          </button>

        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', backgroundColor: '#ecf0f1',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  card: {
    width: '100%', maxWidth: '400px', backgroundColor: '#ffffff',
    padding: '35px', borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
  },
  tabContainer: {
    display: 'flex', backgroundColor: '#f4f6f7', borderRadius: '6px',
    padding: '4px', marginBottom: '25px', border: '1px solid #dcdde1'
  },
  tabButton: {
    flex: 1, padding: '10px', border: 'none', borderRadius: '4px',
    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease'
  },
  title: { textAlign: 'center', margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.4rem' },
  subtitle: { textAlign: 'center', margin: '0 0 25px 0', color: '#7f8c8d', fontSize: '0.85rem' },
  errorBanner: {
    backgroundColor: '#fde8e8', color: '#e74c3c', padding: '10px',
    borderRadius: '4px', fontSize: '0.85rem', textAlign: 'center',
    marginBottom: '20px', border: '1px solid #f8b4b4', fontWeight: '500'
  },
  inputGroup: { marginBottom: '18px' },
  label: { display: 'block', marginBottom: '6px', color: '#34495e', fontSize: '0.85rem', fontWeight: 'bold' },
  input: {
    width: '100%', padding: '10px', borderRadius: '4px',
    border: '1px solid #cccccc', fontSize: '0.95rem',
    boxSizing: 'border-box', outline: 'none'
  },
  submitButton: {
    width: '100%', padding: '12px', color: '#ffffff', border: 'none',
    borderRadius: '4px', fontSize: '0.95rem', fontWeight: 'bold',
    cursor: 'pointer', marginTop: '10px', transition: 'opacity 0.2s'
  }
};

export default Login;
