import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [ws, setWs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wallets, setWallets] = useState([]);
    const [systemMode, setSystemMode] = useState(null); // Test/Production mode info

    // Initialize user from token on mount
    useEffect(() => {
        const initUser = async () => {
            if (token) {
                try {
                    const response = await api.request('/api/auth/me', 'GET', null, token);
                    setUser(response.user);
                    setWallets(response.user.wallets || []);
                    setSystemMode(response.systemMode || null);
                } catch (err) {
                    console.error('Failed to load user:', err);
                    // Token might be invalid, clear it
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        };
        initUser();
    }, [token]);

    // WebSocket connection with userId
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // In production, use current host. In development, use localhost:3000
        const wsHost = import.meta.env.MODE === 'production'
            ? window.location.host
            : 'localhost:3000';
        const wsUrl = user
            ? `${protocol}//${wsHost}?userId=${user.id}`
            : `${protocol}//${wsHost}`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WS Connected', user ? `(User ${user.id})` : '(Guest)');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Message:', data);

                // Handle user updates (balance changes, etc.)
                if (data.type === 'USER_UPDATE' && data.user) {
                    setUser(prevUser => ({
                        ...prevUser,
                        ...data.user
                    }));
                }
            } catch (err) {
                console.error('WS Message Error:', err);
            }
        };

        socket.onclose = () => {
            console.log('WS Disconnected');
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, [user?.id]);

    // Auth methods
    const loginEmail = async (email, password) => {
        const response = await api.request('/api/auth/login', 'POST', { email, password });
        setToken(response.token);
        localStorage.setItem('token', response.token);
        setUser(response.user);
        setWallets(response.user.wallets || []);
        setSystemMode(response.systemMode || null);
        return response;
    };

    const registerEmail = async (email, password) => {
        const response = await api.request('/api/auth/register', 'POST', { email, password });
        setToken(response.token);
        localStorage.setItem('token', response.token);
        setUser(response.user);
        setWallets(response.user.wallets || []);
        setSystemMode(response.systemMode || null);
        return response;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setWallets([]);
        localStorage.removeItem('token');
    };

    // Wallet methods
    const connectWallet = async (address, signature, message) => {
        const response = await api.request('/api/wallet/connect', 'POST', { address, signature, message }, token);
        // Refresh user data to get updated wallets
        const userResponse = await api.request('/api/auth/me', 'GET', null, token);
        setUser(userResponse.user);
        setWallets(userResponse.user.wallets || []);
        return response;
    };

    const disconnectWallet = async (address) => {
        const response = await api.request('/api/wallet/disconnect', 'POST', { address }, token);
        // Refresh user data
        const userResponse = await api.request('/api/auth/me', 'GET', null, token);
        setUser(userResponse.user);
        setWallets(userResponse.user.wallets || []);
        return response;
    };

    // Wallet management helpers
    const refreshWallets = async () => {
        try {
            const response = await api.request('/api/wallet/list', 'GET', null, token);
            setWallets(response.wallets || []);
            return response.wallets;
        } catch (err) {
            console.error('Failed to refresh wallets:', err);
            throw err;
        }
    };

    const setPrimaryWallet = async (address) => {
        try {
            await api.request(`/api/wallet/${address}/primary`, 'PATCH', null, token);
            await refreshWallets();
            // Also refresh user data to get updated primary wallet
            const userResponse = await api.request('/api/auth/me', 'GET', null, token);
            setUser(userResponse.user);
            setWallets(userResponse.user.wallets || []);
        } catch (err) {
            console.error('Failed to set primary wallet:', err);
            throw err;
        }
    };

    const removeWallet = async (address) => {
        try {
            await api.request('/api/wallet/disconnect', 'POST', { address }, token);
            await refreshWallets();
            // Also refresh user data
            const userResponse = await api.request('/api/auth/me', 'GET', null, token);
            setUser(userResponse.user);
            setWallets(userResponse.user.wallets || []);
        } catch (err) {
            console.error('Failed to remove wallet:', err);
            throw err;
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            token,
            ws,
            loading,
            wallets,
            systemMode, // Expose system mode
            loginEmail,
            registerEmail,
            logout,
            connectWallet,
            disconnectWallet,
            refreshWallets,
            setPrimaryWallet,
            removeWallet
        }}>
            {children}
        </UserContext.Provider>
    );
};

// Export hook separately to maintain Fast Refresh compatibility
export const useUser = () => useContext(UserContext);
