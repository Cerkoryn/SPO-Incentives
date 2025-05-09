import poolData from '../data/pools.json';
import { ADA_TOTAL_SUPPLY, ADA_RESERVES, ADA_CIRCULATING, REWARDS_POT } from './constants';
import { satCapFns, type Env } from '$lib/utils/types';
import type { SaturationMode, RewardsMode } from '$lib/stores/store';

export interface Pool {
	pool_id_bech32: string;
	ticker: string;
	pledge: number;
	active_stake: number;
	group: string;
}

/**
 * Load and sanitize pool data: ensure active_stake is at least the pledge amount.
 * Pools cannot earn rewards if stake < pledge, so we clamp active_stake accordingly.
 */
export const pools: Pool[] = poolData.map((pool) => ({
	...pool,
	active_stake: Math.max(pool.active_stake, pool.pledge)
}));

export function getSaturationCapLinear(
	k: number,
	L: number,
	maxX: number,
	stepSizeX: number
): { x: number; y: number }[] {
	const baseCap = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;
	const points = [];
	for (let x = 0; x <= maxX; x += stepSizeX) {
		points.push({ x, y: baseCap + L * x });
	}
	return points;
}

export function getSaturationCapExpSaturation(
	k: number,
	L: number,
	L2: number,
	maxX: number,
	stepSizeX: number
): { x: number; y: number }[] {
	const baseCap = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;
	const F = 10_000_000; // constant to map bump to our y-values (stake ranges)
	const points: { x: number; y: number }[] = [];

	// map L2 to values roughly corresponding to our x-values (pledge ranges)
	const τ = (L2 / 100) * maxX;

	for (let x = 0; x <= maxX; x += stepSizeX / 8) {
		// Denominator here just to change resolution of jagged edges in chart
		const normalized = 1 - Math.exp(-x / τ);
		const bump = F * L * normalized;
		points.push({ x, y: baseCap + bump });
	}

	return points;
}

export function getRewards(
	poolStake: number,
	poolPledge: number,
	k: number,
	a0: number,
	L: number,
	L2: number,
	saturationMode: SaturationMode,
	rewardsMode: RewardsMode
): number {
	// Convert absolute ADA values to relative fractions
	const sigma = poolStake / ADA_CIRCULATING; // σ
	const s = poolPledge / ADA_CIRCULATING; // s

	const env: Env = { k: k, L: L, L2: L2, ADA_CIRCULATING }; // We need to determine saturation cap here
	const satCap = satCapFns[saturationMode](poolPledge, env); // Switch between the three saturation modes to determine formula
	const z0 = satCap / ADA_CIRCULATING; // Use the calculated value for z0 going forward

	const sigmaP = Math.min(sigma, z0); // σ′
	const sP = Math.min(s, z0); // s′

	const inner = sigmaP - (sP * (z0 - sigmaP)) / z0;
	const f = sigmaP + sP * a0 * (inner / z0);

	// pool reward share: current vs full rewards modes
	const rewardPerEpoch = rewardsMode === 'current' ? (REWARDS_POT / (1 + a0)) * f : REWARDS_POT * f;
	const roiEpoch = rewardPerEpoch / poolStake; // per-ADA
	return roiEpoch * 73 * 100; // annualised %
}
