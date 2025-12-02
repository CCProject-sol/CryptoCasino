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


// Make broadcast available to routes (hacky but works for MVP)
app.set('broadcastUserUpdate', broadcastUserUpdate);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`SERVER_URL: ${process.env.SERVER_URL || 'http://localhost:3000'}`);
    console.log(`CLIENT_URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
