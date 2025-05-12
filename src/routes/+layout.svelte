<script lang="ts">
	import '../app.css';
	import Controls from '$lib/components/controls.svelte';
	import Graph from '$lib/components/graph.svelte';
	let showSliders = false;
</script>

<!-- Container wrapping sidebar and main content -->
<div class="flex min-h-screen flex-col md:flex-row overflow-x-hidden">
  <div class="fixed top-4 left-4 z-60 lg:hidden">
    <button class="bg-blue-500 px-4 py-2 text-white" on:click={() => (showSliders = !showSliders)}>
			{#if showSliders}
				Hide Sliders
			{:else}
				Show Sliders
			{/if}
		</button>
	</div>

  <!-- Controls pane: overlay on small/mid screens, static sidebar on large screens -->
  <!-- Controls pane: overlay on small/mid screens, static sidebar on large screens -->
  <aside class={`bg-gray-100 p-4 max-h-screen overflow-y-auto overflow-x-hidden
      ${showSliders ? 'fixed inset-0 z-50 w-full max-w-full' : 'hidden'}
      lg:block lg:static lg:inset-auto lg:z-auto lg:w-1/4`}>
    <Controls />
  </aside>

	<main class="flex flex-1 flex-col p-4">
		<Graph />
		<slot />
	</main>
</div>
