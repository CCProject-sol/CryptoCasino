const express = require('express');
const { db } = require('../db');

const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const adminSecret = req.headers['x-admin-secret'];

    if (!adminSecret || adminSecret !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Unauthorized - Invalid admin credentials' });
    }

    next();
};

// Set test balance for a user (admin only)
router.post('/set-test-balance', authenticateAdmin, (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || amount === undefined) {
        return res.status(400).json({ error: 'userId and amount are required' });
    }

    if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    try {
        // Check if user exists  
        const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update test balance (stored in lamports like real balance)
        const amountInLamports = Math.floor(amount * 1e9);
        db.prepare('UPDATE users SET test_balance = ? WHERE id = ?').run(amountInLamports, userId);

        res.json({
            success: true,
            message: `Test balance updated for user ${user.email}`,
            userId,
            testBalance: amount,
            testBalanceLamports: amountInLamports
        });
    } catch (err) {
        console.error('Set test balance error:', err);
        res.status(500).json({ error: 'Failed to set test balance', details: err.message });
    }
});

// Get current test balance for a user (admin only)
router.get('/test-balance/:userId', authenticateAdmin, (req, res) => {
    const { userId } = req.params;

    try {
        const user = db.prepare('SELECT id, email, test_balance FROM users WHERE id = ?').get(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            userId: user.id,
            email: user.email,
            testBalance: (user.test_balance || 0) / 1e9,
            testBalanceLamports: user.test_balance || 0
        });
    } catch (err) {
        console.error('Get test balance error:', err);
        res.status(500).json({ error: 'Failed to get test balance', details: err.message });
    }
});

module.exports = router;
