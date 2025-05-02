import type { SaturationMode } from '$lib/stores/store';
import { graphSettings } from '$lib/stores/store';
import { get } from 'svelte/store';

export interface Env {
    k:               number;   // protocol parameter
    L:               number;   // slope for the linear / exponential variants
    L2:              number;   // exponential curve constant
    ADA_CIRCULATING: number;   // circulating supply
  }

export const satCapFns: Record<SaturationMode, (pledge: number, env: Env) => number > = {
  /** Existing formula: (circ / k) */
  current: (_pledge, { k, ADA_CIRCULATING }) =>
    (ADA_CIRCULATING) / k,

  /** Linear: (circ / k) + L · pledge */
  linear: (pledge, { k, L, ADA_CIRCULATING }) =>
    (ADA_CIRCULATING) / k + L * pledge,

  /** Exponential: (circ / k) + sc·L·(1 − e^(−pledge/sc)) */
  exponential: (
    pledge,
    { k, L, L2, ADA_CIRCULATING },
  ) => {
    const baseCap = (ADA_CIRCULATING) / k;
    const F = 10_000_000;
    // Import maxX from the graphSettings store
    const { maxX } = get(graphSettings);
    const τ = (L2 / 100) * maxX;
    return baseCap + F * L * (1 - Math.exp(-pledge / τ));
  },
};