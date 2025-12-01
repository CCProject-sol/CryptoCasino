import React from 'react';
import { X, Wallet } from 'lucide-react';

const WalletModal = ({ isOpen, onClose, onConnect }) => {
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={onConnect}
                        className="btn"
                        style={{
                            background: '#2c2d3a',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            width: '100%',
                            justifyContent: 'flex-start'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#353646'}
                        onMouseOut={e => e.currentTarget.style.background = '#2c2d3a'}
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
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Phantom</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Connect with Phantom Wallet</div>
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
