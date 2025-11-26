import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Users } from 'lucide-react';

const Games = () => {
    const games = [
        { id: 1, title: 'Coin Flip', players: 124, minBet: '0.001 BTC', image: 'linear-gradient(45deg, #ffd700, #ffaa00)', path: '/game/coin-flip' },
        { id: 2, title: 'High Card', players: 89, minBet: '0.0005 BTC', image: 'linear-gradient(45deg, #0f3460, #533483)', path: '/game/high-card' },
        { id: 3, title: 'Dice Duel', players: 210, minBet: '0.0001 BTC', image: 'linear-gradient(45deg, #533483, #1a1a2e)', path: '/game/dice-duel' },
        { id: 4, title: 'Rock-Paper-Scissors', players: 56, minBet: '0.002 BTC', image: 'linear-gradient(45deg, #16213e, #e94560)', path: '/game/rps' },
    ];

    return (
        <div className="container animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px' }}>All Games</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select style={{
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '8px 16px',
                        borderRadius: '8px'
                    }}>
                        <option>Popular</option>
                        <option>Newest</option>
                        <option>High Stakes</option>
                    </select>
                </div>
            </div>

            <div className="grid-games">
                {games.map((game) => (
                    <Link to={game.path || '#'} key={game.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                            height: '160px',
                            background: game.image,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'rgba(0,0,0,0.5)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)'
                            }}>
                                <Play fill="white" size={24} />
                            </div>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{game.title}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '14px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Users size={14} /> {game.players} Playing
                                </span>
                                <span>Min: <span style={{ color: 'var(--primary)' }}>{game.minBet}</span></span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Games;
