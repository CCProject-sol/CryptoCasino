// const { db } = require('./db');
// const request = require('supertest');
// Actually, let's use a standalone script that uses fetch against the running server.

// const fetch = require('node-fetch'); // Using native fetch in Node 22

const API_URL = 'http://localhost:3005/api';
let user1Token = '';
let user1Id = '';
const wallet1 = 'Wallet1_' + Date.now();
const wallet2 = 'Wallet2_' + Date.now();
const wallet3 = 'Wallet3_' + Date.now();

async function runTests() {
    console.log('--- Starting Extended Auth Tests ---');

    // 1. Register User 1
    console.log(`\n1. Registering User 1 with ${wallet1}...`);
    let res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: wallet1 })
    });
    let data = await res.json();
    if (data.user) {
        console.log('SUCCESS: User registered', data.user.id);
        user1Id = data.user.id;
        user1Token = data.user.id.toString(); // Mock token (x-user-id)
    } else {
        console.error('FAILED:', data);
        return;
    }

    // 2. Set Nickname
    console.log(`\n2. Setting Nickname for User 1...`);
    res = await fetch(`${API_URL}/user/nickname`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': user1Token
        },
        body: JSON.stringify({ nickname: 'User_' + Date.now() })
    });
    data = await res.json();
    if (data.success) {
        console.log('SUCCESS: Nickname set to', data.nickname);
    } else {
        console.error('FAILED:', data);
    }

    // 3. Link Wallet 2
    console.log(`\n3. Linking Wallet 2 (${wallet2})...`);
    res = await fetch(`${API_URL}/auth/link-wallet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': user1Token
        },
        body: JSON.stringify({ publicKey: wallet2 })
    });
    data = await res.json();
    if (data.success) {
        console.log('SUCCESS: Wallet 2 linked');
    } else {
        console.error('FAILED:', data);
    }

    // 4. Verify Profile
    console.log(`\n4. Verifying Profile...`);
    res = await fetch(`${API_URL}/user/profile`, {
        headers: { 'x-user-id': user1Token }
    });
    data = await res.json();
    if (data.linkedWallets && data.linkedWallets.length === 2) {
        console.log('SUCCESS: Profile shows 2 linked wallets');
        data.linkedWallets.forEach(w => console.log(` - ${w.wallet_address} (Primary: ${w.is_primary})`));
    } else {
        console.error('FAILED: Incorrect wallet count', data);
    }

    // 5. Login with Wallet 2 (Should return User 1)
    console.log(`\n5. Logging in with Wallet 2...`);
    res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: wallet2 })
    });
    data = await res.json();
    if (data.user && data.user.id === user1Id) {
        console.log('SUCCESS: Logged in as User 1 using Wallet 2');
    } else {
        console.error('FAILED: Did not log in as User 1', data);
    }

    // 6. Set Wallet 2 as Primary
    console.log(`\n6. Setting Wallet 2 as Primary...`);
    res = await fetch(`${API_URL}/auth/set-primary-wallet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': user1Token
        },
        body: JSON.stringify({ publicKey: wallet2 })
    });
    data = await res.json();
    if (data.success) {
        console.log('SUCCESS: Wallet 2 set as primary');
    } else {
        console.error('FAILED:', data);
    }

    // 7. Unlink Wallet 1
    console.log(`\n7. Unlinking Wallet 1...`);
    res = await fetch(`${API_URL}/auth/unlink-wallet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': user1Token
        },
        body: JSON.stringify({ publicKey: wallet1 })
    });
    data = await res.json();
    if (data.success) {
        console.log('SUCCESS: Wallet 1 unlinked');
    } else {
        console.error('FAILED:', data);
    }

    console.log('\n--- Tests Completed ---');
}

runTests().catch(console.error);
