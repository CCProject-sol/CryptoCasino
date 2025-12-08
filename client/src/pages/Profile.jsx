import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { api } from '../api';
import { User, Wallet, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Profile = () => {
    const { user, token, wallets } = useUser();
    const [nickname, setNickname] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (user) {
            setNickname(user.nickname || '');
            loadTransactions();
        }
    }, [user, page]);

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {wallets.map((wallet, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                                        {wallet.address}
                                    </div>
                                    {wallet.isPrimary && (
                                        <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>
                                            Primary Wallet
                                        </div>
                                    )}
                                </div>
                            </div>
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
        </div>
    );
};

export default Profile;
