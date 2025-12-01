import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Trophy, User, Wallet, LogOut, ChevronDown, LogIn } from 'lucide-react';
import AuthModal from './AuthModal';
import { useUser } from '../context/UserContext';

const Navbar = () => {
    const location = useLocation();
    const { user, logout } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { name: 'Games', path: '/games', icon: Gamepad2 },
        { name: 'Tournaments', path: '/tournaments', icon: Trophy },
        { name: 'Profile', path: '/profile', icon: User },
    ];


    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        window.location.href = '/';
    };

    const handleLinkWallet = async () => {
        try {
            if (!window.solana || !window.solana.isPhantom) {
                alert('Phantom wallet is not installed!');
                window.open('https://phantom.app/', '_blank');
                return;
            }

            const response = await window.solana.connect();
            const publicKey = response.publicKey.toString();

            // Sign message for verification
            const message = `Link wallet ${publicKey} to user ${user.id}`;
            const encodedMessage = new TextEncoder().encode(message);
            await window.solana.signMessage(encodedMessage, 'utf8');

            // Call API to link wallet
            const { api } = await import('../api'); // Dynamic import to avoid circular dependency if any
            await api.linkWallet(publicKey);

            alert('Wallet linked successfully!');
            setIsDropdownOpen(false);
        } catch (err) {
            console.error('Link wallet failed:', err);
            alert('Failed to link wallet: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <>
            <AuthModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <nav style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                background: 'rgba(10, 10, 15, 0.8)',
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
                    </div>

                    {/* Wallet / User */}
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Balance</div>
                                <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {(user.balance / 1e9).toFixed(2)} SOL
                                </div>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <User size={16} />
                                    {user.nickname || user.email || `${user.wallet_address?.slice(0, 4)}...${user.wallet_address?.slice(-4)}`}
                                    <ChevronDown size={14} />
                                </button>

                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '8px',
                                        background: '#1a1b23',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        width: '200px',
                                        padding: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                    }}>
                                        <Link
                                            to="/profile"
                                            className="dropdown-item"
                                            onClick={() => setIsDropdownOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '12px',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '8px',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <User size={16} />
                                            Profile
                                        </Link>

                                        {!user.wallet_address && (
                                            <button
                                                onClick={handleLinkWallet}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '12px',
                                                    color: 'var(--primary)',
                                                    background: 'none',
                                                    border: 'none',
                                                    width: '100%',
                                                    cursor: 'pointer',
                                                    borderRadius: '8px',
                                                    textAlign: 'left'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Wallet size={16} />
                                                Connect Wallet
                                            </button>
                                        )}

                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '12px',
                                                color: '#ff4d4d',
                                                background: 'none',
                                                border: 'none',
                                                width: '100%',
                                                cursor: 'pointer',
                                                borderRadius: '8px',
                                                textAlign: 'left'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,77,77,0.1)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <LogOut size={16} />
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            <LogIn size={18} />
                            Sign In
                        </button>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navbar;
