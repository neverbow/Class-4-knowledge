import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, mergeStates, normalizeState } from '../lib/sync-core.js';

const active = (updatedAt, chapter = 'chapter6') => ({ status: 'active', correctStreak: 0, chapter, updatedAt, deviceId: 'device-phone-1' });
const resolved = updatedAt => ({ status: 'resolved', correctStreak: 2, chapter: 'chapter6', updatedAt, deviceId: 'device-pc-0001' });

test('empty PC state never deletes phone mistakes', () => {
    const phone = emptyState();
    phone.mistakes['C4-2026-245'] = active('2026-07-18T10:00:00.000Z');
    const merged = mergeStates(phone, emptyState());
    assert.equal(merged.mistakes['C4-2026-245'].status, 'active');
});

test('newer resolution wins and remains as a tombstone', () => {
    const phone = emptyState();
    const pc = emptyState();
    phone.mistakes['C4-2026-245'] = active('2026-07-18T10:00:00.000Z');
    pc.mistakes['C4-2026-245'] = resolved('2026-07-18T11:00:00.000Z');
    const merged = mergeStates(phone, pc);
    assert.equal(merged.mistakes['C4-2026-245'].status, 'resolved');
});

test('newer wrong answer can reactivate a resolved question', () => {
    const cloud = emptyState();
    const phone = emptyState();
    cloud.mistakes['C4-2026-245'] = resolved('2026-07-18T10:00:00.000Z');
    phone.mistakes['C4-2026-245'] = active('2026-07-18T12:00:00.000Z');
    assert.equal(mergeStates(cloud, phone).mistakes['C4-2026-245'].status, 'active');
});

test('progress and history merge without duplicates', () => {
    const left = { ...emptyState(), practiceProgress: ['C4-2026-201'], history: [{ date: '2026-07-18T10:00:00.000Z', score: 80, mode: 'Mock Exam', class: 'class4-rest' }] };
    const right = { ...emptyState(), practiceProgress: ['C4-2026-202'], history: [...left.history] };
    const merged = mergeStates(left, right);
    assert.deepEqual(merged.practiceProgress.sort(), ['C4-2026-201', 'C4-2026-202']);
    assert.equal(merged.history.length, 1);
});

test('invalid keys and oversized values are normalized out', () => {
    const state = normalizeState({ profile: 'OTHER', mistakes: { bad: active('2026-07-18T10:00:00.000Z') }, practiceProgress: ['bad'] });
    assert.deepEqual(state.mistakes, {});
    assert.deepEqual(state.practiceProgress, []);
    assert.equal(state.profile, 'KENT');
});
