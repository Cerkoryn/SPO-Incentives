<script lang="ts">
	import SliderControl from '$lib/components/SliderControl.svelte';
	import type { SaturationMode, SliderParameters } from '$lib/stores/store';
	import {
		sliderParams,
		showCustomPool,
		saturationMode,
		customPool,
		zoomEnabled,
		rewardsMode
	} from '$lib/stores/store';
	import {
		CUSTOM_POOL_DEFAULT_PLEDGE,
		CUSTOM_POOL_DEFAULT_STAKE,
		CUSTOM_POOL_PLEDGE_STEP,
		CUSTOM_POOL_STAKE_STEP
	} from '$lib/utils/constants';
	// Import descriptions for auxiliary controls tooltips
	import descriptions from '$lib/slider-descriptions.json' assert { type: 'json' };
	const desc: Record<string, string> = descriptions;

	function applyModeDefaults(mode: SaturationMode) {
		saturationMode.set(mode);
		if (mode === 'linear') {
			sliderParams.update((s: SliderParameters) => ({ ...s, L: 2 }));
		} else if (mode === 'exponential') {
			sliderParams.update((s: SliderParameters) => ({ ...s, L: 12, L2: 20 }));
		} else if (mode === 'cip-50') {
			sliderParams.update((s: SliderParameters) => ({ ...s, L: 2000 }));
		} else if (mode === 'cip-7') {
			// Set default CIP-7 slider values
			sliderParams.update((s) => ({ ...s, crossover: 8, curveRoot: 3 }));
		}
	}

	function resetDefaults() {
		// Default values as on initial page load
		if ($saturationMode === 'exponential') {
			sliderParams.set({
				k: 500,
				a0: 0.3,
				L: 12,
				L2: 20,
				crossover: 8,
				curveRoot: 3,
				rho: 0.003,
				tau: 0.2,
				stakedRatio: 0.6
			});
		} else if ($saturationMode === 'cip-50') {
			sliderParams.set({
				k: 500,
				a0: 0.3,
				L: 2000,
				L2: 20,
				crossover: 8,
				curveRoot: 3,
				rho: 0.003,
				tau: 0.2,
				stakedRatio: 0.6
			});
		} else if ($saturationMode === 'cip-7') {
			// Default settings for CIP-7 mode
			sliderParams.set({
				k: 500,
				a0: 0.3,
				L: 2,
				L2: 20,
				crossover: 8,
				curveRoot: 3,
				rho: 0.003,
				tau: 0.2,
				stakedRatio: 0.6
			});
		} else {
			sliderParams.set({
				k: 500,
				a0: 0.3,
				L: 2,
				L2: 20,
				crossover: 8,
				curveRoot: 3,
				rho: 0.003,
				tau: 0.2,
				stakedRatio: 0.6
			});
		}
		// Note: rho and tau are now part of sliderParams
	}
</script>

<!-- Reset button resets all sliders to initial defaults -->
<button
	type="button"
	on:click={resetDefaults}
	class="mb-4 cursor-pointer rounded border border-gray-300 bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
>
	Reset Sliders
</button>

<div class="flex flex-col gap-4">
	<SliderControl
		id="rho-slider"
		label="Rho:"
		value={$sliderParams.rho}
		min={0}
		max={0.005}
		step={0.0001}
		hint="min: 0, max: 0.005"
		wide={true}
		onChange={(value: number) =>
			sliderParams.update((s: SliderParameters) => ({ ...s, rho: value }))}
	/>
	<SliderControl
		id="staked-ratio-slider"
		label="Staked Ratio:"
		value={$sliderParams.stakedRatio}
		min={0}
		max={1}
		step={0.01}
		hint="min: 0, max: 1"
		wide={true}
		onChange={(value: number) =>
			sliderParams.update((s: SliderParameters) => ({ ...s, stakedRatio: value }))}
	/>
	<SliderControl
		id="tau-slider"
		label="Tau:"
		value={$sliderParams.tau}
		min={0}
		max={0.3}
		step={0.01}
		hint="min: 0, max: 0.3"
		onChange={(value: number) =>
			sliderParams.update((s: SliderParameters) => ({ ...s, tau: value }))}
	/>
	<SliderControl
		id="k-slider"
		label="k:"
		value={$sliderParams.k}
		min={1}
		max={2000}
		step={1}
		hint="min: 1, max: 2000"
		onChange={(value: number) => sliderParams.update((s: SliderParameters) => ({ ...s, k: value }))}
	/>
	<SliderControl
		id="a0-slider"
		label="a<sub>0</sub>:"
		value={$sliderParams.a0}
		min={0}
		max={1}
		step={0.01}
		hint="min: 0, max: 1"
		onChange={(value: number) =>
			sliderParams.update((s: SliderParameters) => ({ ...s, a0: value }))}
	/>
	{#if $saturationMode === 'linear' || $saturationMode === 'exponential' || $saturationMode === 'cip-50'}
		<SliderControl
			id="L-slider"
			label="L"
			value={$sliderParams.L}
			min={$saturationMode === 'cip-50' ? 1 : 0}
			max={$saturationMode === 'cip-50' ? 10000 : 50}
			step={$saturationMode === 'cip-50' ? 1 : 0.1}
			hint={$saturationMode === 'cip-50' ? 'min: 1, max: 10000' : 'min: 0, max: 50'}
			onChange={(value: number) =>
				sliderParams.update((s: SliderParameters) => ({ ...s, L: value }))}
		/>
	{/if}
	{#if $saturationMode === 'exponential'}
		<SliderControl
			id="L2-slider"
			label="L2:"
			value={$sliderParams.L2}
			min={1}
			max={100}
			step={1}
			hint="min: 1, max: 100"
			onChange={(value: number) =>
				sliderParams.update((s: SliderParameters) => ({ ...s, L2: value }))}
		/>
	{/if}
	{#if $saturationMode === 'cip-7'}
		<SliderControl
			id="crossover-slider"
			label="Crossover Factor:"
			value={$sliderParams.crossover}
			min={1}
			max={20}
			step={1}
			hint="min: 1, max: 20"
			onChange={(value: number) =>
				sliderParams.update((s: SliderParameters) => ({ ...s, crossover: value }))}
		/>
		<SliderControl
			id="curve-root-slider"
			label="Curve Root:"
			value={$sliderParams.curveRoot}
			min={1}
			max={20}
			step={1}
			hint="min: 1, max: 20"
			onChange={(value: number) =>
				sliderParams.update((s: SliderParameters) => ({ ...s, curveRoot: value }))}
		/>
	{/if}
</div>

<!-- Checkbox controls for selecting graph points -->
<div class="mt-4 flex flex-wrap gap-4">
	<div class="flex items-center">
		<label for="custom-checkbox">
			<input
				type="checkbox"
				id="custom-checkbox"
				checked={$showCustomPool}
				on:change={(e: Event) => {
					const checked = (e.target as HTMLInputElement).checked;
					showCustomPool.set(checked);
					if (checked) {
						customPool.set({
							pledge: CUSTOM_POOL_DEFAULT_PLEDGE,
							stake: CUSTOM_POOL_DEFAULT_STAKE
						});
					}
				}}
			/>
			Show Custom Pool
			<span
				class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
				title={desc.show_custom_pool}>?</span
			>
		</label>
		{#if $showCustomPool && $customPool.stake < $customPool.pledge}
			<span class="ml-2 text-xs text-amber-600">⚠ Stake cannot be lower than pledge</span>
		{/if}
	</div>
</div>
{#if $showCustomPool}
	<div class="mt-4 flex flex-col gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<label for="custom-pledge"
				>Pledge:
				<span
					class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
					title={desc.custom_pledge}>?</span
				>
			</label>
			<input
				type="number"
				id="custom-pledge"
				min="0"
				step={CUSTOM_POOL_PLEDGE_STEP}
				value={$customPool.pledge}
				on:input={(e: Event) => {
					const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
					const v = parseInt(raw, 10);
					if (!isNaN(v)) {
						const pledgeVal = Math.max(1, v);
						customPool.update((c) => ({ ...c, pledge: pledgeVal }));
					}
				}}
				class="w-[12ch] bg-white"
			/>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<label for="custom-stake"
				>Stake:
				<span
					class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
					title={desc.custom_stake}>?</span
				>
			</label>
			<input
				type="number"
				id="custom-stake"
				min="0"
				step={CUSTOM_POOL_STAKE_STEP}
				value={$customPool.stake}
				on:input={(e: Event) => {
					const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
					const v = parseInt(raw, 10);
					if (!isNaN(v)) {
						const stakeVal = Math.max(1, v);
						customPool.update((c) => ({ ...c, stake: stakeVal }));
					}
				}}
				class="w-[12ch] bg-white"
			/>
		</div>
	</div>
{/if}

<!-- Radio Buttons for selecting the rewards mode -->
<div class="mt-4 flex items-center gap-4">
	<span>Rewards:</span>
	<label class="flex items-center gap-1">
		<input
			type="radio"
			name="rewards-mode"
			value="current"
			on:change={() => rewardsMode.set('current')}
			checked={$rewardsMode === 'current'}
		/>
		Current
	</label>
	<label class="flex items-center gap-1">
		<input
			type="radio"
			name="rewards-mode"
			value="full"
			on:change={() => rewardsMode.set('full')}
			checked={$rewardsMode === 'full'}
		/>
		Full
	</label>
	<label class="flex items-center gap-1">
		<input
			type="radio"
			name="rewards-mode"
			value="max"
			on:change={() => rewardsMode.set('max')}
			checked={$rewardsMode === 'max'}
		/>
		Max
	</label>
	<!-- Combined info bubble for rewards modes -->
	<span
		class="ml-1 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
		title={desc.rewards}>?</span
	>
</div>

<!-- Radio Buttons for selecting the saturation function with default presets -->
<div class="mt-4 grid grid-cols-[auto_auto_auto_auto] items-center gap-x-2 gap-y-2">
	<span class="col-start-1 row-start-1">Formula:</span>
	<label class="col-start-2 row-start-1">
		<input
			type="radio"
			name="saturation-mode"
			value="current"
			on:change={() => applyModeDefaults('current')}
			checked={$saturationMode === 'current'}
		/>
		Current
	</label>
	<label class="col-start-3 row-start-1">
		<input
			type="radio"
			name="saturation-mode"
			value="linear"
			on:change={() => applyModeDefaults('linear')}
			checked={$saturationMode === 'linear'}
		/>
		Linear
	</label>
	<label class="col-start-4 row-start-1">
		<input
			type="radio"
			name="saturation-mode"
			value="exponential"
			on:change={() => applyModeDefaults('exponential')}
			checked={$saturationMode === 'exponential'}
		/>
		Exponential
	</label>
	<label class="col-start-2 row-start-2">
		<input
			type="radio"
			name="saturation-mode"
			value="cip-50"
			on:change={() => applyModeDefaults('cip-50')}
			checked={$saturationMode === 'cip-50'}
		/>
		CIP-50
	</label>
	<label class="col-start-3 row-start-2">
		<input
			type="radio"
			name="saturation-mode"
			value="cip-7"
			on:change={() => applyModeDefaults('cip-7')}
			checked={$saturationMode === 'cip-7'}
		/>
		CIP-7
	</label>
	<!-- Combined info bubble for saturation formulas -->
	<span
		class="col-start-4 row-start-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
		title={desc.formula}>?</span
	>
</div>
<div class="flex items-center">
	<label for="toggle-zoom-checkbox">
		<input
			type="checkbox"
			id="toggle-zoom-checkbox"
			checked={$zoomEnabled}
			on:change={(e: Event) => zoomEnabled.set((e.target as HTMLInputElement).checked)}
		/>
		Toggle Zoom
		<span
			class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
			title={desc.toggle_zoom}>?</span
		>
	</label>
</div>
