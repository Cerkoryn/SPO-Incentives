<script lang="ts">
	interface Descriptions {
		[key: string]: string;
	}

	export let id: string;
	export let label: string;
	export let value: number;
	export let min: number;
	export let max: number;
	export let step: number;
	export let unit: string = '';
	export let hint: string = '';
	export let wide: boolean = false;
	export let onChange: (value: number) => void = () => {};

	import descriptions from '$lib/slider-descriptions.json' assert { type: 'json' };

	// Type the descriptions
	const typedDescriptions: Descriptions = descriptions;

	let paramKey: string;
	let description: string;
	$: {
		const baseKey = id.replace(/-slider$/, '');
		const parts = baseKey.split('-');
		paramKey = parts
			.map((seg, idx) => (idx === 0 ? seg : seg.charAt(0).toUpperCase() + seg.slice(1)))
			.join('');
		description = typedDescriptions[paramKey] || 'No description available';
	}

	function onNumberInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const v = parseFloat(raw);
		if (!isNaN(v)) {
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

<div class="flex flex-col gap-2">
	<div class="flex flex-1 items-center gap-2">
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
		{#if unit}
			<span class="text-sm text-gray-600">{unit}</span>
		{/if}
		{#if hint}
			<span class="text-xs text-gray-400">{hint}</span>
		{/if}
		<span
			class="flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
			title={description}
		>
			?
		</span>
	</div>
	<input {id} type="range" {min} {max} {step} {value} on:input={onRangeInput} class="w-full" />
</div>
