<script lang="ts">
	import { saturationMode } from '$lib/stores/store';
	import type { SaturationMode } from '$lib/stores/store';

	const imageMap: Record<SaturationMode, string> = {
		current: '/Current.png',
		linear: '/Linear.png',
		exponential: '/Exponential.png',
		'cip-50': '/CIP-50.png',
		'cip-7': '/CIP-7.png'
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
			subtext: 'Bubble size represents pool ROI.',
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
			subtext: 'Bubble size represents pool ROI.',
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
			subtext: 'Bubble size represents pool ROI.',
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
				'This is a formula based on <a href="https://cips.cardano.org/cip/CIP-0050" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">CIP-50</a> for saturation cap on Cardano.',
			subtitle: 'Experiment with the sliders to visualize the effects of parameter changes.',
			subtext: 'Bubble size represents pool ROI.',
			subtext2: 'Note that ROI calculations may differ slightly from live data.',
			legend: [
				'p  - Pool Pledge',
				'R  - Rewards',
				'σ  - Pool Stake',
				'L  - Pledge Leverage (new)',
				'k  - Target Number of Pools'
			]
		},
		'cip-7': {
			title:
				'This is a formula based on <a href="https://cips.cardano.org/cip/CIP-7" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">CIP-7</a> for saturation cap on Cardano.',
			subtitle: 'Experiment with the sliders to visualize the effects of parameter changes.',
			subtext: 'Bubble size represents pool ROI.',
			subtext2: 'Note that ROI calculations may differ slightly from live data.',
			legend: [
				's  - Total Pool Pledge',
				"s'  - Eligible Pool Pledge ",
				'n  - Curve Root (new)',
				'S  - Supply',
				'R  - Reserve',
				's<sub>c</sub>  - Crossover (new)',
				'ϕ - Crossover Factor (new)'
			]
		}
	};

	$: data = modeData[$saturationMode];
</script>

<div class="box-border flex max-w-full flex-col gap-4 p-4 md:flex-row md:gap-8">
	<div class="flex min-w-0 flex-col gap-2 leading-tight">
		<h1 class="m-0 text-lg font-bold">{@html data.title}</h1>
		<p class="m-0 text-sm">{data.subtitle}</p>
		<p class="m-0 text-sm">{data.subtext}</p>
		<p class="m-0 mt-2 text-sm">{data.subtext2}</p>
	</div>

	<div class="flex min-w-0 flex-col gap-1 leading-tight">
		<h2 class="m-0 text-sm font-bold underline">Legend</h2>
		{#each data.legend as entry}
			<p class="m-0 text-sm">{@html entry}</p>
		{/each}
	</div>

	<div class="flex items-center justify-center">
		<img
			src={imageMap[$saturationMode]}
			alt="Formula for {$saturationMode} saturation cap"
			class="h-auto max-w-full"
		/>
		<div class="flex min-w-0 flex-col items-center gap-1 pl-4 text-center leading-tight">
			<p class="m-0 text-sm">Brought to you by the community driven SPO Incentives Working Group</p>
			<p class="m-0 text-sm">Want to join the discussion? Contact one of our community members:</p>
			<p class="m-0 text-sm">
				<a
					href="https://x.com/Cerkoryn"
					class="text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">Cerkoryn</a
				>
			</p>
			<p class="m-0 text-sm">
				<a
					href="https://x.com/rabbitholepools"
					class="text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">rabbitholepools</a
				>
			</p>
			<p class="m-0 text-sm">
				<a
					href="https://x.com/earncoinpool"
					class="text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">earncoinpool</a
				>
			</p>
			<p class="m-0 text-sm">
				<a
					href="https://x.com/KpunToN00b"
					class="text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">KpunToN00b</a
				>
			</p>
			<p class="m-0 text-sm">
				<a
					href="https://x.com/Star_Forge_Pool"
					class="text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">Star_Forge_Pool</a
				>
			</p>
			<p class="m-0 text-sm">
				<a
					href="https://x.com/BBHMM_Stake"
					class="text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">BBHMM_Stake</a
				>
			</p>
		</div>
	</div>
</div>

<style>
	/* Prevent text overflow */
	:global(.text-sm) {
		word-break: break-word;
	}
	/* Prevent image overflow */
	img {
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>
