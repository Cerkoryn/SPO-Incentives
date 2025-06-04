// stores.ts
import { writable, derived } from 'svelte/store';
import { ADA_CIRCULATING } from '$lib/utils/constants';

// --- Types -------------------------------------------------------
export interface SliderParameters {
	k: number;
	a0: number;
	L: number;
	L2: number;
	crossover: number;
	curveRoot: number;
	rho: number;
	tau: number;
	stakedRatio: number;
}

export interface GraphSettings {
	maxX: number;
	stepSizeX: number;
}

export interface CustomPool {
	pledge: number;
	stake: number;
}


export interface Cip50StakeTotals {
	aboveL: number;
	belowL: number;
}


export type SaturationMode = 'current' | 'linear' | 'exponential' | 'cip-50' | 'cip-7';
export type RewardsMode = 'current' | 'full' | 'max';
export type ZoomLevel = 'off' | '1x' | '2x' | '3x';

// --- Stores ------------------------------------------------------
export const sliderParams = writable<SliderParameters>({
	k: 500,
	a0: 0.3,
	L: 0,
	L2: 1,
	crossover: 8,
	curveRoot: 3,
	rho: 0.003,
	tau: 0.2,
	stakedRatio: 0.6
});

export const graphSettings = writable<GraphSettings>({
	maxX: 75_000_000,
	stepSizeX: 5_000_000
});

export const showCustomPool = writable<boolean>(false);
export const customPool = writable<CustomPool>({ pledge: 0, stake: 0 });

// Second custom pool
export const showCustomPool2 = writable<boolean>(false);
export const customPool2 = writable<CustomPool>({ pledge: 0, stake: 0 });

export const saturationMode = writable<SaturationMode>('current');
export const zoomLevel = writable<ZoomLevel>('off');
export const rewardsMode = writable<RewardsMode>('current');
export const cip50StakeTotals = writable<Cip50StakeTotals>({ aboveL: 0, belowL: 0 });



export const adaTotalStaked = derived(
	sliderParams,
	($sliderParams) => ADA_CIRCULATING * $sliderParams.stakedRatio
);
