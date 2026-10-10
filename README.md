# 🥂 Hams Lounge POS System

A professional Point of Sale (POS) system designed for the Hams Lounge, featuring a modern drink menu, seamless checkout, and integration with M-Pesa for automated payments.

## 🚀 Features

- **Modern Drink Menu**: A visual POS grid displaying drinks with actual bottle images for fast identification.
- **Seamless Checkout**: Intuitive cart system with automatic tax (VAT 16%) calculation.
- **M-Pesa Integration**: Full STK Push integration for automated mobile money payments, including real-time status polling.
- **Inventory Management**: Track and update drink stock levels in real-time.
- **Sales Analytics**: Detailed sales history and revenue tracking.
- **Receipt Printing**: Optimized 80mm thermal paper receipt generation.

## 🛠️ Technology Stack

### Backend
- **Node.js & Express**: Robust server-side logic.
- **PostgreSQL**: High-performance relational database for managing products and sales.
- **pg-pool**: Efficient database connection pooling.
- **JWT**: Secure staff authentication.
- **Safaricom Daraja API**: For M-Pesa payment processing.

### Frontend
- **React**: Dynamic and responsive user interface.
- **Axios**: Efficient API communication.
- **CSS3**: Custom "Lounge" aesthetic with dark mode, glassmorphism, and gold accents.

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/GAMEZ-slayer/hams_lounge.git
cd hams_lounge
```

### 2. Backend Setup
```bash
cd hams-backend
npm install
```
Create a `.env` file in the `hams-backend` folder:
```env
PORT=5000
PGHOST=localhost
PGUSER=your_username
PGDATABASE=hams_lounge
PGPASSWORD=your_password
PGPORT=5432
JWT_SECRET=your_secret_key
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=your_callback_url
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm start
```

## 📂 Project Structure
- `client/`: React frontend application.
- `hams-backend/`: Express API and PostgreSQL configuration.
- `hams-backend/public/images/products/`: Local storage for drink bottle images.

## 📄 License
This project is proprietary to Hams Lounge.
