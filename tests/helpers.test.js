import { paginate, getPathFromURL } from '../frontend/src/core/helpers.js';
import assert from 'node:assert';
import test from 'node:test';

test('paginate slices array correctly', () => {
  const data = [1, 2, 3, 4, 5];
  assert.deepStrictEqual(paginate(data, 0, 2), [1, 2]);
  assert.deepStrictEqual(paginate(data, 1, 2), [3, 4]);
  assert.deepStrictEqual(paginate(data, 2, 2), [5]);
});

test('getPathFromURL extracts path parameter', () => {
  assert.strictEqual(getPathFromURL('?path=abc'), 'abc');
  assert.strictEqual(getPathFromURL('?foo=1'), '');
});
