import { writable, derived } from 'svelte/store';
import { ADA_CIRCULATING } from '$lib/utils/constants';

export interface SliderParameters {
	k: number;
	a0: number;
	L: number;
	L2: number;
	// CIP-7 parameters
	crossover: number;
	curveRoot: number;
	// Reactive monetary expansion and treasury cut parameters
	rho: number;
	tau: number;
	// fraction of ADA in circulation that is staked
	stakedRatio: number;
}

export const sliderParams = writable<SliderParameters>({
	k: 500,
	a0: 0.3,
	L: 0,
	L2: 1,
	// default CIP-7 slider values
	crossover: 8,
	curveRoot: 3,
	// default monetary parameters
	rho: 0.003,
	tau: 0.2,
	// fraction of ADA in circulation that is staked
	stakedRatio: 0.6
});

// Toggle to show/hide the custom pool on the graph
export const showCustomPool = writable<boolean>(false);

export interface GraphSettings {
	maxX: number;
	stepSizeX: number;
}

export const graphSettings = writable<GraphSettings>({
	maxX: 75000000,
	stepSizeX: 5000000
});

// Store for custom pool inputs
export interface CustomPool {
	pledge: number;
	stake: number;
}
export const customPool = writable<CustomPool>({ pledge: 0, stake: 0 });

export type SaturationMode = 'current' | 'linear' | 'exponential' | 'cip-50' | 'cip-7';
export const saturationMode = writable<SaturationMode>('current');
export const zoomEnabled = writable<boolean>(false);
export type RewardsMode = 'current' | 'full' | 'max';
export const rewardsMode = writable<RewardsMode>('current');
// Derived store for total ADA staked based on stakedRatio
export const adaTotalStaked = derived(
	sliderParams,
	($sliderParams) => ADA_CIRCULATING * $sliderParams.stakedRatio
);
