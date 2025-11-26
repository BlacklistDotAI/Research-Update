// Authentication Module
// Handles login, logout, and JWT token management

const AUTH_CONFIG = {
    API_BASE: '/api/v1',  // Backend API prefix
    TOKEN_KEY: 'admin_token',
    REFRESH_TOKEN_KEY: 'admin_refresh_token',
    USER_KEY: 'admin_user',
};

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) return false;

    // Check if token is expired (basic check)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() < exp;
    } catch (e) {
        return false;
    }
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
}

// Save auth tokens
function saveTokens(accessToken, refreshToken) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, accessToken);
    if (refreshToken) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
    }
}

// Extract username from token
function getUsernameFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || 'Admin';
    } catch (e) {
        return 'Admin';
    }
}

// Login function
async function login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${AUTH_CONFIG.API_BASE}/admin/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    saveTokens(data.access_token, data.refresh_token);

    // Save username
    const username_from_token = getUsernameFromToken(data.access_token);
    localStorage.setItem(AUTH_CONFIG.USER_KEY, username_from_token);

    return data;
}

// Logout function
async function logout() {
    const token = getAuthToken();

    if (token) {
        try {
            await fetch(`${AUTH_CONFIG.API_BASE}/admin/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
        } catch (e) {
            console.error('Logout API error:', e);
        }
    }

    // Clear local storage
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);

    // Redirect to login
    window.location.href = '/static/admin/login.html';
}

// Auto-redirect to login if not authenticated (for protected pages)
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/static/admin/login.html';
        return false;
    }
    return true;
}

// Auto-redirect to dashboard if already authenticated (for login page)
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = '/static/admin/index.html';
    }
}

// Handle login form submission
if (document.getElementById('loginForm')) {
    // Redirect if already logged in
    redirectIfAuthenticated();

    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const successMessage = document.getElementById('successMessage');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');
    const buttonLoader = document.getElementById('buttonLoader');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide messages
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        // Show loading state
        loginButton.disabled = true;
        buttonText.classList.add('hidden');
        buttonLoader.classList.remove('hidden');

        try {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            await login(username, password);

            // Show success
            successMessage.classList.remove('hidden');

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '/static/admin/index.html';
            }, 1000);

        } catch (error) {
            // Show error
            errorText.textContent = error.message;
            errorMessage.classList.remove('hidden');

            // Reset button
            loginButton.disabled = false;
            buttonText.classList.remove('hidden');
            buttonLoader.classList.add('hidden');
        }
    });
}
