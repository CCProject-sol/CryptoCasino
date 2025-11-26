import React from 'react';
import { Trophy, Clock, Users } from 'lucide-react';

const Tournaments = () => {
    const tournaments = [
        { id: 1, name: 'Weekly High Rollers', prize: '5 BTC', endsIn: '2d 14h', players: '1,240/2,000', entry: '0.01 BTC', status: 'Active' },
        { id: 2, name: 'Daily Sprint', prize: '0.5 BTC', endsIn: '4h 20m', players: '450/500', entry: '0.001 BTC', status: 'Active' },
        { id: 3, name: 'Newcomer Freeroll', prize: '0.1 BTC', endsIn: 'Starts in 2h', players: '890/1,000', entry: 'Free', status: 'Upcoming' },
    ];

    return (
        <div className="container animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{ fontSize: '42px', marginBottom: '16px' }}>Tournaments</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Compete for glory and massive crypto prizes</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {tournaments.map((t) => (
                    <div key={t.id} className="card" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'rgba(255, 215, 0, 0.1)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffd700'
                            }}>
                                <Trophy size={32} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{t.name}</h3>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} /> {t.endsIn}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users size={14} /> {t.players}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Prize Pool</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)', textShadow: '0 0 10px var(--primary-glow)' }}>{t.prize}</div>
                            </div>

                            <button className={`btn ${t.status === 'Active' ? 'btn-primary' : 'btn-secondary'}`}>
                                {t.status === 'Active' ? 'Join Now' : 'Register'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tournaments;
