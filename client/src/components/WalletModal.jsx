import React, { useState, useEffect } from 'react';
import { X, Wallet, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import bs58 from 'bs58';

const WalletModal = ({ isOpen, onClose }) => {
    const { connectWallet } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [phantomInstalled, setPhantomInstalled] = useState(false);

    useEffect(() => {
        // Check if Phantom is installed
        if (window.solana && window.solana.isPhantom) {
            setPhantomInstalled(true);
        }
    }, []);

    const handleConnect = async () => {
        setError('');
        setLoading(true);

        try {
            if (!window.solana || !window.solana.isPhantom) {
                throw new Error('Phantom wallet not detected. Please install Phantom extension.');
            }

            // Connect to Phantom
            const resp = await window.solana.connect();
            const publicKey = resp.publicKey.toString();

            // Sign a verification message
            const message = `Sign this message to verify wallet ownership for NEXUS Casino: ${Date.now()}`;
            const encodedMessage = new TextEncoder().encode(message);
            const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8');
            const signature = bs58.encode(signedMessage.signature);

            // Send to backend
            await connectWallet(publicKey, signature, message);

            onClose();
        } catch (err) {
            console.error('Wallet connection error:', err);
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setLoading(false);
        }
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
                maxWidth: '400px',
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

                <h2 style={{ marginTop: 0, marginBottom: '24px', textAlign: 'center' }}>Connect Wallet</h2>

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

                {!phantomInstalled && (
                    <div style={{
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.2)',
                        color: '#ffc107',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        Phantom wallet not detected. <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Install Phantom</a>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={handleConnect}
                        disabled={loading || !phantomInstalled}
                        className="btn"
                        style={{
                            background: phantomInstalled ? '#2c2d3a' : 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            borderRadius: '12px',
                            cursor: phantomInstalled ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            width: '100%',
                            justifyContent: 'flex-start',
                            opacity: loading || !phantomInstalled ? 0.5 : 1
                        }}
                        onMouseOver={e => phantomInstalled && !loading && (e.currentTarget.style.background = '#353646')}
                        onMouseOut={e => phantomInstalled && (e.currentTarget.style.background = '#2c2d3a')}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: '#AB9FF2',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Wallet size={24} color="#fff" />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                {loading ? 'Connecting...' : 'Phantom'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Connect with Phantom Wallet
                            </div>
                        </div>
                    </button>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                    By connecting, you agree to our Terms of Service and Privacy Policy.
                </div>
            </div>
        </div>
    );
};

export default WalletModal;
