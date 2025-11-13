import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import FarmerDashboardPage from './pages/FarmerDashboardPage';
import FarmerWalletPage from './pages/FarmerWalletPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import RefundsDashboardPage from './pages/RefundsDashboardPage';
import ProduceEditPage from './pages/ProduceEditPage';
import OrderPage from './pages/OrderPage';
import ChatPage from './pages/ChatPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <Router>
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      <main className="py-3">
        <Container>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search/:keyword" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/verify-email/:token"
              element={<VerifyEmailPage />}
            />

            {/* Farmer Routes */}
            <Route path="/farmer/dashboard" element={<FarmerDashboardPage />} />
            <Route path="/farmer/wallet" element={<FarmerWalletPage />} />
            
            {/* ** THIS IS THE FIX ** */}
            {/* The 'new' route MUST come before the ':id' route */}
            <Route path="/farmer/produce/new/edit" element={<ProduceEditPage />} />
            <Route path="/farmer/produce/:id/edit" element={<ProduceEditPage />} />

            {/* Buyer Routes */}
            <Route path="/buyer/dashboard" element={<BuyerDashboardPage />} />
            <Route path="/buyer/refunds" element={<RefundsDashboardPage />} />
            <Route path="/order/:id" element={<OrderPage />} />

            {/* Shared Routes */}
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:userId" element={<ChatPage />} />
            
            {/* ADMIN Route */}
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Routes>
        </Container>
      </main>
      <Footer />
    </Router>
  );
}

export default App;