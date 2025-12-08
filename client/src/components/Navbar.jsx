import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Trophy, User, LogOut, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import AuthModal from './AuthModal';
import WalletModal from './WalletModal';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';

const Navbar = () => {
    const location = useLocation();
    const { user, logout, loading, wallets } = useUser();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { name: 'Games', path: '/games', icon: Gamepad2 },
        { name: 'Tournaments', path: '/tournaments', icon: Trophy },
    ];

    return (
        <>
            <nav style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                background: 'rgba(10, 10, 15,0.8)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
                    {/* Logo */}
                    <Link to="/" style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'var(--primary)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000'
                        }}>
                            <Gamepad2 size={24} />
                        </div>
                        <span className="text-gradient">NEXUS</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="desktop-nav" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    color: isActive(link.path) ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: '500',
                                    transition: 'color 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <link.icon size={18} />
                                {link.name}
                            </Link>
                        ))}

                        {/* Auth Section */}
                        {!loading && (
                            <>
                                {user ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {/* Balance */}
                                        <div style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            {(user.balance / 1e9).toFixed(4)} SOL
                                        </div>

                                        {/* Wallet Button */}
                                        <button
                                            onClick={() => setShowWalletModal(true)}
                                            className="btn"
                                            style={{
                                                background: wallets && wallets.length > 0 ? 'rgba(77, 255, 148, 0.1)' : 'rgba(255,255,255,0.05)',
                                                border: wallets && wallets.length > 0 ? '1px solid rgba(77, 255, 148, 0.2)' : '1px solid rgba(255,255,255,0.1)',
                                                padding: '8px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Wallet size={18} />
                                            {wallets && wallets.length > 0 ? `${wallets[0].address.slice(0, 4)}...${wallets[0].address.slice(-4)}` : 'Connect Wallet'}
                                        </button>

                                        {/* Deposit Button */}
                                        <button
                                            onClick={() => setShowDepositModal(true)}
                                            className="btn"
                                            style={{
                                                background: 'rgba(77, 255, 148, 0.1)',
                                                border: '1px solid rgba(77, 255, 148, 0.2)',
                                                padding: '8px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <ArrowDownCircle size={18} />
                                            Deposit
                                        </button>

                                        {/* Withdraw Button */}
                                        <button
                                            onClick={() => setShowWithdrawModal(true)}
                                            className="btn"
                                            style={{
                                                background: 'rgba(255, 193, 7, 0.1)',
                                                border: '1px solid rgba(255, 193, 7, 0.2)',
                                                padding: '8px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <ArrowUpCircle size={18} />
                                            Withdraw
                                        </button>

                                        {/* User Menu */}
                                        <Link
                                            to="/profile"
                                            className="btn"
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '8px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <User size={18} />
                                            {user.nickname || user.email}
                                        </Link>

                                        {/* Logout */}
                                        <button
                                            onClick={logout}
                                            className="btn"
                                            style={{
                                                background: 'rgba(255,77,77,0.1)',
                                                border: '1px solid rgba(255,77,77,0.2)',
                                                padding: '8px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <LogOut size={18} />
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowAuthModal(true)}
                                        className="btn btn-primary"
                                        style={{
                                            padding: '10px 20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <User size={18} />
                                        Login / Register
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            {/* Wallet Modal */}
            <WalletModal
                isOpen={showWalletModal}
                onClose={() => setShowWalletModal(false)}
            />

            {/* Deposit Modal */}
            <DepositModal
                isOpen={showDepositModal}
                onClose={() => setShowDepositModal(false)}
            />

            {/* Withdraw Modal */}
            <WithdrawModal
                isOpen={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
            />
        </>
    );
};

export default Navbar;
