<script lang="ts">
	import SliderControl from '$lib/components/SliderControl.svelte';
	import type { SaturationMode, SliderParameters } from '$lib/stores/store';
	import {
		sliderParams,
		showCustomPool,
		saturationMode,
		customPool,
		zoomEnabled,
		rewardsMode,
		rho,
		tau
	} from '$lib/stores/store';
	import {
		CUSTOM_POOL_DEFAULT_PLEDGE,
		CUSTOM_POOL_DEFAULT_STAKE,
		CUSTOM_POOL_PLEDGE_STEP,
		CUSTOM_POOL_STAKE_STEP
	} from '$lib/utils/constants';

	function applyModeDefaults(mode: SaturationMode) {
		saturationMode.set(mode);
		if (mode === 'linear') {
			sliderParams.update((s: SliderParameters) => ({ ...s, L: 2 }));
		} else if (mode === 'exponential') {
			sliderParams.update((s: SliderParameters) => ({ ...s, L: 12, L2: 20 }));
		} else if (mode === 'cip-50') {
			sliderParams.update((s: SliderParameters) => ({ ...s, L: 1 }));
		}
	}

	function resetDefaults() {
		// Default values as on initial page load
		if ($saturationMode === 'exponential') {
			sliderParams.set({ k: 500, a0: 0.3, L: 12, L2: 20 });
		} else if ($saturationMode === 'cip-50') {
			sliderParams.set({ k: 500, a0: 0.3, L: 1, L2: 20 });
		} else {
			sliderParams.set({ k: 500, a0: 0.3, L: 2, L2: 20 });
		}
		rho.set(0.003);
		tau.set(0.2);
	}
</script>

<!-- Reset button resets all sliders to initial defaults -->
<button
	type="button"
	on:click={resetDefaults}
	class="mb-4 cursor-pointer rounded border border-gray-300 bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
	>Reset Sliders</button
>

<div class="flex flex-col gap-4">
	<SliderControl
		id="rho-slider"
		label="Rho:"
		value={$rho}
		min={0}
		max={0.005}
		step={0.0001}
		hint="min: 0, max: 0.005"
		wide={true}
		onChange={(value: number) => rho.set(value)}
	/>
	<SliderControl
		id="tau-slider"
		label="Tau:"
		value={$tau}
		min={0}
		max={0.3}
		step={0.01}
		hint="min: 0, max: 0.3"
		onChange={(value: number) => tau.set(value)}
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
			min={$saturationMode === 'cip-50' ? 0.1 : 0}
			max={50}
			step={0.1}
			hint={$saturationMode === 'cip-50' ? 'min: 0.1, max: 50' : 'min: 0, max: 50'}
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
		</label>
		{#if $showCustomPool && $customPool.stake < $customPool.pledge}
			<span class="ml-2 text-xs text-amber-600">⚠ Stake cannot be lower than pledge</span>
		{/if}
	</div>
</div>
{#if $showCustomPool}
	<div class="mt-4 flex flex-col gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<label for="custom-pledge">Pledge:</label>
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
			<label for="custom-stake">Stake:</label>
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
	<label>
		<input
			type="radio"
			name="rewards-mode"
			value="current"
			on:change={() => rewardsMode.set('current')}
			checked={$rewardsMode === 'current'}
		/>
		Current
	</label>
	<label>
		<input
			type="radio"
			name="rewards-mode"
			value="full"
			on:change={() => rewardsMode.set('full')}
			checked={$rewardsMode === 'full'}
		/>
		Full
	</label>
</div>

<!-- Radio Buttons for selecting the saturation function with default presets -->
<div class="mt-4 flex items-center gap-4">
	<span>Formula:</span>
	<label>
		<input
			type="radio"
			name="saturation-mode"
			value="current"
			on:change={() => applyModeDefaults('current')}
			checked={$saturationMode === 'current'}
		/>
		Current
	</label>
	<label>
		<input
			type="radio"
			name="saturation-mode"
			value="linear"
			on:change={() => applyModeDefaults('linear')}
			checked={$saturationMode === 'linear'}
		/>
		Linear
	</label>
	<label>
		<input
			type="radio"
			name="saturation-mode"
			value="exponential"
			on:change={() => applyModeDefaults('exponential')}
			checked={$saturationMode === 'exponential'}
		/>
		Exponential
	</label>
	<label>
		<input
			type="radio"
			name="saturation-mode"
			value="cip-50"
			on:change={() => applyModeDefaults('cip-50')}
			checked={$saturationMode === 'cip-50'}
		/>
		CIP-50
	</label>
</div>
<br />
<div class="flex items-center">
	<label for="toggle-zoom-checkbox">
		<input
			type="checkbox"
			id="toggle-zoom-checkbox"
			checked={$zoomEnabled}
			on:change={(e: Event) => zoomEnabled.set((e.target as HTMLInputElement).checked)}
		/>
		Toggle Zoom
	</label>
</div>
