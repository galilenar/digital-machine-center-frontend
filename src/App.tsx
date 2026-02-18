import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LibraryPage from './pages/LibraryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminPage from './pages/AdminPage';
import DealerPage from './pages/DealerPage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, isAdmin, isDealer, isVendor } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route
          path="/admin"
          element={
            isAuthenticated && isAdmin ? <AdminPage /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/dealer"
          element={
            isAuthenticated && (isDealer || isVendor || isAdmin) ? (
              <DealerPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
