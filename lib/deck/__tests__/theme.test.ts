import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themeFor } from '../theme.ts';

test('covers, statements, closings default dark; content default light', () => {
  assert.equal(themeFor('cover', undefined), 'dark');
  assert.equal(themeFor('statement', undefined), 'dark');
  assert.equal(themeFor('closing', undefined), 'dark');
  assert.equal(themeFor('bullets', undefined), 'light');
  assert.equal(themeFor('gantt', undefined), 'light');
});

test('explicit override wins', () => {
  assert.equal(themeFor('bullets', 'dark'), 'dark');
  assert.equal(themeFor('cover', 'light'), 'light');
});
