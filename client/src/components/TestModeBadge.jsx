import React from 'react';

/**
 * Test Mode Badge Component
 * 
 * Displays a prominent warning banner when the application is in test mode.
 * Shows that games are using test balance instead of real SOL.
 */
const TestModeBadge = ({ systemMode }) => {
    if (!systemMode?.isTestMode) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, rgba(255, 191, 0, 0.95), rgba(255, 152, 0, 0.95))',
            color: '#000',
            padding: '12px 20px',
            textAlign: 'center',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            borderBottom: '2px solid #ff9800',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
        }}>
            <div style={{
                background: '#000',
                color: '#ffbf00',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '1px'
            }}>
                ⚠️ TEST MODE
            </div>
            <span>
                Using test balance for games • Real SOL transactions disabled
            </span>
            <div style={{
                background: 'rgba(0,0,0,0.2)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px'
            }}>
                {systemMode.description}
            </div>
        </div>
    );
};

export default TestModeBadge;
