<script lang="ts">
	// ... existing code ...
	import '../app.css';
	import Controls from '$lib/components/controls.svelte';
	import Graph from '$lib/components/graph.svelte';

	// Toggle state for slider visibility on small screens.
	let showSliders = false;
</script>

<!-- Container wrapping sidebar and main content -->
<div class="flex min-h-screen flex-col md:flex-row">
	<!-- Toggle button for small screens only -->
	<div class="p-4 md:hidden">
		<button class="bg-blue-500 px-4 py-2 text-white" on:click={() => (showSliders = !showSliders)}>
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
	<aside class={`bg-gray-100 p-4 md:w-1/4 ${showSliders ? 'block' : 'hidden'} md:block`}>
		<Controls />
	</aside>

	<!-- Main content area showing the graph and additional page content -->
	<main class="flex flex-1 flex-col p-4">
		<Graph />
		<slot />
	</main>
</div>
