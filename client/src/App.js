import React, { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import InventoryManager from './InventoryManager';
import SalesHistory from './SalesHistory';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pos');
  // Counter to signal when sales records need to be re-fetched
  const [salesRefreshTrigger, setSalesRefreshTrigger] = useState(0);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab('pos');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const triggerSalesRefresh = () => {
    setSalesRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f7', minHeight: '100vh' }}>
      
      {/* ADMIN & STAFF CONTROL NAVIGATION BAR */}
      <nav style={styles.navBar}>
        <div style={styles.logo}>🍻 Hams Lounge POS System</div>
        <div style={styles.navLinks}>
          <button 
            onClick={() => setActiveTab('pos')} 
            style={{ ...styles.navBtn, backgroundColor: activeTab === 'pos' ? '#34495e' : 'transparent' }}
          >
            🛒 POS Register
          </button>

          {user.role === 'admin' && (
            <>
              <button 
                onClick={() => setActiveTab('inventory')} 
                style={{ ...styles.navBtn, backgroundColor: activeTab === 'inventory' ? '#34495e' : 'transparent' }}
              >
                📦 Manage Stock
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                style={{ ...styles.navBtn, backgroundColor: activeTab === 'history' ? '#34495e' : 'transparent' }}
              >
                📊 Sales History
              </button>
            </>
          )}
        </div>
        <div style={{ color: '#fff', fontSize: '0.9rem' }}>
          <span style={{ marginRight: '15px' }}>👤 {user.username} ({user.role})</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      {/* DYNAMIC WINDOW RENDERER */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'pos' && (
          <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            onSaleComplete={triggerSalesRefresh} // Passed to trigger refresh
          />
        )}
        {activeTab === 'inventory' && user.role === 'admin' && <InventoryManager />}
        {activeTab === 'history' && user.role === 'admin' && (
          <SalesHistory refreshTrigger={salesRefreshTrigger} /> // Listens to refresh counter
        )}
      </div>

    </div>
  );
}

const styles = {
  navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', padding: '10px 20px', color: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  logo: { fontSize: '1.2rem', fontWeight: 'bold' },
  navLinks: { display: 'flex', gap: '10px' },
  navBtn: { padding: '8px 16px', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' },
  logoutBtn: { padding: '6px 12px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }
};

export default App;