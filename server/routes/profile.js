const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../auth');

const router = express.Router();

// Update profile (nickname, avatar)
router.patch('/update', authenticateToken, (req, res) => {
    const { nickname, avatarUrl } = req.body;
    const userId = req.user.id;

    try {
        const updates = [];
        const values = [];

        if (nickname !== undefined) {
            // Check if nickname is already taken
            const existing = db.prepare('SELECT id FROM users WHERE nickname = ? AND id != ?').get(nickname, userId);
            if (existing) {
                return res.status(400).json({ error: 'Nickname already taken' });
            }
            updates.push('nickname = ?');
            values.push(nickname);
        }

        if (avatarUrl !== undefined) {
            updates.push('avatar_url = ?');
            values.push(avatarUrl);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        values.push(userId);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        db.prepare(query).run(...values);

        // Get updated user
        const user = db.prepare(
            'SELECT id, email, nickname, balance, avatar_url FROM users WHERE id = ?'
        ).get(userId);

        res.json({ success: true, user });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Failed to update profile', details: err.message });
    }
});

// Get transaction history (paginated)
router.get('/transactions', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        const transactions = db.prepare(
            'SELECT id, type, amount, tx_hash, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
        ).all(userId, limit, offset);

        const total = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?').get(userId);

        res.json({
            success: true,
            transactions: transactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                txHash: tx.tx_hash,
                status: tx.status,
                createdAt: tx.created_at
            })),
            pagination: {
                page,
                limit,
                total: total.count,
                totalPages: Math.ceil(total.count / limit)
            }
        });
    } catch (err) {
        console.error('Get transactions error:', err);
        res.status(500).json({ error: 'Failed to get transactions', details: err.message });
    }
});

// Get user wallets
router.get('/wallets', authenticateToken, (req, res) => {
    try {
        const wallets = db.prepare(
            'SELECT wallet_address, is_primary, added_at FROM linked_wallets WHERE user_id = ? ORDER BY is_primary DESC, added_at ASC'
        ).all(req.user.id);

        res.json({
            success: true,
            wallets: wallets.map(w => ({
                address: w.wallet_address,
                isPrimary: w.is_primary === 1,
                addedAt: w.added_at
            }))
        });
    } catch (err) {
        console.error('Get wallets error:', err);
        res.status(500).json({ error: 'Failed to get wallets', details: err.message });
    }
});

module.exports = router;
