export const ADA_TOTAL_SUPPLY = 45000000000;
export const ADA_RESERVES = 7251344361;
export const ADA_CIRCULATING = ADA_TOTAL_SUPPLY - ADA_RESERVES;
export const ADA_TREASURY = 1730343069;
export const STAKED_RATIO = 0.6;
export const ADA_TOTAL_STAKED = ADA_CIRCULATING * STAKED_RATIO;
/* RHO, TAU, TREASURY_CUT, and REWARDS_POT are now reactive and computed in store/graphs.ts */

// Graph zoom and scale constants
export const GRAPH_X_ZOOM_INITIAL_MAX = 5000000;
export const GRAPH_X_ZOOM_REACTIVE_MAX = 1000000;
export const GRAPH_X_ZOOM_STEP = 100000;

export const GRAPH_Y_SCALE_DEFAULT_MAX = 300000000;
export const GRAPH_Y_ZOOM_MAX = 80000000;
export const GRAPH_Y_SCALE_DEFAULT_STEP = 25000000;
export const GRAPH_Y_ZOOM_STEP = 5000000;

// Custom pool defaults and step values
export const CUSTOM_POOL_DEFAULT_PLEDGE = 35000000;
export const CUSTOM_POOL_DEFAULT_STAKE = 200000000;
export const CUSTOM_POOL_PLEDGE_STEP = 10000;
export const CUSTOM_POOL_STAKE_STEP = 1000000;
