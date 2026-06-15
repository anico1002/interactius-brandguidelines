import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGantt } from '../blocks.ts';

test('parses weeks, rows with ranges, and milestones', () => {
  const g = parseGantt('semanas: 8\nDiagnóstico: 1\nDiscovery: 2-3\nVolumetría: 4-8\nhitos cliente: 1, 3, 5, 8');
  assert.equal(g.weeks, 8);
  assert.deepEqual(g.rows[0], { label: 'Diagnóstico', start: 1, end: 1, accent: 'opal' });
  assert.deepEqual(g.rows[1], { label: 'Discovery', start: 2, end: 3, accent: 'bordeaux' });
  assert.deepEqual(g.rows[2], { label: 'Volumetría', start: 4, end: 8, accent: 'emerald' });
  assert.deepEqual(g.milestones, [1, 3, 5, 8]);
});

test('parses half-week endpoints and a bare fractional value', () => {
  const g = parseGantt('semanas: 8\nKick Off: 0.5\nDiscovery: 2-3.5\nCierre: 4-4.5');
  assert.deepEqual(g.rows[0], { label: 'Kick Off', start: 1, end: 1.5, accent: 'opal' });
  assert.deepEqual(g.rows[1], { label: 'Discovery', start: 2, end: 3.5, accent: 'bordeaux' });
  assert.deepEqual(g.rows[2], { label: 'Cierre', start: 4, end: 4.5, accent: 'emerald' });
});
