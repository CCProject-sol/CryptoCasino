import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';

const Home = () => {
    return (
        <div className="container">
            {/* Hero Section */}
            <section style={{
                textAlign: 'center',
                padding: '80px 0',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(0, 255, 157, 0.1) 0%, rgba(0,0,0,0) 70%)',
                    zIndex: -1
                }} />

                <h1 style={{
                    fontSize: '64px',
                    fontWeight: '800',
                    marginBottom: '24px',
                    lineHeight: '1.1'
                }}>
                    The Future of <br />
                    <span className="text-gradient">Competitive Gaming</span>
                </h1>

                <p style={{
                    fontSize: '20px',
                    color: 'var(--text-muted)',
                    maxWidth: '600px',
                    margin: '0 auto 40px'
                }}>
                    Join the ultimate PVP crypto casino. Compete in high-stakes tournaments,
                    wager on skill-based games, and win instant crypto rewards.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <Link to="/games" className="btn btn-primary">
                        Start Playing <ArrowRight size={20} />
                    </Link>
                    <Link to="/tournaments" className="btn btn-secondary">
                        View Tournaments
                    </Link>
                </div>
            </section>

            {/* Features Grid */}
            <section style={{ padding: '40px 0' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    <FeatureCard
                        icon={<Zap color="var(--primary)" size={32} />}
                        title="Instant Payouts"
                        desc="Withdraw your winnings instantly to your wallet via Lightning Network or standard chain transactions."
                    />
                    <FeatureCard
                        icon={<Shield color="var(--accent)" size={32} />}
                        title="Provably Fair"
                        desc="Every game outcome is verifiable on-chain. Trust the code, not the house."
                    />
                    <FeatureCard
                        icon={<Globe color="var(--secondary)" size={32} />}
                        title="Global Tournaments"
                        desc="Compete against players worldwide in daily, weekly, and monthly tournaments with massive prize pools."
                    />
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="card" style={{ textAlign: 'left' }}>
        <div style={{ marginBottom: '20px' }}>{icon}</div>
        <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{desc}</p>
    </div>
);

export default Home;
