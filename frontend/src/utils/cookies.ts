/**
 * Cookie utility functions
 * Supports setting, getting, and deleting cookies with expiration
 */

interface CookieOptions {
  expires?: number | Date; // Days if number, or Date object
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Set a cookie
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options
 */
export const setCookie = (
  name: string,
  value: string,
  options: CookieOptions = {}
): void => {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  // Handle expiration
  if (options.expires) {
    let expiresDate: Date;
    if (typeof options.expires === 'number') {
      expiresDate = new Date();
      expiresDate.setTime(expiresDate.getTime() + options.expires * 24 * 60 * 60 * 1000);
    } else {
      expiresDate = options.expires;
    }
    cookieString += `; expires=${expiresDate.toUTCString()}`;
  }

  // Path
  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += '; path=/'; // Default to root path
  }

  // Domain
  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  // Secure flag (HTTPS only)
  if (options.secure) {
    cookieString += '; secure';
  }

  // SameSite
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
};

/**
 * Get a cookie value by name
 * @param name Cookie name
 * @returns Cookie value or null if not found
 */
export const getCookie = (name: string): string | null => {
  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
};

/**
 * Delete a cookie
 * @param name Cookie name
 * @param options Cookie options (must match original cookie settings)
 */
export const deleteCookie = (
  name: string,
  options: CookieOptions = {}
): void => {
  // Set expiration to past date to delete
  setCookie(name, '', {
    ...options,
    expires: new Date(0),
  });
};

/**
 * Check if a cookie exists
 * @param name Cookie name
 * @returns true if cookie exists
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

