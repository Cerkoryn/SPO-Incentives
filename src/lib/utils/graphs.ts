import poolData from '../data/pools.json';
import { ADA_CIRCULATING, ADA_RESERVES } from './constants';
import { adaTotalStaked } from '$lib/stores/store';
import { get } from 'svelte/store';
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
	.map((pool) => {
		const active_stake = pool.active_stake;
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
		},
		/** CIP-50: saturation cap is the lesser of L·pledge or ADA_CIRCULATING/k, with L clamped to min 0.1 */
		'cip-50': (pledge, { k, L, ADA_CIRCULATING }, _maxX) => {
			const effL = L < 0.1 ? 0.1 : L;
			const cap1 = effL * pledge;
			const cap2 = ADA_CIRCULATING / k;
			return Math.min(cap1, cap2);
		},
		/** CIP-7: use modified pledge fraction with crossover and curve root, cap same as current */
		'cip-7': (_pledge, { k, ADA_CIRCULATING }, _maxX) => ADA_CIRCULATING / k
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
	const supply = rewardsMode === 'current' ? ADA_CIRCULATING : get(adaTotalStaked);

	const sigma = poolStake / supply; // σ
	let s: number = poolPledge / supply;

	if (saturationMode === 'cip-7') {
		const effCrossover = supply / (k * crossover);
		s =
			(Math.pow(poolPledge, 1 / curveRoot) * Math.pow(effCrossover, (curveRoot - 1) / curveRoot)) /
			supply;
	}

	const env: Env = { k, L, L2, ADA_CIRCULATING }; // sat-cap stays absolute
	const satCap = satCapFns[saturationMode](poolPledge, env, maxX);
	const z0 = satCap / supply;

	const sigmaP = Math.min(sigma, z0); // σ′
	const sP = Math.min(s, z0); // s′

	const inner = sigmaP - (sP * (z0 - sigmaP)) / z0;
	const f = sigmaP + sP * a0 * (inner / z0);

	const treasuryCut = rho * ADA_RESERVES * tau;
	const rewardsPot = rho * ADA_RESERVES - treasuryCut;

	const divisor = rewardsMode === 'max' ? 1 : 1 + a0;
	const rewardPerEpoch = (rewardsPot / divisor) * f;

	const roiEpoch = rewardPerEpoch / poolStake; // per-ADA
	return roiEpoch * 73 * 100; // annualised %
}
