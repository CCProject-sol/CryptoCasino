const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { db } = require('./db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Passport Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_CLIENT_SECRET',
    callbackURL: `${SERVER_URL}/api/auth/google/callback`
},
    function (accessToken, refreshToken, profile, cb) {
        try {
            // Check if user exists by google_id
            let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);

            if (!user) {
                // Check if user exists by email
                const email = profile.emails[0].value;
                user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

                if (user) {
                    // Link google_id to existing user
                    db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(profile.id, user.id);
                } else {
                    // Create new user
                    const lastUser = db.prepare('SELECT deposit_address_index FROM users ORDER BY deposit_address_index DESC LIMIT 1').get();
                    const nextIndex = (lastUser ? lastUser.deposit_address_index : 0) + 1;

                    const info = db.prepare('INSERT INTO users (email, google_id, deposit_address_index) VALUES (?, ?, ?)').run(email, profile.id, nextIndex);
                    user = { id: info.lastInsertRowid, email, balance: 0 };
                }
            }
            return cb(null, user);
        } catch (err) {
            return cb(err);
        }
    }
));

// ... (middleware and other routes remain unchanged)

// Google Auth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home with token.
        const user = req.user;
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        // Redirect to client with token
        res.redirect(`${CLIENT_URL}/login?token=${token}`);
    }
);

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
