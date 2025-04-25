// ... existing code ...
import poolData from '../data/pools.json';
import { ADA_TOTAL_SUPPLY, ADA_RESERVES, ADA_TOTAL_STAKED } from './constants';

export interface Pool {
  ticker: string;
  name: string;
  group: string;
  stake: number;
  pledge: number;
}

export const pools: Pool[] = poolData;

export function getSaturationCapLinear(k: number, L: number, maxX: number, stepSizeX: number): { x: number; y: number }[] {
    const baseCap = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;
    const points = [];
    for (let x = 0; x <= maxX; x += stepSizeX) {
      points.push({ x, y: baseCap + L * x });
    }
    return points;
  }

export function getSaturationCapExpSaturation(k: number, L: number, maxX: number, stepSizeX: number): { x: number; y: number }[] {
    const baseCap = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;
    const points = [];
    const scalingConstant = 10000000;  // adjusted to range of x-values, modify this to change curve's aggressiveness
    // Denom normalizes the exponential value to range [0,1]
    const denom = 1 - Math.exp(-maxX / scalingConstant);
    for (let x = 0; x <= maxX; x += stepSizeX/2) {
      const normalizedExponential = (1 - Math.exp(-x / scalingConstant)) / denom;
      points.push({ x, y: baseCap + 10000000*L*normalizedExponential });  // The number here controls how high the horizontal asymptote is
    }
    return points;
}

export function getRewards(poolStake: number, poolPledge: number, k: number, a0: number): number {
  // Convert absolute ADA values to relative fractions
  const sigma = poolStake / ADA_TOTAL_STAKED;       // pool’s share of active stake
  const s     = poolPledge / ADA_TOTAL_STAKED;  // operator’s pledge share

  if (sigma <= 0 || sigma > 1) {
    throw new Error('Calculated sigma must be in (0, 1]');
  }
  if (s < 0 || s > 1) {
    throw new Error('Calculated s must be in [0, 1]');
  }

  // Saturation parameter
  const z0 = 1 / k;

  // Cap stake and pledge at z0
  const sigmaP = Math.min(sigma, z0);
  const sP     = Math.min(s, z0);

  // Normalized per-epoch reward share (no performance adjustment)
  const f = (sigmaP + a0 * (sP / z0)) / (1 + a0);

  // Per-unit-stake ROI per epoch
  const roiEpoch = f / sigma;

  // Annualize over 73 epochs and convert to percent
  return roiEpoch * 73 * 100;
}