// Run against the local Firebase emulator only; no production credentials.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:9000';
const ns = 'demo-quivro-double-it-default-rtdb';
async function write(path, body, method = 'PUT') {
  const response = await fetch(`${base}/rooms/${path}.json?ns=${ns}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return response.ok;
}

test('questionSeconds is validated at creation and on nested or multi-path updates', async () => {
  for (const [i, seconds] of [5, 10, 15, 20, 30, 45, 60, 4, 61, 15.5, '60', true].entries()) {
    const valid = typeof seconds === 'number' && Number.isInteger(seconds) && seconds >= 5 && seconds <= 60;
    const code = `TIMERCONFIG${i}`;
    await write(code, null);
    assert.equal(await write(code, { config: { questionSeconds: seconds } }), valid);
    assert.equal(await write(code, { 'config/questionSeconds': 15 }, 'PATCH'), true);
    assert.equal(await write(`${code}/config/questionSeconds`, seconds), valid);
    assert.equal(await write(code, { 'config/questionSeconds': seconds }, 'PATCH'), valid);
  }
});

test('published question duration uses whole seconds from 5 to 60', async () => {
  const code = 'TIMERDURATION';
  await write(code, null);
  assert.equal(await write(code, { config: { questionSeconds: 60 } }), true);
  for (const durationMs of [5000, 15000, 60000, 4999, 60001, 60500, 15500, '60000']) {
    const valid = typeof durationMs === 'number' && durationMs >= 5000 && durationMs <= 60000 && durationMs % 1000 === 0;
    assert.equal(await write(`${code}/currentQuestion`, { durationMs }), valid);
  }
  assert.equal(await write(`${code}/currentQuestion`, null), true);
});

test('legacy rooms without a timer field and rematch cleanup remain writable', async () => {
  const code = 'TIMERLEGACY';
  await write(code, null);
  assert.equal(await write(code, { phase: 'lobby', config: { roundLength: 10 } }), true);
  assert.equal(await write(code, { phase: 'finished', currentQuestion: null }, 'PATCH'), true);
  assert.equal(await write(code, null), true);
});
