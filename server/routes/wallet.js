const express = require('express');
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const { db } = require('../db');
const { authenticateToken } = require('../auth');
const { getUserDepositAddress } = require('../wallet');

const router = express.Router();

// Connect Phantom wallet with signature verification
router.post('/connect', authenticateToken, async (req, res) => {
    const { address, signature, message } = req.body;
    const userId = req.user.id;

    if (!address || !signature || !message) {
        return res.status(400).json({ error: 'Address, signature, and message required' });
    }

    try {
        // Dynamic import for bs58 (handles ES module in CommonJS)
        const bs58 = (await import('bs58')).default;

        // Verify signature
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = bs58.decode(address);

        const verified = nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKeyBytes
        );

        if (!verified) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Check if wallet is already linked to any account
        const existingWallet = db.prepare(
            'SELECT user_id FROM linked_wallets WHERE wallet_address = ?'
        ).get(address);

        if (existingWallet) {
            if (existingWallet.user_id === userId) {
                return res.status(400).json({ error: 'Wallet already linked to your account' });
            } else {
                return res.status(400).json({ error: 'Wallet already linked to another account' });
            }
        }

        // Check if this is the first wallet for the user
        const existingCount = db.prepare(
            'SELECT COUNT(*) as count FROM linked_wallets WHERE user_id = ?'
        ).get(userId);

        const isPrimary = existingCount.count === 0 ? 1 : 0;

        // Link wallet to user
        db.prepare(
            'INSERT INTO linked_wallets (user_id, wallet_address, is_primary) VALUES (?, ?, ?)'
        ).run(userId, address, isPrimary);

        res.json({
            success: true,
            message: 'Wallet connected successfully',
            wallet: {
                address,
                isPrimary: isPrimary === 1
            }
        });
    } catch (err) {
        console.error('Wallet connect error:', err);
        res.status(500).json({ error: 'Failed to connect wallet', details: err.message });
    }
});

// List user's linked wallets
router.get('/list', authenticateToken, (req, res) => {
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
        console.error('List wallets error:', err);
        res.status(500).json({ error: 'Failed to list wallets', details: err.message });
    }
});

// Disconnect wallet
router.post('/disconnect', authenticateToken, (req, res) => {
    const { address } = req.body;
    const userId = req.user.id;

    if (!address) {
        return res.status(400).json({ error: 'Address required' });
    }

    try {
        // Check if wallet belongs to user
        const wallet = db.prepare(
            'SELECT id, is_primary FROM linked_wallets WHERE user_id = ? AND wallet_address = ?'
        ).get(userId, address);

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // Check wallet count
        const walletCount = db.prepare(
            'SELECT COUNT(*) as count FROM linked_wallets WHERE user_id = ?'
        ).get(userId);

        // Don't allow removing the only wallet
        if (walletCount.count === 1) {
            return res.status(400).json({ error: 'Cannot remove your only wallet' });
        }

        // If removing primary wallet, promote another one
        if (wallet.is_primary === 1) {
            // Get the oldest non-primary wallet
            const nextWallet = db.prepare(
                'SELECT id FROM linked_wallets WHERE user_id = ? AND wallet_address != ? ORDER BY added_at ASC LIMIT 1'
            ).get(userId, address);

            if (nextWallet) {
                db.prepare('UPDATE linked_wallets SET is_primary = 1 WHERE id = ?').run(nextWallet.id);
            }
        }

        // Remove wallet
        db.prepare('DELETE FROM linked_wallets WHERE id = ?').run(wallet.id);

        res.json({ success: true, message: 'Wallet disconnected successfully' });
    } catch (err) {
        console.error('Disconnect wallet error:', err);
        res.status(500).json({ error: 'Failed to disconnect wallet', details: err.message });
    }
});

// Set wallet as primary
router.patch('/:address/primary', authenticateToken, (req, res) => {
    const { address } = req.params;
    const userId = req.user.id;

    try {
        // Check if wallet belongs to user
        const wallet = db.prepare(
            'SELECT id, is_primary FROM linked_wallets WHERE user_id = ? AND wallet_address = ?'
        ).get(userId, address);

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // Already primary
        if (wallet.is_primary === 1) {
            return res.json({ success: true, message: 'Wallet is already primary' });
        }

        // Update in a transaction
        db.prepare('UPDATE linked_wallets SET is_primary = 0 WHERE user_id = ?').run(userId);
        db.prepare('UPDATE linked_wallets SET is_primary = 1 WHERE id = ?').run(wallet.id);

        res.json({ success: true, message: 'Primary wallet updated successfully' });
    } catch (err) {
        console.error('Set primary wallet error:', err);
        res.status(500).json({ error: 'Failed to set primary wallet', details: err.message });
    }
});

// Get user's unique deposit address
router.get('/deposit-address', authenticateToken, async (req, res) => {
    try {
        const user = db.prepare('SELECT deposit_address_index FROM users WHERE id = ?').get(req.user.id);

        if (!user || user.deposit_address_index === null) {
            return res.status(404).json({ error: 'User not found or no deposit address assigned' });
        }

        const depositAddress = await getUserDepositAddress(user.deposit_address_index);

        res.json({
            success: true,
            depositAddress,
            network: 'devnet' // or 'mainnet-beta' in production
        });
    } catch (err) {
        console.error('Get deposit address error:', err);
        res.status(500).json({ error: 'Failed to get deposit address', details: err.message });
    }
});

module.exports = router;
