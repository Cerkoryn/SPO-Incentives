<script lang="ts">
	// ... existing code ...
	import '../app.css';
	import Controls from '$lib/components/controls.svelte';
	import Graph from '$lib/components/graph.svelte';
	let showSliders = false;
</script>

<!-- Container wrapping sidebar and main content -->
<div class="flex min-h-screen flex-col md:flex-row">
  <div class="fixed top-4 left-4 z-60 lg:hidden">
    <button class="bg-blue-500 px-4 py-2 text-white" on:click={() => (showSliders = !showSliders)}>
			{#if showSliders}
				Hide Sliders
			{:else}
				Show Sliders
			{/if}
		</button>
	</div>

  <aside class={`bg-gray-100 p-4 lg:w-1/4
      ${showSliders ? 'fixed inset-0 z-50 overflow-auto' : 'hidden'}
      lg:block lg:static lg:inset-auto lg:z-auto`}>
    <Controls />
  </aside>

	<main class="flex flex-1 flex-col p-4">
		<Graph />
		<slot />
	</main>
</div>
