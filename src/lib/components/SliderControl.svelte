<!-- src/lib/components/SliderControl.svelte -->
<script lang="ts">
  // Define Descriptions interface
  interface Descriptions {
    [key: string]: string;
  }

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

  // Import descriptions with type
  import descriptions from '$lib/slider-descriptions.json' assert { type: 'json' };

  // Type the descriptions
  const typedDescriptions: Descriptions = descriptions;

  // Extract parameter key from id (e.g., "rho-slider" -> "rho")
  $: paramKey = id.split('-')[0];
  $: description = typedDescriptions[paramKey] || 'No description available';

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

<div class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    <!-- Label and input container -->
    <div class="flex items-center gap-2 flex-1">
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
    <!-- Question mark on far right -->
    <span
      class="inline-block text-xs text-white bg-gray-800 rounded-full w-4 h-4 flex items-center justify-center text-center font-bold"
      title={description}
    >
      ?
    </span>
  </div>
  <input {id} type="range" {min} {max} {step} {value} on:input={onRangeInput} class="w-full" />
</div>