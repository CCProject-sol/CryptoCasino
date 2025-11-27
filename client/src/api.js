const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
    token: localStorage.getItem('token'),

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    },

    logout() {
        this.token = null;
        localStorage.removeItem('token');
    },

    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        });

        if (res.status === 401) {
            this.logout();
            window.location.href = '/login';
            return null;
        }

        return res.json();
    },

    login(email, password) {
        return this.request('/auth/login', 'POST', { email, password });
    },

    register(email, password) {
        return this.request('/auth/register', 'POST', { email, password });
    },

    getProfile() {
        return this.request('/auth/me');
    },

    linkWallet(publicKey, signature) {
        return this.request('/auth/link-wallet', 'POST', { publicKey, signature });
    },

    withdraw(amount, address) {
        return this.request('/withdraw', 'POST', { amount, address });
    }
};
