import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Spade, Diamond, Club } from 'lucide-react';
import { Link } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';

const SUITS = {
    hearts: { icon: Heart, color: '#ff4d4d' },
    diamonds: { icon: Diamond, color: '#ff4d4d' },
    spades: { icon: Spade, color: '#e0e0e0' },
    clubs: { icon: Club, color: '#e0e0e0' }
};

const HighCard = () => {
    const [betAmount, setBetAmount] = useState('0.001');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [playerCard, setPlayerCard] = useState(null);
    const [dealerCard, setDealerCard] = useState(null);
    const [result, setResult] = useState(null); // 'win', 'lose', 'draw'
    const [winAmount, setWinAmount] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const { isConnected, sendMessage, lastMessage } = useWebSocket('ws://localhost:3001');

    useEffect(() => {
        if (lastMessage) {
            handleWebSocketMessage(lastMessage);
        }
    }, [lastMessage]);

    const handleWebSocketMessage = (data) => {
        switch (data.type) {
            case 'SEARCHING_MATCH':
                setIsSearching(true);
                setStatusMessage('Searching for opponent...');
                break;
            case 'MATCH_FOUND':
                setIsSearching(false);
                setStatusMessage('Opponent found! Dealing cards...');
                break;
            case 'GAME_RESULT':
                if (data.gameType === 'highcard') {
                    performDeal(data.myCard, data.opponentCard, data.result, data.winAmount);
                }
                break;
            case 'MATCH_CANCELLED':
                setIsSearching(false);
                setStatusMessage('');
                break;
            default:
                break;
        }
    };

    const handlePlay = () => {
        if (isPlaying || isSearching || !isConnected) return;

        sendMessage('FIND_MATCH', {
            gameType: 'highcard',
            betAmount: betAmount
        });
    };

    const handleCancelMatch = () => {
        sendMessage('CANCEL_MATCH');
    };

    const performDeal = (pCard, dCard, gameResult, amount) => {
        setIsPlaying(true);
        setShowResult(false);
        setPlayerCard(null);
        setDealerCard(null);
        setResult(null);
        setStatusMessage('Dealing...');

        // Animation sequence
        setTimeout(() => {
            setPlayerCard(pCard);

            setTimeout(() => {
                setDealerCard(dCard);

                setTimeout(() => {
                    setResult(gameResult);
                    setWinAmount(gameResult === 'win' ? amount : (gameResult === 'lose' ? -amount : 0));
                    setShowResult(true);
                    setIsPlaying(false);
                    setStatusMessage('');
                }, 1000);
            }, 1000);
        }, 500);
    };

    return (
        <div className="container animate-fade-in">
            <Link to="/games" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                <ArrowLeft size={20} /> Back to Games
            </Link>

            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                <h1 style={{ fontSize: '42px', marginBottom: '16px' }}>High Card</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Highest card wins. Ace is high.</p>

                {/* Status Message */}
                {statusMessage && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'var(--primary)'
                    }}>
                        {statusMessage}
                    </div>
                )}

                {/* Game Area */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '40px',
                    marginBottom: '60px',
                    perspective: '1000px'
                }}>
                    {/* Player Card */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '16px', color: 'var(--primary)', fontWeight: 'bold' }}>YOU</div>
                        <Card card={playerCard} hidden={!playerCard} />
                    </div>

                    {/* VS */}
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '32px', fontWeight: '800', color: 'var(--text-muted)' }}>
                        VS
                    </div>

                    {/* Dealer Card */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '16px', color: '#ff4d4d', fontWeight: 'bold' }}>OPPONENT</div>
                        <Card card={dealerCard} hidden={!dealerCard} />
                    </div>
                </div>

                {/* Controls */}
                <div className="card" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-muted)' }}>Bet Amount (BTC)</label>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            disabled={isSearching || isPlaying}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '16px',
                                borderRadius: '12px',
                                color: 'white',
                                width: '100%',
                                fontSize: '24px',
                                textAlign: 'center',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {!isSearching ? (
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', fontSize: '20px', justifyContent: 'center' }}
                            onClick={handlePlay}
                            disabled={isPlaying || !isConnected}
                        >
                            {!isConnected ? 'Connecting...' : (isPlaying ? 'Dealing...' : 'FIND MATCH')}
                        </button>
                    ) : (
                        <button
                            className="btn"
                            style={{
                                width: '100%',
                                fontSize: '20px',
                                justifyContent: 'center',
                                background: 'rgba(255, 77, 77, 0.2)',
                                color: '#ff4d4d',
                                border: '1px solid #ff4d4d'
                            }}
                            onClick={handleCancelMatch}
                        >
                            CANCEL SEARCH
                        </button>
                    )}
                </div>
            </div>

            {/* Result Modal */}
            {showResult && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="card" style={{ width: '400px', textAlign: 'center', animation: 'fadeIn 0.3s ease-out' }}>
                        <h2 style={{ fontSize: '32px', marginBottom: '16px', color: result === 'win' ? 'var(--primary)' : result === 'lose' ? '#ff4d4d' : 'var(--text-muted)' }}>
                            {result === 'win' ? 'YOU WON!' : result === 'lose' ? 'YOU LOST' : 'DRAW'}
                        </h2>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '24px' }}>
                            <MiniCard card={playerCard} label="YOU" />
                            <MiniCard card={dealerCard} label="OPP" />
                        </div>

                        <p style={{ fontSize: '18px', marginBottom: '24px', color: 'var(--text-muted)' }}>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>{playerCard.rank}</span> of {playerCard.suit} vs <span style={{ color: 'white', fontWeight: 'bold' }}>{dealerCard.rank}</span> of {dealerCard.suit}
                        </p>

                        <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px', color: result === 'win' ? 'var(--primary)' : result === 'lose' ? '#ff4d4d' : 'var(--text-muted)' }}>
                            {result === 'win' ? '+' : ''}{winAmount} BTC
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowResult(false)} style={{ width: '100%', justifyContent: 'center' }}>
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Card = ({ card, hidden }) => {
    if (hidden) {
        return (
            <div style={{
                width: '160px',
                height: '240px',
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                borderRadius: '16px',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
                <div style={{
                    width: '140px',
                    height: '220px',
                    border: '2px dashed rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ fontSize: '40px', opacity: 0.2 }}>?</div>
                </div>
            </div>
        );
    }

    const suitData = SUITS[card.suit];
    const Icon = suitData.icon;

    return (
        <div style={{
            width: '160px',
            height: '240px',
            background: 'white',
            borderRadius: '16px',
            color: suitData.color,
            position: 'relative',
            padding: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            animation: 'flipIn 0.6s ease-out'
        }}>
            <div style={{ textAlign: 'left', fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>
                {card.rank}
                <div style={{ marginTop: '4px' }}><Icon size={20} /></div>
            </div>

            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <Icon size={64} />
            </div>

            <div style={{ textAlign: 'right', fontSize: '24px', fontWeight: 'bold', lineHeight: 1, transform: 'rotate(180deg)' }}>
                {card.rank}
                <div style={{ marginTop: '4px' }}><Icon size={20} /></div>
            </div>
        </div>
    );
};

const MiniCard = ({ card, label }) => {
    const suitData = SUITS[card.suit];
    const Icon = suitData.icon;
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
            <div style={{
                width: '60px',
                height: '84px',
                background: 'white',
                borderRadius: '8px',
                color: suitData.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
                {card.rank}
                <Icon size={16} style={{ marginLeft: '2px' }} />
            </div>
        </div>
    );
};

export default HighCard;
