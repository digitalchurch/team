export const SEARCH_VECTOR_DIMS = 96;

const DEFAULT_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'if',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'with',
]);

const TOKEN_REGEX = /[a-z0-9][a-z0-9_-]{1,}/g;

function fnv1aHash(input, seed = 0x811c9dc5) {
  let hash = seed >>> 0;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function sanitizeSearchText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function tokenizeSearchText(value = '') {
  const sanitized = sanitizeSearchText(value);
  const tokens = sanitized.match(TOKEN_REGEX) || [];

  return tokens.filter(
    (token) => token.length > 1 && token.length <= 48 && !DEFAULT_STOP_WORDS.has(token),
  );
}

export function createZeroVector(dims = SEARCH_VECTOR_DIMS) {
  return Array.from({length: dims}, () => 0);
}

export function normalizeVector(vector) {
  const magnitude = Math.hypot(...vector);
  if (!magnitude || !Number.isFinite(magnitude)) {
    return createZeroVector(vector.length);
  }

  return vector.map((value) => value / magnitude);
}

export function embedText(text, dims = SEARCH_VECTOR_DIMS) {
  const tokens = tokenizeSearchText(text);
  if (!tokens.length) {
    return createZeroVector(dims);
  }

  const vector = createZeroVector(dims);
  const termFrequency = new Map();

  tokens.forEach((token) => {
    termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
  });

  for (const [token, count] of termFrequency.entries()) {
    const weight = 1 + Math.log(count);
    const primaryHash = fnv1aHash(token, 0x811c9dc5);
    const secondaryHash = fnv1aHash(token, 0x165667b1);

    const primaryIndex = primaryHash % dims;
    const secondaryIndex = secondaryHash % dims;

    vector[primaryIndex] += (primaryHash & 1 ? 1 : -1) * weight;
    vector[secondaryIndex] += (secondaryHash & 1 ? 1 : -1) * weight * 0.5;
  }

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const bigram = `${tokens[index]}_${tokens[index + 1]}`;
    const hash = fnv1aHash(bigram, 0x9e3779b1);
    const offset = hash % dims;
    vector[offset] += (hash & 1 ? 1 : -1) * 0.35;
  }

  return normalizeVector(vector);
}
