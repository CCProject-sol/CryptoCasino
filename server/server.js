const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

const MatchmakingManager = require('./matchmaking');
const GameManager = require('./gameManager');
const withdrawalRouter = require('./withdraw');
const { startDepositListener } = require('./wallet');

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

// Request Logging
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

// Serve Static Files (React App)
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes
// API Routes
const { router: authRouter } = require('./auth');
const url = require('url');

app.use('/api/auth', authRouter);
app.use('/api', withdrawalRouter);
app.use('/api', withdrawalRouter);

// SPA Fallback (Must be after API routes, before 404 handler)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 404 Handler (For API routes that fell through)
app.use((req, res, next) => {
    console.log(`[404] Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not Found', path: req.url });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Server] Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start background services
startDepositListener();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const gameManager = new GameManager();
const matchmakingManager = new MatchmakingManager(gameManager);

wss.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    const userId = parameters.query.userId;

    if (userId) {
        ws.user = { id: parseInt(userId) };
        ws.id = userId; // Use user ID as connection ID
        console.log(`Client connected: ${ws.id} (Authenticated)`);
    } else {
        ws.id = uuidv4();
        console.log(`Client connected: ${ws.id} (Guest)`);
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


server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`SERVER_URL: ${process.env.SERVER_URL || 'http://localhost:3000'}`);
    console.log(`CLIENT_URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
