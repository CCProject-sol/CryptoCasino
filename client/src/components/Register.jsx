import React, { useState } from 'react';
import { api } from '../api';

export function Register({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.register(email, password);
            if (res.error) {
                setError(res.error);
            } else {
                api.setToken(res.token);
                onLogin(res.user);
            }
        } catch (err) {
            setError('Registration failed');
        }
    };

    return (
        <div className="auth-form-container">
            <h2>Register</h2>
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
                <button type="submit">Register</button>
            </form>
        </div>
    );
}
