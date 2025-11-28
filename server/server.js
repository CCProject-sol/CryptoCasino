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

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all for now, restrict in prod
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const passport = require('passport');
app.use(passport.initialize());

// Routes
const { router: authRouter } = require('./auth');
const withdrawalRouter = require('./withdraw');
const { startDepositListener } = require('./wallet');

app.use('/api/auth', authRouter);
app.use('/api', withdrawalRouter);

// Start background services
startDepositListener();

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const gameManager = new GameManager();
const matchmakingManager = new MatchmakingManager(gameManager);

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

wss.on('connection', (ws, req) => {
    // Parse Token from URL (e.g., ?token=...)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
        ws.close(1008, 'Token required');
        return;
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        ws.user = user; // Attach user to WS
        ws.id = uuidv4();
        console.log(`Client connected: ${ws.id} (User: ${user.id})`);
    } catch (err) {
        ws.close(1008, 'Invalid token');
        return;
    }

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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Server] Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`SERVER_URL: ${process.env.SERVER_URL || 'http://localhost:3000'}`);
    console.log(`CLIENT_URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
