export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
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

    updateAvatar(avatarUrl) {
        return this.request('/user/avatar', 'POST', { avatarUrl });
    },

    uploadAvatar(formData) {
        // Custom request for multipart/form-data
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        return fetch(`${API_URL}/user/upload-avatar`, {
            method: 'POST',
            headers: headers, // Do NOT set Content-Type, let browser set it with boundary
            body: formData
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            return data;
        });
    },

    changePassword(oldPassword, newPassword) {
        return this.request('/auth/change-password', 'POST', { oldPassword, newPassword });
    },

    withdraw(amount, address) {
        return this.request('/withdraw', 'POST', { amount, address });
    }
};
