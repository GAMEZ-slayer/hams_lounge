import React, { useState } from 'react';
import api from './api/axios';

const Login = ({ onLogin }) => {
  const [role, setRole] = useState('staff');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginPayload = {
      role,
      username: role === 'admin' ? username : name,
      name: role === 'staff' ? name : undefined,
      password,
    };

    try {
      const response = await api.post('/api/auth/login', loginPayload);

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        onLogin({
          token:    response.data.token,
          role:     response.data.role,
          username: role === 'staff' ? name : response.data.username,
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError((err.response?.data?.message) || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (selectedRole) => {
    setRole(selectedRole);
    setUsername('');
    setName('');
    setPassword('');
    setError('');
  };

  return (
    <div style={styles.container}>
      {/* Ambient background glow */}
      <div style={styles.glowOrb1}></div>
      <div style={styles.glowOrb2}></div>

      <div style={styles.card}>
        {/* Brand Header */}
        <div style={styles.brandSection}>
          <div style={styles.logoIcon}>H</div>
          <h1 style={styles.brandName}>HAMS LOUNGE</h1>
          <p style={styles.brandTagline}>Premium Bar & Lounge</p>
        </div>

        {/* Role Tabs */}
        <div style={styles.tabContainer}>
          {['staff', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleTabChange(r)}
              style={{
                ...styles.tabButton,
                backgroundColor: role === r ? '#c9a94e' : 'transparent',
                color: role === r ? '#0f0f0f' : '#8a8a8a',
                borderColor: role === r ? '#c9a94e' : '#2a2a3e',
              }}
            >
              {r === 'staff' ? 'Staff Login' : 'Admin Login'}
            </button>
          ))}
        </div>

        <p style={styles.subtitle}>
          {role === 'admin' ? 'Enter your admin credentials' : 'Enter your name and PIN to begin'}
        </p>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {role === 'staff' ? (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Your Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
              />
            </div>
          ) : (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Admin Username</label>
              <input
                type="text"
                required
                placeholder="e.g. admin"
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
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>Hams Lounge POS System v2.0</p>
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
    background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 40%, #16213e 70%, #0a0a12 100%)',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,169,78,0.15) 0%, transparent 70%)',
    top: '-100px',
    right: '-100px',
    pointerEvents: 'none',
  },
  glowOrb2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,169,78,0.1) 0%, transparent 70%)',
    bottom: '-80px',
    left: '-80px',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'rgba(20, 20, 35, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '40px 35px',
    borderRadius: '16px',
    border: '1px solid rgba(201, 169, 78, 0.2)',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(201,169,78,0.05)',
    zIndex: 1,
  },
  brandSection: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logoIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #c9a94e, #e8d48b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#0f0f0f',
    fontFamily: "'Playfair Display', serif",
    lineHeight: '60px',
    textAlign: 'center',
  },
  brandName: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#c9a94e',
    letterSpacing: '3px',
    margin: '0',
    fontFamily: "'Playfair Display', serif",
  },
  brandTagline: {
    fontSize: '0.75rem',
    color: '#7a7a8e',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    padding: '4px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  tabButton: {
    flex: 1,
    padding: '10px',
    border: '1px solid transparent',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  subtitle: {
    textAlign: 'center',
    margin: '0 0 22px 0',
    color: '#6a6a7e',
    fontSize: '0.8rem',
  },
  errorBanner: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    color: '#ff6b6b',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.82rem',
    textAlign: 'center',
    marginBottom: '18px',
    border: '1px solid rgba(231, 76, 60, 0.3)',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#9a9ab0',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '0.92rem',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#e0e0e0',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  submitButton: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #c9a94e, #e8d48b)',
    color: '#0f0f0f',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    letterSpacing: '0.5px',
    fontFamily: "'Inter', sans-serif",
  },
  footer: {
    textAlign: 'center',
    color: '#4a4a5e',
    fontSize: '0.7rem',
    marginTop: '24px',
    letterSpacing: '1px',
  },
};

export default Login;
