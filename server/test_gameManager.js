const test = require('node:test');
const assert = require('node:assert');
const Database = require('better-sqlite3');
const GameManager = require('./gameManager');

function setup(t) {
    const db = new Database(':memory:');
    db.exec(`
        CREATE TABLE users (id INTEGER PRIMARY KEY, balance INTEGER);
        CREATE TABLE transactions (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, amount INTEGER, status TEXT);
    `);

    const players = [
        { user: { id: 1 }, send: t.mock.fn() },
        { user: { id: 2 }, send: t.mock.fn() }
    ];

    // Give players 1 SOL each (1e9 lamports)
    db.prepare('INSERT INTO users (id, balance) VALUES (?, ?), (?, ?)').run(players[0].user.id, 1e9, players[1].user.id, 1e9);

    const broadcastUserUpdate = t.mock.fn();
    const gameManager = new GameManager(db, broadcastUserUpdate);

    return { db, players, gameManager, broadcastUserUpdate };
}

test.describe('GameManager', () => {
    test.describe('runCoinFlip()', (t) => {
        test('should refund both players if there is no winner', async (t) => {
            const { db, players, gameManager } = setup(t);
            const initialBalance = 1e9;
            const betAmountSOL = "0.1"; // 0.1 SOL
            const betAmountLamports = 1e8;

            // Mock Math.random to ensure a predictable outcome ('tails')
            t.mock.method(Math, 'random', () => 0.6);

            const metadata = { [players[0].user.id]: 'heads', [players[1].user.id]: 'heads' };

            gameManager.createGame('coinflip', players, betAmountSOL, metadata);

            await new Promise(resolve => setTimeout(resolve, 2500));

            const p1Balance = db.prepare('SELECT balance FROM users WHERE id = ?').get(players[0].user.id).balance;
            const p2Balance = db.prepare('SELECT balance FROM users WHERE id = ?').get(players[1].user.id).balance;

            assert.strictEqual(p1Balance, initialBalance, 'Player 1 should have been refunded');
            assert.strictEqual(p2Balance, initialBalance, 'Player 2 should have been refunded');
        });
    });
});
