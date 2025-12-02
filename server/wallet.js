const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const nacl = require('tweetnacl');
const { db } = require('./db');

const CONNECTION_URL = 'https://api.devnet.solana.com'; // Use Devnet for now
const connection = new Connection(CONNECTION_URL, 'confirmed');

// Derive a child key pair from the mnemonic and index
const getDerivedKeyPair = async (index) => {
    const MNEMONIC = process.env.SERVER_WALLET_MNEMONIC;
    if (!MNEMONIC) {
        throw new Error('SERVER_WALLET_MNEMONIC is not set in .env');
    }
    const seed = await bip39.mnemonicToSeed(MNEMONIC);
    const path = `m/44'/501'/0'/${index}'`; // Standard Solana derivation path
    const derivedSeed = derivePath(path, seed.toString('hex')).key;
    const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed);
    return keyPair;
};

// Get public key for a user's deposit address index
const getUserDepositAddress = async (index) => {
    const keyPair = await getDerivedKeyPair(index);
    return new PublicKey(keyPair.publicKey).toString();
};

// Check for new deposits
const checkDeposits = async (broadcastUserUpdate) => {
    console.log('Checking for deposits...');

    // Get all users with their deposit address indices
    const users = db.prepare('SELECT id, deposit_address_index, balance FROM users').all();

    for (const user of users) {
        try {
            const address = await getUserDepositAddress(user.deposit_address_index);
            const pubKey = new PublicKey(address);

            // Get recent signatures for this address
            const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 5 });

            for (const sigInfo of signatures) {
                // Check if this tx is already processed
                const existingTx = db.prepare('SELECT id FROM transactions WHERE tx_hash = ?').get(sigInfo.signature);
                if (existingTx) continue;

                // Fetch transaction details
                const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });

                if (!tx || !tx.meta || tx.meta.err) continue;

                // Calculate amount received by this address
                const accountIndex = tx.transaction.message.accountKeys.findIndex(k => k.pubkey.toString() === address);
                if (accountIndex === -1) continue;

                const preBalance = tx.meta.preBalances[accountIndex];
                const postBalance = tx.meta.postBalances[accountIndex];
                const amountReceived = postBalance - preBalance;

                if (amountReceived > 0) {
                    console.log(`Deposit detected! User: ${user.id}, Amount: ${amountReceived} lamports, Tx: ${sigInfo.signature}`);

                    // Atomic update
                    const updateTx = db.transaction(() => {
                        db.prepare('INSERT INTO transactions (user_id, type, amount, tx_hash, status) VALUES (?, ?, ?, ?, ?)').run(user.id, 'DEPOSIT', amountReceived, sigInfo.signature, 'COMPLETED');
                        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amountReceived, user.id);
                    });
                    updateTx();

                    // Broadcast update
                    if (broadcastUserUpdate) {
                        broadcastUserUpdate(user.id);
                    }
                }
            }
        } catch (err) {
            console.error(`Error checking deposits for user ${user.id}:`, err);
        }
    }
};

// Start the deposit listener loop
const startDepositListener = (broadcastUserUpdate) => {
    setInterval(() => checkDeposits(broadcastUserUpdate), 30000); // Check every 30 seconds
};

module.exports = { getUserDepositAddress, startDepositListener, connection, getDerivedKeyPair };
