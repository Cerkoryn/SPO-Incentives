import poolData from '../data/pools.json';

export interface Pool {
  ticker: string;
  name: string;
  group: string;
  stake: number;
  pledge: number;
}

export const pools: Pool[] = poolData;

