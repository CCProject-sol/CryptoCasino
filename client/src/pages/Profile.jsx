import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User, Wallet, Shield, Plus, Trash2, Star, CheckCircle, AlertCircle } from 'lucide-react';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [nickname, setNickname] = useState('');
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

    const fetchProfile = async () => {
        try {
            const data = await api.getProfile();
            setProfile(data);
            setNickname(data.user.nickname || '');
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            showNotification('error', 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleUpdateNickname = async () => {
        try {
            await api.updateNickname(nickname);
            setIsEditingNickname(false);
            fetchProfile(); // Refresh
            showNotification('success', 'Nickname updated successfully');
        } catch (err) {
            showNotification('error', 'Failed to update nickname: ' + (err.message || 'Unknown error'));
        }
    };

    const handleLinkWallet = async () => {
        try {
            if (!window.solana || !window.solana.isPhantom) {
                showNotification('error', 'Phantom wallet is not installed!');
                window.open('https://phantom.app/', '_blank');
                return;
            }

            // Force disconnect to allow selecting a different wallet if needed
            // await window.solana.disconnect(); 
            // Note: Phantom behavior varies, sometimes disconnect() is needed to switch accounts

            alert('Please switch to the new wallet in your Phantom extension if needed, then click OK to connect.');

            const response = await window.solana.connect();
            const publicKey = response.publicKey.toString();

            // Sign message for verification
            const message = `Link wallet ${publicKey} to user ${profile.user.id}`;
            const encodedMessage = new TextEncoder().encode(message);
            await window.solana.signMessage(encodedMessage, 'utf8');

            await api.linkWallet(publicKey);
            fetchProfile();
            showNotification('success', 'Wallet linked successfully');
        } catch (err) {
            console.error('Link wallet failed:', err);
            showNotification('error', 'Failed to link wallet: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleUnlinkWallet = async (address) => {
        if (!confirm('Are you sure you want to unlink this wallet?')) return;
        try {
            await api.unlinkWallet(address);
            fetchProfile();
            showNotification('success', 'Wallet unlinked successfully');
        } catch (err) {
            showNotification('error', 'Failed to unlink: ' + (err.message || 'Unknown error'));
        }
    };

    const handleSetPrimary = async (address) => {
        try {
            await api.setPrimaryWallet(address);
            fetchProfile();
            showNotification('success', 'Primary wallet updated');
        } catch (err) {
            showNotification('error', 'Failed to set primary: ' + (err.message || 'Unknown error'));
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Loading...</div>;
    if (!profile) return <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>Please connect your wallet.</div>;

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <h1 className="text-gradient" style={{ marginBottom: '40px' }}>Player Profile</h1>

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: notification.type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                    border: `1px solid ${notification.type === 'success' ? '#00ff00' : '#ff0000'}`,
                    color: notification.type === 'success' ? '#00ff00' : '#ff0000',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)'
                }}>
                    {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {notification.message}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 24px',
                        color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                    }}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('wallets')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 24px',
                        color: activeTab === 'wallets' ? 'var(--primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'wallets' ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        transition: 'all 0.3s'
                    }}
                >
                    Manage Wallets
                </button>
            </div>

            {/* Content */}
            {activeTab === 'overview' ? (
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
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Email</div>
                            <div style={{ fontSize: '16px', fontWeight: '500' }}>{profile.user.email || 'N/A'}</div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Member Since</div>
                            <div style={{ fontSize: '16px', fontWeight: '500' }}>{new Date(profile.user.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Wallet size={20} />
                            Linked Wallets
                        </h2>
                        <button className="btn btn-outline" onClick={handleLinkWallet} style={{ fontSize: '12px', padding: '8px 12px' }}>
                            <Plus size={14} /> Link New Wallet
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {profile.linkedWallets.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                No wallets linked yet. Link a wallet to deposit and withdraw.
                            </div>
                        )}
                        {profile.linkedWallets.map(wallet => (
                            <div key={wallet.wallet_address} style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '16px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: wallet.is_primary ? '1px solid var(--primary)' : '1px solid transparent',
                                transition: 'all 0.2s'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-6)}
                                        {wallet.is_primary && (
                                            <span style={{
                                                fontSize: '10px',
                                                background: 'var(--primary)',
                                                color: 'black',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                PRIMARY
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Added: {new Date(wallet.added_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {!wallet.is_primary && (
                                        <>
                                            <button
                                                onClick={() => handleSetPrimary(wallet.wallet_address)}
                                                className="btn btn-outline"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                title="Set as Primary"
                                            >
                                                <Star size={14} style={{ marginRight: '6px' }} /> Set Primary
                                            </button>
                                            <button
                                                onClick={() => handleUnlinkWallet(wallet.wallet_address)}
                                                className="btn"
                                                style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.2)' }}
                                                title="Unlink"
                                            >
                                                <Trash2 size={14} style={{ marginRight: '6px' }} /> Unlink
                                            </button>
                                        </>
                                    )}
                                    {wallet.is_primary && (
                                        <div style={{ color: 'var(--primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Shield size={14} /> Active for Transactions
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
