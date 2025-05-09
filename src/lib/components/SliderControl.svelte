<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{ change: number }>();
	// Props
	export let id: string;
	export let label: string;
	export let value: number;
	export let min: number;
	export let max: number;
	export let step: number;
	export let hint: string = '';
	export let wide: boolean = false;

	function onNumberInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const v = parseFloat(raw);
		if (!isNaN(v)) {
			// clamp to [min, max]
			const nv = Math.min(max, Math.max(min, v));
			dispatch('change', nv);
		}
	}

	function onRangeInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const v = parseFloat(raw);
		if (!isNaN(v)) {
			dispatch('change', v);
		}
	}
</script>

<div class="slider-control">
	<div class="label-row">
		<label for={id}>{@html label}</label>
		<input
			type="number"
			id={id + '-number'}
			{min}
			{max}
			{step}
			{value}
			on:input={onNumberInput}
			class={`value-input ${wide ? 'wide-input' : ''}`}
		/>
		{#if hint}
			<span class="hint-text">{hint}</span>
		{/if}
	</div>
	<input {id} type="range" {min} {max} {step} {value} on:input={onRangeInput} />
</div>

<style>
	.slider-control {
		display: flex;
		flex-direction: column;
	}
	.label-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.value-input {
		width: 4rem;
		background-color: white;
	}
	.value-input.wide-input {
		width: 8ch;
	}
	.hint-text {
		font-size: 0.65rem;
		color: #aaa;
	}
</style>
