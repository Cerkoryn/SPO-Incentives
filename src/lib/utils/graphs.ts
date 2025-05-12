import poolData from '../data/pools.json';
import { ADA_CIRCULATING, ADA_RESERVES } from './constants';
import type { Env } from '$lib/utils/types';
import type { SaturationMode, RewardsMode } from '$lib/stores/store';

export interface Pool {
	pool_id_bech32: string;
	ticker: string;
	pledge: number;
	active_stake: number;
	group: string;
}

export const pools: Pool[] = poolData
	.map((pool) => {
		const active_stake = Math.max(pool.active_stake, pool.pledge);
		const pledge = pool.active_stake < pool.pledge ? pool.active_stake : pool.pledge;
		return {
			...pool,
			active_stake,
			pledge
		};
	})
	.filter((pool) => pool.active_stake > 0);

export function getSaturationCapLinear(
	k: number,
	L: number,
	maxX: number,
	stepSizeX: number
): { x: number; y: number }[] {
	const baseCap = ADA_CIRCULATING / k;
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
	const baseCap = ADA_CIRCULATING / k;
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

export const satCapFns: Record<SaturationMode, (pledge: number, env: Env, maxX: number) => number> =
	{
		/** Existing formula: (circ / k) */
		current: (_pledge, { k, ADA_CIRCULATING }, _maxX) => ADA_CIRCULATING / k,

		/** Linear: (circ / k) + L · pledge */
		linear: (pledge, { k, L, ADA_CIRCULATING }, _maxX) => ADA_CIRCULATING / k + L * pledge,

		/** Exponential: (circ / k) + sc·L·(1 − e^(−pledge/sc)) */
		exponential: (pledge, { k, L, L2, ADA_CIRCULATING }, maxX) => {
			const baseCap = ADA_CIRCULATING / k;
			const F = 10_000_000;
			const τ = (L2 / 100) * maxX;
			return baseCap + F * L * (1 - Math.exp(-pledge / τ));
		}
	};

export function getRewards(
	poolStake: number,
	poolPledge: number,
	k: number,
	a0: number,
	L: number,
	L2: number,
	maxX: number,
	saturationMode: SaturationMode,
	rewardsMode: RewardsMode,
	rho: number,
	tau: number
): number {
	// Convert absolute ADA values to relative fractions
	const sigma = poolStake / ADA_CIRCULATING; // σ
	const s = poolPledge / ADA_CIRCULATING; // s

	const env: Env = { k: k, L: L, L2: L2, ADA_CIRCULATING }; // We need to determine saturation cap here
	const satCap = satCapFns[saturationMode](poolPledge, env, maxX); // Pass maxX explicitly for exponential mode
	const z0 = satCap / ADA_CIRCULATING; // Use the calculated value for z0 going forward

	const sigmaP = Math.min(sigma, z0); // σ′
	const sP = Math.min(s, z0); // s′

	const inner = sigmaP - (sP * (z0 - sigmaP)) / z0;
	const f = sigmaP + sP * a0 * (inner / z0);

	// compute treasury cut and rewards pot based on rho and tau
	const treasuryCut = rho * ADA_RESERVES * tau;
	const rewardsPot = rho * ADA_RESERVES - treasuryCut;
	// pool reward share: current vs full rewards modes
	const rewardPerEpoch = rewardsMode === 'current' ? (rewardsPot / (1 + a0)) * f : rewardsPot * f;
	const roiEpoch = rewardPerEpoch / poolStake; // per-ADA
	return roiEpoch * 73 * 100; // annualised %
}
