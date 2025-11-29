const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const MatchmakingManager = require('./matchmaking');
const GameManager = require('./gameManager');
const { router: authRouter } = require('./auth');
const withdrawalRouter = require('./withdraw');
const { startDepositListener } = require('./wallet');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

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

// Passport
app.use(passport.initialize());

// Serve Static Files (React App)
// This must come BEFORE API routes if we want to serve assets, 
// but usually we want API routes to take precedence if there's a name collision.
// However, for /api prefix, there is no collision.
app.use(express.static(path.join(__dirname, '../client/dist')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api', withdrawalRouter);

// SPA Fallback (Must be after API routes, before 404 handler)
// Serves index.html for any non-API route that wasn't found in static files
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

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`SERVER_URL: ${process.env.SERVER_URL || 'http://localhost:3000'}`);
    console.log(`CLIENT_URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
