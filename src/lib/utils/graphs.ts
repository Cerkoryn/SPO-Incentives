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

export function getSaturationCap(k: number): number {
  return (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;
}