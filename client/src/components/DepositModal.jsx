import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { api } from '../api';
import { QRCodeSVG } from 'qrcode.react';

const DepositModal = ({ isOpen, onClose }) => {
    const { token } = useUser();
    const [depositAddress, setDepositAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && token) {
            loadDepositAddress();
        }
    }, [isOpen, token]);

    const loadDepositAddress = async () => {
        try {
            const response = await api.request('/api/wallet/deposit-address', 'GET', null, token);
            setDepositAddress(response.depositAddress);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load deposit address:', err);
            setError(err.message || 'Failed to load deposit address');
            setLoading(false);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(depositAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

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
                maxWidth: '500px',
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

                <h2 style={{ marginTop: 0, marginBottom: '24px', textAlign: 'center' }}>Deposit SOL</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Loading deposit address...
                    </div>
                ) : error ? (
                    <div style={{
                        background: 'rgba(255, 77, 77, 0.1)',
                        border: '1px solid rgba(255, 77, 77, 0.2)',
                        color: '#ff4d4d',
                        padding: '12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                ) : (
                    <>
                        {/* QR Code */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '24px',
                            padding: '20px',
                            background: 'white',
                            borderRadius: '12px'
                        }}>
                            <QRCodeSVG value={depositAddress} size={200} />
                        </div>

                        {/* Address */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                Your Unique Deposit Address
                            </label>
                            <div style={{
                                display: 'flex',
                                gap: '8px'
                            }}>
                                <input
                                    type="text"
                                    value={depositAddress}
                                    readOnly
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontFamily: 'monospace',
                                        fontSize: '12px'
                                    }}
                                />
                                <button
                                    onClick={copyAddress}
                                    className="btn"
                                    style={{
                                        padding: '12px 16px',
                                        background: copied ? 'rgba(77, 255, 148, 0.1)' : 'rgba(255,255,255,0.05)',
                                        border: copied ? '1px solid rgba(77, 255, 148, 0.2)' : '1px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle size={18} color="#4dff94" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={18} />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div style={{
                            background: 'rgba(255, 193, 7, 0.1)',
                            border: '1px solid rgba(255, 193, 7, 0.2)',
                            padding: '16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#ffc107'
                        }}>
                            <strong>Important:</strong>
                            <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                                <li>Only send SOL to this address</li>
                                <li>Network: Solana Devnet (for testing)</li>
                                <li>Deposits are credited after network confirmation</li>
                                <li>Minimum deposit: 0.01 SOL</li>
                            </ul>
                        </div>

                        {/* For testing */}
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: 'rgba(0, 191, 255, 0.1)',
                            border: '1px solid rgba(0, 191, 255, 0.2)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#00bfff',
                            textAlign: 'center'
                        }}>
                            Testing? Get devnet SOL at{' '}
                            <a
                                href="https://faucet.solana.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                            >
                                Solana Faucet
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DepositModal;
