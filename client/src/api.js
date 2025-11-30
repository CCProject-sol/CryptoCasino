export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    headers['x-user-id'] = user.id.toString();
                }
            } catch {
                // Ignore invalid JSON
            }
        }

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

    login(publicKey) {
        return this.request('/auth/login', 'POST', { publicKey });
    },

    withdraw(amount, address) {
        return this.request('/withdraw', 'POST', { amount, address });
    }
};
