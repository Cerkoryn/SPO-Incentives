export const ADA_TOTAL_SUPPLY = 45000000000;
export const ADA_RESERVES = 7251344361;
export const ADA_CIRCULATING = ADA_TOTAL_SUPPLY - ADA_RESERVES;
export const ADA_TREASURY = 1730343069;
export const STAKED_RATIO = 0.6;
export const ADA_TOTAL_STAKED = ADA_CIRCULATING * STAKED_RATIO;
/* RHO, TAU, TREASURY_CUT, and REWARDS_POT are now reactive and computed in store/graphs.ts */
