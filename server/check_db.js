const Database = require('better-sqlite3');
const db = new Database('casino.db');

console.log('--- Checking DB Schema ---');

try {
    const usersInfo = db.prepare('PRAGMA table_info(users)').all();
    console.log('Users Table Columns:', usersInfo.map(c => c.name).join(', '));
} catch (e) {
    console.log('Error checking users table:', e.message);
}

try {
    const linkedInfo = db.prepare('PRAGMA table_info(linked_wallets)').all();
    console.log('Linked Wallets Table Columns:', linkedInfo.map(c => c.name).join(', '));
} catch (e) {
    console.log('Error checking linked_wallets table:', e.message);
}

try {
    const wallets = db.prepare('SELECT * FROM linked_wallets').all();
    console.log('Linked Wallets Count:', wallets.length);
} catch (e) {
    console.log('Error querying linked_wallets:', e.message);
}
