import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '40px 0' }}>
                {children}
            </main>
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                padding: '40px 0',
                marginTop: 'auto',
                textAlign: 'center',
                color: 'var(--text-muted)'
            }}>
                <div className="container">
                    <p>&copy; 2025 Nexus Crypto Casino. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
