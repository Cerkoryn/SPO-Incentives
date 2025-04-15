import { writable } from 'svelte/store';

export interface SliderParameters {
  k: number;
  a0: number;
  L: number;
}

export const sliderParams = writable<SliderParameters>({
  k: 500,
  a0: 0.3,
  L: 70
});

export interface GraphCheckboxes {
  copper: boolean;
  eden: boolean;
  blade: boolean;
  cag: boolean;
  custom: boolean;
}

export const graphCheckboxes = writable<GraphCheckboxes>({
  copper: false,
  eden: false,
  blade: false,
  cag: false,
  custom: false
});