<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
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
		rewardsMode
	} from '$lib/stores/store';
	import { ADA_TOTAL_SUPPLY, ADA_RESERVES } from '$lib/utils/constants';
	import { get } from 'svelte/store';

	Chart.register(...registerables);

	// Custom external tooltip handler to allow rich text and styling
	function externalTooltipHandler(context: any) {
		const { chart, tooltip } = context;
		const tooltipEl = chart.canvas.parentNode.querySelector('#chartjs-tooltip');
		if (!tooltipEl) return;
		// Hide if no tooltip
		if (tooltip.opacity === 0) {
			tooltipEl.style.opacity = '0';
			return;
		}
		// Clear existing content
		tooltipEl.innerHTML = '';
		// Add title lines
		tooltip.title.forEach((line) => {
			const el = document.createElement('div');
			el.classList.add('tooltip-title');
			el.textContent = line;
			tooltipEl.appendChild(el);
		});
		// Add body items with colored box only on the 'Ticker' line
		if (tooltip.dataPoints && tooltip.labelColors) {
			tooltip.dataPoints.forEach((dp: any, i: number) => {
				const lines = tooltip.body[i]?.lines || [];
				const bgColor = tooltip.labelColors[i]?.backgroundColor || 'transparent';
				lines.forEach((line: string, j: number) => {
					const wrapper = document.createElement('div');
					wrapper.classList.add('tooltip-item');
					// prepend colored box only for first line (Ticker); transparent otherwise
					const box = document.createElement('span');
					box.classList.add('tooltip-box');
					box.style.backgroundColor = j === 0 ? bgColor : 'transparent';
					wrapper.appendChild(box);
					// text content
					const text = document.createElement('span');
					if (line === 'Stake cannot be lower than pledge') {
						text.classList.add('warning-text');
						text.textContent = '⚠ ' + line;
					} else {
						text.textContent = line;
					}
					wrapper.appendChild(text);
					tooltipEl.appendChild(wrapper);
				});
			});
		}
		// Display tooltip at caret position, flipping to stay within viewport
		const { caretX, caretY } = tooltip;
		tooltipEl.style.opacity = '1';
		// Get canvas position on page
		const canvasRect = chart.canvas.getBoundingClientRect();
		// Calculate page coordinates for tooltip
		let x = canvasRect.left + window.pageXOffset + caretX;
		let y = canvasRect.top + window.pageYOffset + caretY;
		// Measure tooltip size
		const tooltipWidth = tooltipEl.offsetWidth;
		const tooltipHeight = tooltipEl.offsetHeight;
		// Flip horizontally if overflowing viewport
		if (x + tooltipWidth > window.pageXOffset + window.innerWidth) {
			x -= tooltipWidth;
		}
		if (x < window.pageXOffset) {
			x = window.pageXOffset;
		}
		// Flip vertically if overflowing viewport bottom
		if (y + tooltipHeight > window.pageYOffset + window.innerHeight) {
			y -= tooltipHeight;
		}
		if (y < window.pageYOffset) {
			y = window.pageYOffset;
		}
		// Position tooltip using fixed coordinates
		tooltipEl.style.left = x + 'px';
		tooltipEl.style.top = y + 'px';
	}

	function getPointRadius(roi: number): number {
		const minROI = 0;
		const maxROI = 6.5; // 5% cap
		const minR = 1; // smallest bubble
		const maxR = 25; // largest bubble

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
		// Build bubble datasets: size proportional to annualized ROI
		const scatterDatasets = Object.entries(groups).map(([group, dataPoints]) => {
			const datasetData = dataPoints.map((dp) => {
				const roi = getRewards(dp.y, dp.x, k, a0, L, L2, mode, rMode);
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
		// Enable dragging only on the custom pool bubble
		let isDragging = false;
		let dragDatasetIndex: number;
		let dragDataIndex: number;
		canvas.addEventListener('mousedown', (e: MouseEvent) => {
			const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
			if (pts.length) {
				const el = pts[0];
				if (chart.data.datasets[el.datasetIndex].label === 'Custom Pool') {
					isDragging = true;
					dragDatasetIndex = el.datasetIndex;
					dragDataIndex = el.index;
				}
			}
		});
		canvas.addEventListener('mousemove', (e: MouseEvent) => {
			if (!isDragging) return;
			// Calculate nearest whole number values for custom pool
			const rawX = chart.scales.x.getValueForPixel(e.offsetX);
			const rawY = chart.scales.y.getValueForPixel(e.offsetY);
			// Enforce positive values greater than 0
			const pledgeVal = Math.max(0, Math.round(rawX));
			const stakeVal = Math.max(0, Math.round(rawY));
			const ds = chart.data.datasets[dragDatasetIndex];
			const point: any = (ds.data as any[])[dragDataIndex];
			point.x = pledgeVal;
			point.y = stakeVal;
			customPool.set({ pledge: pledgeVal, stake: stakeVal });
			chart.update('none');
		});
		canvas.addEventListener('mouseup', () => {
			isDragging = false;
		});
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
							$rewardsMode
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
						$rewardsMode
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
			chart.update();
		}
	}
	// Reactive handler: update axis limits and tick sizes when zoom toggles or settings change
	$: if (chart) {
		const { maxX, stepSizeX } = $graphSettings;
		chart.options.scales.x.max = $zoomEnabled ? 1000000 : maxX;
		chart.options.scales.x.ticks.stepSize = $zoomEnabled ? 100000 : stepSizeX;
		chart.options.scales.y.max = $zoomEnabled ? 80000000 : 300000000;
		chart.options.scales.y.ticks.stepSize = $zoomEnabled ? 5000000 : 25000000;
		chart.update();
	}
</script>

<div class="chart-container">
	<canvas bind:this={canvas} width="600" height="300"></canvas>
	<div id="chartjs-tooltip" class="chartjs-tooltip"></div>
</div>

<style>
	canvas {
		width: 100%;
		height: auto;
		border: 1px solid #ccc;
	}
	.chart-container {
		position: relative;
	}
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
