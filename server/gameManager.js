const { v4: uuidv4 } = require('uuid');

class GameManager {
    constructor(db, broadcastUserUpdate) {
        this.activeGames = new Map();
        this.db = db;
        this.broadcastUserUpdate = broadcastUserUpdate;
    }

    createGame(gameType, players, betAmount, metadata = {}) {
        const gameId = uuidv4();
        const betLamports = Math.floor(parseFloat(betAmount) * 1e9); // Convert SOL to lamports

        // Deduct balance from all players atomically
        try {
            const deductTx = this.db.transaction(() => {
                players.forEach(p => {
                    const user = this.db.prepare('SELECT balance FROM users WHERE id = ?').get(p.user.id);
                    if (user.balance < betLamports) {
                        throw new Error(`User ${p.user.id} insufficient balance`);
                    }
                    this.db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(betLamports, p.user.id);
                    this.db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(p.user.id, 'BET', betLamports, 'COMPLETED');
                });
            });
            deductTx();
        } catch (err) {
            console.error('Failed to create game due to balance error:', err);
            players.forEach(p => p.send(JSON.stringify({ type: 'ERROR', message: 'Insufficient balance or error creating game' })));
            return;
        }

        // Broadcast balance updates
        players.forEach(p => this.broadcastUserUpdate(p.user.id));

        const game = {
            id: gameId,
            type: gameType,
            players: players,
            betAmount: betAmount,
            betLamports: betLamports,
            metadata: metadata,
            startTime: Date.now()
        };

        this.activeGames.set(gameId, game);

        // Notify players match is found
        players.forEach(p => {
            p.send(JSON.stringify({
                type: 'MATCH_FOUND',
                gameId: gameId,
                opponentId: players.find(op => op !== p).user.id // Use user.id from ws.user
            }));
        });

        // Start the game logic
        if (gameType === 'coinflip') {
            this.runCoinFlip(game);
        } else if (gameType === 'highcard') {
            this.runHighCard(game);
        }
    }

    runCoinFlip(game) {
        // Simulate a short delay for "flipping"
        setTimeout(() => {
            const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
            // Note: players are WebSocket objects with .user attached
            const winner = game.players.find(p => game.metadata[p.user.id] === outcome);
            const loser = game.players.find(p => p !== winner);

            const winAmountLamports = game.betLamports * 2; // Simple 2x payout for now (no house edge yet)

            if (winner) {
                // Update DB for the winner
                const winTx = this.db.transaction(() => {
                    this.db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(winAmountLamports, winner.user.id);
                    this.db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(winner.user.id, 'WIN', winAmountLamports, 'COMPLETED');
                });
                winTx();
                this.broadcastUserUpdate(winner.user.id);

                const resultData = {
                    type: 'GAME_RESULT',
                    gameType: 'coinflip',
                    outcome: outcome,
                    winAmount: parseFloat(game.betAmount) * 2,
                    winnerId: winner.user.id
                };

                winner.send(JSON.stringify({ ...resultData, result: 'win' }));
                if (loser) loser.send(JSON.stringify({ ...resultData, result: 'lose' }));

            } else {
                // No winner, it's a draw. Refund bets.
                const refundTx = this.db.transaction(() => {
                    game.players.forEach(p => {
                        this.db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(game.betLamports, p.user.id);
                        this.db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(p.user.id, 'REFUND', game.betLamports, 'COMPLETED');
                    });
                });
                refundTx();
                game.players.forEach(p => this.broadcastUserUpdate(p.user.id));

                const resultData = {
                    type: 'GAME_RESULT',
                    gameType: 'coinflip',
                    outcome: outcome,
                    winAmount: 0,
                    winnerId: null,
                    result: 'draw'
                };

                game.players.forEach(p => p.send(JSON.stringify(resultData)));
            }

            this.activeGames.delete(game.id);
        }, 2000);
    }

    runHighCard(game) {
        // Simulate dealing delay
        setTimeout(() => {
            const deck = this.createDeck();
            const shuffled = this.shuffleDeck(deck);

            const p1 = game.players[0];
            const p2 = game.players[1];

            const c1 = shuffled.pop();
            const c2 = shuffled.pop();

            let winnerId = null;
            if (c1.value > c2.value) winnerId = p1.user.id;
            else if (c2.value > c1.value) winnerId = p2.user.id;
            // Draw is possible

            const winAmountLamports = game.betLamports * 2;

            if (winnerId) {
                const winner = game.players.find(p => p.user.id === winnerId);
                const winTx = this.db.transaction(() => {
                    this.db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(winAmountLamports, winner.user.id);
                    this.db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(winner.user.id, 'WIN', winAmountLamports, 'COMPLETED');
                });
                winTx();
                this.broadcastUserUpdate(winner.user.id);
            } else {
                // Draw - refund bets
                const refundTx = this.db.transaction(() => {
                    game.players.forEach(p => {
                        this.db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(game.betLamports, p.user.id);
                        this.db.prepare('INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)').run(p.user.id, 'REFUND', game.betLamports, 'COMPLETED');
                    });
                });
                refundTx();
                game.players.forEach(p => this.broadcastUserUpdate(p.user.id));
            }

            const baseResult = {
                type: 'GAME_RESULT',
                gameType: 'highcard',
                winAmount: parseFloat(game.betAmount) * 2
            };

            // Send P1 result
            p1.send(JSON.stringify({
                ...baseResult,
                myCard: c1,
                opponentCard: c2,
                result: winnerId === p1.user.id ? 'win' : (winnerId === null ? 'draw' : 'lose')
            }));

            // Send P2 result
            p2.send(JSON.stringify({
                ...baseResult,
                myCard: c2,
                opponentCard: c1,
                result: winnerId === p2.user.id ? 'win' : (winnerId === null ? 'draw' : 'lose')
            }));

            this.activeGames.delete(game.id);
        }, 1000);
    }

    // Helper methods for HighCard
    createDeck() {
        const suits = ['hearts', 'diamonds', 'spades', 'clubs'];
        const ranks = [
            { name: '2', value: 2 }, { name: '3', value: 3 }, { name: '4', value: 4 },
            { name: '5', value: 5 }, { name: '6', value: 6 }, { name: '7', value: 7 },
            { name: '8', value: 8 }, { name: '9', value: 9 }, { name: '10', value: 10 },
            { name: 'J', value: 11 }, { name: 'Q', value: 12 }, { name: 'K', value: 13 },
            { name: 'A', value: 14 }
        ];
        const deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ ...rank, suit });
            }
        }
        return deck;
    }

    shuffleDeck(deck) {
        const newDeck = [...deck];
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        return newDeck;
    }
}

module.exports = GameManager;
