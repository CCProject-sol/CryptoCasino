export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        });

        return res.json();
    },

    linkWallet(publicKey, signature) {
        return this.request('/auth/link-wallet', 'POST', { publicKey, signature });
    },

    withdraw(amount, address) {
        return this.request('/withdraw', 'POST', { amount, address });
    }
};
