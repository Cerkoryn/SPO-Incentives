<script lang="ts">
	// Props
	export let id: string;
	export let label: string;
	export let value: number;
	export let min: number;
	export let max: number;
	export let step: number;
	export let hint: string = '';
	export let wide: boolean = false;
	export let onChange: (value: number) => void = () => {};

	function onNumberInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const v = parseFloat(raw);
		if (!isNaN(v)) {
			// clamp to [min, max]
			const nv = Math.min(max, Math.max(min, v));
			onChange(nv);
		}
	}

	function onRangeInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const v = parseFloat(raw);
		if (!isNaN(v)) {
			onChange(v);
		}
	}
</script>

<div class="flex flex-col">
	<div class="flex flex-wrap items-center gap-2">
		<label for={id}>{@html label}</label>
		<input
			type="number"
			id={id + '-number'}
			{min}
			{max}
			{step}
			{value}
			on:input={onNumberInput}
			class={wide ? 'w-[8ch] bg-white' : 'w-16 bg-white'}
		/>
		{#if hint}
			<span class="text-xs text-gray-400">{hint}</span>
		{/if}
	</div>
	<input {id} type="range" {min} {max} {step} {value} on:input={onRangeInput} class="mt-2 w-full" />
</div>
