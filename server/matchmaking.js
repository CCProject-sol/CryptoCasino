const CoinFlipGame = require('./games/coinFlip');
const { db } = require('./db');

class MatchmakingManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.queues = {
            coinflip: {},
            highcard: {}
        };
    }

    // Helper to get User ID from WS
    getUserId(ws) {
        // In a real app, we'd attach the user object to WS on connection after auth
        // For now, let's assume the client sends their token or ID, OR we attached it in connection
        // Let's assume ws.user = { id: ... } was set in server.js
        return ws.user ? ws.user.id : null;
    }

    findMatch(ws, gameType, betAmount, side = null, useTestBalance = false) {
        if (!ws.user || !ws.user.id) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Not authenticated' }));
            return;
        }

        const userId = ws.user.id;

        console.log(`Player ${userId} looking for match: ${gameType} ${betAmount} ${side || ''} ${useTestBalance ? '(TEST MODE)' : ''}`);

        // TEST MODE: Instant single-player game
        if (useTestBalance) {
            console.log(`Creating instant test mode game for player ${userId}`);
            ws.send(JSON.stringify({ type: 'SEARCHING_MATCH' }));

            // Immediate match in test mode
            const metadata = {};
            if (gameType === 'coinflip') {
                metadata[userId] = side; // Store player's choice
            }

            this.gameManager.createGame(gameType, [ws], betAmount, { ...metadata, useTestBalance: true });
            return;
        }

        // PRODUCTION MODE: PVP matchmaking
        if (gameType === 'coinflip') {
            this.matchCoinFlip(ws, betAmount, side);
        } else if (gameType === 'highcard') {
            this.matchHighCard(ws, betAmount);
        }
    }

    matchCoinFlip(ws, betAmount, side) {
        const userId = this.getUserId(ws); // Re-get userId for this method's scope
        if (!this.queues.coinflip[betAmount]) {
            this.queues.coinflip[betAmount] = { heads: [], tails: [] };
        }

        const queue = this.queues.coinflip[betAmount];
        const opponentSide = side === 'heads' ? 'tails' : 'heads';

        // Look for opponent in the opposite queue
        if (queue[opponentSide].length > 0) {
            const opponentWs = queue[opponentSide].shift();
            const opponentId = this.getUserId(opponentWs);

            // Check if opponent is still connected
            if (opponentWs.readyState !== opponentWs.OPEN) {
                return this.matchCoinFlip(ws, betAmount, side); // Retry
            }

            // Match found!
            // Create Game in DB (Atomic Betting)
            try {
                // For PvP, we need to deduct from BOTH players.
                // CoinFlipGame.createGame handles one player. We need a PvP version.
                // Let's do it manually here for PvP to ensure atomicity for both.

                const gameId = db.transaction(() => {
                    // Check balances
                    const p1 = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
                    const p2 = db.prepare('SELECT balance FROM users WHERE id = ?').get(opponentId);

                    if (p1.balance < betAmount || p2.balance < betAmount) {
                        throw new Error('Insufficient balance');
                    }

                    // Deduct bets
                    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(betAmount, userId);
                    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(betAmount, opponentId);

                    // Create Game
                    const info = db.prepare('INSERT INTO game_sessions (game_type, player_1_id, player_2_id, bet_amount, status) VALUES (?, ?, ?, ?, ?)').run('COIN_FLIP', userId, opponentId, betAmount, 'ACTIVE');

                    // Record Transactions
                    db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(userId, 'BET', betAmount, 'COMPLETED');
                    db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(opponentId, 'BET', betAmount, 'COMPLETED');

                    return info.lastInsertRowid;
                })();

                // Resolve Game Immediately (since it's simple Coin Flip)
                const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
                const winnerId = result === side.toUpperCase() ? userId : opponentId;
                const payout = betAmount * 2;

                // Payout Winner
                db.transaction(() => {
                    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(payout, winnerId);
                    db.prepare('UPDATE game_sessions SET winner_id = ?, status = ? WHERE id = ?').run(winnerId, 'COMPLETED', gameId);
                    db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(winnerId, 'WIN', payout, 'COMPLETED');
                })();

                // Notify Players
                const payload = {
                    type: 'GAME_RESULT',
                    gameType: 'coinflip',
                    result,
                    winnerId,
                    payout
                };

                ws.send(JSON.stringify(payload));
                opponentWs.send(JSON.stringify(payload));

            } catch (err) {
                console.error('Betting failed:', err);
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Betting failed: ' + err.message }));
                opponentWs.send(JSON.stringify({ type: 'ERROR', message: 'Betting failed: ' + err.message }));
            }

            return true;
        } else {
            // No match, add to queue
            queue[side].push(ws);
            ws.send(JSON.stringify({ type: 'SEARCHING_MATCH' }));
            return false;
        }
    }

    matchHighCard(ws, betAmount) {
        const userId = this.getUserId(ws);
        // Similar logic for High Card...
        // For MVP, let's stick to Coin Flip first as requested in detail.
        // But we should at least queue them.
        if (!this.queues.highcard[betAmount]) {
            this.queues.highcard[betAmount] = [];
        }
        this.queues.highcard[betAmount].push(ws);
        ws.send(JSON.stringify({ type: 'SEARCHING_MATCH' }));
    }

    removeFromQueue(ws) {
        for (const betAmount in this.queues.coinflip) {
            const q = this.queues.coinflip[betAmount];
            q.heads = q.heads.filter(p => p !== ws);
            q.tails = q.tails.filter(p => p !== ws);
        }
        for (const betAmount in this.queues.highcard) {
            this.queues.highcard[betAmount] = this.queues.highcard[betAmount].filter(p => p !== ws);
        }
    }
}

module.exports = MatchmakingManager;
