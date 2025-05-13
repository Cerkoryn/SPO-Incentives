<script lang="ts">
	import { saturationMode } from '$lib/stores/store';
	import type { SaturationMode } from '$lib/stores/store';

	const imageMap: Record<SaturationMode, string> = {
		current: '/Current.png',
		linear: '/Linear.png',
		exponential: '/Exponential.png',
		'cip-50': 'CIP-50.png'
	};

	interface ModeData {
		title: string;
		subtitle: string;
		subtext: string;
		subtext2: string;
		legend: string[];
	}

	const modeData: Record<SaturationMode, ModeData> = {
		current: {
			title: 'This is using the current formula for saturation cap on Cardano.',
			subtitle: 'Experiment with the sliders to visualize the effects of parameter changes.',
			subtext: 'Bubble size represents pool ROI. You can also drag the custom pool around.',
			subtext2: 'Note that ROI calculations may differ slightly from live data.',
			legend: [
				'C<sub>0</sub> - Saturation Cap',
				'S  - Total Supply',
				'R  - Reserve',
				'z<sub>0</sub> - Relative pool saturation size (1/k)'
			]
		},
		linear: {
			title: 'This is a hypothetical linear formula for saturation cap on Cardano.',
			subtitle: 'Experiment with the sliders to visualize the effects of parameter changes.',
			subtext: 'Bubble size represents pool ROI. You can also drag the custom pool around.',
			subtext2: 'Note that ROI calculations may differ slightly from live data.',
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
			subtext2: 'Note that ROI calculations may differ slightly from live data.',
			legend: [
				'p  - Pool Pledge',
				'S  - Total Supply',
				'R  - Reserve',
				'z<sub>0</sub> - Relative pool saturation size (1/k)',
				'L  - Pledge Leverage (new)',
				'L2 - Pledge Curve Sharpness (new)'
			]
		},
		'cip-50': {
			title:
				'This is a formula based on <a href="https://github.com/michael-liesenfelt/CIPs/blob/CIP-Liesenfelt-Shelleys_Voltaire_decentralization_update/CIP-0050/README.md" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">CIP-50</a> for saturation cap on Cardano.',
			subtitle: 'Experiment with the sliders to visualize the effects of parameter changes.',
			subtext: 'Bubble size represents pool ROI. You can also drag the custom pool around.',
			subtext2: 'Note that ROI calculations may differ slightly from live data.',
			legend: [
				'p  - Pool Pledge',
				'R  - Rewards',
				'&sigma;  - Pool Stake',
				'L  - Pledge Leverage (new)',
				'k  - Target Number of Pools'
			]
		}
	};

	$: data = modeData[$saturationMode];
</script>

<div class="grid auto-cols-max grid-flow-col gap-8">
	<div class="flex flex-col gap-0.5 leading-tight">
		<h1 class="m-0">{@html data.title}</h1>
		<p class="m-0">{data.subtitle}</p>
		<p class="m-0">{data.subtext}</p>
		<br />
		<p class="m-0">{data.subtext2}</p>
	</div>

	<div class="flex flex-col gap-0 leading-tight">
		<h2 class="m-0 font-bold underline">Legend</h2>
		{#each data.legend as entry}
			<p class="m-0">{@html entry}</p>
		{/each}
	</div>

	<div class="flex flex-col items-center justify-center gap-1">
		<img src={imageMap[$saturationMode]} alt="Formula: C0 = (S - R) z0" />
	</div>
</div>
