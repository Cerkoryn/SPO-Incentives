import assert from 'node:assert/strict';
import test from 'node:test';
import {
	getEffectivePoolValues,
	getSaturationTotals,
	getSnapshotPoolValues
} from '../.svelte-kit/tests/pool-display.js';

/** @param {number} actual @param {number} expected @param {number} tolerance */
function close(actual, expected, tolerance) {
	assert.ok(
		Math.abs(actual - expected) <= tolerance,
		`${actual} should be within ${tolerance} of ${expected}`
	);
}

test('unscaled Current values and invalid-pledge clamping match the reward inputs', () => {
	assert.deepEqual(getEffectivePoolValues(100, 5), { stake: 100, pledge: 5 });
	assert.deepEqual(getEffectivePoolValues(100, 150, 2), { stake: 200, pledge: 200 });
	assert.deepEqual(getEffectivePoolValues(0, 5, 2), { stake: 0, pledge: 0 });
});

test('the recorded below-line regression becomes above-cap with the selected ratio', () => {
	const supply = 37_748_655_639;
	const totalSnapshotStake = 21_336_082_940;
	const rawStake = 71_681_880;
	const cap = supply / 500;
	const scale = (supply * 0.6) / totalSnapshotStake;
	const point = getEffectivePoolValues(rawStake, 500_000, scale);
	assert.ok(rawStake < cap);
	assert.ok(point.stake > cap);
	assert.deepEqual(
		getSaturationTotals([point], () => cap),
		{
			above: point.stake,
			below: 0,
			excess: point.stake - cap
		}
	);
});

test('cap equality stays below-or-at and excess excludes the rewarded portion', () => {
	const pools = [
		{ stake: 100, pledge: 5 },
		{ stake: 50, pledge: 5 },
		{ stake: 20, pledge: 5 }
	];
	assert.deepEqual(
		getSaturationTotals(pools, () => 50),
		{ above: 100, below: 70, excess: 50 }
	);
	assert.deepEqual(
		getSaturationTotals([], () => 50),
		{ above: 0, below: 0, excess: 0 }
	);
});

test('L-cap totals use adjusted stake and adjusted eligible pledge together', () => {
	const values = [getEffectivePoolValues(100, 5, 0.5), getEffectivePoolValues(20, 5, 0.5)];
	assert.deepEqual(
		getSaturationTotals(values, (pool) => 10 * pool.pledge),
		{
			above: 50,
			below: 10,
			excess: 25
		}
	);
});

test('repeated display updates derive from snapshot inputs without accumulating scaling', () => {
	const input = { stake: 100, pledge: 5 };
	for (const scale of [0.5, 1.5, 1.5, 1, 0.5]) {
		const point = getEffectivePoolValues(input.stake, input.pledge, scale);
		assert.equal(point.stake, 100 * scale);
		assert.equal(point.pledge, 5 * scale);
	}
	assert.deepEqual(input, { stake: 100, pledge: 5 });
});

test('drag inversion accounts for the moved pool changing the common scale', () => {
	const otherStake = 21_336_082_940;
	for (const activeStake of [11_324_596_691.7, 22_649_193_383.4, 37_748_655_639]) {
		for (const otherCustomStake of [0, 40_000_000]) {
			const target = { stake: 150_000_000, pledge: 20_000_000 };
			const other = otherStake + otherCustomStake;
			const input = getSnapshotPoolValues(target, other, activeStake);
			const newScale = activeStake / (other + input.stake);
			const result = getEffectivePoolValues(input.stake, input.pledge, newScale);
			close(result.stake, target.stake, 1);
			close(result.pledge, target.pledge, 1);
		}
	}
});

test('drag inversion remains finite at empty and impossible target bounds', () => {
	assert.deepEqual(getSnapshotPoolValues({ stake: 10, pledge: 5 }, 100, 0), {
		stake: 0,
		pledge: 0
	});
	const input = getSnapshotPoolValues({ stake: 200, pledge: 10 }, 100, 200);
	assert.ok(Number.isFinite(input.stake) && Number.isFinite(input.pledge));
	const scale = 200 / (100 + input.stake);
	assert.ok(getEffectivePoolValues(input.stake, input.pledge, scale).stake < 200);
});
