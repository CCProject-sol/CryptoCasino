const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const MatchmakingManager = require('./matchmaking');
const GameManager = require('./gameManager');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const gameManager = new GameManager();
const matchmakingManager = new MatchmakingManager(gameManager);

wss.on('connection', (ws) => {
    ws.id = uuidv4();
    console.log(`Client connected: ${ws.id}`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log(`Received from ${ws.id}:`, data);

            if (data.type === 'FIND_MATCH') {
                matchmakingManager.findMatch(ws, data.gameType, data.betAmount, data.side);
            } else if (data.type === 'CANCEL_MATCH') {
                matchmakingManager.removeFromQueue(ws);
                ws.send(JSON.stringify({ type: 'MATCH_CANCELLED' }));
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${ws.id}`);
        matchmakingManager.removeFromQueue(ws);
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
