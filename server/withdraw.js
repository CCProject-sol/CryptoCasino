const express = require('express');
const { db } = require('./db');
const { authenticateToken } = require('./auth');
const { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getDerivedKeyPair, connection } = require('./wallet');

const router = express.Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware for Admin Auth (Simple password check for MVP)
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // In a real app, use a separate role in JWT. Here we just check a header or a specific admin token.
    // For simplicity, let's assume the admin logs in and gets a special JWT or we just check a hardcoded secret in header.
    // Let's use a custom header 'x-admin-secret' for this MVP to keep it simple and distinct.
    const adminSecret = req.headers['x-admin-secret'];

    if (adminSecret !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Admin access denied' });
    }
    next();
};

// Request Withdrawal
router.post('/withdraw', authenticateToken, (req, res) => {
    const { amount, address } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!address) return res.status(400).json({ error: 'Destination address required' });

    try {
        const result = db.transaction(() => {
            // Check balance
            const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
            if (user.balance < amount) {
                throw new Error('Insufficient balance');
            }

            // Deduct balance immediately to prevent double spend
            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);

            // Create withdrawal record
            const info = db.prepare('INSERT INTO withdrawals (user_id, amount, destination_address) VALUES (?, ?, ?)').run(userId, amount, address);

            // Record transaction
            db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(userId, 'WITHDRAWAL', amount, 'PENDING');

            return info.lastInsertRowid;
        })();

        res.json({ success: true, withdrawalId: result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: List Pending Withdrawals
router.get('/admin/withdrawals', authenticateAdmin, (req, res) => {
    const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE status = "PENDING"').all();
    res.json(withdrawals);
});

// Admin: Approve Withdrawal
router.post('/admin/approve-withdrawal', authenticateAdmin, async (req, res) => {
    const { withdrawalId } = req.body;

    try {
        const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ? AND status = "PENDING"').get(withdrawalId);
        if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found or already processed' });

        // Execute Solana Transaction
        // We send from the Main Hot Wallet (Index 0)
        const keyPair = await getDerivedKeyPair(0);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: keyPair.publicKey,
                toPubkey: new PublicKey(withdrawal.destination_address),
                lamports: withdrawal.amount,
            })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [keyPair]);
        console.log(`Withdrawal processed: ${signature}`);

        // Update DB
        db.transaction(() => {
            db.prepare('UPDATE withdrawals SET status = "APPROVED", tx_hash = ? WHERE id = ?').run(signature, withdrawalId);
            db.prepare('UPDATE transactions SET status = "COMPLETED", tx_hash = ? WHERE user_id = ? AND type = "WITHDRAWAL" AND status = "PENDING" AND amount = ?').run(signature, withdrawal.user_id, withdrawal.amount);
        })();

        res.json({ success: true, tx_hash: signature });
    } catch (err) {
        console.error('Withdrawal failed:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
