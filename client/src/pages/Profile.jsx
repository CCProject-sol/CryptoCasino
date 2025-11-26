import React from 'react';
import { User, Wallet, History, Settings, ChevronRight } from 'lucide-react';

const Profile = () => {
    return (
        <div className="container animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>

                {/* Sidebar */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            background: 'var(--bg-hover)',
                            borderRadius: '50%',
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <User size={48} color="var(--text-muted)" />
                        </div>
                        <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>CryptoKing99</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Level 42 VIP</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <ProfileLink icon={<User size={18} />} label="Overview" active />
                        <ProfileLink icon={<Wallet size={18} />} label="Wallet" />
                        <ProfileLink icon={<History size={18} />} label="History" />
                        <ProfileLink icon={<Settings size={18} />} label="Settings" />
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Balances */}
                    <div className="card">
                        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Wallet size={20} color="var(--primary)" /> Balances
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                            <BalanceCard currency="BTC" amount="0.4521" value="$12,450.20" color="#f7931a" />
                            <BalanceCard currency="ETH" amount="4.20" value="$8,120.50" color="#627eea" />
                            <BalanceCard currency="USDT" amount="5,420.00" value="$5,420.00" color="#26a17b" />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card">
                        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <History size={20} color="var(--accent)" /> Recent Activity
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '16px' }}>Game</th>
                                    <th style={{ padding: '16px' }}>Time</th>
                                    <th style={{ padding: '16px' }}>Bet</th>
                                    <th style={{ padding: '16px' }}>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                <ActivityRow game="Neon Poker" time="2 mins ago" bet="0.001 BTC" result="+0.002 BTC" win />
                                <ActivityRow game="Crash" time="15 mins ago" bet="0.005 BTC" result="-0.005 BTC" />
                                <ActivityRow game="Roulette" time="1 hour ago" bet="0.01 BTC" result="+0.03 BTC" win />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileLink = ({ icon, label, active }) => (
    <button style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '12px 16px',
        background: active ? 'var(--primary-glow)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        borderRadius: '8px',
        transition: 'all 0.2s'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {icon}
            <span>{label}</span>
        </div>
        <ChevronRight size={16} />
    </button>
);

const BalanceCard = ({ currency, amount, value, color }) => (
    <div style={{
        background: 'rgba(255,255,255,0.03)',
        padding: '20px',
        borderRadius: '12px',
        borderLeft: `4px solid ${color}`
    }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>{currency}</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{amount}</div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>≈ {value}</div>
    </div>
);

const ActivityRow = ({ game, time, bet, result, win }) => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <td style={{ padding: '16px' }}>{game}</td>
        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{time}</td>
        <td style={{ padding: '16px' }}>{bet}</td>
        <td style={{ padding: '16px', color: win ? 'var(--primary)' : '#ff4d4d' }}>{result}</td>
    </tr>
);

export default Profile;
