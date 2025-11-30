import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Trophy, User, Wallet, Menu, X } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { name: 'Games', path: '/games', icon: Gamepad2 },
        { name: 'Tournaments', path: '/tournaments', icon: Trophy },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    const connectWallet = async () => {
        try {
            if (!window.solana || !window.solana.isPhantom) {
                alert('Phantom wallet is not installed!');
                window.open('https://phantom.app/', '_blank');
                return;
            }

            const response = await window.solana.connect();
            const publicKey = response.publicKey.toString();

            // Login with backend
            const data = await import('../api').then(m => m.api.login(publicKey));

            if (data.user) {
                // Store user session (simplified for MVP)
                localStorage.setItem('user', JSON.stringify(data.user));
                // Reload to update state (or use context in a real app)
                window.location.reload();
            }
        } catch (err) {
            console.error('Wallet connection failed:', err);
            alert('Failed to connect wallet: ' + err.message);
        }
    };

    // Check for existing session
    const [user, setUser] = useState(null);
    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
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

                {/* Wallet Button */}
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Balance</div>
                            <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                {(user.balance / 1e9).toFixed(2)} SOL
                            </div>
                        </div>
                        <button className="btn btn-outline" onClick={() => {
                            localStorage.removeItem('user');
                            window.location.reload();
                        }}>
                            {user.wallet_address.slice(0, 4)}...{user.wallet_address.slice(-4)}
                        </button>
                    </div>
                ) : (
                    <button className="btn btn-primary" onClick={connectWallet}>
                        <Wallet size={18} />
                        Connect Wallet
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
