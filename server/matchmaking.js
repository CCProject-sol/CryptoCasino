class MatchmakingManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        // Queues structure:
        // {
        //   coinflip: {
        //     '0.001': { heads: [], tails: [] },
        //     '0.01': { heads: [], tails: [] }
        //   },
        //   highcard: {
        //     '0.001': [],
        //     '0.01': []
        //   }
        // }
        this.queues = {
            coinflip: {},
            highcard: {}
        };
    }

    findMatch(ws, gameType, betAmount, side = null) {
        console.log(`Player looking for match: ${gameType} ${betAmount} ${side || ''}`);

        if (gameType === 'coinflip') {
            return this.handleCoinFlipMatch(ws, betAmount, side);
        } else if (gameType === 'highcard') {
            return this.handleHighCardMatch(ws, betAmount);
        }
    }

    handleCoinFlipMatch(ws, betAmount, side) {
        if (!this.queues.coinflip[betAmount]) {
            this.queues.coinflip[betAmount] = { heads: [], tails: [] };
        }

        const queue = this.queues.coinflip[betAmount];
        const opponentSide = side === 'heads' ? 'tails' : 'heads';

        // Look for opponent in the opposite queue
        if (queue[opponentSide].length > 0) {
            const opponent = queue[opponentSide].shift();

            // Check if opponent is still connected
            if (opponent.readyState !== opponent.OPEN) {
                return this.handleCoinFlipMatch(ws, betAmount, side); // Retry
            }

            // Match found!
            this.gameManager.createGame('coinflip', [ws, opponent], betAmount, {
                [ws.id]: side,
                [opponent.id]: opponentSide
            });
            return true;
        } else {
            // No match, add to queue
            queue[side].push(ws);
            ws.send(JSON.stringify({ type: 'SEARCHING_MATCH' }));
            return false;
        }
    }

    handleHighCardMatch(ws, betAmount) {
        if (!this.queues.highcard[betAmount]) {
            this.queues.highcard[betAmount] = [];
        }

        const queue = this.queues.highcard[betAmount];

        if (queue.length > 0) {
            const opponent = queue.shift();

            if (opponent.readyState !== opponent.OPEN) {
                return this.handleHighCardMatch(ws, betAmount);
            }

            this.gameManager.createGame('highcard', [ws, opponent], betAmount);
            return true;
        } else {
            queue.push(ws);
            ws.send(JSON.stringify({ type: 'SEARCHING_MATCH' }));
            return false;
        }
    }

    removeFromQueue(ws) {
        // Helper to remove a disconnected player from all queues
        // This is a bit inefficient, but works for now. 
        // In a production app, we'd map player IDs to queues.

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
