// Use environment variable if available, otherwise use current origin in production, fallback to localhost in dev
export const API_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:3000');

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
