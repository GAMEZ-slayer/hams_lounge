import React, { useState, useEffect } from 'react';
import api from './api';

function SalesHistory({ refreshTrigger }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSalesData();
  }, [refreshTrigger]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/sales/history');
      setSales(response.data);
    } catch (err) {
      setError('Could not retrieve sales records: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const mpesaRevenue = sales.filter(s => s.payment_method === 'M-Pesa').reduce((sum, s) => sum + Number(s.total_amount), 0);
  const cashRevenue = sales.filter(s => s.payment_method === 'Cash').reduce((sum, s) => sum + Number(s.total_amount), 0);
  const cardRevenue = sales.filter(s => s.payment_method === 'Card').reduce((sum, s) => sum + Number(s.total_amount), 0);

  const metricCards = [
    { label: 'Total Revenue', value: totalRevenue, color: '#c9a94e', gradient: 'linear-gradient(135deg, rgba(201,169,78,0.12), rgba(201,169,78,0.04))' },
    { label: 'M-Pesa', value: mpesaRevenue, color: '#4fc3f7', gradient: 'linear-gradient(135deg, rgba(79,195,247,0.12), rgba(79,195,247,0.04))' },
    { label: 'Cash', value: cashRevenue, color: '#6fcf97', gradient: 'linear-gradient(135deg, rgba(111,207,151,0.12), rgba(111,207,151,0.04))' },
    { label: 'Card', value: cardRevenue, color: '#b39ddb', gradient: 'linear-gradient(135deg, rgba(179,157,219,0.12), rgba(179,157,219,0.04))' },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Sales Analytics</h2>
        <button onClick={fetchSalesData} style={styles.refreshBtn}>Refresh</button>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      {/* Metrics Cards */}
      <div style={styles.cardRow}>
        {metricCards.map((card, i) => (
          <div key={i} style={{ ...styles.card, background: card.gradient, borderColor: `${card.color}20` }}>
            <span style={styles.cardLabel}>{card.label}</span>
            <h3 style={{ ...styles.cardValue, color: card.color }}>KSh {card.value.toLocaleString()}</h3>
            <div style={{ ...styles.cardAccent, backgroundColor: card.color }}></div>
          </div>
        ))}
      </div>

      {/* Sales Table */}
      <div style={styles.tableSection}>
        <h3 style={styles.tableSectionTitle}>Transaction Ledger</h3>
        {loading ? (
          <p style={{ color: '#6a6a7e', padding: '20px' }}>Loading sales data...</p>
        ) : sales.length === 0 ? (
          <p style={{ color: '#5a5a6e', fontStyle: 'italic', padding: '20px' }}>No sales recorded yet.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Receipt</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Items</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.receiptId}>#HAMS-{sale.id}</span>
                    </td>
                    <td style={{ ...styles.td, color: '#6a6a7e', fontSize: '0.82rem' }}>...</td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '0.85rem', color: '#b0b0c0' }}>
                        {sale.items_list || <span style={{ color: '#5a5a6e' }}>General Sale</span>}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.paymentBadge,
                        backgroundColor: sale.payment_method === 'M-Pesa' ? 'rgba(79,195,247,0.12)' :
                                         sale.payment_method === 'Card' ? 'rgba(179,157,219,0.12)' :
                                         'rgba(111,207,151,0.12)',
                        color: sale.payment_method === 'M-Pesa' ? '#4fc3f7' :
                               sale.payment_method === 'Card' ? '#b39ddb' :
                               '#6fcf97',
                        borderColor: sale.payment_method === 'M-Pesa' ? 'rgba(79,195,247,0.3)' :
                                     sale.payment_method === 'Card' ? 'rgba(179,157,219,0.3)' :
                                     'rgba(111,207,151,0.3)',
                      }}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: '#c9a94e', fontWeight: '700' }}>KSh {Number(sale.total_amount).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'rgba(20, 20, 35, 0.6)',
    backdropFilter: 'blur(10px)',
    padding: '28px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(201,169,78,0.15)',
  },
  headerTitle: {
    color: '#e0e0f0',
    fontSize: '1.2rem',
    fontWeight: '700',
    margin: 0,
    fontFamily: "'Playfair Display', serif",
  },
  refreshBtn: {
    padding: '8px 18px',
    background: 'rgba(201,169,78,0.12)',
    color: '#c9a94e',
    border: '1px solid rgba(201,169,78,0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.82rem',
    fontFamily: "'Inter', sans-serif",
  },
  errorAlert: {
    backgroundColor: 'rgba(231,76,60,0.12)',
    color: '#ff6b6b',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '18px',
    border: '1px solid rgba(231,76,60,0.25)',
    fontSize: '0.85rem',
  },
  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
    marginBottom: '28px',
  },
  card: {
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid',
    position: 'relative',
    overflow: 'hidden',
  },
  cardLabel: {
    fontSize: '0.78rem',
    color: '#7a7a8e',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  cardValue: {
    margin: '6px 0 0 0',
    fontSize: '1.5rem',
    fontWeight: '700',
  },
  cardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    opacity: 0.6,
  },
  tableSection: {
    marginTop: '4px',
  },
  tableSectionTitle: {
    color: '#b0b0c0',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '16px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 4px',
    textAlign: 'left',
  },
  th: {
    padding: '12px 14px',
    color: '#6a6a7e',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  tableRow: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontSize: '0.88rem',
    color: '#9a9ab0',
  },
  receiptId: {
    color: '#d0d0e0',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  paymentBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    border: '1px solid',
    letterSpacing: '0.3px',
  },
};

export default SalesHistory;
