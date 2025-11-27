const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

class CoinFlipGame {
    constructor() {
        this.activeGames = new Map();
    }

    createGame(userId, betAmount, side) {
        // Atomic Balance Check & Deduction
        let gameId;
        try {
            const result = db.transaction(() => {
                const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
                if (!user || user.balance < betAmount) {
                    throw new Error('Insufficient balance');
                }

                // Deduct bet
                db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(betAmount, userId);

                // Create Game Record
                const info = db.prepare('INSERT INTO game_sessions (game_type, player_1_id, bet_amount, status) VALUES (?, ?, ?, ?)').run('COIN_FLIP', userId, betAmount, 'ACTIVE');

                // Record Bet Transaction
                db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(userId, 'BET', betAmount, 'COMPLETED');

                return info.lastInsertRowid;
            })();
            gameId = result;
        } catch (err) {
            throw err;
        }

        // Play the game immediately (Single player vs House for now, or Matchmaking will call this)
        // For PvP, we wait. But the prompt implies "Multiplayer" AND "Coin Flip". 
        // If it's PvP Coin Flip, we need a second player.
        // If it's PvHouse, we resolve immediately.
        // The prompt says "Multiplayer", so let's assume PvP.

        this.activeGames.set(gameId, {
            id: gameId,
            player1: { id: userId, side, betAmount },
            status: 'WAITING_FOR_OPPONENT'
        });

        return gameId;
    }

    // Called by Matchmaking when a match is found
    startGame(gameId, player1Id, player2Id, betAmount) {
        // Logic handled in matchmaking mostly, but here we resolve the flip
        const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';

        // Determine winner
        // We need to know who picked what. 
        // In a simple PvP flip, Player 1 picks Side, Player 2 gets the other.

        // This logic should be called AFTER both players have bet.
        // Let's assume Matchmaking handles the "locking" of funds for both players.

        return result;
    }

    // Simple PvHouse version for testing/fallback
    playPvHouse(userId, betAmount, side) {
        // Atomic Balance Check & Deduction
        let result;
        try {
            result = db.transaction(() => {
                const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
                if (!user || user.balance < betAmount) {
                    throw new Error('Insufficient balance');
                }

                // Deduct bet
                db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(betAmount, userId);

                // Flip
                const outcome = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
                const won = outcome === side;
                const payout = won ? betAmount * 2 : 0;

                // Update Balance if won
                if (won) {
                    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(payout, userId);
                    db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(userId, 'WIN', payout, 'COMPLETED');
                }

                // Record Game
                db.prepare('INSERT INTO game_sessions (game_type, player_1_id, bet_amount, winner_id, status) VALUES (?, ?, ?, ?, ?)').run('COIN_FLIP', userId, betAmount, won ? userId : null, 'COMPLETED');

                return { outcome, won, payout, newBalance: user.balance - betAmount + payout };
            })();
        } catch (err) {
            throw err;
        }
        return result;
    }
}

module.exports = new CoinFlipGame();
