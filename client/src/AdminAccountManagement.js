import React, { useState } from 'react';
import api from './api'; // Points to your axios baseline instance configuration

function AdminAccountManagement() {
  const [targetUsername, setTargetUsername] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [targetRole, setTargetRole] = useState('staff');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleCredentialUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const response = await api.post('/auth/change-password', {
        targetUsername: targetUsername.trim(),
        newCredential: newCredential.trim(),
        role: targetRole
      });

      if (response.data.success) {
        setStatusMessage({ type: 'success', text: response.data.message });
        setTargetUsername('');
        setNewCredential('');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update credentials. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>🔐 Manage User Credentials</h3>
      
      {statusMessage.text && (
        <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', backgroundColor: statusMessage.type === 'success' ? '#d4edda' : '#f8d7da', color: statusMessage.type === 'success' ? '#155724' : '#721c24', textAlign: 'center' }}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleCredentialUpdate}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Role:</label>
          <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="staff">Staff Member</option>
            <option value="admin">Admin User</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Target Username:</label>
          <input type="text" value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} placeholder="e.g. staff_lounge or admin_main" required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password / PIN:</label>
          <input type="password" value={newCredential} onChange={(e) => setNewCredential(e.target.value)} placeholder="Enter secure password or PIN" required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
          {loading ? 'Processing Update...' : '🔄 Update Account Credentials'}
        </button>
      </form>
    </div>
  );
}

export default AdminAccountManagement;