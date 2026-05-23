import React, { useState, useEffect } from 'react';
import api from './api'; // Connects directly to port 5000/api

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
        // UPDATE Existing Product
        await api.put(`/products/${editingId}`, newItem);
        setMessage("⚡ Item updated successfully!");
      } else {
        // ADD New Product
        await api.post('/products', newItem);
        setMessage("🎉 New product added to stock successfully!");
      }

      setNewItem({ name: '', price: '', stock: '', category: 'Beer' });
      setEditingId(null);
      fetchInventory(); // Reload database items
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
      setMessage("🗑️ Product removed from system.");
      fetchInventory();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ borderBottom: '2px solid #2c3e50', paddingBottom: '10px', marginTop: 0 }}>📦 Hams Lounge Stock Inventory Manager</h2>
      
      {message && <div style={styles.alert}>{message}</div>}

      {/* Form Container */}
      <form onSubmit={handleAddOrUpdate} style={styles.form}>
        <input type="text" name="name" placeholder="Drink Name (e.g., Tusker Cider)" value={newItem.name} onChange={handleInputChange} style={styles.input} />
        <input type="number" name="price" placeholder="Price (KSh)" value={newItem.price} onChange={handleInputChange} style={styles.input} />
        <input type="number" name="stock" placeholder="Initial Stock Count" value={newItem.stock} onChange={handleInputChange} style={styles.input} />
        
        <select name="category" value={newItem.category} onChange={handleInputChange} style={styles.input}>
          <option value="Beer">Beer</option>
          <option value="Brandy">Brandy</option>
          <option value="Whiskey">Whiskey</option>
          <option value="Soft Drink">Soft Drink</option>
          <option value="Wine">Wine</option>
        </select>

        <button type="submit" style={editingId ? styles.updateBtn : styles.addBtn}>
          {editingId ? "Update Product Details" : "Add Product to Bar Stock"}
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
      </form>

      {/* Real-time Inventory Status Table Layout */}
      <table style={styles.table}>
        <thead>
          <tr style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Drink Name</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Price</th>
            <th style={styles.th}>Stock Balance</th>
            <th style={styles.th}>Actions Panel</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={styles.td}>{product.id}</td>
              <td style={styles.td}><strong>{product.name}</strong></td>
              <td style={styles.td}>{product.category}</td>
              <td style={styles.td}><span style={{color: '#27ae60', fontWeight: 'bold'}}>KSh {product.price}</span></td>
              <td style={styles.td}>
                <span style={product.stock < 5 ? {color: '#e74c3c', fontWeight: 'bold'} : {color: '#2c3e50'}}>
                  {product.stock} units left
                </span>
              </td>
              <td style={styles.td}>
                <button onClick={() => handleEdit(product)} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDelete(product.id)} style={styles.deleteBtn}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  alert: { backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontWeight: 'bold' },
  form: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', minWidth: '150px', flex: 1 },
  addBtn: { padding: '10px 20px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  updateBtn: { padding: '10px 20px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '5px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', textAlign: 'left' },
  th: { padding: '12px', borderBottom: '2px solid #ddd' },
  td: { padding: '12px', borderBottom: '1px solid #ddd' },
  editBtn: { marginRight: '5px', padding: '5px 10px', backgroundColor: '#f1c40f', border: 'none', borderRadius: '3px', cursor: 'pointer', color: '#000', fontWeight: 'bold' },
  deleteBtn: { padding: '5px 10px', backgroundColor: '#e74c3c', border: 'none', borderRadius: '3px', cursor: 'pointer', color: '#fff', fontWeight: 'bold' }
};

export default InventoryManager;