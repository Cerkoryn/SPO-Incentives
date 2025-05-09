import { writable } from 'svelte/store';

export interface SliderParameters {
	k: number;
	a0: number;
	L: number;
	L2: number;
}

export const sliderParams = writable<SliderParameters>({
	k: 500,
	a0: 0.3,
	L: 0,
	L2: 1
});

export interface GraphCheckboxes {
	[key: string]: boolean;
	copper: boolean;
	eden: boolean;
	blade: boolean;
	cag: boolean;
	custom: boolean;
}

export const graphCheckboxes = writable<GraphCheckboxes>({
	copper: true,
	eden: true,
	blade: true,
	cag: true,
	custom: false
});

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

export type SaturationMode = 'current' | 'linear' | 'exponential';
export const saturationMode = writable<SaturationMode>('current');
export const zoomEnabled = writable<boolean>(false);
export type RewardsMode = 'current' | 'full';
export const rewardsMode = writable<RewardsMode>('current');
// Reactive monetary expansion and treasury cut parameters
export const rho = writable<number>(0.003);
export const tau = writable<number>(0.2);
