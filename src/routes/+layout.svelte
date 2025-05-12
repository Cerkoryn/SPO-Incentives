<script lang="ts">
  import '../app.css';
  import Controls from '$lib/components/controls.svelte';
  import Graph from '$lib/components/graph.svelte';
  import { onMount } from 'svelte';
  let showSliders = false;
  let width = 0;
  const STATIC_THRESHOLD = 1800; // px: min width to show static sidebar
  $: isStatic = width >= STATIC_THRESHOLD;
  onMount(() => {
    width = window.innerWidth;
    const handleResize = () => (width = window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });
</script>

<!-- Container wrapping sidebar and main content -->
<div class="flex min-h-screen flex-col">
  {#if isStatic}
    <div class="flex flex-1">
      <aside class="bg-gray-100 p-4 w-80 overflow-y-auto">
        <Controls />
      </aside>
      <main class="flex-1 p-4">
        <Graph />
        <slot />
      </main>
    </div>
  {:else}
    <div class="relative flex flex-1 overflow-x-auto">
      <main class="flex-1 p-4">
        <Graph />
        <slot />
      </main>
      <div class="fixed top-4 left-4 z-60">
        <button class="bg-blue-500 px-4 py-2 text-white" on:click={() => (showSliders = !showSliders)}>
          {#if showSliders}Hide Sliders{:else}Show Sliders{/if}
        </button>
      </div>
      {#if showSliders}
        <aside class="bg-gray-100 p-4 fixed inset-0 z-50 w-full max-w-full max-h-screen overflow-y-auto overflow-x-hidden">
          <Controls />
        </aside>
      {/if}
    </div>
  {/if}
</div>
