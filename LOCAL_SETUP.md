# Local Development Environment Setup

## Server Environment Variables (server/.env)

Your server `.env` file should now include:

```env
# Server Configuration
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_in_prod
SERVER_WALLET_MNEMONIC="test test test test test test test test test test test junk"
ADMIN_PASSWORD=admin123

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Game Mode Configuration
TEST_MODE=true  # ← ADDED FOR TESTING
```

## How It Works

### Test Mode (Current Setup)
- **TEST_MODE=true** enables single-player testing
- Games start instantly without waiting for an opponent
- Uses `test_balance` instead of real SOL
- Yellow "TEST MODE" banner appears on game pages
- Server logs: "🧪 TEST MODE ENABLED"

### Production Mode (For Later)
To switch to production PVP mode:
1. Change `TEST_MODE=true` to `TEST_MODE=false`
2. Or remove the `TEST_MODE` line entirely
3. Restart your server
4. Server logs: "🎮 PRODUCTION MODE ENABLED"

## Client Environment (.env in client folder)

Your client `.env` file is separate and handles different settings:
```env
VITE_WS_URL=ws://localhost:3001
```

**No changes needed!** The client `.env` file only controls the WebSocket URL and doesn't interfere with TEST_MODE.

## Testing Your Setup

1. **Start the server**:
   ```bash
   cd server
   npm start
   ```

2. **Check the console** - You should see:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🧪 TEST MODE ENABLED
      Environment: development
      Game Mode: Single-player with test balance
      Real SOL transactions: DISABLED
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

3. **Set test balance** (in a new terminal):
   ```bash
   curl -X POST http://localhost:3000/api/admin/set-test-balance \
     -H "Content-Type: application/json" \
     -H "x-admin-secret: admin123" \
     -d "{\"userId\": 1, \"amount\": 10}"
   ```

4. **Play a game**:
   - Start your client (`cd client && npm run dev`)
   - Login to the app
   - Navigate to CoinFlip
   - You should see a yellow "TEST MODE" banner
   - Click "Find Match" → Game starts instantly!
   - Check your test balance updates

## Switching Between Modes

### Switch to Production Mode:
```env
TEST_MODE=false
```
Then restart server: Games require 2 players (PVP)

### Switch back to Test Mode:
```env
TEST_MODE=true
```
Then restart server: Games are single-player

## Troubleshooting

**Problem**: Test mode not working
- ✓ Check `.env` file has `TEST_MODE=true`
- ✓ Restart the server (`Ctrl+C`, then `npm start`)
- ✓ Clear browser cache
- ✓ Check server console for test mode message

**Problem**: Don't see the banner
- ✓ Make sure you're logged in
- ✓ Check browser console for errors
- ✓ Verify server is running on port 3000

**Important Note**: The frontend `.env` file (with `VITE_WS_URL`) is completely separate and controls WebSocket connections only. It has no effect on TEST_MODE.
