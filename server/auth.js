const express = require('express');
const router = express.Router();
const { db } = require('./db');
const bcrypt = require('bcryptjs');

// Middleware
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
        res.status(500).json({ error: 'Internal server error (Auth Middleware): ' + err.message });
    }
};

// Login/Register with Wallet
router.post('/login', (req, res) => {
    const { publicKey } = req.body;
    console.log('[Auth] Login request received for:', publicKey);

    if (!publicKey) {
        return res.status(400).json({ error: 'Public key is required' });
    }

    try {
        // Check if wallet is linked to any user
        let linkedWallet = db.prepare('SELECT user_id FROM linked_wallets WHERE wallet_address = ?').get(publicKey);
        let user;

        if (linkedWallet) {
            // Existing user found via linked wallet
            user = db.prepare('SELECT * FROM users WHERE id = ?').get(linkedWallet.user_id);
            console.log(`[Auth] User logged in via linked wallet: ${user.id} (${publicKey})`);
        } else {
            // Check legacy wallet_address column just in case migration missed something or for safety
            user = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(publicKey);

            if (user) {
                // Found in legacy column, ensure it's in linked_wallets
                db.prepare('INSERT OR IGNORE INTO linked_wallets (user_id, wallet_address, is_primary) VALUES (?, ?, 1)').run(user.id, publicKey);
            } else {
                // Register new user
                const result = db.prepare('SELECT MAX(deposit_address_index) as maxIndex FROM users').get();
                const nextIndex = (result.maxIndex !== null) ? result.maxIndex + 1 : 0;

                const info = db.prepare('INSERT INTO users (wallet_address, deposit_address_index) VALUES (?, ?)').run(publicKey, nextIndex);
                const userId = info.lastInsertRowid;

                // Add to linked_wallets
                db.prepare('INSERT INTO linked_wallets (user_id, wallet_address, is_primary) VALUES (?, ?, 1)').run(userId, publicKey);

                user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
                console.log(`[Auth] New user registered: ${user.id} (${publicKey})`);
            }
        }

        res.json({ user });
    } catch (err) {
        console.error('[Auth] Login error:', err);
        res.status(500).json({ error: 'Internal server error (DEBUG): ' + err.message });
    }
});

// Register with Email
router.post('/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const passwordHash = bcrypt.hashSync(password, 10);

        // Get next deposit index
        const result = db.prepare('SELECT MAX(deposit_address_index) as maxIndex FROM users').get();
        const nextIndex = (result.maxIndex !== null) ? result.maxIndex + 1 : 0;

        const info = db.prepare('INSERT INTO users (email, password_hash, deposit_address_index) VALUES (?, ?, ?)').run(email, passwordHash, nextIndex);
        const userId = info.lastInsertRowid;

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        console.log(`[Auth] New user registered via email: ${user.id} (${email})`);

        res.json({ user });
    } catch (err) {
        console.error('[Auth] Register error:', err);
        res.status(500).json({ error: 'Internal server error (Register): ' + err.message });
    }
});

// Login with Email
router.post('/login-email', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.password_hash) {
            return res.status(401).json({ error: 'Account exists but has no password set (try wallet login?)' });
        }

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log(`[Auth] User logged in via email: ${user.id} (${email})`);
        res.json({ user });
    } catch (err) {
        console.error('[Auth] Email Login error:', err);
        res.status(500).json({ error: 'Internal server error (Email Login): ' + err.message });
    }
});

// Link a new wallet to the authenticated user
router.post('/link-wallet', authenticateToken, (req, res) => {
    const { publicKey } = req.body;
    const userId = req.user.id;

    if (!publicKey) return res.status(400).json({ error: 'Public key is required' });

    try {
        // Check if wallet is already linked to ANY user
        const existing = db.prepare('SELECT user_id FROM linked_wallets WHERE wallet_address = ?').get(publicKey);
        if (existing) {
            if (existing.user_id === userId) {
                return res.status(400).json({ error: 'Wallet already linked to your account' });
            } else {
                return res.status(400).json({ error: 'Wallet already linked to another account' });
            }
        }

        db.prepare('INSERT INTO linked_wallets (user_id, wallet_address, is_primary) VALUES (?, ?, 0)').run(userId, publicKey);

        const broadcast = req.app.get('broadcastUserUpdate');
        if (broadcast) broadcast(userId);

        res.json({ success: true });
    } catch (err) {
        console.error('[Auth] Link wallet error:', err);
        res.status(500).json({ error: 'Internal server error (Link Wallet): ' + err.message });
    }
});

// Unlink a wallet
router.post('/unlink-wallet', authenticateToken, (req, res) => {
    const { publicKey } = req.body;
    const userId = req.user.id;

    try {
        // Check if it's the last wallet
        const count = db.prepare('SELECT COUNT(*) as count FROM linked_wallets WHERE user_id = ?').get(userId);
        if (count.count <= 1) {
            return res.status(400).json({ error: 'Cannot unlink your only wallet' });
        }

        // Check if it's the primary wallet
        const wallet = db.prepare('SELECT is_primary FROM linked_wallets WHERE user_id = ? AND wallet_address = ?').get(userId, publicKey);
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        if (wallet.is_primary) {
            return res.status(400).json({ error: 'Cannot unlink primary wallet. Set another wallet as primary first.' });
        }

        db.prepare('DELETE FROM linked_wallets WHERE user_id = ? AND wallet_address = ?').run(userId, publicKey);

        const broadcast = req.app.get('broadcastUserUpdate');
        if (broadcast) broadcast(userId);

        res.json({ success: true });
    } catch (err) {
        console.error('[Auth] Unlink wallet error:', err);
        res.status(500).json({ error: 'Internal server error (Unlink Wallet): ' + err.message });
    }
});

// Set primary wallet
router.post('/set-primary-wallet', authenticateToken, (req, res) => {
    const { publicKey } = req.body;
    const userId = req.user.id;

    try {
        const wallet = db.prepare('SELECT id FROM linked_wallets WHERE user_id = ? AND wallet_address = ?').get(userId, publicKey);
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        db.transaction(() => {
            db.prepare('UPDATE linked_wallets SET is_primary = 0 WHERE user_id = ?').run(userId);
            db.prepare('UPDATE linked_wallets SET is_primary = 1 WHERE user_id = ? AND wallet_address = ?').run(userId, publicKey);
            // Update legacy column
            db.prepare('UPDATE users SET wallet_address = ? WHERE id = ?').run(publicKey, userId);
        })();

        const broadcast = req.app.get('broadcastUserUpdate');
        if (broadcast) broadcast(userId);

        res.json({ success: true });
    } catch (err) {
        console.error('[Auth] Set primary wallet error:', err);
        res.status(500).json({ error: 'Internal server error (Set Primary): ' + err.message });
    }
});

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    try {
        const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);

        if (!user || !user.password_hash) {
            return res.status(400).json({ error: 'User has no password set (wallet login?)' });
        }

        const validPassword = await bcrypt.compare(oldPassword, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashedPassword, userId);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('[Auth] Change password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = { router, authenticateToken };
