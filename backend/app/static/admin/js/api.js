// API Client Module
// Handles backend communication with auth headers

const API_CONFIG = {
    BASE_URL: '/api/v1'
};

class ApiClient {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    // Helper to get headers with auth token
    getHeaders(contentType = 'application/json') {
        const headers = {
            'Content-Type': contentType
        };

        const token = getAuthToken(); // From auth.js
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    // Generic request handler
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 Unauthorized
            if (response.status === 401) {
                console.warn('Unauthorized access, redirecting to login...');
                logout(); // From auth.js
                return null;
            }

            // Parse JSON if content type is json
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || data.message || 'API request failed');
                }

                return data;
            }

            if (!response.ok) {
                throw new Error('API request failed');
            }

            return response;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // HTTP Methods
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

const api = new ApiClient();
