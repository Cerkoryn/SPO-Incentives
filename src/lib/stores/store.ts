// stores.ts
import { writable, derived } from 'svelte/store';
import { ADA_CIRCULATING } from '$lib/utils/constants';

// --- Types -------------------------------------------------------
/**
 * Parameters controlled by sliders for saturation cap and rewards calculation.
 */
export interface SliderParameters {
	k: number;
	a0: number;
	L: number;
	L2: number;
	crossover: number; // CIP-7 parameter
	curveRoot: number; // CIP-7 parameter
	rho: number; // monetary expansion rate
	tau: number; // treasury cut ratio
	stakedRatio: number; // fraction of ADA in circulation that is staked
}

/**
 * Graph viewport settings: X-axis max and step size.
 */
export interface GraphSettings {
	maxX: number;
	stepSizeX: number;
}

/**
 * Custom pool pledge and stake inputs.
 */
export interface CustomPool {
	pledge: number;
	stake: number;
}

/**
 * Available saturation formula modes.
 */
export type SaturationMode = 'current' | 'linear' | 'exponential' | 'cip-50' | 'cip-7';

/**
 * Available rewards distribution modes.
 */
export type RewardsMode = 'current' | 'full' | 'max';

/**
 * Available zoom levels for the graph.
 */
export type ZoomLevel = 'off' | 'zoom' | 'superZoom';

// --- Stores ------------------------------------------------------
/**
 * Reactive store for slider-controlled parameters.
 */
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

/**
 * Graph viewport store.
 */
export const graphSettings = writable<GraphSettings>({
	maxX: 75_000_000,
	stepSizeX: 5_000_000
});

/**
 * Toggle to show/hide the custom pool on the graph.
 */
export const showCustomPool = writable<boolean>(false);

/**
 * Store for custom pool inputs.
 */
export const customPool = writable<CustomPool>({ pledge: 0, stake: 0 });

/**
 * Selected saturation formula mode.
 */
export const saturationMode = writable<SaturationMode>('current');

/**
 * Selected zoom level for graph axes.
 */
export const zoomLevel = writable<ZoomLevel>('off');

/**
 * Selected rewards distribution mode.
 */
export const rewardsMode = writable<RewardsMode>('current');

/**
 * Derived store: total ADA staked based on circulating supply and stakedRatio.
 */
export const adaTotalStaked = derived(
	sliderParams,
	($sliderParams) => ADA_CIRCULATING * $sliderParams.stakedRatio
);
