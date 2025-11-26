import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data);
                setLastMessage(data);
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };

        return () => {
            socket.close();
        };
    }, [url]);

    const sendMessage = useCallback((type, payload = {}) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, ...payload }));
        } else {
            console.warn('WebSocket is not connected');
        }
    }, []);

    return { isConnected, lastMessage, sendMessage };
};

export default useWebSocket;
