const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch in Node 18+

const API_URL = 'http://localhost:3005/api';
const email = `test_${Date.now()}@example.com`;
const password = 'password123';

async function runTests() {
    console.log('--- Testing Email Authentication ---');

    // 1. Register
    console.log(`\n1. Registering new user: ${email}...`);
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.user) {
            console.log('SUCCESS: User registered', data.user.id);
        } else {
            console.error('FAILED:', data);
            process.exit(1);
        }
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }

    // 2. Login
    console.log(`\n2. Logging in with ${email}...`);
    try {
        const res = await fetch(`${API_URL}/auth/login-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.user) {
            console.log('SUCCESS: Logged in', data.user.id);
        } else {
            console.error('FAILED:', data);
            process.exit(1);
        }
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }

    // 3. Login with wrong password
    console.log('\n3. Testing wrong password...');
    try {
        const res = await fetch(`${API_URL}/auth/login-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'wrongpassword' })
        });
        const data = await res.json();

        if (res.status === 401) {
            console.log('SUCCESS: Login failed as expected');
        } else {
            console.error('FAILED: Should have returned 401', data);
            process.exit(1);
        }
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }

    console.log('\n--- Tests Completed ---');
}

runTests();
