import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import coinHeads from '../assets/coin-heads.png';
import coinTails from '../assets/coin-tails.png';

const CoinFlip = () => {
    const [betAmount, setBetAmount] = useState('0.001');
    const [selectedSide, setSelectedSide] = useState(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [winAmount, setWinAmount] = useState(0);
    const [result, setResult] = useState(null);

    const handleFlip = () => {
        if (!selectedSide || isFlipping) return;

        setIsFlipping(true);
        setShowModal(false);
        setResult(null);

        // Random outcome: 0 = heads, 1 = tails
        const outcome = Math.random() < 0.5 ? 'heads' : 'tails';

        // Calculate new rotation
        // Add 5 full spins (1800deg) + outcome specific
        // We keep adding to the current rotation to avoid snapping back
        // Heads = multiple of 360, Tails = multiple of 360 + 180

        const currentRotation = rotation;
        const spins = 1800; // 5 spins
        let targetRotation = currentRotation + spins;

        // Normalize target to be consistent with outcome
        // If outcome is heads, we want target % 360 === 0
        // If outcome is tails, we want target % 360 === 180

        const remainder = targetRotation % 360;

        if (outcome === 'heads') {
            targetRotation += (360 - remainder);
        } else {
            targetRotation += (180 - remainder) + 360; // Ensure we always move forward
        }

        setRotation(targetRotation);

        // Animation duration is 3s
        setTimeout(() => {
            setResult(outcome);
            setIsFlipping(false);

            const isWin = selectedSide === outcome;
            const amount = parseFloat(betAmount);
            setWinAmount(isWin ? amount : -amount);

            // Show modal slightly after animation ends
            setTimeout(() => {
                setShowModal(true);
            }, 500);
        }, 3000);
    };

    return (
        <div className="container animate-fade-in">
            <Link to="/games" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                <ArrowLeft size={20} /> Back to Games
            </Link>

            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <h1 style={{ fontSize: '42px', marginBottom: '40px' }}>Coin Flip</h1>

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
                            style={{
                                flex: 1,
                                padding: '20px',
                                borderRadius: '12px',
                                background: selectedSide === 'heads' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: selectedSide === 'heads' ? '2px solid #ffd700' : '2px solid transparent',
                                color: selectedSide === 'heads' ? '#ffd700' : 'var(--text-muted)',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            HEADS
                        </button>
                        <button
                            onClick={() => setSelectedSide('tails')}
                            style={{
                                flex: 1,
                                padding: '20px',
                                borderRadius: '12px',
                                background: selectedSide === 'tails' ? 'rgba(189, 0, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: selectedSide === 'tails' ? '2px solid #bd00ff' : '2px solid transparent',
                                color: selectedSide === 'tails' ? '#bd00ff' : 'var(--text-muted)',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                            }}
                        >
                            TAILS
                        </button>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '20px', justifyContent: 'center' }}
                        onClick={handleFlip}
                        disabled={isFlipping || !selectedSide}
                    >
                        {isFlipping ? 'Flipping...' : 'FLIP COIN'}
                    </button>
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
    );
};

export default CoinFlip;
