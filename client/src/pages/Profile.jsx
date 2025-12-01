import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User, Wallet, Shield, Plus, Trash2, Star } from 'lucide-react';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [nickname, setNickname] = useState('');
    const [isEditingNickname, setIsEditingNickname] = useState(false);

    const fetchProfile = async () => {
        try {
            const data = await api.getProfile();
            setProfile(data);
            setNickname(data.user.nickname || '');
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdateNickname = async () => {
        try {
            await api.updateNickname(nickname);
            setIsEditingNickname(false);
            fetchProfile(); // Refresh
        } catch (err) {
            alert('Failed to update nickname: ' + (err.message || 'Unknown error'));
        }
    };

    const handleLinkWallet = async () => {
        try {
            if (!window.solana) return alert('Phantom not found');

            // Disconnect first to force account selection if needed, or just connect
            // Phantom doesn't easily support "switch account" programmatically without disconnecting
            // But if we call connect(), it might just return the current one.
            // User needs to switch in extension first.
            alert('Please switch to the new wallet in your Phantom extension, then click OK.');

            const response = await window.solana.connect();
            const publicKey = response.publicKey.toString();

            await api.linkWallet(publicKey);
            fetchProfile();
        } catch (err) {
            alert('Failed to link wallet: ' + (err.message || 'Unknown error'));
        }
    };

    const handleUnlinkWallet = async (address) => {
        if (!confirm('Are you sure you want to unlink this wallet?')) return;
        try {
            await api.unlinkWallet(address);
            fetchProfile();
        } catch (err) {
            alert('Failed to unlink: ' + (err.message || 'Unknown error'));
        }
    };

    const handleSetPrimary = async (address) => {
        try {
            await api.setPrimaryWallet(address);
            fetchProfile();
        } catch (err) {
            alert('Failed to set primary: ' + (err.message || 'Unknown error'));
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Loading...</div>;
    if (!profile) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Please connect your wallet.</div>;

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <h1 className="text-gradient" style={{ marginBottom: '40px' }}>Player Profile</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* User Info */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'var(--primary)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000'
                        }}>
                            <User size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nickname</div>
                            {isEditingNickname ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        style={{
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            color: 'white'
                                        }}
                                    />
                                    <button className="btn btn-primary" style={{ padding: '4px 12px' }} onClick={handleUpdateNickname}>Save</button>
                                </div>
                            ) : (
                                <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {profile.user.nickname || 'Anonymous'}
                                    <button
                                        onClick={() => setIsEditingNickname(true)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        (Edit)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Total Balance</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {(profile.user.balance / 1e9).toFixed(4)} SOL
                            </div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>User ID</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>#{profile.user.id}</div>
                        </div>
                    </div>
                </div>

                {/* Linked Wallets */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Wallet size={20} />
                            Linked Wallets
                        </h2>
                        <button className="btn btn-outline" onClick={handleLinkWallet} style={{ fontSize: '12px', padding: '8px 12px' }}>
                            <Plus size={14} /> Link New
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {profile.linkedWallets.map(wallet => (
                            <div key={wallet.wallet_address} style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '12px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: wallet.is_primary ? '1px solid var(--primary)' : '1px solid transparent'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-6)}
                                        {wallet.is_primary && <span style={{ fontSize: '10px', background: 'var(--primary)', color: 'black', padding: '2px 6px', borderRadius: '4px' }}>PRIMARY</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Added: {new Date(wallet.added_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {!wallet.is_primary && (
                                        <>
                                            <button
                                                onClick={() => handleSetPrimary(wallet.wallet_address)}
                                                title="Set as Primary"
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                            >
                                                <Star size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleUnlinkWallet(wallet.wallet_address)}
                                                title="Unlink"
                                                style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
