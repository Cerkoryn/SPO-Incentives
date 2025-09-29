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
			subtext2: 'Note that ROI calculations will differ slightly from live data.',
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
			subtext2: 'Note that ROI calculations will differ slightly from live data.',
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
			subtext2: 'Note that ROI calculations will differ slightly from live data.',
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
			subtext2: 'Note that ROI calculations will differ slightly from live data.',
			legend: [
				"σ'  - Pool Stake Eligible for Rewards",
				'σ  - Pool Stake',
				'p  - Pool Pledge',
				'L  - Pledge Leverage (new)',
				'z0  - Circulating ADA divided by k'
			]
		},
		'cip-7': {
			title:
				'This is a formula based on <a href="https://cips.cardano.org/cip/CIP-7" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">CIP-7</a> for saturation cap on Cardano.',
			subtitle: 'Experiment with the sliders to visualize the effects of parameter changes.',
			subtext: 'Bubble size represents pool ROI.',
			subtext2: 'Note that ROI calculations will differ slightly from live data.',
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

<div class="box-border grid grid-cols-1 gap-4 p-4 sm:grid-cols-4 sm:gap-8">
	<div class="flex min-w-0 flex-col gap-2 leading-tight">
		<h1 class="m-0 text-lg font-bold">{@html data.title}</h1>
		<p class="m-0 text-sm">{data.subtitle}</p>
		<p class="m-0 text-sm">{data.subtext}</p>
		<p class="m-0 mt-2 text-sm">{data.subtext2}</p>
	</div>

	<div class="flex min-w-0 items-center justify-center">
		<img
			src={imageMap[$saturationMode]}
			alt="Formula for {$saturationMode} saturation cap"
			class="h-auto max-w-full"
		/>
	</div>

	<div class="flex min-w-0 flex-col gap-1 leading-tight">
		<h2 class="m-0 text-sm font-bold underline">Legend</h2>
		{#each data.legend as entry}
			<p class="m-0 text-sm">{@html entry}</p>
		{/each}
	</div>
	<div class="flex min-w-0 flex-col items-center gap-1 text-center leading-tight">
		<p class="m-0 text-sm">Brought to you by the community driven SPO Incentives Working Group</p>
		<p class="m-0 text-sm">Want to join the discussion? Contact one of our community members:</p>
		<div class="mt-2 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
			<div class="flex items-center justify-center">
				<a
					href="https://github.com/Cerkoryn/SPO-Incentives"
					aria-label="GitHub"
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-900"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						fill="currentColor"
						class="h-8 w-8"
					>
						<path
							d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.594c.4.074.547-.174.547-.386 0-.19-.007-.693-.01-1.36-2.226.483-2.695-1.073-2.695-1.073-.363-.923-.888-1.168-.888-1.168-.726-.497.055-.487.055-.487.803.056 1.226.825 1.226.825.714 1.223 1.873.87 2.33.665.072-.517.28-.87.508-1.07-1.777-.2-3.644-.888-3.644-3.955 0-.874.312-1.588.825-2.147-.083-.202-.358-1.017.078-2.12 0 0 .672-.215 2.2.82a7.637 7.637 0 012.005-.27c.68.003 1.366.093 2.005.27 1.528-1.035 2.2-.82 2.2-.82.437 1.103.162 1.918.08 2.12.515.559.823 1.273.823 2.147 0 3.073-1.87 3.753-3.65 3.95.287.247.543.735.543 1.48 0 1.07-.01 1.933-.01 2.195 0 .214.144.463.55.385A8.001 8.001 0 0016 8c0-4.42-3.58-8-8-8z"
						/>
					</svg>
				</a>
			</div>
			<div class="flex flex-col items-center gap-1">
				<a
					href="https://x.com/Cerkoryn"
					class="m-0 text-sm text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">Cerkoryn</a
				>
				<a
					href="https://x.com/rabbitholepools"
					class="m-0 text-sm text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">rabbitholepools</a
				>
				<a
					href="https://x.com/earncoinpool"
					class="m-0 text-sm text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">earncoinpool</a
				>
				<a
					href="https://x.com/KpunToN00b"
					class="m-0 text-sm text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">KpunToN00b</a
				>
				<a
					href="https://x.com/Star_Forge_Pool"
					class="m-0 text-sm text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">Star_Forge_Pool</a
				>
				<a
					href="https://x.com/BBHMM_Stake"
					class="m-0 text-sm text-blue-600 underline"
					target="_blank"
					rel="noopener noreferrer">BBHMM_Stake</a
				>
			</div>
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
