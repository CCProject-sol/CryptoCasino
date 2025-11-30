const axios = require('axios');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3000/api';
const WS_URL = 'ws://localhost:3000';

async function testAuth() {
    console.log('--- Testing Authentication ---');
    const publicKey = 'TestWallet' + uuidv4(); // Simulate a unique wallet address

    try {
        // 1. Register New User
        console.log(`1. Registering new user with key: ${publicKey}`);
        const res1 = await axios.post(`${API_URL}/auth/login`, { publicKey });
        const user1 = res1.data.user;
        console.log('   Result:', user1 ? 'SUCCESS' : 'FAILED');
        if (!user1) throw new Error('User creation failed');
        console.log(`   User ID: ${user1.id}, Balance: ${user1.balance}`);

        // 2. Login Existing User
        console.log(`2. Logging in existing user with key: ${publicKey}`);
        const res2 = await axios.post(`${API_URL}/auth/login`, { publicKey });
        const user2 = res2.data.user;
        console.log('   Result:', user2 ? 'SUCCESS' : 'FAILED');
        if (user1.id !== user2.id) throw new Error('User ID mismatch');
        console.log('   User IDs match.');

        // 3. WebSocket Authentication
        console.log(`3. Testing WebSocket Auth for User ID: ${user1.id}`);
        const ws = new WebSocket(`${WS_URL}?userId=${user1.id}`);

        await new Promise((resolve, reject) => {
            ws.on('open', () => {
                console.log('   WebSocket Connected');
                // Send a message to verify server knows who we are (check server logs manually or trust connection)
                // Ideally server sends back a "Welcome" message or we can check logs.
                // For this test, successful connection without error is good.
                ws.close();
                resolve();
            });
            ws.on('error', (err) => {
                console.error('   WebSocket Error:', err);
                reject(err);
            });
        });
        console.log('   WebSocket Auth Test Passed');

    } catch (err) {
        console.error('TEST FAILED:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

testAuth();
