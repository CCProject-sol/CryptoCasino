import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Games from './pages/Games';
import CoinFlip from './pages/CoinFlip';
import HighCard from './pages/HighCard';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';

import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/game/coin-flip" element={<CoinFlip />} />
            <Route path="/game/high-card" element={<HighCard />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </Router>
    </UserProvider>
  );
}

export default App;
