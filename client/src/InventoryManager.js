import React, { useState, useEffect } from 'react';
import api from './api';

function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', stock: '', category: 'Beer' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    }
  };

  const handleInputChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.stock) {
      alert("Please fill in all input rows!");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, newItem);
        setMessage("Item updated successfully!");
      } else {
        await api.post('/products', newItem);
        setMessage("New product added to stock!");
      }

      setNewItem({ name: '', price: '', stock: '', category: 'Beer' });
      setEditingId(null);
      fetchInventory();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert("Operation failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setNewItem({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this drink from Hams Lounge stock?")) return;
    try {
      await api.delete(`/products/${id}`);
      setMessage("Product removed from system.");
      fetchInventory();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Stock Inventory</h2>
        <span style={styles.headerCount}>{products.length} products</span>
      </div>

      {message && <div style={styles.alert}>{message}</div>}

      {/* Form Container */}
      <form onSubmit={handleAddOrUpdate} style={styles.form}>
        <div style={styles.formRow}>
          <input type="text" name="name" placeholder="Drink Name (e.g., Tusker Cider)" value={newItem.name} onChange={handleInputChange} style={styles.input} />
          <input type="number" name="price" placeholder="Price (KSh)" value={newItem.price} onChange={handleInputChange} style={styles.input} />
          <input type="number" name="stock" placeholder="Stock Count" value={newItem.stock} onChange={handleInputChange} style={styles.input} />

          <select name="category" value={newItem.category} onChange={handleInputChange} style={styles.input}>
            <option value="Beer">Beer</option>
            <option value="Brandy">Brandy</option>
            <option value="Whiskey">Whiskey</option>
            <option value="Soft Drink">Soft Drink</option>
            <option value="Wine">Wine</option>
          </select>
        </div>

        <div style={styles.formActions}>
          <button type="submit" style={editingId ? styles.updateBtn : styles.addBtn}>
            {editingId ? "Update Product" : "Add to Stock"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setNewItem({name:'', price:'', stock:'', category:'Beer'}); }}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Inventory Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Stock</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <span style={styles.idBadge}>#{product.id}</span>
                </td>
                <td style={{ ...styles.td, fontWeight: '600', color: '#d0d0e0' }}>{product.name}</td>
                <td style={styles.td}>
                  <span style={styles.catBadge}>{product.category}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ color: '#c9a94e', fontWeight: '700' }}>KSh {product.price}</span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    color: product.stock < 5 ? '#ff6b6b' : '#6fcf97',
                    fontWeight: '600',
                  }}>
                    {product.stock} units
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleEdit(product)} style={styles.editBtn}>Edit</button>
                    <button onClick={() => handleDelete(product.id)} style={styles.deleteBtn}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  headerCount: {
    color: '#6a6a7e',
    fontSize: '0.8rem',
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: '4px 14px',
    borderRadius: '20px',
  },
  alert: {
    background: 'rgba(39, 174, 96, 0.12)',
    color: '#6fcf97',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '18px',
    fontWeight: '500',
    fontSize: '0.85rem',
    border: '1px solid rgba(39,174,96,0.2)',
  },
  form: {
    marginBottom: '28px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  formRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    minWidth: '150px',
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#d0d0e0',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
  },
  formActions: {
    display: 'flex',
    gap: '8px',
  },
  addBtn: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #c9a94e, #e8d48b)',
    color: '#0f0f0f',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
  },
  updateBtn: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #3498db, #5dade2)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
  },
  cancelBtn: {
    padding: '11px 20px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#8a8a9a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
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
  idBadge: {
    color: '#5a5a6e',
    fontSize: '0.78rem',
    fontWeight: '500',
  },
  catBadge: {
    fontSize: '0.72rem',
    color: '#9a9ab0',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '6px',
    padding: '3px 10px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  editBtn: {
    padding: '5px 14px',
    background: 'rgba(201,169,78,0.15)',
    color: '#c9a94e',
    border: '1px solid rgba(201,169,78,0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.78rem',
    fontFamily: "'Inter', sans-serif",
  },
  deleteBtn: {
    padding: '5px 14px',
    backgroundColor: 'rgba(231,76,60,0.12)',
    color: '#ff6b6b',
    border: '1px solid rgba(231,76,60,0.25)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.78rem',
    fontFamily: "'Inter', sans-serif",
  },
};

export default InventoryManager;
