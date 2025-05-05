<script lang="ts">
  import { saturationMode } from '$lib/stores/store';
  import type { SaturationMode } from '$lib/stores/store';

  const imageMap: Record<SaturationMode, string> = {
    current: '/Current.png',
    linear: '/Linear.png',
    exponential: '/Exponential.png'
  };

  interface ModeData {
    title: string;
    subtitle: string;
    subtext: string;
    legend: string[];
  }

  const modeData: Record<SaturationMode, ModeData> = {
    current: {
      title: 'This is using the current formula for saturation cap on Cardano.',
      subtitle: 'Experiment with the sliders to visualize the effects of parameter changes.',
      subtext: 'Bubble size represents pool ROI. You can also drag the custom pool around.',
      legend: [
        'C<sub>0</sub> - Saturation Cap (constant)',
        'S  - Total Supply',
        'R  - Reserve',
        'z<sub>0</sub> - Relative pool saturation size (1/k)'
      ]
    },
    linear: {
      title: 'This is a hypothetical linear formula for saturation cap on Cardano.',
      subtitle: 'Experiment with the sliders to visualize the effects of parameter changes.',
      subtext: 'Bubble size represents pool ROI. You can also drag the custom pool around.',
      legend: [
        'p  - Pool Pledge',
        'S  - Total Supply',
        'R  - Reserve',
        'z<sub>0</sub> - Relative pool saturation size (1/k)',
        'L  - Pledge Leverage (new)'
      ]
    },
    exponential: {
      title: 'This is a hypothetical exponential formula for saturation cap on Cardano.',
      subtitle: 'Experiment with the sliders to visualize the effects of parameter changes.',
      subtext: 'Bubble size represents pool ROI. You can also drag the custom pool around.',
      legend: [
        'p  - Pool Pledge',
        'S  - Total Supply',
        'R  - Reserve',
        'z<sub>0</sub> - Relative pool saturation size (1/k)',
        'L  - Pledge Leverage (new)',
        'L2 - Pledge Curve Sharpness (new)'
      ]
    }
  };

  $: data = modeData[$saturationMode];
</script>

<div class="grid grid-flow-col auto-cols-max gap-8">
  <div class="flex flex-col gap-0.5 leading-tight">
    <h1 class="m-0">{data.title}</h1>
    <p class="m-0">{data.subtitle}</p>
    <p class="m-0">{data.subtext}</p>
  </div>

  <div class="flex flex-col gap-0 leading-tight">
    <h2 class="m-0 font-bold underline">Legend</h2>
    {#each data.legend as entry}
      <p class="m-0">{@html entry}</p>
    {/each}
  </div>

  <div class="flex flex-col gap-1 justify-center items-center">
    <img src={imageMap[$saturationMode]} alt="Formula: C0 = (S - R) z0" />
  </div>
</div>
