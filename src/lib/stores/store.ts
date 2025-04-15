import { writable } from 'svelte/store';

export interface SliderParameters {
  k: number;
  a0: number;
  L: number;
}

export const sliderParams = writable<SliderParameters>({
  k: 500,
  a0: 0.3,
  L: 0
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
  maxX: 10000000,
  stepSizeX: 1000000
});

export type SaturationMode = "linear" | "exponential";
export const saturationMode = writable<SaturationMode>("exponential");