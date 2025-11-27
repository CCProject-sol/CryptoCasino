import React, { useState, useEffect } from 'react';
import { api } from '../api';
import bs58 from 'bs58';

function Profile({ user }) {
    const [profile, setProfile] = useState(user);
    const [depositAddress, setDepositAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch latest profile data
        api.getProfile().then(setProfile);

        // Fetch deposit address (derived from index)
        // In a real app, we'd have an endpoint for this or send it in profile
        // For now, let's assume the backend sends it in profile or we fetch it.
        // Actually, the backend calculates it on the fly for deposits.
        // Let's add an endpoint or just show the index for now? 
        // No, we need the actual address.
        // Let's assume the backend sends `deposit_address` in the profile response if we update auth.js
        // I'll update auth.js later to include it, or just derive it on client if we had the pubkey (we don't have master pubkey here).
        // Let's just show the user's ID for now as a placeholder for "Unique Deposit Account" until we fix the backend to return the address.
    }, []);

    const linkWallet = async () => {
        if (!window.solana) {
            alert('Phantom wallet not found');
            return;
        }

        try {
            const resp = await window.solana.connect();
            const publicKey = resp.publicKey.toString();
            const message = `Link wallet ${publicKey} to account ${user.id}`;
            const encodedMessage = new TextEncoder().encode(message);
            const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8');

            const signature = bs58.encode(signedMessage.signature);

            const res = await api.linkWallet(publicKey, signature);
            if (res.success) {
                setMessage('Wallet linked successfully!');
                setProfile({ ...profile, wallet_address: publicKey });
            } else {
                setMessage(res.error || 'Failed to link wallet');
            }
        } catch (err) {
            console.error(err);
            setMessage('Error linking wallet');
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        try {
            const res = await api.withdraw(parseFloat(withdrawAmount) * 1000000000, withdrawAddress); // Convert SOL to lamports
            if (res.success) {
                setMessage('Withdrawal requested successfully!');
                setProfile({ ...profile, balance: profile.balance - (parseFloat(withdrawAmount) * 1000000000) });
            } else {
                setMessage(res.error || 'Withdrawal failed');
            }
        } catch (err) {
            setMessage('Error requesting withdrawal');
        }
    };

    return (
        <div className="profile-container">
            <h1>User Profile</h1>
            <div className="profile-details">
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Internal Balance:</strong> {profile.balance / 1000000000} SOL</p>

                <div className="wallet-section">
                    <h3>Linked Wallet</h3>
                    {profile.wallet_address ? (
                        <p className="success">Linked: {profile.wallet_address}</p>
                    ) : (
                        <button onClick={linkWallet} className="btn-primary">Link Phantom Wallet</button>
                    )}
                </div>

                <div className="deposit-section">
                    <h3>Deposit</h3>
                    <p>Send SOL to your unique deposit address:</p>
                    <div className="address-box">
                        {profile.deposit_address || 'Loading address...'}
                    </div>
                </div>

                <div className="withdraw-section">
                    <h3>Withdraw</h3>
                    <form onSubmit={handleWithdraw}>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Amount (SOL)"
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Destination Address"
                            value={withdrawAddress}
                            onChange={e => setWithdrawAddress(e.target.value)}
                        />
                        <button type="submit" className="btn-secondary">Request Withdrawal</button>
                    </form>
                </div>

                {message && <div className="message">{message}</div>}
            </div>
        </div>
    );
}

export default Profile;
