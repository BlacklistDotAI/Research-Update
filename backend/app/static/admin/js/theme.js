// Theme Management
const THEME_KEY = 'admin_theme';

function initTheme() {
    const theme = localStorage.getItem(THEME_KEY) || 'dark';
    setTheme(theme);

    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const current = localStorage.getItem(THEME_KEY) || 'dark';
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }
}

function setTheme(theme) {
    const html = document.documentElement;
    const body = document.body;
    const icon = document.querySelector('#themeToggle span');

    if (theme === 'light') {
        html.classList.remove('dark');
        body.classList.remove('bg-slate-900', 'text-white');
        body.classList.add('bg-gray-100', 'text-slate-900');

        // Update icon
        if (icon) icon.textContent = 'light_mode';

        // Update CSS variables for glassmorphism
        document.documentElement.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.7)');
        document.documentElement.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.05)');
    } else {
        html.classList.add('dark');
        body.classList.add('bg-slate-900', 'text-white');
        body.classList.remove('bg-gray-100', 'text-slate-900');

        if (icon) icon.textContent = 'dark_mode';

        document.documentElement.style.setProperty('--glass-bg', 'rgba(30, 41, 59, 0.5)');
        document.documentElement.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.05)');
    }

    localStorage.setItem(THEME_KEY, theme);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initTheme);
