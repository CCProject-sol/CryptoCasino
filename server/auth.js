const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const { db } = require('./db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Assign a unique deposit address index
        // Simple strategy: incrementing index. 
        // In a real app, we might want gaps or random indices, but sequential is fine for HD wallets.
        const lastUser = db.prepare('SELECT deposit_address_index FROM users ORDER BY deposit_address_index DESC LIMIT 1').get();
        const nextIndex = (lastUser ? lastUser.deposit_address_index : 0) + 1;

        const info = db.prepare('INSERT INTO users (email, password_hash, deposit_address_index) VALUES (?, ?, ?)').run(email, hashedPassword, nextIndex);

        const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET);
        res.json({ token, user: { id: info.lastInsertRowid, email, balance: 0 } });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !await bcrypt.compare(password, user.password_hash)) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, balance: user.balance, wallet_address: user.wallet_address } });
});

// Link Wallet
router.post('/link-wallet', authenticateToken, (req, res) => {
    const { publicKey, signature } = req.body;
    const userId = req.user.id;

    if (!publicKey || !signature) return res.status(400).json({ error: 'Missing public key or signature' });

    try {
        // Verify signature
        // Message to sign: "Link wallet {publicKey} to account {userId}"
        const message = `Link wallet ${publicKey} to account ${userId}`;
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = bs58.decode(publicKey);

        const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

        if (!verified) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        db.prepare('UPDATE users SET wallet_address = ? WHERE id = ?').run(publicKey, userId);
        res.json({ success: true, wallet_address: publicKey });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const { getUserDepositAddress } = require('./wallet');

// Get User Profile
router.get('/me', authenticateToken, async (req, res) => {
    const user = db.prepare('SELECT id, email, wallet_address, balance, deposit_address_index FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.sendStatus(404);

    // Derive deposit address
    try {
        const depositAddress = await getUserDepositAddress(user.deposit_address_index);
        user.deposit_address = depositAddress;
    } catch (err) {
        console.error('Error deriving address:', err);
    }

    res.json(user);
});

module.exports = { router, authenticateToken };
