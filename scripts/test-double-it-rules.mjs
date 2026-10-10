// Local emulator only. No production project, credentials or dependencies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:9000';
const ns = 'demo-quivro-double-it-default-rtdb';
let serial = 0;
async function request(path, method = 'GET', body, owner = false) {
  const response = await fetch(`${base}/${path}.json?ns=${ns}`, {
    method, headers: { 'Content-Type': 'application/json', ...(owner ? { Authorization: 'Bearer owner' } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { ok: response.ok, status: response.status, body: await response.json() };
}
async function setup(overrides = {}) {
  const code = `TEST${++serial}`;
  const now = Date.now();
  const room = { phase: 'question', roundId: 'round-a', hostSessionId: 'host-a',
    currentIndex: 0, totalQuestions: 3, config: { powerUpSlots: { 0: 'double_it', 1: 'double_it', 2: 'fifty_fifty' } },
    currentQuestion: { index: 0, answerOpensAt: now - 1000, endsAt: now + 60000 },
    players: Object.fromEntries(['p1', 'p2', 'p3'].map(id => [id, { id, name: id, avatar: 0, score: 0 }])), ...overrides };
  assert.equal((await request(`rooms/${code}`, 'PUT', room, true)).ok, true);
  return { code, room };
}
const tap = (roundId = 'round-a', index = 0, slot = 0) => ({ type: 'double_it', slot, roundId, questionIndex: index, at: Date.now() });
function commit(previous = '', player = '', req) {
  return { id: `commit-${++serial}`, previous, hostSessionId: 'host-a', requestPlayer: player,
    requestAt: req?.at ?? 0, requestSlot: req?.slot ?? -1, requestType: req?.type ?? '' };
}
function acceptance(player, req, previous = '') {
  return { hostCommit: commit(previous, player, req), [`powerUpRequests/${player}`]: null,
    [`powerUps/${player}/used/${req.slot}`]: req.questionIndex,
    [`questionBoosts/${req.questionIndex + 1}/${player}`]: {
      roundId: req.roundId, sourceIndex: req.questionIndex, slot: req.slot, name: player, at: Date.now() } };
}

test('simultaneous host commits cannot overwrite each other; retry stacks exactly once', async () => {
  const { code } = await setup();
  const a = tap(), b = tap();
  for (const [player, req] of [['p1', a], ['p2', b]]) assert.equal((await request(`rooms/${code}/powerUpRequests/${player}`, 'PUT', req)).ok, true);
  const results = await Promise.all([request(`rooms/${code}`, 'PATCH', acceptance('p1', a)), request(`rooms/${code}`, 'PATCH', acceptance('p2', b))]);
  assert.equal(results.filter(r => r.ok).length, 1, JSON.stringify(results));
  let state = (await request(`rooms/${code}`)).body;
  const loser = results[0].ok ? 'p2' : 'p1';
  const req = loser === 'p2' ? b : a;
  assert.equal((await request(`rooms/${code}`, 'PATCH', acceptance(loser, req, state.hostCommit.id))).ok, true);
  state = (await request(`rooms/${code}`)).body;
  assert.equal(Object.keys(state.questionBoosts[1]).length + 1, 3);
  assert.equal((await request(`rooms/${code}`, 'PATCH', acceptance(loser, req, state.hostCommit.id))).ok, false);
  assert.equal((await request(`rooms/${code}/players/p1`, 'DELETE')).ok, true);
  assert.equal(Object.keys((await request(`rooms/${code}/questionBoosts/1`)).body).length, 2);
});

test('reveal wins the boundary race: late acceptance is rejected without spending', async () => {
  const { code } = await setup(); const req = tap();
  await request(`rooms/${code}/powerUpRequests/p1`, 'PUT', req);
  assert.equal((await request(`rooms/${code}`, 'PATCH', { phase: 'reveal', hostCommit: commit() })).ok, true);
  const state = (await request(`rooms/${code}`)).body;
  assert.equal((await request(`rooms/${code}`, 'PATCH', acceptance('p1', req, state.hostCommit.id))).ok, false);
  assert.equal((await request(`rooms/${code}/powerUps/p1/used`)).body, null);
});

test('deadline, final question, stale round, and preview cannot request Double it', async () => {
  for (const overrides of [
    { totalQuestions: 1 },
    { roundId: 'round-b' },
    { currentQuestion: { answerOpensAt: Date.now() + 60000, endsAt: Date.now() + 90000 } },
    { currentQuestion: { answerOpensAt: 1, endsAt: Date.now() - 1 } },
  ]) {
    const { code } = await setup(overrides);
    assert.equal((await request(`rooms/${code}/powerUpRequests/p1`, 'PUT', tap())).ok, false);
  }
});

test('used or locked players cannot spend; the next question allows another slot', async () => {
  for (const powerUps of [{ p1: { used: { 2: 0 } } }, { p1: { locked: { 0: { blank: true } } } }]) {
    const { code } = await setup({ powerUps }); const req = tap();
    await request(`rooms/${code}/powerUpRequests/p1`, 'PUT', req);
    assert.equal((await request(`rooms/${code}`, 'PATCH', acceptance('p1', req))).ok, false);
    assert.equal((await request(`rooms/${code}/powerUps/p1/used/0`)).body, null);
  }
  const { code } = await setup({ currentIndex: 1, powerUps: { p1: { used: { 0: 0 } } } });
  const req = tap('round-a', 1, 1);
  assert.equal((await request(`rooms/${code}/powerUpRequests/p1`, 'PUT', req)).ok, true);
  assert.equal((await request(`rooms/${code}`, 'PATCH', acceptance('p1', req))).ok, true);
});

test('a resolver cannot clear a newer request; a previous host cannot commit', async () => {
  const { code } = await setup(); const old = tap(); const newer = { ...old, at: old.at + 1, slot: 1 };
  await request(`rooms/${code}/powerUpRequests/p1`, 'PUT', newer);
  assert.equal((await request(`rooms/${code}`, 'PATCH', acceptance('p1', old))).ok, false);
  assert.deepEqual((await request(`rooms/${code}/powerUpRequests/p1`)).body, newer);
  await request(`rooms/${code}/hostSessionId`, 'PUT', 'host-b', true);
  assert.equal((await request(`rooms/${code}`, 'PATCH', acceptance('p1', newer))).ok, false);
});

test('only one reveal can commit scores from the same revision', async () => {
  const { code } = await setup();
  const patch = () => ({ phase: 'reveal', 'players/p1/score': 3, hostCommit: commit() });
  const results = await Promise.all([request(`rooms/${code}`, 'PATCH', patch()), request(`rooms/${code}`, 'PATCH', patch())]);
  assert.equal(results.filter(r => r.ok).length, 1);
  assert.equal((await request(`rooms/${code}/players/p1/score`)).body, 3);
});
