// Detect if we're in production by checking if we're NOT on localhost
// This is more reliable than import.meta.env.MODE which varies by build
const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

export const API_URL = import.meta.env.VITE_API_URL ||
    (isLocalhost ? 'http://localhost:3000' : window.location.origin);

export const api = {
    async request(endpoint, method = 'GET', body = null, token = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if token provided
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }
};
