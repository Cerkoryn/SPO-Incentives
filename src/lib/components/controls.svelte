<script lang="ts">
	import SliderControl from '$lib/components/SliderControl.svelte';
	import type { SaturationMode } from '$lib/stores/store';
	import {
		sliderParams,
		graphCheckboxes,
		saturationMode,
		customPool,
		zoomEnabled,
		rewardsMode,
		rho,
		tau
	} from '$lib/stores/store';

	function applyModeDefaults(mode: SaturationMode) {
		saturationMode.set(mode);
		if (mode === 'linear') {
			sliderParams.update((s) => ({ ...s, L: 2 }));
		} else if (mode === 'exponential') {
			sliderParams.update((s) => ({ ...s, L: 12, L2: 20 }));
		}
	}

	function resetDefaults() {
		// Default values as on initial page load
		sliderParams.set(
			$saturationMode === 'exponential'
				? { k: 500, a0: 0.3, L: 12, L2: 20 }
				: { k: 500, a0: 0.3, L: 2, L2: 20 }
		);
		rho.set(0.003);
		tau.set(0.2);
	}
</script>

<!-- Reset button resets all sliders to initial defaults -->
<button type="button" on:click={resetDefaults} class="reset-button">Reset Defaults</button>

<div class="slider-controls">
	<SliderControl
		id="rho-slider"
		label="Rho:"
		value={$rho}
		min={0}
		max={0.005}
		step={0.0001}
		hint="min: 0, max: 0.005"
		wide={true}
		on:change={({ detail }) => rho.set(detail)}
	/>
	<SliderControl
		id="tau-slider"
		label="Tau:"
		value={$tau}
		min={0}
		max={0.3}
		step={0.01}
		hint="min: 0, max: 0.3"
		on:change={({ detail }) => tau.set(detail)}
	/>
	<SliderControl
		id="k-slider"
		label="k:"
		value={$sliderParams.k}
		min={1}
		max={2000}
		step={1}
		hint="min: 1, max: 2000"
		on:change={({ detail }) => sliderParams.update((s) => ({ ...s, k: detail }))}
	/>
	<SliderControl
		id="a0-slider"
		label="a<sub>0</sub>:"
		value={$sliderParams.a0}
		min={0}
		max={1}
		step={0.01}
		hint="min: 0, max: 1"
		on:change={({ detail }) => sliderParams.update((s) => ({ ...s, a0: detail }))}
	/>
	{#if $saturationMode === 'linear' || $saturationMode === 'exponential'}
		<SliderControl
			id="L-slider"
			label="L:"
			value={$sliderParams.L}
			min={0}
			max={50}
			step={0.1}
			hint="min: 0, max: 50"
			on:change={({ detail }) => sliderParams.update((s) => ({ ...s, L: detail }))}
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
			on:change={({ detail }) => sliderParams.update((s) => ({ ...s, L2: detail }))}
		/>
	{/if}
</div>

<!-- Checkbox controls for selecting graph points -->
<div class="checkbox-controls">
	<div class="checkbox-control">
		<label for="custom-checkbox">
			<input
				type="checkbox"
				id="custom-checkbox"
				checked={$graphCheckboxes.custom}
				on:change={(e) => {
					const checked = (e.target as HTMLInputElement).checked;
					graphCheckboxes.update((s) => ({ ...s, custom: checked }));
					if (checked) {
						customPool.set({ pledge: 35000000, stake: 200000000 });
					}
				}}
			/>
			Show Custom Pool
		</label>
		{#if $graphCheckboxes.custom && $customPool.stake < $customPool.pledge}
			<span class="hint-text error-text">⚠ Stake cannot be lower than pledge</span>
		{/if}
	</div>
</div>
{#if $graphCheckboxes.custom}
	<div class="custom-pool-inputs">
		<div class="label-row">
			<label for="custom-pledge">Pledge:</label>
			<input
				type="number"
				id="custom-pledge"
				min="0"
				step="10000"
				value={$customPool.pledge}
				on:input={(e) => {
					const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
					const v = parseInt(raw, 10);
					if (!isNaN(v)) {
						const pledgeVal = Math.max(1, v);
						customPool.update((c) => ({ ...c, pledge: pledgeVal }));
					}
				}}
				class="value-input"
			/>
		</div>
		<div class="label-row">
			<label for="custom-stake">Stake:</label>
			<input
				type="number"
				id="custom-stake"
				min="0"
				step="1000000"
				value={$customPool.stake}
				on:input={(e) => {
					const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
					const v = parseInt(raw, 10);
					if (!isNaN(v)) {
						const stakeVal = Math.max(1, v);
						customPool.update((c) => ({ ...c, stake: stakeVal }));
					}
				}}
				class="value-input"
			/>
		</div>
	</div>
{/if}

<!-- Radio Buttons for selecting the rewards mode -->
<div class="rewards-mode-toggle">
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
<div class="saturation-mode-toggle">
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
</div>
<br />
<div class="checkbox-control">
	<label for="toggle-zoom-checkbox">
		<input
			type="checkbox"
			id="toggle-zoom-checkbox"
			checked={$zoomEnabled}
			on:change={(e) => zoomEnabled.set((e.target as HTMLInputElement).checked)}
		/>
		Toggle Zoom
	</label>
</div>

<style>
	.slider-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Reset Defaults button */
	.reset-button {
		margin-bottom: 1rem;
		padding: 0.5rem 1rem;
		background-color: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.875rem;
	}
	.reset-button:hover {
		background-color: #e5e7eb;
	}

	/* Global styling for numeric inputs */
	.value-input {
		width: 4rem;
		background-color: white;
	}
	.hint-text {
		font-size: 0.65rem;
		color: #aaa;
	}

	.checkbox-controls {
		margin-top: 1rem;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.checkbox-control {
		display: flex;
		align-items: center;
	}

	.saturation-mode-toggle {
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.rewards-mode-toggle {
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.custom-pool-inputs {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	/* Widen custom inputs to show up to 10-digit values */
	.custom-pool-inputs .value-input {
		width: 12ch;
	}

	/* Error text next to custom pool toggle */
	.error-text {
		color: #d97706;
		margin-left: 0.5rem;
	}
</style>
