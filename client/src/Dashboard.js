import React, { useState, useEffect } from 'react';
import api from './api';

const CATEGORIES = ['All', 'Beer', 'Whiskey', 'Brandy', 'Soft Drink'];

function Dashboard({ user, onLogout, onSaleComplete }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [message, setMessage] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const calculateSubtotal = () => {
    const totalPayableAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return totalPayableAmount / 1.16;
  };

  const calculateTax = (subtotal) => subtotal * 0.16;

  const addToCart = (product) => {
    if (product.stock <= 0) return alert("Out of stock!");
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("Cannot exceed available stock limit!");
          return prevCart;
        }
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === productId);
      if (!existing) return prevCart;
      if (existing.quantity === 1) return prevCart.filter(item => item.id !== productId);
      return prevCart.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const removeItemFully = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");

    const subtotalSnapshot = calculateSubtotal();
    const taxSnapshot = calculateTax(subtotalSnapshot);
    const finalTotalSnapshot = subtotalSnapshot + taxSnapshot;
    const receiptItemsSnapshot = [...cart];

    try {
      const response = await api.post('/sales', {
        items: cart,
        total_amount: finalTotalSnapshot,
        payment_method: paymentMethod,
        phone_number: null
      });

      setMessage("🎉 Sale completed successfully!");
      setCurrentReceipt({
        id: response.data.saleId || Math.floor(1000 + Math.random() * 9000),
        date: new Date().toLocaleString('en-KE'),
        items: receiptItemsSnapshot,
        subtotal: subtotalSnapshot,
        tax: taxSnapshot,
        total: finalTotalSnapshot,
        payment: paymentMethod,
        servedBy: user.username
      });

      setShowReceipt(true);
      setCart([]);
      fetchProducts();
      if (onSaleComplete) onSaleComplete();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert("Checkout failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handlePrintReceipt = () => {
    const receiptHtml = document.getElementById("printable-receipt-content").innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: 'Courier New', Courier, monospace; padding: 5mm; margin: 0; width: 80mm; color: #000; background-color: #fff; font-size: 12px; }
            h2, p { margin: 0; text-align: center; }
            .dashed-line { border-bottom: 2px dashed #000; margin: 10px 0; }
            .thin-line { border-bottom: 1px dashed #000; margin: 8px 0; }
            .flex-row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
            .bold { font-weight: bold; }
            .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 10px 0; }
          </style>
        </head>
        <body>
          ${receiptHtml}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.parent.document.body.removeChild(window.frameElement); }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  const currentSubtotal = calculateSubtotal();
  const currentTax = calculateTax(currentSubtotal);
  const currentTotal = currentSubtotal + currentTax;

  // Category emoji mapping
  const categoryEmoji = { 'All': '🍽️', 'Beer': '🍺', 'Whiskey': '🥃', 'Brandy': '🍷', 'Soft Drink': '🥤' };

  return (
    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>

      {/* LEFT COLUMN: STOCK SHELF GRID */}
      <div style={{ flex: 2, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>🍺 Bar Drink Counter Stock</h3>
        {message && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{message}</div>}

        {/* CATEGORY TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '2px solid',
                borderColor: activeCategory === cat ? '#2c3e50' : '#e2e8f0',
                backgroundColor: activeCategory === cat ? '#2c3e50' : '#f8f9fa',
                color: activeCategory === cat ? '#fff' : '#2c3e50',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                transition: '0.2s'
              }}
            >
              {categoryEmoji[cat]} {cat}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
          {filteredProducts.length === 0 ? (
            <p style={{ color: '#95a5a6', fontStyle: 'italic' }}>No products in this category.</p>
          ) : (
            filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                style={{
                  padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                  opacity: product.stock > 0 ? 1 : 0.6,
                  textAlign: 'center', transition: '0.2s'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#fff', backgroundColor: '#7f8c8d', borderRadius: '10px', padding: '2px 8px', display: 'inline-block', marginBottom: '6px' }}>
                  {categoryEmoji[product.category]} {product.category}
                </div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{product.name}</div>
                <div style={{ color: '#27ae60', fontWeight: 'bold', margin: '5px 0' }}>KSh {product.price}</div>
                <div style={{ fontSize: '0.8rem', color: product.stock > 5 ? '#7f8c8d' : '#e74c3c' }}>
                  {product.stock > 0 ? `Stock: ${product.stock} units` : '🚫 Out of stock'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CART */}
      <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '480px' }}>
        <div>
          <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>🛒 Current Bill Order</h3>
          {cart.length === 0 ? (
            <p style={{ color: '#95a5a6', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>Cart is currently empty. Tap items to add.</p>
          ) : (
            <div style={{ marginTop: '15px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #eee', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => removeFromCart(item.id)} style={{ width: '24px', height: '24px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', lineHeight: 1 }}>−</button>
                    <span>{item.name} <strong>x {item.quantity}</strong></span>
                    <button onClick={() => addToCart(item)} style={{ width: '24px', height: '24px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', lineHeight: 1 }}>+</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>KSh {(item.price * item.quantity).toLocaleString()}</span>
                    <button onClick={() => removeItemFully(item.id)} title="Remove item" style={{ backgroundColor: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1rem', padding: '0' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '2px solid #2c3e50', paddingTop: '15px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#7f8c8d', marginBottom: '5px' }}>
            <span>Subtotal (Excl. Tax):</span>
            <span>KSh {currentSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#7f8c8d', marginBottom: '10px' }}>
            <span>VAT (16% Included):</span>
            <span>KSh {currentTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <span>Total Payable:</span>
            <span style={{ color: '#27ae60' }}>KSh {currentTotal.toLocaleString()}</span>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '5px' }}>PAYMENT METHOD:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', fontWeight: 'bold' }}
            >
              <option value="Cash">💵 Cash Collection</option>
              <option value="M-Pesa">📱 M-Pesa Till Payment</option>
              <option value="Card">💳 Card Swipe</option>
            </select>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: cart.length > 0 ? '#27ae60' : '#95a5a6',
              color: '#fff', border: 'none', borderRadius: '4px',
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold', fontSize: '1rem'
            }}
          >
            ✅ Complete Sale & Bill Out
          </button>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {showReceipt && currentReceipt && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.receiptPaper}>
            <div id="printable-receipt-content">
              <div>
                <h2>🍻 HAMS LOUNGE</h2>
                <p style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>Nairobi, Kenya</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '3px' }}>CUSTOMER RECEIPT</p>
                <div style={{ borderBottom: '2px dashed #2c3e50', marginTop: '10px' }}></div>
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Receipt ID:</strong></span><span>#HAMS-{currentReceipt.id}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Date/Time:</strong></span><span>{currentReceipt.date}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Served By:</strong></span><span>{currentReceipt.servedBy}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Payment:</strong></span><span>{currentReceipt.payment}</span></div>
                <div style={{ borderBottom: '1px dashed #ccc', marginTop: '8px' }}></div>
              </div>
              <div style={{ margin: '15px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '5px' }}>
                  <span>Item</span><span>Subtotal</span>
                </div>
                {currentReceipt.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', margin: '4px 0' }}>
                    <span>{item.name} (x{item.quantity})</span>
                    <span>KSh {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderBottom: '1px dashed #ccc', marginTop: '10px' }}></div>
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: '1.6', margin: '5px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>KSh {currentReceipt.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT (16%):</span><span>KSh {currentReceipt.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div style={{ borderBottom: '2px dashed #2c3e50', marginTop: '10px' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', margin: '10px 0' }}>
                <span>TOTAL PAID:</span>
                <span style={{ color: '#27ae60' }}>KSh {currentReceipt.total.toLocaleString()}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '20px', fontStyle: 'italic', textAlign: 'center' }}>
                Thank you for visiting Hams Lounge!<br />Welcome again. 🥂
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button onClick={handlePrintReceipt} style={{ flex: 1, padding: '10px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Print Receipt</button>
              <button onClick={() => setShowReceipt(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>❌ Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  receiptPaper: { backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '340px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', fontFamily: "'Courier New', Courier, monospace" }
};

export default Dashboard;