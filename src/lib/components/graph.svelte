<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { externalTooltipHandler, enableCustomPoolDrag } from '$lib/utils/chart';
	import {
		pools,
		getSaturationCapLinear,
		getSaturationCapExpSaturation,
		getRewards
	} from '$lib/utils/graphs';
	import {
		showCustomPool,
		sliderParams,
		graphSettings,
		saturationMode,
		customPool,
		zoomEnabled,
		rewardsMode,
		rho,
		tau
	} from '$lib/stores/store';
	import { ADA_TOTAL_SUPPLY, ADA_RESERVES } from '$lib/utils/constants';
	import {
		GRAPH_X_ZOOM_INITIAL_MAX,
		GRAPH_X_ZOOM_REACTIVE_MAX,
		GRAPH_X_ZOOM_STEP,
		GRAPH_Y_SCALE_DEFAULT_MAX,
		GRAPH_Y_ZOOM_MAX,
		GRAPH_Y_SCALE_DEFAULT_STEP,
		GRAPH_Y_ZOOM_STEP
	} from '$lib/utils/constants';
	import { get } from 'svelte/store';

	Chart.register(...registerables);

	function getPointRadius(roi: number): number {
		const minROI = 0;
		const maxROI = 10; // Largest value we can get
		const minR = 1; // smallest bubble
		const maxR = 32; // largest bubble

		// normalize to [0…1]
		const t = Math.max(0, Math.min((roi - minROI) / (maxROI - minROI), 1));
		return minR + t * (maxR - minR);
	}

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let chart: Chart;

	// Define colors for pool groups: MPO, sSPO, plus Custom Pool
	const groupColors: Record<string, string> = {
		sSPO: 'rgba(75, 192, 75, 0.6)',
		MPO: 'rgba(255, 140, 60, 0.6)',
		'Custom Pool': 'rgba(255, 0, 0, 1)'
	};

	onMount(() => {
		createChart();
		// watch for container size changes to resize chart
		const ro = new ResizeObserver((entries: ResizeObserverEntry[], observer: ResizeObserver) => {
			if (chart) chart.resize();
		});
		if (container) ro.observe(container);
		return () => {
			ro.disconnect();
		};
	});

	function createChart() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Group all pools by their group name (all non-custom pools displayed)
		const groups: Record<string, any[]> = {};
		pools.forEach((pool) => {
			if (!groups[pool.group]) {
				groups[pool.group] = [];
			}
			groups[pool.group].push({
				x: pool.pledge,
				y: pool.active_stake,
				ticker: pool.ticker,
				name: pool.pool_id_bech32,
				group: pool.group
			});
		});
		// Include custom pool if toggled
		if ($showCustomPool) {
			const { pledge, stake } = $customPool;
			if (!isNaN(pledge) && !isNaN(stake)) {
				const groupKey = 'Custom Pool';
				if (!groups[groupKey]) groups[groupKey] = [];
				groups[groupKey].push({
					x: pledge,
					y: stake,
					ticker: 'CUSTOM',
					name: 'Custom Pool',
					group: groupKey
				});
			}
		}

		const { k, a0, L, L2 } = get(sliderParams);
		const { maxX, stepSizeX } = get(graphSettings);
		const isZoomOn = get(zoomEnabled);
		const mode = get(saturationMode);
		const rMode = get(rewardsMode);
		const rhoValue = get(rho);
		const tauValue = get(tau);
		// Build bubble datasets: size proportional to annualized ROI
		const scatterDatasets = Object.entries(groups).map(([group, dataPoints]) => {
			const datasetData = dataPoints.map((dp) => {
				const roi = getRewards(dp.y, dp.x, k, a0, L, L2, maxX, mode, rMode, rhoValue, tauValue);
				return { ...dp, roi, r: getPointRadius(roi) };
			});
			return {
				label: group,
				data: datasetData,
				backgroundColor: groupColors[group] || 'rgba(0, 0, 0, 0.6)',
				type: 'bubble' as const
			};
		});

		// pull these out so we use them in all three modes
		const baseCap = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;

		// pick exactly the right datasets for each mode
		let lineDatasets: any[];
		if (mode === 'current') {
			lineDatasets = [
				{
					label: 'Saturation Cap',
					data: [
						{ x: 0, y: baseCap },
						{ x: maxX, y: baseCap }
					],
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				}
			];
		} else if (mode === 'linear') {
			lineDatasets = [
				{
					label: 'Saturation Cap',
					data: getSaturationCapLinear(k, L, maxX, stepSizeX),
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				}
			];
		} else if (mode === 'cip-50') {
			const dottedData: { x: number; y: number }[] = [];
			for (let x = 0; x <= maxX; x += stepSizeX) {
				dottedData.push({ x, y: L * x });
			}
			lineDatasets = [
				{
					label: 'Saturation Cap (soft)',
					data: dottedData,
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					borderDash: [5, 5],
					fill: false,
					pointRadius: 0,
					showLine: true
				},
				{
					label: 'Saturation Cap',
					data: [
						{ x: 0, y: baseCap },
						{ x: maxX, y: baseCap }
					],
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				}
			];
		} else {
			lineDatasets = [
				{
					label: 'Saturation Cap',
					data: getSaturationCapExpSaturation(k, L, L2, maxX, stepSizeX),
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				}
			];
		}

		chart = new Chart(ctx, {
			type: 'scatter',
			data: {
				datasets: [...scatterDatasets, ...lineDatasets]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 0 },
				scales: {
					x: {
						type: 'linear',
						position: 'bottom',
						title: {
							display: true,
							text: 'Pledge'
						},
						min: 0,
						max: isZoomOn ? GRAPH_X_ZOOM_INITIAL_MAX : maxX,
						ticks: {
							stepSize: stepSizeX,
							callback: function (value: number | string): string {
								return new Intl.NumberFormat('en-US').format(Number(value));
							}
						}
					},
					y: {
						title: {
							display: true,
							text: 'Stake'
						},
						min: 0,
						max: isZoomOn ? GRAPH_Y_ZOOM_MAX : GRAPH_Y_SCALE_DEFAULT_MAX,
						ticks: {
							stepSize: GRAPH_Y_SCALE_DEFAULT_STEP,
							callback: function (value: number | string): string {
								return new Intl.NumberFormat('en-US').format(Number(value));
							}
						}
					}
				},
				plugins: {
					tooltip: {
						enabled: false,
						external: externalTooltipHandler,
						callbacks: {
							label: function (context: any): string[] {
								const { ticker, name, x, y, roi } = context.raw as {
									ticker: string;
									name: string;
									x: number;
									y: number;
									roi: number;
								};
								const formattedX =
									typeof x === 'number' ? new Intl.NumberFormat('en-US').format(x) : x;
								const formattedY =
									typeof y === 'number' ? new Intl.NumberFormat('en-US').format(y) : y;
								const formattedROI = typeof roi === 'number' ? roi.toFixed(2) : roi;
								const lines = [
									`Ticker: ${ticker}`,
									`Stake: ${formattedY}`,
									`Pledge: ${formattedX}`,
									`ROI: ${formattedROI}%`
								];
								if (name === 'Custom Pool' && y < x) {
									lines.push('Stake cannot be lower than pledge');
								}
								return lines;
							}
						}
					}
				}
			}
		});
		// Setup custom pool drag handlers
		enableCustomPoolDrag(chart, canvas);
	}

	// Update reactive block: recalc all datasets on param changes
	$: if (
		chart &&
		$sliderParams &&
		$graphSettings &&
		$saturationMode !== undefined &&
		$showCustomPool !== undefined &&
		$customPool
	) {
		const { k, L, L2 } = $sliderParams;
		const { maxX, stepSizeX } = $graphSettings;
		const base = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;

		// Ensure correct line datasets (dashed soft cap + flat cap) based on mode
		{
			const isCip50 = $saturationMode === 'cip-50';
			const datasets = chart.data.datasets;
			// find dashed (soft) line index: type line with borderDash
			const dashedIdx = datasets.findIndex(
				(ds) => ds.type === 'line' && Array.isArray((ds as any).borderDash)
			);
			// find flat cap line index: type line without borderDash
			const flatIdx = datasets.findIndex(
				(ds) => ds.type === 'line' && !Array.isArray((ds as any).borderDash)
			);
			if (isCip50) {
				// add soft (dotted) cap if missing
				if (dashedIdx === -1) {
					const dotted: { x: number; y: number }[] = [];
					for (let x = 0; x <= maxX; x += stepSizeX) {
						dotted.push({ x, y: L * x });
					}
					datasets.push({
						label: 'Saturation Cap (soft)',
						data: dotted,
						type: 'line' as const,
						borderColor: 'red',
						borderWidth: 2,
						borderDash: [5, 5],
						fill: false,
						pointRadius: 0,
						showLine: true
					});
				}
				// add flat cap if missing
				if (flatIdx === -1) {
					datasets.push({
						label: 'Saturation Cap',
						data: [
							{ x: 0, y: base },
							{ x: maxX, y: base }
						],
						type: 'line' as const,
						borderColor: 'red',
						borderWidth: 2,
						fill: false,
						pointRadius: 0,
						showLine: true
					});
				}
			} else {
				// remove soft cap line if present
				if (dashedIdx !== -1) datasets.splice(dashedIdx, 1);
				// keep only one flat cap line
				const lineIndices = datasets
					.map((ds, i) => ({ ds, i }))
					.filter(({ ds }) => ds.type === 'line')
					.map(({ i }) => i);
				for (let j = lineIndices.length - 1; j > 0; j--) {
					datasets.splice(lineIndices[j], 1);
				}
				// ensure label of remaining line is correct
				const onlyIdx = datasets.findIndex((ds) => ds.type === 'line');
				if (onlyIdx !== -1) {
					datasets[onlyIdx].label = 'Saturation Cap';
					delete (datasets[onlyIdx] as any).borderDash;
				}
			}
		}
		// Update line datasets
		chart.data.datasets.forEach((ds: any) => {
			if (ds.type === 'line') {
				let newData: { x: number; y: number }[] | undefined;
				if ($saturationMode === 'current') {
					// constant 1/k cap
					newData = [
						{ x: 0, y: base },
						{ x: maxX, y: base }
					];
				} else if ($saturationMode === 'linear') {
					newData = getSaturationCapLinear(k, L, maxX, stepSizeX);
				} else if ($saturationMode === 'exponential') {
					newData = getSaturationCapExpSaturation(k, L, L2, maxX, stepSizeX);
				} else if ($saturationMode === 'cip-50') {
					if ((ds as any).borderDash) {
						// dotted soft cap line
						const dotted: { x: number; y: number }[] = [];
						for (let x = 0; x <= maxX; x += stepSizeX) {
							dotted.push({ x, y: L * x });
						}
						newData = dotted;
					} else {
						// flat saturation cap line
						newData = [
							{ x: 0, y: base },
							{ x: maxX, y: base }
						];
					}
				}
				if (newData) {
					ds.data = newData;
				}
			}
		});

		// Update bubble radii
		chart.data.datasets.forEach((ds: any) => {
			if (ds.type === 'bubble') {
				ds.data = (ds.data as any[]).map((pt: any) => {
					const roi = getRewards(
						pt.y,
						pt.x,
						k,
						$sliderParams.a0,
						L,
						L2,
						maxX,
						$saturationMode,
						$rewardsMode,
						$rho,
						$tau
					);
					return { ...pt, roi, r: getPointRadius(roi) };
				});
			}
		});

		// Handle custom pool dataset
		const customIdx = chart.data.datasets.findIndex((ds: any) => ds.label === 'Custom Pool');
		if ($showCustomPool) {
			const { pledge, stake } = $customPool;
			if (!isNaN(pledge) && !isNaN(stake)) {
				const roi = getRewards(
					stake,
					pledge,
					k,
					$sliderParams.a0,
					L,
					L2,
					maxX,
					$saturationMode,
					$rewardsMode,
					$rho,
					$tau
				);
				const rVal = getPointRadius(roi);
				const customData = {
					x: pledge,
					y: stake,
					ticker: 'CUSTOM',
					name: 'Custom Pool',
					group: 'Custom Pool',
					roi,
					r: rVal
				};
				if (customIdx === -1) {
					chart.data.datasets.unshift({
						label: 'Custom Pool',
						data: [customData],
						type: 'bubble' as const,
						backgroundColor: groupColors['Custom Pool']
					});
				} else {
					(chart.data.datasets[customIdx].data as any[]) = [customData];
				}
			}
		} else if (customIdx !== -1) {
			chart.data.datasets.splice(customIdx, 1);
		}

		// Commit updates
		chart.update('none');
	}
	// Reactive block for axis and zoom updates
	$: if (chart && $graphSettings) {
		const { maxX, stepSizeX } = $graphSettings;
		// adjust axis limits and ticks based on zoom toggle
		const scales: any = chart.options.scales as any;
		const xScale: any = scales.x;
		const yScale: any = scales.y;
		xScale.max = $zoomEnabled ? GRAPH_X_ZOOM_REACTIVE_MAX : maxX;
		xScale.ticks.stepSize = $zoomEnabled ? GRAPH_X_ZOOM_STEP : stepSizeX;
		yScale.max = $zoomEnabled ? GRAPH_Y_ZOOM_MAX : GRAPH_Y_SCALE_DEFAULT_MAX;
		yScale.ticks.stepSize = $zoomEnabled ? GRAPH_Y_ZOOM_STEP : GRAPH_Y_SCALE_DEFAULT_STEP;
		chart.update();
	}
</script>

<div bind:this={container} class="relative h-175 w-full">
	<canvas bind:this={canvas} class="h-full w-full border border-gray-300"></canvas>
	<div
		id="chartjs-tooltip"
		class="chartjs-tooltip bg-opacity-70 pointer-events-none fixed rounded bg-black px-2 py-1 text-xs whitespace-nowrap text-white transition-opacity duration-100"
	></div>
</div>

<style>
	/* Tooltip container fixed to viewport for overflow handling */
	:global(.chartjs-tooltip) {
		opacity: 0;
		pointer-events: none;
		position: fixed;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border-radius: 3px;
		font-size: 12px;
		padding: 6px;
		white-space: nowrap;
		transition: opacity 0.1s ease;
	}
	:global(.chartjs-tooltip .tooltip-item) {
		display: flex;
		align-items: center;
		margin-bottom: 2px;
	}
	:global(.chartjs-tooltip .tooltip-item:last-child) {
		margin-bottom: 0;
	}
	:global(.chartjs-tooltip .tooltip-box) {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin-right: 6px;
	}
	:global(.chartjs-tooltip .warning-text) {
		color: orange !important;
	}
	:global(.chartjs-tooltip .tooltip-title) {
		font-weight: bold;
		margin-bottom: 4px;
	}
</style>
