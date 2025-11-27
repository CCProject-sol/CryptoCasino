const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'casino.db');
const db = new Database(dbPath);

const init = () => {
    console.log('Initializing database...');

    // Users Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password_hash TEXT, -- Nullable for Google users
            google_id TEXT UNIQUE, -- New column for Google OAuth
            wallet_address TEXT UNIQUE,
            balance INTEGER DEFAULT 0, -- Stored in lamports (1 SOL = 1e9 lamports)
            deposit_address_index INTEGER UNIQUE,
            is_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Migration: Add google_id if it doesn't exist (for existing DBs)
    try {
        db.prepare('ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE').run();
    } catch (err) {
        // Column likely already exists
    }

    // Transactions Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL, -- DEPOSIT, WITHDRAWAL, BET, WIN, LOSS
            amount INTEGER NOT NULL,
            tx_hash TEXT,
            status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `).run();

    // Game Sessions Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_type TEXT NOT NULL, -- COIN_FLIP, HIGH_CARD
            player_1_id INTEGER,
            player_2_id INTEGER,
            bet_amount INTEGER NOT NULL,
            winner_id INTEGER,
            server_seed TEXT,
            client_seed TEXT,
            status TEXT DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(player_1_id) REFERENCES users(id),
            FOREIGN KEY(player_2_id) REFERENCES users(id)
        )
    `).run();

    // Withdrawals Table (for admin approval)
    db.prepare(`
        CREATE TABLE IF NOT EXISTS withdrawals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            destination_address TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, PROCESSED
            tx_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `).run();

    console.log('Database initialized successfully.');
};

module.exports = { db, init };
