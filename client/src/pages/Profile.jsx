import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { api } from '../api';
import { User, Wallet, Clock, CheckCircle, XCircle, AlertCircle, Star, Trash2 } from 'lucide-react';

// Wallet Card Component
const WalletCard = ({ wallet, onSetPrimary, onDisconnect }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    const truncateAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

    return (
        <>
            <div style={{
                padding: '20px',
                background: wallet.isPrimary
                    ? 'linear-gradient(135deg, rgba(77, 255, 148, 0.1), rgba(77, 255, 148, 0.05))'
                    : 'rgba(255,255,255,0.03)',
                border: wallet.isPrimary
                    ? '1px solid rgba(77, 255, 148, 0.3)'
                    : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: 'default'
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                {wallet.isPrimary && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#4dff94',
                        fontWeight: '600',
                        background: 'rgba(77, 255, 148, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                    }}>
                        <Star size={14} fill="#4dff94" />
                        PRIMARY
                    </div>
                )}

                <div style={{ marginBottom: '16px', marginTop: wallet.isPrimary ? '20px' : '0' }}>
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Wallet Address
                    </div>
                    <div style={{
                        fontFamily: 'monospace',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: wallet.isPrimary ? '#4dff94' : 'white'
                    }}>
                        {truncateAddress(wallet.address)}
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                        fontFamily: 'monospace'
                    }}>
                        {wallet.address}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    {!wallet.isPrimary && (
                        <button
                            onClick={onSetPrimary}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: 'rgba(77, 255, 148, 0.1)',
                                border: '1px solid rgba(77, 255, 148, 0.3)',
                                borderRadius: '8px',
                                color: '#4dff94',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(77, 255, 148, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(77, 255, 148, 0.1)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <Star size={16} />
                            Set as Primary
                        </button>
                    )}
                    <button
                        onClick={() => setShowConfirm(true)}
                        style={{
                            flex: wallet.isPrimary ? 1 : 0,
                            padding: '10px',
                            background: 'rgba(255, 77, 77, 0.1)',
                            border: '1px solid rgba(255, 77, 77, 0.3)',
                            borderRadius: '8px',
                            color: '#ff4d4d',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            minWidth: wallet.isPrimary ? 'auto' : '44px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 77, 77, 0.2)';
                            e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <Trash2 size={16} />
                        {wallet.isPrimary && 'Disconnect'}
                    </button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1b23',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Confirm Disconnect</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
                            Are you sure you want to disconnect this wallet?
                            {wallet.isPrimary && ' Another wallet will automatically be set as primary.'}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="btn"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    onDisconnect();
                                }}
                                className="btn"
                                style={{
                                    flex: 1,
                                    background: 'rgba(255, 77, 77, 0.2)',
                                    border: '1px solid rgba(255, 77, 77, 0.4)',
                                    color: '#ff4d4d'
                                }}
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const Profile = () => {
    const { user, token, wallets, setPrimaryWallet, removeWallet, refreshWallets } = useUser();
    const [nickname, setNickname] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [toast, setToast] = useState(null);

    // Toast helper
    const showToast = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (user) {
            setNickname(user.nickname || '');
            loadTransactions();
            refreshWallets();
        }
    }, [user, page]);

    const handleSetPrimary = async (address) => {
        try {
            await setPrimaryWallet(address);
            showToast('Primary wallet updated!', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to set primary wallet', 'error');
        }
    };

    const handleDisconnect = async (address) => {
        try {
            await removeWallet(address);
            showToast('Wallet disconnected successfully', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to disconnect wallet', 'error');
        }
    };

    const loadTransactions = async () => {
        try {
            const response = await api.request(`/api/profile/transactions?page=${page}&limit=10`, 'GET', null, token);
            setTransactions(response.transactions);
            setTotalPages(response.pagination.totalPages);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load transactions:', err);
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setMessage('');

        try {
            await api.request('/api/profile/update', 'PATCH', { nickname }, token);
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle size={16} color="#4dff94" />;
            case 'PENDING':
                return <Clock size={16} color="#ffc107" />;
            case 'FAILED':
                return <XCircle size={16} color="#ff4d4d" />;
            default:
                return <AlertCircle size={16} color="#888" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'DEPOSIT':
                return '#4dff94';
            case 'WITHDRAWAL':
                return '#ff4d4d';
            case 'WIN':
                return '#00bfff';
            case 'LOSS':
                return '#ff8c00';
            default:
                return '#888';
        }
    };

    if (!user) {
        return (
            <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <h2>Please login to view your profile</h2>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px' }}>
            <h1 style={{ marginBottom: '32px' }}>Profile</h1>

            {/* Profile Info */}
            <div style={{
                background: '#1a1b23',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={24} />
                    Profile Information
                </h2>

                <form onSubmit={handleUpdateProfile}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Email
                        </label>
                        <input
                            type="text"
                            value={user.email}
                            disabled
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'var(--text-muted)',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Nickname
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Enter nickname"
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Balance
                        </label>
                        <div style={{
                            padding: '12px',
                            background: 'rgba(77, 255, 148, 0.1)',
                            border: '1px solid rgba(77, 255, 148, 0.2)',
                            borderRadius: '8px',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#4dff94'
                        }}>
                            {(user.balance / 1e9).toFixed(4)} SOL
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Test Balance (for testing)
                        </label>
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255, 191, 0, 0.1)',
                            border: '1px solid rgba(255, 191, 0, 0.2)',
                            borderRadius: '8px',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#ffbf00'
                        }}>
                            {((user.testBalance || 0) / 1e9).toFixed(4)} SOL
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Use admin endpoint to set test balance
                        </div>
                    </div>

                    {message && (
                        <div style={{
                            padding: '12px',
                            background: message.includes('success') ? 'rgba(77, 255, 148, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                            border: `1px solid ${message.includes('success') ? 'rgba(77, 255, 148, 0.2)' : 'rgba(255, 77, 77, 0.2)'}`,
                            color: message.includes('success') ? '#4dff94' : '#ff4d4d',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={updating}
                        className="btn btn-primary"
                        style={{ opacity: updating ? 0.7 : 1 }}
                    >
                        {updating ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </div>

            {/* Wallets */}
            <div style={{
                background: '#1a1b23',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={24} />
                    Linked Wallets
                </h2>

                {wallets && wallets.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                        {wallets.map((wallet) => (
                            <WalletCard
                                key={wallet.address}
                                wallet={wallet}
                                onSetPrimary={() => handleSetPrimary(wallet.address)}
                                onDisconnect={() => handleDisconnect(wallet.address)}
                            />
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No wallets connected yet</p>
                )}
            </div>

            {/* Transaction History */}
            <div style={{
                background: '#1a1b23',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '24px'
            }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Transaction History</h2>

                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
                ) : transactions.length > 0 ? (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px' }}>Type</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px' }}>Amount</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px' }}>Date</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px' }}>Tx Hash</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ color: getTypeColor(tx.type), fontWeight: '600' }}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                                                {(tx.amount / 1e9).toFixed(4)} SOL
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {getStatusIcon(tx.status)}
                                                    {tx.status}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '12px', fontFamily: 'monospace' }}>
                                                {tx.txHash ? (
                                                    <a
                                                        href={`https://explorer.solana.com/tx/${tx.txHash}?cluster=devnet`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: 'var(--primary)', textDecoration: 'none' }}
                                                    >
                                                        {tx.txHash.slice(0, 8)}...
                                                    </a>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="btn"
                                    style={{
                                        opacity: page === 1 ? 0.5 : 1,
                                        cursor: page === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Previous
                                </button>
                                <div style={{ padding: '8px 16px', color: 'var(--text-muted)' }}>
                                    Page {page} of {totalPages}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="btn"
                                    style={{
                                        opacity: page === totalPages ? 0.5 : 1,
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
                )}
            </div>

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    background: toast.type === 'success'
                        ? 'linear-gradient(135deg, rgba(77, 255, 148, 0.2), rgba(77, 255, 148, 0.1))'
                        : 'linear-gradient(135deg, rgba(255, 77, 77, 0.2), rgba(255, 77, 77, 0.1))',
                    border: toast.type === 'success'
                        ? '1px solid rgba(77, 255, 148, 0.4)'
                        : '1px solid rgba(255, 77, 77, 0.4)',
                    color: toast.type === 'success' ? '#4dff94' : '#ff4d4d',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    zIndex: 10000,
                    fontSize: '14px',
                    fontWeight: '600',
                    animation: 'slideIn 0.3s ease',
                    maxWidth: '400px'
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default Profile;
