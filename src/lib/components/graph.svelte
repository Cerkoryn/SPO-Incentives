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
		graphCheckboxes,
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
	let chart: Chart;

	// Define colors for pool groups: MPO, sSPO, plus Custom Pool
	const groupColors: Record<string, string> = {
		sSPO: 'rgba(75, 192, 75, 0.6)',
		MPO: 'rgba(255, 140, 60, 0.6)',
		'Custom Pool': 'rgba(255, 0, 0, 1)'
	};

	onMount(() => {
		createChart();
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
		if ($graphCheckboxes.custom) {
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
				const roi = getRewards(dp.y, dp.x, k, a0, L, L2, mode, rMode, rhoValue, tauValue);
				return { ...dp, roi, r: getPointRadius(roi) };
			});
			return {
				label: group,
				data: datasetData,
				backgroundColor: groupColors[group] || 'rgba(0, 0, 0, 0.6)',
				type: 'bubble'
			};
		});

		// pull these out so we use them in all three modes
		const baseCap = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;

		// pick exactly the right data for each mode
		let lineData: { x: number; y: number }[];
		if (mode === 'current') {
			lineData = [
				{ x: 0, y: baseCap },
				{ x: maxX, y: baseCap }
			];
		} else if (mode === 'linear') {
			lineData = getSaturationCapLinear(k, L, maxX, stepSizeX);
		} else {
			lineData = getSaturationCapExpSaturation(k, L, L2, maxX, stepSizeX);
		}

		const lineDataset = {
			label: 'Saturation Cap',
			data: lineData,
			type: 'line',
			borderColor: 'red',
			borderWidth: 2,
			fill: false,
			pointRadius: 0,
			showLine: true
		};

		chart = new Chart(ctx, {
			type: 'scatter',
			data: {
				datasets: [...scatterDatasets, lineDataset]
			},
			options: {
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
						max: isZoomOn ? 5000000 : maxX,
						ticks: {
							stepSize: stepSizeX,
							callback: function (value) {
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
						max: isZoomOn ? 80000000 : 300000000,
						ticks: {
							stepSize: 25000000,
							callback: function (value) {
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
							label: function (context) {
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

	// Update reactive block to listen to changes in both slider parameters and graph settings.
	$: if (
		chart &&
		$sliderParams &&
		$graphSettings &&
		$saturationMode &&
		$graphCheckboxes &&
		$customPool
	) {
		const idx = chart.data.datasets.findIndex((ds) => ds.label === 'Saturation Cap');
		if (idx !== -1) {
			const { k, L, L2 } = $sliderParams;
			const { maxX, stepSizeX } = $graphSettings;

			let updatedLine: { x: number; y: number }[];
			const base = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;
			if ($saturationMode === 'current') {
				updatedLine = [
					{ x: 0, y: base },
					{ x: maxX, y: base }
				];
			} else if ($saturationMode === 'linear') {
				updatedLine = getSaturationCapLinear(k, L, maxX, stepSizeX);
			} else {
				updatedLine = getSaturationCapExpSaturation(k, L, L2, maxX, stepSizeX);
			}

			chart.data.datasets[idx].data = updatedLine;

			// update bubble radii as before…
			chart.data.datasets.forEach((ds) => {
				if (ds.type === 'bubble') {
					ds.data = (ds.data as any[]).map((pt) => {
						const roi = getRewards(
							pt.y,
							pt.x,
							k,
							$sliderParams.a0,
							L,
							L2,
							$saturationMode,
							$rewardsMode,
							$rho,
							$tau
						);
						return { ...pt, roi, r: getPointRadius(roi) };
					});
				}
			});
			// Handle custom pool dataset presence and updates
			const customIdx = chart.data.datasets.findIndex((ds) => ds.label === 'Custom Pool');
			if ($graphCheckboxes.custom) {
				const { pledge, stake } = $customPool;
				if (!isNaN(pledge) && !isNaN(stake)) {
					const roi = getRewards(
						stake,
						pledge,
						k,
						$sliderParams.a0,
						L,
						L2,
						$saturationMode,
						$rewardsMode,
						$rho,
						$tau
					);
					const r = getPointRadius(roi);
					const customData = {
						x: pledge,
						y: stake,
						ticker: 'CUSTOM',
						name: 'Custom Pool',
						group: 'Custom Pool',
						roi,
						r
					};
					if (customIdx === -1) {
						chart.data.datasets.splice(0, 0, {
							label: 'Custom Pool',
							data: [customData],
							type: 'bubble',
							backgroundColor: groupColors['Custom Pool'] ?? 'rgba(255, 0, 0, 1)'
						});
					} else {
						(chart.data.datasets[customIdx].data as any[]) = [customData];
					}
				}
			} else if (customIdx !== -1) {
				chart.data.datasets.splice(customIdx, 1);
			}
			// update axis options based on zoom toggle
			chart.options.scales.x.max = $zoomEnabled ? 1000000 : maxX;
			chart.options.scales.x.ticks.stepSize = $zoomEnabled ? 100000 : stepSizeX;
			chart.options.scales.y.max = $zoomEnabled ? 80000000 : 300000000;
			chart.options.scales.y.ticks.stepSize = $zoomEnabled ? 5000000 : 25000000;
			chart.update();
		}
	}
</script>

<div class="relative">
	<canvas bind:this={canvas} width="600" height="300" class="w-full h-auto border border-gray-300"></canvas>
	<div id="chartjs-tooltip" class="chartjs-tooltip fixed pointer-events-none bg-black bg-opacity-70 text-white rounded px-2 py-1 text-xs whitespace-nowrap transition-opacity duration-100"></div>
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
