import React, { useState, useEffect } from 'react';
import api from './api';

const CATEGORIES = ['All', 'Beer', 'Whiskey', 'Brandy', 'Soft Drink'];

function Dashboard({ user, onLogout, onSaleComplete }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [message, setMessage] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);

  // STK Push states
  const [showSTKModal, setShowSTKModal] = useState(false);
  const [stkStatus, setSTKStatus] = useState(''); // 'initiating', 'waiting', 'success', 'failed'
 // const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-print receipt when it becomes visible after M-Pesa payment
  useEffect(() => {
    if (showReceipt && shouldAutoPrint && currentReceipt) {
      // Wait for DOM to update, then print
      const timer = setTimeout(() => {
        handlePrintReceipt();
        setShouldAutoPrint(false); // Reset flag
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showReceipt, shouldAutoPrint, currentReceipt]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  const fetchProducts = async () => {
    try {
      console.log("Fetching products from API...");
      const response = await api.get('/products');
      console.log("API Response received:", response.data);
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

  const initiateSTKPush = async () => {
    const subtotalSnapshot = calculateSubtotal();
    const taxSnapshot = calculateTax(subtotalSnapshot);
    const finalTotalSnapshot = subtotalSnapshot + taxSnapshot;

    try {
      setSTKStatus('initiating');
      setShowSTKModal(true);

      const response = await api.post('/api/mpesa/stkpush', {
        phoneNumber: mpesaPhone.trim(),
        amount: finalTotalSnapshot,
        accountReference: `HAMS-${Date.now()}`,
        transactionDesc: 'Payment for drinks at Hams Lounge'
      });

      if (response.data.success) {
        //setCheckoutRequestId(response.data.data.CheckoutRequestID);
        setSTKStatus('waiting');

        // Start polling for payment status
        const interval = setInterval(async () => {
          try {
            const statusResponse = await api.get(`/api/mpesa/status/${response.data.data.CheckoutRequestID}`);

            if (statusResponse.data.success) {
              if (statusResponse.data.status === 'success') {
                clearInterval(interval);
                setSTKStatus('success');
                // Complete the sale
                await completeSale(finalTotalSnapshot);
              } else if (statusResponse.data.status === 'failed') {
                clearInterval(interval);
                setSTKStatus('failed');
              }
            }
          } catch (err) {
            console.error('Status check error:', err);
          }
        }, 3000); // Check every 3 seconds

        setStatusCheckInterval(interval);

        // Auto-timeout after 60 seconds
        setTimeout(() => {
          clearInterval(interval);
          if (stkStatus === 'waiting') {
            setSTKStatus('timeout');
          }
        }, 60000);
      } else {
        setSTKStatus('failed');
      }
    } catch (error) {
      console.error('STK Push error:', error);
      setSTKStatus('failed');
    }
  };

  const completeSale = async (finalTotalSnapshot) => {
    const subtotalSnapshot = calculateSubtotal();
    const taxSnapshot = calculateTax(subtotalSnapshot);
    const receiptItemsSnapshot = [...cart];

    try {
      const response = await api.post('/sales', {
        items: cart,
        total_amount: finalTotalSnapshot,
        payment_method: paymentMethod,
        phone_number: mpesaPhone.trim()
      });

      setMessage("Sale completed successfully!");
      setCurrentReceipt({
        id: response.data.saleId || Math.floor(1000 + Math.random() * 9000),
        date: new Date().toLocaleString('en-KE'),
        items: receiptItemsSnapshot,
        subtotal: subtotalSnapshot,
        tax: taxSnapshot,
        total: finalTotalSnapshot,
        payment: paymentMethod,
        phoneNumber: mpesaPhone.trim(),
        servedBy: user.username
      });

      setCart([]);
      setMpesaPhone('');
      fetchProducts();
      if (onSaleComplete) onSaleComplete();

      // Close STK modal and show receipt with auto-print
      setTimeout(() => {
        setShowSTKModal(false);
        setShowReceipt(true);
        setShouldAutoPrint(true); // Flag to trigger auto-print
      }, 2000);

      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error("Sale completion error:", err);
      alert("Sale recording failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");

    // Validate M-Pesa phone number if M-Pesa is selected
    if (paymentMethod === 'M-Pesa') {
      if (!mpesaPhone.trim()) {
        return alert("Please enter M-Pesa phone number!");
      }
      const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
      if (!phoneRegex.test(mpesaPhone.trim())) {
        return alert("Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)");
      }

      // Initiate STK Push for M-Pesa
      await initiateSTKPush();
      return;
    }

    // For Cash and Card payments, proceed normally
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

      setMessage("Sale completed successfully!");
      setCurrentReceipt({
        id: response.data.saleId || Math.floor(1000 + Math.random() * 9000),
        date: new Date().toLocaleString('en-KE'),
        items: receiptItemsSnapshot,
        subtotal: subtotalSnapshot,
        tax: taxSnapshot,
        total: finalTotalSnapshot,
        payment: paymentMethod,
        phoneNumber: null,
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

  const closeSTKModal = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    setShowSTKModal(false);
    setSTKStatus('');
    setCheckoutRequestId('');
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

  const categoryIcons = { 'All': 'All', 'Beer': 'Beer', 'Whiskey': 'Whiskey', 'Brandy': 'Brandy', 'Soft Drink': 'Soft' };

  return (
    <div style={{ display: 'flex', gap: '24px', marginTop: '0' }}>

      {/* LEFT COLUMN: PRODUCT GRID */}
      <div style={styles.leftPanel}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Drink Menu</h3>
          <span style={styles.itemCount}>{filteredProducts.length} items</span>
        </div>

        {message && (
          <div style={styles.successBanner}>{message}</div>
        )}

        {/* CATEGORY TABS */}
        <div style={styles.categoryRow}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...styles.categoryBtn,
                  backgroundColor: isActive ? '#c9a94e' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#0f0f0f' : '#8a8a9a',
                  borderColor: isActive ? '#c9a94e' : 'rgba(255,255,255,0.08)',
                }}
              >
                {categoryIcons[cat] || cat}
              </button>
            );
          })}
        </div>

        {/* PRODUCT GRID */}
        <div style={styles.productGrid}>
          {filteredProducts.length === 0 ? (
            <p style={{ color: '#5a5a6e', fontStyle: 'italic', gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>No products in this category.</p>
          ) : (
            filteredProducts.map(product => {
              const inCart = cart.find(c => c.id === product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    ...styles.productCard,
                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                    opacity: product.stock > 0 ? 1 : 0.4,
                    borderColor: inCart ? 'rgba(201,169,78,0.5)' : 'rgba(255,255,255,0.06)',
                    boxShadow: inCart ? '0 0 20px rgba(201,169,78,0.08)' : 'none',
                  }}
                >
                  <div style={styles.categoryBadge}>{product.category}</div>
                  {inCart && (
                    <div style={styles.cartBadge}>x{inCart.quantity}</div>
                  )}
                  <img
                    src={product.image_url || 'https://via.placeholder.com/150?text=Drink'}
                    alt={product.name}
                    style={styles.productImage}
                    onError={(e) => {
                      console.error(`Image failed to load for ${product.name}: ${e.target.src}`);
                      e.target.src = 'https://via.placeholder.com/150?text=Error';
                    }}
                  />
                  <div style={styles.productName}>{product.name}</div>
                  <div style={styles.productPrice}>KSh {product.price.toLocaleString()}</div>
                  <div style={{
                    ...styles.stockInfo,
                    color: product.stock > 5 ? '#4a6e4a' : '#ff6b6b',
                  }}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CART */}
      <div style={styles.rightPanel}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Current Order</h3>
          <span style={styles.cartCount}>{cart.length} items</span>
        </div>

        <div style={styles.cartBody}>
          {cart.length === 0 ? (
            <div style={styles.emptyCart}>
              <div style={styles.emptyCartIcon}>+</div>
              <p style={{ color: '#5a5a6e', fontSize: '0.85rem' }}>Tap drinks to add to order</p>
            </div>
          ) : (
            <div style={styles.cartList}>
              {cart.map(item => (
                <div key={item.id} style={styles.cartItem}>
                  <div style={styles.cartItemLeft}>
                    <span style={styles.cartItemName}>{item.name}</span>
                    <span style={styles.cartItemMeta}>KSh {item.price.toLocaleString()} each</span>
                  </div>
                  <div style={styles.cartItemRight}>
                    <div style={styles.qtyControls}>
                      <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} style={styles.qtyBtn}>-</button>
                      <span style={styles.qtyValue}>{item.quantity}</span>
                      <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} style={styles.qtyBtnAdd}>+</button>
                    </div>
                    <span style={styles.cartItemTotal}>KSh {(item.price * item.quantity).toLocaleString()}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeItemFully(item.id); }} style={styles.removeBtn} title="Remove">x</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CHECKOUT SECTION */}
        <div style={styles.checkoutSection}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>Subtotal</span>
            <span style={styles.summaryValue}>KSh {currentSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>VAT (16%)</span>
            <span style={styles.summaryValue}>KSh {currentTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={styles.totalRow}>
            <span>Total</span>
            <span style={{ color: '#c9a94e' }}>KSh {currentTotal.toLocaleString()}</span>
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: '14px' }}>
            <label style={styles.paymentLabel}>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={styles.paymentSelect}
            >
              <option value="Cash">Cash</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Card">Card</option>
            </select>
          </div>

          {/* M-Pesa Phone Number Input */}
          {paymentMethod === 'M-Pesa' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.paymentLabel}>M-Pesa Phone Number</label>
              <input
                type="tel"
                placeholder="Enter your number to test: 0712345678"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                style={styles.phoneInput}
              />
              <p style={styles.phoneHint}>📱 You will receive an M-Pesa prompt on this phone</p>
              <p style={styles.phoneHintBold}>Enter YOUR number to see it work!</p>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            style={{
              ...styles.checkoutBtn,
              opacity: cart.length > 0 ? 1 : 0.4,
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Complete Sale
          </button>
        </div>
      </div>

      {/* STK PUSH STATUS MODAL */}
      {showSTKModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.stkModal}>
            {stkStatus === 'initiating' && (
              <>
                <div style={modalStyles.spinner}></div>
                <h3 style={modalStyles.stkTitle}>Initiating Payment...</h3>
                <p style={modalStyles.stkText}>Please wait</p>
              </>
            )}
            {stkStatus === 'waiting' && (
              <>
                <div style={modalStyles.phoneIcon}>📱</div>
                <h3 style={modalStyles.stkTitle}>Check Your Phone Now!</h3>
                <p style={modalStyles.stkText}>M-Pesa prompt sent to:</p>
                <p style={modalStyles.stkPhone}>{mpesaPhone}</p>
                <p style={modalStyles.stkAmount}>Amount: KSh {currentTotal.toLocaleString()}</p>
                <div style={modalStyles.instructionBox}>
                  <p style={modalStyles.instruction}>1. Check your phone for M-Pesa notification</p>
                  <p style={modalStyles.instruction}>2. Enter your M-Pesa PIN</p>
                  <p style={modalStyles.instruction}>3. Confirm the payment</p>
                </div>
                <div style={modalStyles.spinner}></div>
                <p style={modalStyles.waitingText}>Waiting for payment confirmation...</p>
                <button onClick={closeSTKModal} style={modalStyles.cancelBtn}>Cancel</button>
              </>
            )}
            {stkStatus === 'success' && (
              <>
                <div style={modalStyles.successIcon}>✓</div>
                <h3 style={{ ...modalStyles.stkTitle, color: '#6fcf97' }}>Payment Received!</h3>
                <p style={modalStyles.stkText}>KSh {currentTotal.toLocaleString()} paid successfully</p>
                <p style={modalStyles.stkText}>From: {mpesaPhone}</p>
                <p style={{ ...modalStyles.stkText, marginTop: '12px', fontStyle: 'italic' }}>Printing receipt...</p>
              </>
            )}
            {stkStatus === 'failed' && (
              <>
                <div style={modalStyles.errorIcon}>✕</div>
                <h3 style={{ ...modalStyles.stkTitle, color: '#ff6b6b' }}>Payment Failed</h3>
                <p style={modalStyles.stkText}>Please try again or use another payment method</p>
                <button onClick={closeSTKModal} style={modalStyles.closeBtn}>Close</button>
              </>
            )}
            {stkStatus === 'timeout' && (
              <>
                <div style={modalStyles.errorIcon}>⏱</div>
                <h3 style={{ ...modalStyles.stkTitle, color: '#ff6b6b' }}>Payment Timeout</h3>
                <p style={modalStyles.stkText}>Customer did not complete payment in time</p>
                <button onClick={closeSTKModal} style={modalStyles.closeBtn}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceipt && currentReceipt && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.receiptPaper}>
            <div id="printable-receipt-content">
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#000', fontSize: '1.1rem', margin: '0 0 2px' }}>HAMS LOUNGE</h2>
                <p style={{ fontSize: '0.8rem', color: '#666', margin: '0' }}>Kinyumba, Charia</p>
                <p style={{ fontSize: '0.8rem', color: '#666', margin: '0' }}>Nairobi, Kenya</p>
                <p style={{ fontSize: '0.78rem', fontWeight: 'bold', marginTop: '3px', color: '#000' }}>CUSTOMER RECEIPT</p>
                <div style={{ borderBottom: '2px dashed #333', marginTop: '10px' }}></div>
              </div>
              <div style={{ fontSize: '0.82rem', lineHeight: '1.6', marginBottom: '10px', color: '#000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Receipt ID:</strong></span><span>#HAMS-{currentReceipt.id}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Date/Time:</strong></span><span>{currentReceipt.date}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Served By:</strong></span><span>{currentReceipt.servedBy}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Payment:</strong></span><span>{currentReceipt.payment}</span></div>
                {currentReceipt.phoneNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>M-Pesa Phone:</strong></span><span>{currentReceipt.phoneNumber}</span></div>
                )}
                <div style={{ borderBottom: '1px dashed #999', marginTop: '8px' }}></div>
              </div>
              <div style={{ margin: '12px 0', color: '#000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.82rem' }}>
                  <span>Item</span><span>Subtotal</span>
                </div>
                {currentReceipt.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', margin: '4px 0' }}>
                    <span>{item.name} (x{item.quantity})</span>
                    <span>KSh {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderBottom: '1px dashed #999', marginTop: '10px' }}></div>
              </div>
              <div style={{ fontSize: '0.82rem', lineHeight: '1.6', margin: '5px 0', color: '#000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>KSh {currentReceipt.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT (16%):</span><span>KSh {currentReceipt.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                <div style={{ borderBottom: '2px dashed #333', marginTop: '10px' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 'bold', margin: '10px 0', color: '#000' }}>
                <span>TOTAL PAID:</span>
                <span>KSh {currentReceipt.total.toLocaleString()}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '18px', fontStyle: 'italic', textAlign: 'center' }}>
                Thank you for visiting Hams Lounge!<br />Welcome again.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button onClick={handlePrintReceipt} style={modalStyles.printBtn}>Print Receipt</button>
              <button onClick={() => setShowReceipt(false)} style={modalStyles.closeBtn}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  leftPanel: {
    flex: 2,
    backgroundColor: 'rgba(20, 20, 35, 0.6)',
    backdropFilter: 'blur(10px)',
    padding: '24px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 35, 0.6)',
    backdropFilter: 'blur(10px)',
    padding: '24px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '520px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(201,169,78,0.15)',
  },
  sectionTitle: {
    color: '#e0e0f0',
    fontSize: '1.1rem',
    fontWeight: '700',
    margin: 0,
    fontFamily: "'Playfair Display', serif",
  },
  itemCount: {
    color: '#6a6a7e',
    fontSize: '0.8rem',
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  cartCount: {
    color: '#c9a94e',
    fontSize: '0.8rem',
    fontWeight: '600',
    backgroundColor: 'rgba(201,169,78,0.1)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  successBanner: {
    background: 'rgba(39, 174, 96, 0.12)',
    color: '#6fcf97',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.85rem',
    fontWeight: '500',
    border: '1px solid rgba(39,174,96,0.2)',
  },
  categoryRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '22px',
    flexWrap: 'wrap',
  },
  categoryBtn: {
    padding: '8px 18px',
    borderRadius: '20px',
    border: '1px solid',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.8rem',
    transition: 'all 0.25s ease',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.3px',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
    gap: '14px',
  },
  productCard: {
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '110px',
    objectFit: 'contain',
    borderRadius: '8px',
    marginBottom: '8px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  categoryBadge: {
    fontSize: '0.65rem',
    color: '#9a9ab0',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: '6px',
    padding: '3px 8px',
    display: 'inline-block',
    marginBottom: '8px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cartBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: '#c9a94e',
    color: '#0f0f0f',
    borderRadius: '6px',
    padding: '2px 7px',
    fontSize: '0.7rem',
    fontWeight: '700',
  },
  productName: {
    fontWeight: '600',
    color: '#d0d0e0',
    fontSize: '0.9rem',
    marginBottom: '4px',
  },
  productPrice: {
    color: '#c9a94e',
    fontWeight: '700',
    margin: '6px 0',
    fontSize: '1rem',
  },
  stockInfo: {
    fontSize: '0.72rem',
    fontWeight: '500',
  },
  cartBody: {
    flex: 1,
    overflowY: 'auto',
  },
  emptyCart: {
    textAlign: 'center',
    marginTop: '50px',
  },
  emptyCartIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: '2px dashed rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    color: '#4a4a5e',
    fontSize: '1.5rem',
    lineHeight: '50px',
    textAlign: 'center',
  },
  cartList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  cartItemLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  cartItemName: {
    color: '#d0d0e0',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  cartItemMeta: {
    color: '#5a5a6e',
    fontSize: '0.72rem',
  },
  cartItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '6px',
    padding: '2px',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    backgroundColor: 'rgba(231,76,60,0.2)',
    color: '#ff6b6b',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '24px',
    textAlign: 'center',
    padding: 0,
  },
  qtyBtnAdd: {
    width: '24px',
    height: '24px',
    backgroundColor: 'rgba(39,174,96,0.2)',
    color: '#6fcf97',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '24px',
    textAlign: 'center',
    padding: 0,
  },
  qtyValue: {
    color: '#e0e0f0',
    fontWeight: '700',
    fontSize: '0.85rem',
    minWidth: '16px',
    textAlign: 'center',
  },
  cartItemTotal: {
    color: '#c9a94e',
    fontWeight: '700',
    fontSize: '0.85rem',
    minWidth: '65px',
    textAlign: 'right',
  },
  removeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#5a5a6e',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '2px 4px',
    fontWeight: '600',
    transition: 'color 0.2s',
  },
  checkoutSection: {
    borderTop: '1px solid rgba(201,169,78,0.15)',
    paddingTop: '16px',
    marginTop: '14px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    marginBottom: '6px',
  },
  summaryLabel: {
    color: '#6a6a7e',
  },
  summaryValue: {
    color: '#9a9ab0',
    fontWeight: '500',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.15rem',
    fontWeight: '700',
    marginBottom: '16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '10px',
    marginTop: '8px',
    color: '#e0e0f0',
  },
  paymentLabel: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6a6a7e',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  paymentSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#d0d0e0',
    fontWeight: '600',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    cursor: 'pointer',
  },
  checkoutBtn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #c9a94e, #e8d48b)',
    color: '#0f0f0f',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.95rem',
    transition: 'all 0.25s ease',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.3px',
  },
  phoneInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#d0d0e0',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
  },
  phoneHint: {
    fontSize: '0.7rem',
    color: '#6a6a7e',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  phoneHintBold: {
    fontSize: '0.72rem',
    color: '#c9a94e',
    marginTop: '2px',
    fontWeight: '600',
  },
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  stkModal: {
    backgroundColor: 'rgba(20, 20, 35, 0.95)',
    backdropFilter: 'blur(20px)',
    padding: '40px 35px',
    borderRadius: '16px',
    width: '380px',
    border: '1px solid rgba(201,169,78,0.2)',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  phoneIcon: {
    fontSize: '3.5rem',
    marginBottom: '16px',
  },
  successIcon: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    backgroundColor: 'rgba(111,207,151,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: '2.5rem',
    color: '#6fcf97',
    fontWeight: 'bold',
  },
  errorIcon: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,107,107,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: '2.5rem',
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  stkTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#e0e0f0',
    margin: '0 0 12px 0',
    fontFamily: "'Playfair Display', serif",
  },
  stkText: {
    fontSize: '0.88rem',
    color: '#9a9ab0',
    marginBottom: '10px',
  },
  stkPhone: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#c9a94e',
    marginBottom: '6px',
  },
  stkAmount: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#6fcf97',
    marginBottom: '20px',
  },
  instructionBox: {
    backgroundColor: 'rgba(201,169,78,0.08)',
    border: '1px solid rgba(201,169,78,0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    textAlign: 'left',
  },
  instruction: {
    fontSize: '0.82rem',
    color: '#d0d0e0',
    margin: '6px 0',
    lineHeight: '1.5',
  },
  waitingText: {
    fontSize: '0.78rem',
    color: '#7a7a8e',
    fontStyle: 'italic',
    marginTop: '8px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(201,169,78,0.2)',
    borderTop: '4px solid #c9a94e',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '20px auto',
  },
  cancelBtn: {
    marginTop: '16px',
    padding: '10px 24px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#8a8a9a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
  },
  receiptPaper: {
    backgroundColor: '#fff',
    padding: '28px',
    borderRadius: '12px',
    width: '350px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    fontFamily: "'Courier New', Courier, monospace",
    color: '#000',
  },
  printBtn: {
    flex: 1,
    padding: '11px',
    background: 'linear-gradient(135deg, #c9a94e, #e8d48b)',
    color: '#0f0f0f',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
  },
  closeBtn: {
    flex: 1,
    padding: '11px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
  },
};

// Add CSS keyframes for spinner animation
const styleSheet = document.styleSheets[0];
const keyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
try {
  styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
} catch (e) {
  // Ignore if already exists
}

export default Dashboard;
