import {AUTH_LOGIN_ENDPOINT} from './config';

function parseJsonSafely(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function loginWithDigitalChurch({emailOrPhone, password, redirectTo}) {
  let response;

  try {
    response = await fetch(AUTH_LOGIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_or_phone: emailOrPhone,
        password,
        redirect_to: redirectTo,
      }),
    });
  } catch {
    throw new Error('Unable to connect. Please check your connection and try again.');
  }

  const responseText = await response.text();
  const data = parseJsonSafely(responseText);

  if (!response.ok) {
    const fallbackMessage = response.status >= 500
      ? 'Sign-in is temporarily unavailable. Please try again in a moment.'
      : 'Invalid login credentials.';
    throw new Error(data?.message || fallbackMessage);
  }

  if (!data?.success || !data?.user) {
    throw new Error('Sign-in failed. Please try again.');
  }

  return data;
}
