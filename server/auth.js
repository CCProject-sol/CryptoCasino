const express = require('express');
const router = express.Router();
const { db } = require('./db');

// Login/Register with Wallet
router.post('/login', (req, res) => {
    const { publicKey } = req.body;

    if (!publicKey) {
        return res.status(400).json({ error: 'Public key is required' });
    }

    try {
        // Check if user exists
        let user = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(publicKey);

        if (!user) {
            // Register new user
            // Find next deposit address index
            const result = db.prepare('SELECT MAX(deposit_address_index) as maxIndex FROM users').get();
            const nextIndex = (result.maxIndex !== null) ? result.maxIndex + 1 : 0;

            const info = db.prepare('INSERT INTO users (wallet_address, deposit_address_index) VALUES (?, ?)').run(publicKey, nextIndex);
            user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);

            console.log(`[Auth] New user registered: ${user.id} (${publicKey})`);
        } else {
            console.log(`[Auth] User logged in: ${user.id}`);
        }

        res.json({ user });
    } catch (err) {
        console.error('[Auth] Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const authenticateToken = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) return res.status(403).json({ error: 'Invalid user' });

        req.user = user;
        next();
    } catch (err) {
        console.error('[Auth] Auth middleware error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { router, authenticateToken };
