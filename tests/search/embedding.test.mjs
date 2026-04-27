import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SEARCH_VECTOR_DIMS,
  embedText,
  tokenizeSearchText,
} from '../../shared/search/embedding.mjs';

function vectorMagnitude(vector) {
  return Math.hypot(...vector);
}

test('tokenizeSearchText returns stable filtered tokens', () => {
  const tokens = tokenizeSearchText('The Beaver Builder BRANDING settings for 2026!');
  assert.deepEqual(tokens, ['beaver', 'builder', 'branding', 'settings', '2026']);
});

test('embedText returns deterministic vectors', () => {
  const first = embedText('beaver builder branding');
  const second = embedText('beaver builder branding');

  assert.equal(first.length, SEARCH_VECTOR_DIMS);
  assert.deepEqual(first, second);
});

test('embedText normalizes non-empty vectors', () => {
  const vector = embedText('gravity forms cloudflare turnstile setup guide');
  const magnitude = vectorMagnitude(vector);

  assert.ok(Math.abs(magnitude - 1) < 0.00001, `expected normalized vector, got magnitude ${magnitude}`);
});

test('embedText returns a zero vector for empty text', () => {
  const vector = embedText('   ');
  const magnitude = vectorMagnitude(vector);

  assert.equal(magnitude, 0);
  assert.ok(vector.every((value) => value === 0));
});
