const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { generateToken } = require('../auth');
const { getModeInfo } = require('../utils/modeDetector');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Get next available deposit address index
        const maxIndex = db.prepare('SELECT MAX(deposit_address_index) as maxIdx FROM users').get();
        const nextIndex = (maxIndex.maxIdx || -1) + 1;

        // Create user
        const result = db.prepare(
            'INSERT INTO users (email, password_hash, deposit_address_index, balance) VALUES (?, ?, ?, ?)'
        ).run(email, passwordHash, nextIndex, 0);

        const userId = result.lastInsertRowid;

        // Generate token
        const token = generateToken(userId);

        // Get user data
        const user = db.prepare(
            'SELECT id, email, nickname, balance, avatar_url, test_balance FROM users WHERE id = ?'
        ).get(userId);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                balance: user.balance,
                avatarUrl: user.avatar_url,
                testBalance: user.test_balance || 0
            },
            systemMode: getModeInfo()
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        // Get user
        const user = db.prepare(
            'SELECT id, email, password_hash, nickname, balance, avatar_url FROM users WHERE email = ?'
        ).get(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user.id);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                balance: user.balance,
                avatarUrl: user.avatar_url,
                testBalance: user.test_balance || 0
            },
            systemMode: getModeInfo()
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

// Get current user info (protected)
router.get('/me', require('../auth').authenticateToken, (req, res) => {
    try {
        const user = db.prepare(
            'SELECT id, email, nickname, balance, avatar_url, test_balance FROM users WHERE id = ?'
        ).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get linked wallets
        const wallets = db.prepare(
            'SELECT wallet_address, is_primary, added_at FROM linked_wallets WHERE user_id = ? ORDER BY is_primary DESC, added_at ASC'
        ).all(req.user.id);

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                balance: user.balance,
                avatarUrl: user.avatar_url,
                testBalance: user.test_balance || 0,
                wallets: wallets.map(w => ({
                    address: w.wallet_address,
                    isPrimary: w.is_primary === 1,
                    addedAt: w.added_at
                }))
            },
            systemMode: getModeInfo()
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Failed to get user', details: err.message });
    }
});

module.exports = router;
