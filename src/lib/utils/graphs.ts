// graphs.ts
import poolData from '../data/pools.json';
import { ADA_CIRCULATING, ADA_RESERVES } from './constants';
import type { Env } from '$lib/utils/types';
import type { SaturationMode, RewardsMode, SliderParameters } from '$lib/stores/store';

export interface Pool {
	pool_id_bech32: string;
	ticker: string;
	pledge: number;
	active_stake: number;
	group: string;
}

export const pools: Pool[] = poolData
	.map((pool) => ({
		...pool,
		active_stake: pool.active_stake,
		pledge: Math.min(pool.active_stake, pool.pledge)
	}))
	.filter((pool) => pool.active_stake > 0);

export function getSaturationCapLinear(
	k: number,
	L: number,
	maxX: number,
	stepSizeX: number
): { x: number; y: number }[] {
	const baseCap = ADA_CIRCULATING / k;
	const points: { x: number; y: number }[] = [];
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
	const F = 10_000_000;
	const τ = (L2 / 100) * maxX;
	const points: { x: number; y: number }[] = [];
	for (let x = 0; x <= maxX; x += stepSizeX / 8) {
		const normalized = 1 - Math.exp(-x / τ);
		points.push({ x, y: baseCap + F * L * normalized });
	}
	return points;
}

export const satCapFns: Record<SaturationMode, (pledge: number, env: Env, maxX: number) => number> =
	{
		current: (_pledge, { k, ADA_CIRCULATING }) => ADA_CIRCULATING / k,
		linear: (pledge, { k, L, ADA_CIRCULATING }) => ADA_CIRCULATING / k + L * pledge,
		exponential: (pledge, { k, L, L2, ADA_CIRCULATING }, maxX) => {
			const baseCap = ADA_CIRCULATING / k;
			const τ = (L2 / 100) * maxX;
			return baseCap + 10_000_000 * L * (1 - Math.exp(-pledge / τ));
		},
		'cip-50': (pledge, { k, L, ADA_CIRCULATING }) => {
			const effL = Math.max(L, 0.1);
			return Math.min(effL * pledge, ADA_CIRCULATING / k);
		},
		'cip-7': (_pledge, { k, ADA_CIRCULATING }) => ADA_CIRCULATING / k
	};

export function getRewards(
	poolStake: number,
	poolPledge: number,
	params: SliderParameters,
	maxX: number,
	saturationMode: SaturationMode,
	rewardsMode: RewardsMode
): number {
	const { k, a0, L, L2, crossover, curveRoot, rho, tau } = params;
	const supply = ADA_CIRCULATING;

	const sigma = poolStake / supply;
	let s = poolPledge / supply;
	if (saturationMode === 'cip-7') {
		const effCrossover = supply / (k * crossover);
		s =
			(Math.pow(poolPledge, 1 / curveRoot) * Math.pow(effCrossover, (curveRoot - 1) / curveRoot)) /
			supply;
	}

	const capEnv: Env = { k, L, L2, ADA_CIRCULATING };
	const satCap = satCapFns[saturationMode](poolPledge, capEnv, maxX);
	const z0 = satCap / supply;

	const sigmaP = Math.min(sigma, z0);
	const sP = Math.min(s, z0);

	const inner = sigmaP - (sP * (z0 - sigmaP)) / z0;
	const f = sigmaP + sP * a0 * (inner / z0);

	const rewardsPot = rho * ADA_RESERVES * (1 - tau);
	const divisor = rewardsMode === 'max' ? 1 : 1 + a0;
	const rewardPerEpoch = (rewardsPot / divisor) * f;

	const roiEpoch = rewardPerEpoch / poolStake;
	return roiEpoch * 73 * 100;
}
