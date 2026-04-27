import {
  AUTH_SESSION_STORAGE_KEY,
  AUTH_SESSION_TTL_MS,
} from './config';

const SESSION_VERSION = 1;

function isBrowser() {
  return typeof window !== 'undefined';
}

function isValidStoredSession(session) {
  return (
    session &&
    typeof session === 'object' &&
    session.version === SESSION_VERSION &&
    session.authenticated === true &&
    typeof session.issuedAt === 'number' &&
    typeof session.expiresAt === 'number' &&
    session.expiresAt > Date.now() &&
    session.user &&
    typeof session.user === 'object'
  );
}

export function clearSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

export function loadSession() {
  if (!isBrowser()) {
    return null;
  }

  const stored = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(stored);
  } catch {
    clearSession();
    return null;
  }

  if (!isValidStoredSession(parsed)) {
    clearSession();
    return null;
  }

  return parsed;
}

export function hasValidSession() {
  return Boolean(loadSession());
}

export function saveSession(user) {
  if (!isBrowser()) {
    return null;
  }

  const issuedAt = Date.now();
  const session = {
    version: SESSION_VERSION,
    authenticated: true,
    issuedAt,
    expiresAt: issuedAt + AUTH_SESSION_TTL_MS,
    user: {
      id: user?.id,
      display_name: user?.display_name,
      email: user?.email,
    },
  };

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}
