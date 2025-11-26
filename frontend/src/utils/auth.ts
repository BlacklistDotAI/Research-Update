import { setCookie, getCookie, deleteCookie } from './cookies';

const AUTH_KEY = 'chongluadao_user_email';
const COOKIE_EXPIRES_DAYS = 30; // Cookie expires after 30 days

/**
 * Set user email in cookie
 * @param email User email address
 */
export const setUserEmail = (email: string): void => {
  // Save to cookie (primary storage)
  setCookie(AUTH_KEY, email, {
    expires: COOKIE_EXPIRES_DAYS,
    path: '/',
    secure: window.location.protocol === 'https:', // Secure in production
    sameSite: 'lax',
  });

  // Also save to localStorage as backup (optional, for compatibility)
  try {
    localStorage.setItem(AUTH_KEY, email);
  } catch (e) {
    // localStorage might be disabled, ignore
    console.warn('localStorage not available, using cookie only');
  }
};

/**
 * Get user email from cookie (falls back to localStorage)
 * @returns User email or null if not found
 */
export const getUserEmail = (): string | null => {
  // Try cookie first
  const cookieValue = getCookie(AUTH_KEY);
  if (cookieValue) {
    // Sync to localStorage for compatibility
    try {
      localStorage.setItem(AUTH_KEY, cookieValue);
    } catch (e) {
      // Ignore localStorage errors
    }
    return cookieValue;
  }

  // Fallback to localStorage (migration support)
  try {
    const storedValue = localStorage.getItem(AUTH_KEY);
    if (storedValue) {
      // Migrate to cookie
      setUserEmail(storedValue);
      return storedValue;
    }
  } catch (e) {
    // localStorage might be disabled
  }

  return null;
};

/**
 * Remove user email from cookie and localStorage
 */
export const removeUserEmail = (): void => {
  // Delete from cookie
  deleteCookie(AUTH_KEY, {
    path: '/',
  });

  // Also remove from localStorage
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (e) {
    // Ignore localStorage errors
  }
};

/**
 * Check if user is authenticated
 * @returns true if user email exists
 */
export const isAuthenticated = (): boolean => {
  return !!getUserEmail();
};

