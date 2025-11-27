import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

export function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            api.setToken(token);
            // Fetch profile to confirm login and get user data
            api.getProfile().then(user => {
                if (user) {
                    onLogin(user);
                } else {
                    setError('Failed to load profile');
                }
            }).catch(() => {
                setError('Invalid token');
            });
        }
    }, [searchParams, onLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.login(email, password);
            if (res.error) {
                setError(res.error);
            } else {
                api.setToken(res.token);
                onLogin(res.user);
            }
        } catch {
            setError('Login failed');
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/api/auth/google';
    };

    return (
        <div className="auth-form-container">
            <h2>Login</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>OR</span>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="btn-secondary"
                    style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.065 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
                        <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.514-1.015 7.565-2.741l-3.525-3.246Z" />
                        <path fill="#4A90E2" d="M19.834 21.258a11.991 11.991 0 0 0 3.217-8.837h-11.05v4.61h6.64c-.154 1.182-.979 3.136-3.59 4.227l3.525 3.247Z" />
                        <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" />
                    </svg>
                    Sign in with Google
                </button>
            </form>
            <p>
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
}
