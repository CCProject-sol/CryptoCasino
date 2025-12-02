import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { User, Wallet, Shield, Plus, Trash2, Star, CheckCircle, AlertCircle, History, ArrowUpRight, ArrowDownLeft, Trophy, Gamepad2, Edit2 } from 'lucide-react';
import EditProfileModal from '../components/EditProfileModal';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const showNotification = useCallback((type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const data = await api.getProfile();
            setProfile(data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            showNotification('error', 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleLinkWallet = async () => {
        try {
            if (!window.solana || !window.solana.isPhantom) {
                showNotification('error', 'Phantom wallet is not installed!');
                window.open('https://phantom.app/', '_blank');
                return;
            }

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

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                profile={profile}
                onUpdate={fetchProfile}
            />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['overview', 'wallets', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '12px 24px',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500',
                            transition: 'all 0.3s',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'wallets' ? 'Manage Wallets' : tab === 'history' ? 'Transaction History' : tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                background: profile.user.avatar_url ? `url(${profile.user.avatar_url}) center/cover` : 'var(--primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000',
                                border: '2px solid var(--primary)'
                            }}>
                                {!profile.user.avatar_url && <User size={48} />}
                            </div>
                        </div>

                        {/* Nickname & Info */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nickname</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {profile.user.nickname || 'Anonymous'}
                            </div>
                            <button
                                className="btn btn-outline"
                                style={{ marginTop: '12px', padding: '6px 12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <Edit2 size={16} /> Edit Profile
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Total Balance</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {(profile.user.balance / 1e9).toFixed(4)} SOL
                            </div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>User ID</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>#{profile.user.id}</div>
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
            )}

            {activeTab === 'wallets' && (
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

            {activeTab === 'history' && (
                <div className="card">
                    <h2 style={{ fontSize: '20px', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History size={20} />
                        Transaction History
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(!profile.recentTransactions || profile.recentTransactions.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                No transactions found.
                            </div>
                        )}
                        {profile.recentTransactions?.map((tx, i) => (
                            <div key={i} style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '16px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: tx.type === 'DEPOSIT' || tx.type === 'WIN' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                                        color: tx.type === 'DEPOSIT' || tx.type === 'WIN' ? '#00ff00' : '#ff0000',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {tx.type === 'DEPOSIT' && <ArrowDownLeft size={20} />}
                                        {tx.type === 'WITHDRAWAL' && <ArrowUpRight size={20} />}
                                        {tx.type === 'WIN' && <Trophy size={20} />}
                                        {tx.type === 'BET' && <Gamepad2 size={20} />}
                                        {tx.type === 'REFUND' && <History size={20} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{tx.type}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(tx.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        color: tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'REFUND' ? '#00ff00' : '#ff0000'
                                    }}>
                                        {tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'REFUND' ? '+' : '-'}{(tx.amount / 1e9).toFixed(4)} SOL
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {tx.status}
                                    </div>
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
