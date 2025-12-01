const express = require('express');
const router = express.Router();
const { db } = require('./db');
const { authenticateToken } = require('./auth');

// Get full user profile
router.get('/profile', authenticateToken, (req, res) => {
    const userId = req.user.id;

    try {
        const user = db.prepare('SELECT id, email, wallet_address, nickname, balance, deposit_address_index, created_at FROM users WHERE id = ?').get(userId);
        const linkedWallets = db.prepare('SELECT wallet_address, is_primary, added_at FROM linked_wallets WHERE user_id = ? ORDER BY added_at ASC').all(userId);

        // Get recent transactions (optional, limit 10)
        const recentTransactions = db.prepare('SELECT type, amount, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);

        res.json({
            user,
            linkedWallets,
            recentTransactions
        });
    } catch (err) {
        console.error('[User] Get profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Nickname
router.post('/nickname', authenticateToken, (req, res) => {
    const { nickname } = req.body;
    const userId = req.user.id;

    if (!nickname || nickname.length < 3 || nickname.length > 20) {
        return res.status(400).json({ error: 'Nickname must be between 3 and 20 characters' });
    }

    try {
        db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, userId);

        // Broadcast update
        const broadcast = req.app.get('broadcastUserUpdate');
        if (broadcast) broadcast(userId);

        res.json({ success: true, nickname });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Nickname already taken' });
        }
        console.error('[User] Update nickname error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
