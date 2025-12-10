require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const url = require('url');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const multer = require('multer');
const fs = require('fs');

// Database and route imports
// Database and route imports
const db = require('./db');
const GameManager = require('./gameManager');
const MatchmakingManager = require('./matchmaking');
const { startDepositListener } = require('./wallet');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? true  // In production, allow same-origin (frontend served by same server)
        : (process.env.CLIENT_URL || 'http://localhost:5173'),
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })
app.set('upload', upload);

app.use('/uploads', express.static(uploadsDir));

// Routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const walletRouter = require('./routes/wallet');
app.use('/api/wallet', walletRouter);

const withdrawRouter = require('./withdraw');
app.use('/api/withdraw', withdrawRouter);

const profileRouter = require('./routes/profile');
app.use('/api/profile', profileRouter);

const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);



// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/dist');
    app.use(express.static(clientBuildPath));

    // Handle client-side routing - send all non-API requests to index.html
    app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// 404 Handler
app.use((req, res, next) => {
    console.log(`[404] Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not Found', path: req.url });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Server] Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Helper to broadcast user updates
const broadcastUserUpdate = (userId) => {
    const user = db.prepare('SELECT id, email, wallet_address, nickname, balance, avatar_url FROM users WHERE id = ?').get(userId);
    if (!user) return;

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.user && client.user.id === userId) {
            client.send(JSON.stringify({
                type: 'USER_UPDATE',
                user
            }));
        }
    });
};

// Start background services
startDepositListener(broadcastUserUpdate);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const gameManager = new GameManager(db, broadcastUserUpdate);
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
                matchmakingManager.findMatch(ws, data.gameType, data.betAmount, data.side, data.useTestBalance);
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


// Make broadcast available to routes (hacky but works for MVP)
app.set('broadcastUserUpdate', broadcastUserUpdate);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`SERVER_URL: ${process.env.SERVER_URL || 'http://localhost:3000'}`);
    console.log(`CLIENT_URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
