const { db } = require('./db');
const GameManager = require('./gameManager');

// Mock broadcast function
const mockBroadcast = (userId) => {
    console.log(`[MockBroadcast] User update for ${userId}`);
};

const runTest = async () => {
    console.log('Starting Ledger Verification Test...');

    // 1. Create test users with unique emails
    const uniqueId = Date.now();
    const email1 = `test_ledger_1_${uniqueId}@example.com`;
    const email2 = `test_ledger_2_${uniqueId}@example.com`;

    // Ensure we don't clash on deposit_address_index either
    const index1 = Math.floor(Math.random() * 1000000);
    const index2 = Math.floor(Math.random() * 1000000);

    const info1 = db.prepare('INSERT INTO users (email, balance, deposit_address_index) VALUES (?, ?, ?)').run(email1, 10000000000, index1); // 10 SOL
    const userId1 = info1.lastInsertRowid;
    console.log(`Created test user 1: ${userId1} with 10 SOL`);

    const info2 = db.prepare('INSERT INTO users (email, balance, deposit_address_index) VALUES (?, ?, ?)').run(email2, 10000000000, index2); // 10 SOL
    const userId2 = info2.lastInsertRowid;
    console.log(`Created test user 2: ${userId2} with 10 SOL`);

    // 2. Initialize GameManager
    const gameManager = new GameManager(db, mockBroadcast);

    // 3. Create mock player objects
    const mockPlayer1 = {
        user: { id: userId1 },
        send: (msg) => console.log(`[MockPlayer1] Received: ${msg}`)
    };
    const mockPlayer2 = {
        user: { id: userId2 },
        send: (msg) => console.log(`[MockPlayer2] Received: ${msg}`)
    };

    // 4. Simulate a Coin Flip Game (Bet 1 SOL)
    console.log('Simulating Coin Flip Game...');
    const betAmount = 1; // 1 SOL
    // User 1 bets heads, User 2 bets tails
    const metadata = { [userId1]: 'heads', [userId2]: 'tails' };

    // Create game (should deduct balance from BOTH)
    gameManager.createGame('coinflip', [mockPlayer1, mockPlayer2], betAmount, metadata);

    // Verify deduction for Player 1
    const user1AfterBet = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId1);
    console.log(`User 1 Balance after bet: ${user1AfterBet.balance / 1e9} SOL`);

    if (user1AfterBet.balance === 9000000000) {
        console.log('PASS: User 1 Balance deducted correctly.');
    } else {
        console.error('FAIL: User 1 Balance deduction incorrect.');
    }

    // Verify transaction record for Player 1
    const betTx = db.prepare('SELECT * FROM transactions WHERE user_id = ? AND type = ? ORDER BY id DESC LIMIT 1').get(userId1, 'BET');
    if (betTx && betTx.amount === 1000000000) {
        console.log('PASS: Bet transaction recorded.');
    } else {
        console.error('FAIL: Bet transaction missing or incorrect.');
    }

    // Wait for game result (simulated delay is 2s)
    console.log('Waiting for game result...');
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Verify result
    const user1AfterGame = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId1);
    const user2AfterGame = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId2);

    console.log(`User 1 Balance after game: ${user1AfterGame.balance / 1e9} SOL`);
    console.log(`User 2 Balance after game: ${user2AfterGame.balance / 1e9} SOL`);

    // One should have won 2 SOL (net +1), the other lost 1 SOL (net -1)
    if (user1AfterGame.balance === 11000000000 || user2AfterGame.balance === 11000000000) {
        console.log('PASS: Winner received payout.');
    } else {
        console.error('FAIL: Payout incorrect.');
    }

    console.log('Test Complete.');
};

runTest();
