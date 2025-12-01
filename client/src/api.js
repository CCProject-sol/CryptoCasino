export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

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


    login(publicKey) {
        return this.request('/auth/login', 'POST', { publicKey });
    },

    register(email, password) {
        return this.request('/auth/register', 'POST', { email, password });
    },

    loginEmail(email, password) {
        return this.request('/auth/login-email', 'POST', { email, password });
    },

    linkWallet(publicKey) {
        return this.request('/auth/link-wallet', 'POST', { publicKey });
    },

    unlinkWallet(publicKey) {
        return this.request('/auth/unlink-wallet', 'POST', { publicKey });
    },

    setPrimaryWallet(publicKey) {
        return this.request('/auth/set-primary-wallet', 'POST', { publicKey });
    },

    getProfile() {
        return this.request('/user/profile');
    },

    updateNickname(nickname) {
        return this.request('/user/nickname', 'POST', { nickname });
    },

    withdraw(amount, address) {
        return this.request('/withdraw', 'POST', { amount, address });
    }
};
