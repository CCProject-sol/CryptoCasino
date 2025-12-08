import React, { useState } from 'react';
import { X, AlertCircle, DollarSign } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { api } from '../api';

const WithdrawModal = ({ isOpen, onClose }) => {
    const { user, token, wallets } = useUser();
    const [amount, setAmount] = useState('');
    const [selectedWallet, setSelectedWallet] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const NETWORK_FEE = 0.000005; // 5000 lamports (~0.000005 SOL)
    const MIN_WITHDRAWAL = 0.01;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const amountSol = parseFloat(amount);
        if (isNaN(amountSol) || amountSol <= 0) {
            setError('Invalid amount');
            return;
        }

        if (amountSol < MIN_WITHDRAWAL) {
            setError(`Minimum withdrawal is ${MIN_WITHDRAWAL} SOL`);
            return;
        }

        const amountLamports = Math.floor(amountSol * 1e9);
        const userBalance = user?.balance || 0;

        if (amountLamports > userBalance) {
            setError('Insufficient balance');
            return;
        }

        if (!selectedWallet) {
            setError('Please select a destination wallet');
            return;
        }

        setLoading(true);

        try {
            const response = await api.request('/api/withdraw/withdraw', 'POST', {
                amount: amountLamports,
                address: selectedWallet
            }, token);

            setSuccess('Withdrawal request submitted! Pending admin approval.');
            setAmount('');
            setSelectedWallet('');

            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 2000);
        } catch (err) {
            console.error('Withdrawal failed:', err);
            setError(err.message || 'Failed to submit withdrawal');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const availableBalance = (user?.balance || 0) / 1e9;
    const withdrawAmount = parseFloat(amount) || 0;
    const netAmount = withdrawAmount - NETWORK_FEE;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                background: '#1a1b23',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '450px',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ marginTop: 0, marginBottom: '24px', textAlign: 'center' }}>Withdraw SOL</h2>

                {error && (
                    <div style={{
                        background: 'rgba(255, 77, 77, 0.1)',
                        border: '1px solid rgba(255, 77, 77, 0.2)',
                        color: '#ff4d4d',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        background: 'rgba(77, 255, 148, 0.1)',
                        border: '1px solid rgba(77, 255, 148, 0.2)',
                        color: '#4dff94',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                    }}>
                        <AlertCircle size={16} />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Available Balance */}
                    <div style={{
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'rgba(77, 255, 148, 0.1)',
                        border: '1px solid rgba(77, 255, 148, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ color: 'var(--text-muted)' }}>Available Balance:</span>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: '#4dff94' }}>
                            {availableBalance.toFixed(4)} SOL
                        </span>
                    </div>

                    {/* Amount */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Amount (SOL)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="number"
                                step="0.0001"
                                min={MIN_WITHDRAWAL}
                                max={availableBalance}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={`Min ${MIN_WITHDRAWAL} SOL`}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setAmount(availableBalance.toString())}
                            style={{
                                marginTop: '8px',
                                padding: '4px 12px',
                                background: 'none',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                color: 'var(--primary)',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Max
                        </button>
                    </div>

                    {/* Destination Wallet */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Destination Wallet
                        </label>
                        {wallets && wallets.length > 0 ? (
                            <select
                                value={selectedWallet}
                                onChange={(e) => setSelectedWallet(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Select wallet</option>
                                {wallets.map((wallet, index) => (
                                    <option key={index} value={wallet.address}>
                                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                                        {wallet.isPrimary ? ' (Primary)' : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                No wallets connected. Please connect a wallet first.
                            </div>
                        )}
                    </div>

                    {/* Fee Summary */}
                    {withdrawAmount > 0 && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Withdrawal Amount:</span>
                                <span>{withdrawAmount.toFixed(4)} SOL</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Network Fee:</span>
                                <span>~{NETWORK_FEE.toFixed(6)} SOL</span>
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                <span>You will receive:</span>
                                <span style={{ color: '#4dff94' }}>~{netAmount.toFixed(4)} SOL</span>
                            </div>
                        </div>
                    )}

                    {/* Warning */}
                    <div style={{
                        marginBottom: '20px',
                        padding: '12px',
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.2)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#ffc107'
                    }}>
                        <strong>Note:</strong> Withdrawals require admin approval and may take some time to process.
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !wallets || wallets.length === 0}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '12px',
                            opacity: loading || !wallets || wallets.length === 0 ? 0.5 : 1
                        }}
                    >
                        {loading ? 'Submitting...' : 'Request Withdrawal'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WithdrawModal;
