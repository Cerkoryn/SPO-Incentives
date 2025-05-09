<script lang="ts">
	import type { SaturationMode } from '$lib/stores/store';
	import {
		sliderParams,
		graphCheckboxes,
		saturationMode,
		customPool,
		zoomEnabled,
		rewardsMode
	} from '$lib/stores/store';

	function applyModeDefaults(mode: SaturationMode) {
		saturationMode.set(mode);
		if (mode === 'current') {
			sliderParams.set({ k: 500, a0: 0.3, L: 0, L2: 1 });
		} else if (mode === 'linear') {
			sliderParams.set({ k: 1000, a0: 0.2, L: 2, L2: 1 });
		} else if (mode === 'exponential') {
			sliderParams.set({ k: 1000, a0: 0.2, L: 12, L2: 20 });
		}
	}
</script>

<div class="slider-controls">
	<div class="slider-control">
		<div class="label-row">
			<label for="k-slider">k:</label>
			<input
				type="number"
				min="1"
				max="2000"
				step="1"
				value={$sliderParams.k}
				on:input={(e) => {
					const v = parseInt((e.target as HTMLInputElement).value, 10);
					if (!isNaN(v)) sliderParams.update((s) => ({ ...s, k: Math.min(2000, Math.max(1, v)) }));
				}}
				class="value-input"
			/>
			<span class="hint-text">min: 1, max: 2000</span>
		</div>
		<input
			id="k-slider"
			type="range"
			min="1"
			max="2000"
			step="1"
			value={$sliderParams.k}
			on:input={(e) =>
				sliderParams.update((s) => ({
					...s,
					k: parseInt((e.target as HTMLInputElement).value, 10)
				}))}
		/>
	</div>

	<div class="slider-control">
		<div class="label-row">
			<label for="a0-slider">a0:</label>
			<input
				type="number"
				min="0"
				max="1"
				step="0.01"
				value={$sliderParams.a0}
				on:input={(e) => {
					const v = parseFloat((e.target as HTMLInputElement).value);
					if (!isNaN(v)) sliderParams.update((s) => ({ ...s, a0: Math.min(1, Math.max(0, v)) }));
				}}
				class="value-input"
			/>
			<span class="hint-text">min: 0, max: 1</span>
		</div>
		<input
			id="a0-slider"
			type="range"
			min="0"
			max="1"
			step="0.01"
			value={$sliderParams.a0}
			on:input={(e) =>
				sliderParams.update((s) => ({
					...s,
					a0: parseFloat((e.target as HTMLInputElement).value)
				}))}
		/>
	</div>

	{#if $saturationMode === 'linear' || $saturationMode === 'exponential'}
		<div class="slider-control">
			<div class="label-row">
				<label for="L-slider">L:</label>
				<input
					type="number"
					min="0"
					max="50"
					step="0.1"
					value={$sliderParams.L}
					on:input={(e) => {
						const v = parseFloat((e.target as HTMLInputElement).value);
						if (!isNaN(v)) sliderParams.update((s) => ({ ...s, L: Math.min(100, Math.max(0, v)) }));
					}}
					class="value-input"
				/>
				<span class="hint-text">min: 0, max: 50</span>
			</div>
			<input
				id="L-slider"
				type="range"
				min="0"
				max="50"
				step="0.1"
				value={$sliderParams.L}
				on:input={(e) =>
					sliderParams.update((s) => ({
						...s,
						L: parseFloat((e.target as HTMLInputElement).value)
					}))}
			/>
		</div>
	{/if}

	{#if $saturationMode === 'exponential'}
		<div class="slider-control">
			<div class="label-row">
				<label for="L2-slider">L2:</label>
				<input
					type="number"
					min="1"
					max="100"
					step="1"
					value={$sliderParams.L2}
					on:input={(e) => {
						const v = parseInt((e.target as HTMLInputElement).value, 10);
						if (!isNaN(v))
							sliderParams.update((s) => ({ ...s, L2: Math.min(100, Math.max(0, v)) }));
					}}
					class="value-input"
				/>
				<span class="hint-text">min: 1, max: 100</span>
			</div>
			<input
				id="L2-slider"
				type="range"
				min="1"
				max="100"
				step="1"
				value={$sliderParams.L2}
				on:input={(e) =>
					sliderParams.update((s) => ({
						...s,
						L2: parseInt((e.target as HTMLInputElement).value, 10)
					}))}
			/>
		</div>
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

	.slider-control {
		display: flex;
		flex-direction: column;
	}
	.label-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
