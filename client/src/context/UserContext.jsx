import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ws, setWs] = useState(null);

    // Initial load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // WebSocket connection
    useEffect(() => {
        if (!user) {
            if (ws) {
                ws.close();
                setWs(null);
            }
            return;
        }

        // Connect to WS with user ID
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.hostname}:3005?userId=${user.id}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('User WS Connected');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'USER_UPDATE') {
                    console.log('Received user update:', data.user);
                    setUser(prev => ({ ...prev, ...data.user }));
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            } catch (err) {
                console.error('WS Message Error:', err);
            }
        };

        socket.onclose = () => {
            console.log('User WS Disconnected');
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, [user?.id]); // Re-connect if user ID changes (login/logout)

    const login = async (publicKey) => {
        const data = await api.login(publicKey);
        if (data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        if (ws) ws.close();
    };

    const registerEmail = async (email, password) => {
        const data = await api.register(email, password);
        if (data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    };

    const loginEmail = async (email, password) => {
        const data = await api.loginEmail(email, password);
        if (data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    };

    return (
        <UserContext.Provider value={{ user, login, logout, registerEmail, loginEmail, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
