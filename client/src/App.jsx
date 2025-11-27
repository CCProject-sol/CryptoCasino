import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Games from './pages/Games';
import CoinFlip from './pages/CoinFlip';
import HighCard from './pages/HighCard';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { api } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (api.token) {
        const profile = await api.getProfile();
        if (profile) {
          setUser(profile);
        } else {
          api.logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = (user) => {
    setUser(user);
    window.location.href = '/'; // Simple redirect
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/games" element={<Games />} />
          <Route path="/game/coin-flip" element={user ? <CoinFlip user={user} /> : <Navigate to="/login" />} />
          <Route path="/game/high-card" element={user ? <HighCard user={user} /> : <Navigate to="/login" />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
