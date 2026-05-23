import React, { useState, useEffect } from 'react';
import api from './api';

// 1. Accepted the refreshTrigger prop passed from App.js
function SalesHistory({ refreshTrigger }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. Added refreshTrigger to the dependency array so it runs on every new checkout
  useEffect(() => {
    fetchSalesData();
  }, [refreshTrigger]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // NOTE: Make sure your backend route maps to /sales/history or matches your backend configurations!
      const response = await api.get('/sales/history');
      setSales(response.data);
    } catch (err) {
      setError('Could not retrieve sales records: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Calculate quick metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const mpesaRevenue = sales.filter(s => s.payment_method === 'M-Pesa').reduce((sum, s) => sum + Number(s.total_amount), 0);
  const cashRevenue = sales.filter(s => s.payment_method === 'Cash').reduce((sum, s) => sum + Number(s.total_amount), 0);
  const cardRevenue = sales.filter(s => s.payment_method === 'Card').reduce((sum, s) => sum + Number(s.total_amount), 0);


  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2c3e50', paddingBottom: '10px' }}>
        <h2>📊 Hams Lounge Sales Analytics Ledger</h2>
        <button onClick={fetchSalesData} style={styles.refreshBtn}>🔄 Refresh Metrics</button>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      {/* Analytics Summary Cards Box Layout */}
      <div style={styles.cardRow}>
        <div style={{ ...styles.card, borderLeft: '5px solid #27ae60' }}>
          <span style={styles.cardLabel}>Total Gross Revenue</span>
          <h3 style={styles.cardValue}>KSh {totalRevenue.toLocaleString()}</h3>
        </div>
        <div style={{ ...styles.card, borderLeft: '5px solid #3498db' }}>
          <span style={styles.cardLabel}>📱 M-Pesa Till Total</span>
          <h3 style={{ ...styles.cardValue, color: '#3498db' }}>KSh {mpesaRevenue.toLocaleString()}</h3>
        </div>
        <div style={{ ...styles.card, borderLeft: '5px solid #f1c40f' }}>
          <span style={styles.cardLabel}>💵 Cash Collection Total</span>
          <h3 style={{ ...styles.cardValue, color: '#f39c12' }}>KSh {cashRevenue.toLocaleString()}</h3>
        </div>
        <div style={{ ...styles.card, borderLeft: '5px solid #9b59b6' }}>
          <span style={styles.cardLabel}>💳 Card Transactions Total</span>
          <h3 style={{ ...styles.cardValue, color: '#9b59b6' }}>KSh {cardRevenue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Transaction Records Table Layout */}
      <h3 style={{ marginTop: '30px', color: '#34495e' }}>Detailed Orders Ledger</h3>
      {loading ? (
        <p>Loading database sales index tables...</p>
      ) : sales.length === 0 ? (
        <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No sales data logged in the database table history yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
              <th style={styles.th}>Receipt ID</th>
              <th style={styles.th}>Timestamp / Date</th>
              <th style={styles.th}>Purchased Drink Items</th>
              <th style={styles.th}>Payment Mode</th>
              <th style={styles.th}>Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={styles.td}><strong>#HAMS-{sale.id}</strong></td>
                <td style={styles.td}>...</td>
                <td style={styles.td}>
                  <div style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                    {sale.items_list || <span style={{ color: '#7f8c8d' }}>Generic Sale</span>}
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    backgroundColor: sale.payment_method === 'M-Pesa' ? '#e3f2fd' : '#fff3e0',
                    color: sale.payment_method === 'M-Pesa' ? '#1e88e5' : '#f57c00'
                  }}>
                    {sale.payment_method}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{ color: '#27ae60', fontWeight: 'bold' }}>KSh {Number(sale.total_amount).toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  refreshBtn: { padding: '8px 15px', backgroundColor: '#34495e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  errorAlert: { backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '15px' },
  cardRow: { display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '20px' },
  card: { flex: 1, minWidth: '200px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardLabel: { fontSize: '0.85rem', color: '#7f8c8d', fontWeight: 'bold', textTransform: 'uppercase' },
  cardValue: { margin: '5px 0 0 0', fontSize: '1.6rem', color: '#27ae60' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', textAlign: 'left' },
  th: { padding: '12px', borderBottom: '2px solid #ddd' },
  td: { padding: '12px', borderBottom: '1px solid #ddd' }
};

export default SalesHistory;