// Client-safe copy of the password rule (lib/password.js pulls in Node's crypto, which the browser can't load).
export const MIN_PASSWORD_LENGTH = 8;
