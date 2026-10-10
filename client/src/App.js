import React, { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import InventoryManager from './InventoryManager';
import SalesHistory from './SalesHistory';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pos');
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

  const navItems = [
    { key: 'pos', label: 'POS Register', icon: '', adminOnly: false },
    { key: 'inventory', label: 'Manage Stock', icon: '', adminOnly: true },
    { key: 'history', label: 'Sales History', icon: '', adminOnly: true },
  ];

  return (
    <div style={styles.appContainer}>

      {/* NAVIGATION BAR */}
      <nav style={styles.navBar}>
        <div style={styles.navInner}>
          {/* Brand */}
          <div style={styles.brand}>
            <div style={styles.brandIcon}>H</div>
            <div>
              <div style={styles.brandTitle}>HAMS LOUNGE</div>
              <div style={styles.brandSub}>Point of Sale</div>
            </div>
          </div>

          {/* Nav Links */}
          <div style={styles.navLinks}>
            {navItems.map(item => {
              if (item.adminOnly && user.role !== 'admin') return null;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  style={{
                    ...styles.navBtn,
                    backgroundColor: isActive ? 'rgba(201,169,78,0.15)' : 'transparent',
                    color: isActive ? '#c9a94e' : '#8a8a9a',
                    borderColor: isActive ? '#c9a94e' : 'transparent',
                  }}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}
          </div>

          {/* User Info */}
          <div style={styles.userSection}>
            <div style={styles.userAvatar}>{user.username?.charAt(0).toUpperCase()}</div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user.username}</span>
              <span style={styles.userRole}>{user.role}</span>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <div style={styles.mainContent}>
        {activeTab === 'pos' && (
          <Dashboard
            user={user}
            onLogout={handleLogout}
            onSaleComplete={triggerSalesRefresh}
          />
        )}
        {activeTab === 'inventory' && user.role === 'admin' && <InventoryManager />}
        {activeTab === 'history' && user.role === 'admin' && (
          <SalesHistory refreshTrigger={salesRefreshTrigger} />
        )}
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    fontFamily: "'Inter', sans-serif",
    background: 'linear-gradient(180deg, #0f0f1a 0%, #141422 100%)',
    minHeight: '100vh',
  },
  navBar: {
    background: 'rgba(15, 15, 26, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(201,169,78,0.12)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
  },
  navInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #c9a94e, #e8d48b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#0f0f0f',
    fontFamily: "'Playfair Display', serif",
    lineHeight: '38px',
    textAlign: 'center',
  },
  brandTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#c9a94e',
    letterSpacing: '2px',
    fontFamily: "'Playfair Display', serif",
  },
  brandSub: {
    fontSize: '0.65rem',
    color: '#5a5a6e',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
  },
  navLinks: {
    display: 'flex',
    gap: '6px',
  },
  navBtn: {
    padding: '9px 18px',
    border: '1px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.82rem',
    transition: 'all 0.25s ease',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.3px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #c9a94e, #e8d48b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#0f0f0f',
    lineHeight: '34px',
    textAlign: 'center',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    color: '#d0d0e0',
    fontSize: '0.82rem',
    fontWeight: '600',
  },
  userRole: {
    color: '#6a6a7e',
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  logoutBtn: {
    padding: '7px 14px',
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    color: '#ff6b6b',
    border: '1px solid rgba(231, 76, 60, 0.25)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.78rem',
    fontWeight: '600',
    marginLeft: '8px',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', sans-serif",
  },
  mainContent: {
    padding: '24px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
};

export default App;
