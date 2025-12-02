const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'casino.db');
const db = new Database(dbPath);

const init = () => {
    console.log('Initializing database at:', dbPath);
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    console.log('[DB Init] Users table columns:', tableInfo.map(c => c.name).join(', '));

    // Users Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            wallet_address TEXT UNIQUE, -- Kept for backward compatibility/reference
            nickname TEXT UNIQUE,
            password_hash TEXT,
            balance INTEGER DEFAULT 0, -- Stored in lamports (1 SOL = 1e9 lamports)
            deposit_address_index INTEGER UNIQUE,
            is_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Linked Wallets Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS linked_wallets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            wallet_address TEXT UNIQUE NOT NULL,
            is_primary INTEGER DEFAULT 0,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `).run();

    // Verify schema and migrate if needed
    try {
        const tableInfo = db.prepare('PRAGMA table_info(users)').all();
        const columns = tableInfo.map(c => c.name);
        console.log('[DB] Users table schema:', columns.join(', '));

        if (!columns.includes('nickname')) {
            console.log('[DB] Migrating: Adding nickname column to users...');
            try {
                db.prepare('ALTER TABLE users ADD COLUMN nickname TEXT UNIQUE').run();
            } catch (alterErr) {
                if (alterErr.message.includes('duplicate column name')) {
                    console.log('[DB] Nickname column already exists (race condition handled).');
                } else {
                    throw alterErr;
                }
            }
        }

        if (!columns.includes('password_hash')) {
            console.log('[DB] Migrating: Adding password_hash column to users...');
            try {
                db.prepare('ALTER TABLE users ADD COLUMN password_hash TEXT').run();
            } catch (alterErr) {
                if (alterErr.message.includes('duplicate column name')) {
                    console.log('[DB] password_hash column already exists (race condition handled).');
                } else {
                    throw alterErr;
                }
            }
        }

        if (!columns.includes('avatar_url')) {
            console.log('[DB] Migrating: Adding avatar_url column to users...');
            try {
                db.prepare('ALTER TABLE users ADD COLUMN avatar_url TEXT').run();
            } catch (alterErr) {
                if (alterErr.message.includes('duplicate column name')) {
                    console.log('[DB] avatar_url column already exists (race condition handled).');
                } else {
                    throw alterErr;
                }
            }
        }

        // Migrate existing users to linked_wallets
        const existingUsers = db.prepare('SELECT id, wallet_address FROM users').all();
        for (const user of existingUsers) {
            const linked = db.prepare('SELECT id FROM linked_wallets WHERE wallet_address = ?').get(user.wallet_address);
            if (!linked && user.wallet_address) {
                console.log(`[DB] Migrating user ${user.id} wallet to linked_wallets...`);
                try {
                    db.prepare('INSERT INTO linked_wallets (user_id, wallet_address, is_primary) VALUES (?, ?, 1)').run(user.id, user.wallet_address);
                } catch (linkErr) {
                    console.error(`[DB] Failed to migrate wallet for user ${user.id}:`, linkErr.message);
                }
            }
        }

    } catch (err) {
        console.error('[DB] Schema verification/migration failed:', err);
        // Do not rethrow, allow server to continue if possible
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

init();

module.exports = { db, init };
