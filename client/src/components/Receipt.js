import React from 'react';

function Receipt({ saleDetails, onNewSale }) {
  if (!saleDetails) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.receiptPaper}>
        <h2 style={styles.center}>HAMS LOUNGE</h2>
        <p style={styles.center}>Nairobi, Kenya</p>
        <p style={styles.center}>--------------------------------</p>
        <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Method:</strong> {saleDetails.paymentMethod}</p>
        <p style={styles.center}>--------------------------------</p>
        
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.left}>Item</th>
              <th>Qty</th>
              <th style={styles.right}>Price</th>
            </tr>
          </thead>
          <tbody>
            {saleDetails.items.map((item, index) => (
              <tr key={index}>
                <td style={styles.left}>{item.name}</td>
                <td style={styles.center}>{item.quantity}</td>
                <td style={styles.right}>{(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={styles.center}>--------------------------------</p>
        <h3 style={styles.totalRow}>
          <span>TOTAL:</span>
          <span>KES {saleDetails.totalAmount.toLocaleString()}</span>
        </h3>
        <p style={styles.center}>--------------------------------</p>
        <p style={styles.center}>Thank you for your business!</p>
        
        <div style={styles.noPrint}>
          <button onClick={() => window.print()} style={styles.printBtn}>Print Receipt</button>
          <button onClick={onNewSale} style={styles.closeBtn}>Next Sale</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  receiptPaper: { backgroundColor: '#fff', padding: '20px', width: '300px', fontFamily: 'monospace', boxShadow: '0 0 10px rgba(0,0,0,0.5)' },
  center: { textAlign: 'center', margin: '5px 0' },
  table: { width: '100%', borderCollapse: 'collapse', margin: '10px 0' },
  left: { textAlign: 'left' },
  right: { textAlign: 'right' },
  totalRow: { display: 'flex', justifyContent: 'space-between', marginTop: '10px' },
  printBtn: { width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', marginBottom: '5px', cursor: 'pointer' },
  closeBtn: { width: '100%', padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', cursor: 'pointer' },
  // This CSS hide buttons when the actual print window opens
  noPrint: { marginTop: '20px', display: 'block' }
};

export default Receipt;