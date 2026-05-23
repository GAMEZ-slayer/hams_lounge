import React from 'react';

function ProductCard({ drink, onAdd }) {
  // 1. Safety Check: Ensure price is treated as a number
  const numericPrice = Number(drink.price) || 0;
  
  // 2. Logic Check: Ensure stock is treated as a number
  const currentStock = Number(drink.stock) || 0;
  const isOutOfStock = currentStock <= 0;

  return (
    <div className="product-card" style={styles.card}>
      {/* Header Section */}
      <div style={styles.header}>
        <h3 style={styles.name}>{drink.name || 'Unknown Item'}</h3>
        <span style={styles.category}>{drink.category || 'General'}</span>
      </div>

      {/* Info Section */}
      <div style={styles.info}>
        <p style={styles.price}>
          <span style={styles.currency}>KES</span> {numericPrice.toLocaleString()}
        </p>
        <p style={{ ...styles.stock, color: isOutOfStock ? '#d9534f' : '#5bc0de' }}>
          {isOutOfStock ? 'Out of Stock' : `${currentStock} in stock`}
        </p>
      </div>

      {/* Action Section */}
      <button 
        onClick={() => onAdd(drink)} 
        disabled={isOutOfStock}
        style={{
          ...styles.button,
          backgroundColor: isOutOfStock ? '#ccc' : '#28a745',
          cursor: isOutOfStock ? 'not-allowed' : 'pointer'
        }}
      >
        {isOutOfStock ? 'Unavailable' : 'Add to Order'}
      </button>
    </div>
  );
}

const styles = {
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '16px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: { marginBottom: '10px' },
  name: { margin: '0', fontSize: '1.1rem', color: '#333', fontWeight: '600' },
  category: { fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', display: 'block' },
  info: { margin: '15px 0' },
  price: { fontSize: '1.4rem', fontWeight: 'bold', margin: '0', color: '#2c3e50' },
  currency: { fontSize: '0.9rem', marginRight: '4px' },
  stock: { fontSize: '0.85rem', margin: '4px 0 0 0' },
  button: { width: '100%', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }
};

export default ProductCard;