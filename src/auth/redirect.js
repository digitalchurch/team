import {
  AUTH_ROUTE_PATH,
  DEFAULT_AUTH_REDIRECT_PATH,
} from './config';

function decodeRedirectValue(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function sanitizeInternalRedirect(value, fallback = DEFAULT_AUTH_REDIRECT_PATH) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const decoded = decodeRedirectValue(value).trim();
  if (!decoded.startsWith('/')) {
    return fallback;
  }

  if (decoded.startsWith('//')) {
    return fallback;
  }

  if (decoded === AUTH_ROUTE_PATH || decoded.startsWith(`${AUTH_ROUTE_PATH}/`) || decoded.startsWith(`${AUTH_ROUTE_PATH}?`) || decoded.startsWith(`${AUTH_ROUTE_PATH}#`)) {
    return fallback;
  }

  try {
    const parsed = new URL(decoded, 'https://digitalchurch.team');
    if (parsed.origin !== 'https://digitalchurch.team') {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function buildAuthRedirectPath(targetPath) {
  return `${AUTH_ROUTE_PATH}?redirect=${encodeURIComponent(targetPath)}`;
}
