import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import TestModeBadge from '../components/TestModeBadge';
import coinHeads from '../assets/coin-heads.png';
import coinTails from '../assets/coin-tails.png';
import useWebSocket from '../hooks/useWebSocket';

const CoinFlip = () => {
    const { systemMode } = useUser();
    const [betAmount, setBetAmount] = useState('0.001');
    const [selectedSide, setSelectedSide] = useState(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [winAmount, setWinAmount] = useState(0);
    const [result, setResult] = useState(null);
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
                setStatusMessage('Opponent found! Game starting...');
                break;
            case 'GAME_RESULT':
                if (data.gameType === 'coinflip') {
                    performFlip(data.outcome, data.result, data.winAmount);
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

    const handleFindMatch = () => {
        if (!selectedSide || isSearching || isFlipping || !isConnected) return;

        sendMessage('FIND_MATCH', {
            gameType: 'coinflip',
            betAmount: betAmount,
            side: selectedSide
        });
    };

    const handleCancelMatch = () => {
        sendMessage('CANCEL_MATCH');
    };

    const performFlip = (outcome, gameResult, amount) => {
        setIsFlipping(true);
        setShowModal(false);
        setResult(null);
        setStatusMessage('Flipping...');

        const currentRotation = rotation;
        const spins = 1800; // 5 spins
        let targetRotation = currentRotation + spins;
        const remainder = targetRotation % 360;

        if (outcome === 'heads') {
            targetRotation += (360 - remainder);
        } else {
            targetRotation += (180 - remainder) + 360;
        }

        setRotation(targetRotation);

        setTimeout(() => {
            setResult(outcome);
            setIsFlipping(false);
            setWinAmount(gameResult === 'win' ? amount : -amount);
            setStatusMessage('');

            setTimeout(() => {
                setShowModal(true);
            }, 500);
        }, 3000);
    };

    return (
        <>
            <TestModeBadge systemMode={systemMode} />
            <div className="container animate-fade-in" style={{ marginTop: systemMode?.isTestMode ? '60px' : '0' }}>
                <Link to="/games" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    <ArrowLeft size={20} /> Back to Games
                </Link>

                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '42px', marginBottom: '40px' }}>Coin Flip</h1>

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

                    {/* Coin Animation Container */}
                    <div style={{
                        height: '250px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '60px',
                        perspective: '1000px'
                    }}>
                        <div style={{
                            width: '200px',
                            height: '200px',
                            position: 'relative',
                            transformStyle: 'preserve-3d',
                            transition: isFlipping ? 'transform 3s cubic-bezier(0.4, 2.7, 0.6, 1)' : 'none',
                            transform: `rotateY(${rotation}deg)`
                        }}>
                            {/* Heads Side */}
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backfaceVisibility: 'hidden',
                                borderRadius: '50%',
                                boxShadow: '0 0 50px rgba(255, 215, 0, 0.2)'
                            }}>
                                <img src={coinHeads} alt="Heads" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                            </div>

                            {/* Tails Side */}
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                borderRadius: '50%',
                                boxShadow: '0 0 50px rgba(189, 0, 255, 0.4)'
                            }}>
                                <img src={coinTails} alt="Tails" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="card" style={{ padding: '40px' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-muted)' }}>Bet Amount (BTC)</label>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                disabled={isSearching || isFlipping}
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

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                            <button
                                onClick={() => setSelectedSide('heads')}
                                disabled={isSearching || isFlipping}
                                style={{
                                    flex: 1,
                                    padding: '20px',
                                    borderRadius: '12px',
                                    background: selectedSide === 'heads' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: selectedSide === 'heads' ? '2px solid #ffd700' : '2px solid transparent',
                                    color: selectedSide === 'heads' ? '#ffd700' : 'var(--text-muted)',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    cursor: (isSearching || isFlipping) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                HEADS
                            </button>
                            <button
                                onClick={() => setSelectedSide('tails')}
                                disabled={isSearching || isFlipping}
                                style={{
                                    flex: 1,
                                    padding: '20px',
                                    borderRadius: '12px',
                                    background: selectedSide === 'tails' ? 'rgba(189, 0, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: selectedSide === 'tails' ? '2px solid #bd00ff' : '2px solid transparent',
                                    color: selectedSide === 'tails' ? '#bd00ff' : 'var(--text-muted)',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    cursor: (isSearching || isFlipping) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                TAILS
                            </button>
                        </div>

                        {!isSearching ? (
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', fontSize: '20px', justifyContent: 'center' }}
                                onClick={handleFindMatch}
                                disabled={isFlipping || !selectedSide || !isConnected}
                            >
                                {!isConnected ? 'Connecting...' : (isFlipping ? 'Flipping...' : 'FIND MATCH')}
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
                {showModal && (
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
                            <h2 style={{ fontSize: '32px', marginBottom: '16px', color: winAmount > 0 ? 'var(--primary)' : '#ff4d4d' }}>
                                {winAmount > 0 ? 'YOU WON!' : 'YOU LOST'}
                            </h2>
                            <div style={{ marginBottom: '24px' }}>
                                <img
                                    src={result === 'heads' ? coinHeads : coinTails}
                                    alt={result}
                                    style={{ width: '100px', height: '100px', borderRadius: '50%', boxShadow: `0 0 30px ${result === 'heads' ? 'rgba(255,215,0,0.5)' : 'rgba(189,0,255,0.5)'}` }}
                                />
                            </div>
                            <p style={{ fontSize: '20px', marginBottom: '8px' }}>
                                The coin landed on <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{result}</span>
                            </p>
                            <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px', color: winAmount > 0 ? 'var(--primary)' : '#ff4d4d' }}>
                                {winAmount > 0 ? '+' : ''}{winAmount} BTC
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowModal(false)} style={{ width: '100%', justifyContent: 'center' }}>
                                Play Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CoinFlip;
