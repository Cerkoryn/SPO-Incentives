<script lang="ts">
	// ... existing code ...
	import '../app.css';
	import Controls from '$lib/components/controls.svelte';
	import Graph from '$lib/components/graph.svelte';

	// Toggle state for slider visibility on small screens.
	let showSliders = false;
</script>

<!-- Container wrapping sidebar and main content -->
<div class="min-h-screen flex flex-col md:flex-row">
	<!-- Toggle button for small screens only -->
	<div class="md:hidden p-4">
		<button class="bg-blue-500 text-white px-4 py-2" on:click={() => showSliders = !showSliders}>
			{#if showSliders}
				Hide Sliders
			{:else}
				Show Sliders
			{/if}
		</button>
	</div>

	<!-- Sidebar for slider controls.
	     For small screens, uses conditional classes to display based on showSliders.
	     On medium screens and above, it's always visible via "md:block". -->
	<aside class={`bg-gray-100 md:w-1/4 p-4 ${showSliders ? 'block' : 'hidden'} md:block`}>
		<Controls />
	</aside>

	<!-- Main content area showing the graph and additional page content -->
	<main class="flex flex-col flex-1 p-4">
		<Graph />
		<slot />
	</main>
</div>