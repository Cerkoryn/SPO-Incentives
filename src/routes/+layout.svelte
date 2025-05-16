<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import '../app.css';
	import Controls from '$lib/components/controls.svelte';
	import Graph from '$lib/components/graph.svelte';

	// Whether the controls popup is visible
	let showPopup = false;
	let isDragging = false;
	let currentX = 0;
	let currentY = 0;
	let initialX = 0;
	let initialY = 0;
	let collapsed = false;

	// Debounce utility
	function debounce<T extends (...args: any[]) => void>(
		func: T,
		wait: number
	): (...args: Parameters<T>) => void {
		let timeout: ReturnType<typeof setTimeout> | null = null;
		return (...args: Parameters<T>) => {
			clearTimeout(timeout!);
			timeout = setTimeout(() => func(...args), wait);
		};
	}

	// Position popup at top (mobile) or top-right (desktop)
	function setInitialPosition() {
		if (!browser) return;
		requestAnimationFrame(() => {
			const popup = document.querySelector('.popup') as HTMLElement;
			const isMobile = window.innerWidth < 768;
			if (popup) {
				const { width } = popup.getBoundingClientRect();
				currentX = isMobile ? 0 : window.innerWidth - width;
				currentY = 0;
			} else {
				currentX = isMobile ? 0 : window.innerWidth - 512;
				currentY = 0;
			}
		});
	}

	onMount(() => {
		setInitialPosition();
		showPopup = true;
		// Reposition on window resize
		const handleResize = debounce(() => {
			if (showPopup) setInitialPosition();
		}, 100);
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	function togglePopup() {
		showPopup = !showPopup;
		if (showPopup && browser) {
			setInitialPosition();
		}
	}

	function toggleCollapse(event: MouseEvent) {
		collapsed = !collapsed;
		(event.currentTarget as HTMLElement).blur();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			showPopup = false;
		}
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			showPopup = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			showPopup = false;
		} else if (event.key === 'Enter' && event.ctrlKey) {
			event.preventDefault();
			collapsed = !collapsed;
		}
	}

	function startDragging(event: MouseEvent) {
		if (window.innerWidth < 768) return; // Disable dragging on mobile
		if ((event.target as HTMLElement).closest('.drag-handle')) {
			isDragging = true;
			initialX = event.clientX - currentX;
			initialY = event.clientY - currentY;
		}
	}

	function drag(event: MouseEvent) {
		if (isDragging && browser) {
			event.preventDefault();
			const newX = event.clientX - initialX;
			const newY = event.clientY - initialY;

			const popup = document.querySelector('.popup') as HTMLElement;
			if (!popup) return;

			const { width, height } = popup.getBoundingClientRect();
			const maxX = window.innerWidth - width;
			const maxY = window.innerHeight - height;

			currentX = Math.max(0, Math.min(newX, maxX));
			currentY = Math.max(0, Math.min(newY, maxY));
		}
	}

	function stopDragging() {
		isDragging = false;
	}
</script>

<svelte:window on:keydown={handleKeydown} on:mousemove={drag} on:mouseup={stopDragging} />

<div class="box-border flex min-h-screen flex-col">
	<main class="flex max-w-full flex-1 flex-col gap-4 p-2 sm:p-4">
		<div class="flex flex-col gap-4">
			<div class="relative w-full max-w-full">
				<Graph />
				<button
					class="absolute bottom-2 left-2 z-10 transform rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					style="transform-origin: bottom left; transform: scale(0.6);"
					aria-label={showPopup ? 'Hide Controls' : 'Show Controls'}
					on:click={togglePopup}
				>
					{showPopup ? 'Hide Controls' : 'Show Controls'}
				</button>
			</div>
			<slot />
		</div>
	</main>

	{#if showPopup}
		<div
			role="dialog"
			aria-labelledby="popup-title"
			aria-modal="true"
			tabindex="0"
			class="pointer-events-none fixed inset-0 z-50"
			on:click={handleBackdropClick}
			on:keydown={handleBackdropKeydown}
		>
			<div
				class="popup border-glass animate-fade-in pointer-events-auto box-border flex w-full flex-col rounded-lg border backdrop-blur-md transition-all duration-200 sm:max-w-lg"
				class:collapsed
				style="position: absolute; left: {currentX}px; top: {currentY}px;"
			>
				<div
					class="drag-handle group relative flex cursor-grab items-center justify-between p-4 sm:p-6"
					role="button"
					tabindex="0"
					aria-label="Drag to move popup"
					class:isDragging
					on:mousedown={startDragging}
					on:keydown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							startDragging({ clientX: currentX, clientY: currentY } as MouseEvent);
						}
					}}
				>
					<div class="flex items-center gap-2">
						<h2 id="popup-title" class="text-lg font-semibold text-gray-900">Adjust Parameters</h2>
					</div>
					<div class="flex items-center gap-2">
						<button
							class="text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-gray-500 focus:outline-none"
							aria-label={collapsed ? 'Expand controls' : 'Collapse controls'}
							on:click={toggleCollapse}
						>
							<svg
								class="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={collapsed ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}
								/>
							</svg>
						</button>
						<button
							class="text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-gray-500 focus:outline-none"
							aria-label="Close parameter sliders"
							on:click={(event) => {
								showPopup = false;
								(event.currentTarget as HTMLElement).blur();
							}}
						>
							<svg
								class="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>
				{#if !collapsed}
					<div class="box-border max-w-full flex-1 overflow-y-auto p-4 pt-0 sm:p-6">
						<Controls />
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.popup {
		transition: max-height 0.2s ease-out;
		position: absolute;
		top: 0;
		right: 0;
		width: 100%;
		max-width: 512px;
		background: rgba(255, 255, 255, 0.2); /* Very transparent for glass effect */
		box-sizing: border-box;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
	}
	.popup.collapsed {
		max-height: 80px;
	}
	.popup:not(.collapsed) {
		max-height: 90vh;
	}
	.drag-handle:hover {
		background: rgba(0, 0, 0, 0.05);
	}
	.drag-handle.isDragging {
		cursor: grabbing;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
	@media (max-width: 767px) {
		.popup {
			top: 0;
			right: 0;
			left: 0;
			width: 100%;
			max-width: none;
			border-radius: 0;
			box-shadow: none;
			flex-direction: column;
		}
	}
	/* Glass-like border */
	.border-glass {
		border: 1px solid rgba(255, 255, 255, 0.3);
	}
</style>
