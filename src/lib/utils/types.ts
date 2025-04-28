import type { SaturationMode } from '$lib/stores/store';

export interface Env {
    k:               number;   // protocol parameter
    L:               number;   // slope for the linear / exponential variants
    L2:              number;   // exponential curve constant
    ADA_TOTAL_SUPPLY:       number;   // circulating supply
    ADA_RESERVES:     number;   // remaining reserves
  }

  export const satCapFns: Record<
  SaturationMode,
  (pledge: number, env: Env) => number
> = {
  /** Existing formula: (circ / k) */
  current: (_pledge, { k, ADA_TOTAL_SUPPLY, ADA_RESERVES }) =>
    (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k,

  /** Linear: (circ / k) + L · pledge */
  linear: (pledge, { k, L, ADA_TOTAL_SUPPLY, ADA_RESERVES }) =>
    (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k + L * pledge,

  /** Exponential: (circ / k) + sc·L·(1 − e^(−pledge/sc)) */
  exponential: (pledge, { k, L, L2, ADA_TOTAL_SUPPLY, ADA_RESERVES }) =>
    (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k +
    L2 *
      L *
      (1 - Math.exp(-pledge / L2)),
};