const { v4: uuidv4 } = require('uuid');

class GameManager {
    constructor() {
        this.activeGames = new Map();
    }

    createGame(gameType, players, betAmount, metadata = {}) {
        const gameId = uuidv4();
        const game = {
            id: gameId,
            type: gameType,
            players: players,
            betAmount: betAmount,
            metadata: metadata,
            startTime: Date.now()
        };

        this.activeGames.set(gameId, game);

        // Notify players match is found
        players.forEach(p => {
            p.send(JSON.stringify({
                type: 'MATCH_FOUND',
                gameId: gameId,
                opponentId: players.find(op => op !== p).id
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
            const winner = game.players.find(p => game.metadata[p.id] === outcome);
            const loser = game.players.find(p => p !== winner);

            const resultData = {
                type: 'GAME_RESULT',
                gameType: 'coinflip',
                outcome: outcome,
                winAmount: parseFloat(game.betAmount),
                winnerId: winner.id
            };

            // Send results
            winner.send(JSON.stringify({ ...resultData, result: 'win' }));
            loser.send(JSON.stringify({ ...resultData, result: 'lose' }));

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
            if (c1.value > c2.value) winnerId = p1.id;
            else if (c2.value > c1.value) winnerId = p2.id;
            // Draw is possible

            const baseResult = {
                type: 'GAME_RESULT',
                gameType: 'highcard',
                winAmount: parseFloat(game.betAmount)
            };

            // Send P1 result
            p1.send(JSON.stringify({
                ...baseResult,
                myCard: c1,
                opponentCard: c2,
                result: winnerId === p1.id ? 'win' : (winnerId === null ? 'draw' : 'lose')
            }));

            // Send P2 result
            p2.send(JSON.stringify({
                ...baseResult,
                myCard: c2,
                opponentCard: c1,
                result: winnerId === p2.id ? 'win' : (winnerId === null ? 'draw' : 'lose')
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
