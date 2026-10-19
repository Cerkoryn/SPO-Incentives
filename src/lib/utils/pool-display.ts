export interface PoolValues {
	stake: number;
	pledge: number;
}

/** Use the same scaled stake and capped pledge for rewards, points and counters. */
export function getEffectivePoolValues(stake: number, pledge: number, stakeScale = 1): PoolValues {
	const scaledStake = stake * stakeScale;
	return { stake: scaledStake, pledge: Math.min(pledge * stakeScale, scaledStake) };
}

/** Whole-pool totals and the distinct amount actually beyond the selected cap. */
export function getSaturationTotals(pools: PoolValues[], capForPool: (pool: PoolValues) => number) {
	let above = 0;
	let below = 0;
	let excess = 0;
	for (const pool of pools) {
		const cap = capForPool(pool);
		if (pool.stake > cap) {
			above += pool.stake;
			excess += pool.stake - cap;
		} else {
			below += pool.stake;
		}
	}
	return { above, below, excess };
}

/**
 * Convert a dragged effective point back to the snapshot inputs.
 * The moved pool changes the scale too: effectiveStake = A * rawStake / (B + rawStake),
 * where A is active stake and B is all other pools' snapshot stake.
 */
export function getSnapshotPoolValues(
	pool: PoolValues,
	otherSnapshotStake: number,
	activeStake: number
): PoolValues {
	if (activeStake <= 0 || otherSnapshotStake <= 0) {
		return { stake: 0, pledge: 0 };
	}
	const effectiveStake = Math.min(Math.max(0, pool.stake), Math.max(0, activeStake - 1));
	const snapshotStake = (effectiveStake * otherSnapshotStake) / (activeStake - effectiveStake);
	const scale = activeStake / (otherSnapshotStake + snapshotStake);
	return {
		stake: Math.round(snapshotStake),
		pledge: Math.round(Math.max(0, pool.pledge) / scale)
	};
}
