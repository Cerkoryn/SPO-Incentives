// ... existing code ...
import poolData from '../data/pools.json';
import { ADA_TOTAL_SUPPLY, ADA_RESERVES } from './constants';

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