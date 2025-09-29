<!-- Chart.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { externalTooltipHandler, enableCustomPoolDrag } from '$lib/utils/chart';
	import {
		pools,
		getSaturationCapLinear,
		getSaturationCapExpSaturation,
		getRewards,
		computeRewardScale,
		type ExtraPoolInput
	} from '$lib/utils/graphs';
	import {
		showCustomPool,
		showCustomPool2,
		sliderParams,
		graphSettings,
		saturationMode,
		customPool,
		customPool2,
		zoomLevel,
		rewardsMode,
		cip50StakeTotals,
		kStakeTotals
	} from '$lib/stores/store';
	import {
		ADA_TOTAL_SUPPLY,
		ADA_RESERVES,
		GRAPH_X_ZOOM_OFF_MAX,
		GRAPH_X_ZOOM_1X_MAX,
		GRAPH_X_ZOOM_2X_MAX,
		GRAPH_X_ZOOM_3X_MAX,
		GRAPH_X_ZOOM_OFF_STEP,
		GRAPH_X_ZOOM_1X_STEP,
		GRAPH_X_ZOOM_2X_STEP,
		GRAPH_X_ZOOM_3X_STEP,
		GRAPH_Y_SCALE_DEFAULT_MAX,
		GRAPH_Y_ZOOM_MAX,
		GRAPH_Y_SCALE_DEFAULT_STEP,
		GRAPH_Y_ZOOM_STEP
	} from '$lib/utils/constants';
	import { get } from 'svelte/store';

	Chart.register(...registerables);

	function getPointRadius(roi: number): number {
		const minROI = 0;
		const maxROI = 10;
		const minR = 1;
		const maxR = 32;
		const t = Math.max(0, Math.min((roi - minROI) / (maxROI - minROI), 1));
		return minR + t * (maxR - minR);
	}

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let chart: Chart;

	const groupColors: Record<string, string> = {
		sSPO: 'rgba(75, 192, 75, 0.6)',
		MPO: 'rgba(255, 140, 60, 0.6)',
		'Custom Pool': 'rgba(255, 0, 0, 1)',
		'Custom Pool 2': 'rgba(0, 0, 255, 1)'
	};

	onMount(() => {
		createChart();
		const ro = new ResizeObserver(() => chart?.resize());
		if (container) ro.observe(container);
		return () => ro.disconnect();
	});

	function createChart() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const groups: Record<string, any[]> = {};
		pools.forEach((pool) => {
			groups[pool.group] ||= [];
			groups[pool.group].push({
				x: pool.pledge,
				y: pool.active_stake,
				ticker: pool.ticker,
				name: pool.pool_id_bech32,
				group: pool.group
			});
		});

		if ($showCustomPool) {
			const { pledge, stake } = $customPool;
			if (!isNaN(pledge) && !isNaN(stake)) {
				const key = 'Custom Pool';
				groups[key] ||= [];
				groups[key].push({ x: pledge, y: stake, ticker: 'CUSTOM', name: key, group: key });
			}
		}

		if ($showCustomPool2) {
			const { pledge, stake } = $customPool2;
			if (!isNaN(pledge) && !isNaN(stake)) {
				const key = 'Custom Pool 2';
				groups[key] ||= [];
				groups[key].push({ x: pledge, y: stake, ticker: 'CUSTOM2', name: key, group: key });
			}
		}

		const params = get(sliderParams);
		const { k, a0, L, L2 } = params;
		const { maxX, stepSizeX } = get(graphSettings);
		const zoomState = get(zoomLevel);
		const mode = get(saturationMode);
		const rMode = get(rewardsMode);

		const extraPools: ExtraPoolInput[] = [];
		if ($showCustomPool) {
			const { pledge, stake } = $customPool;
			if (!isNaN(pledge) && !isNaN(stake) && stake > 0) {
				extraPools.push({ stake, pledge });
			}
		}
		if ($showCustomPool2) {
			const { pledge, stake } = $customPool2;
			if (!isNaN(pledge) && !isNaN(stake) && stake > 0) {
				extraPools.push({ stake, pledge });
			}
		}
		const { rewardScale, stakeScale } = computeRewardScale(params, maxX, mode, rMode, extraPools);

		let axisMinX = 0;
		let axisMaxX: number;
		let axisStepX: number;
		switch (zoomState) {
			case '3x':
				axisMaxX = GRAPH_X_ZOOM_3X_MAX;
				axisStepX = GRAPH_X_ZOOM_3X_STEP;
				axisMinX = 0;
				break;
			case '2x':
				axisMaxX = GRAPH_X_ZOOM_2X_MAX;
				axisStepX = GRAPH_X_ZOOM_2X_STEP;
				break;
			case '1x':
				axisMaxX = GRAPH_X_ZOOM_1X_MAX;
				axisStepX = GRAPH_X_ZOOM_1X_STEP;
				break;
			case 'off':
			default:
				axisMaxX = maxX || GRAPH_X_ZOOM_OFF_MAX;
				axisStepX = stepSizeX || GRAPH_X_ZOOM_OFF_STEP;
				break;
		}

		const axisMaxY = zoomState === 'off' ? GRAPH_Y_SCALE_DEFAULT_MAX : GRAPH_Y_ZOOM_MAX;
		const axisStepY = zoomState === 'off' ? GRAPH_Y_SCALE_DEFAULT_STEP : GRAPH_Y_ZOOM_STEP;

		const scatterDatasets = Object.entries(groups).map(([group, dataPoints]) => {
			const data = dataPoints.map((dp) => {
				const roi = getRewards(dp.y, dp.x, params, maxX, mode, rMode, rewardScale, stakeScale);
				return { ...dp, roi, r: getPointRadius(roi) };
			});
			return {
				label: group,
				data,
				backgroundColor: groupColors[group] || 'rgba(0,0,0,0.6)',
				type: 'bubble' as const
			};
		});

		const baseCap = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;

		let lineDatasets: any[] = []; // Initialize to empty array
		if (mode === 'current') {
			lineDatasets = [
				{
					label: 'Saturation Cap',
					data: [
						{ x: axisMinX, y: baseCap },
						{ x: axisMaxX, y: baseCap }
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
					data: getSaturationCapLinear(k, L, axisMaxX, axisStepX),
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				}
			];
		} else if (mode === 'exponential') {
			lineDatasets = [
				{
					label: 'Saturation Cap',
					data: getSaturationCapExpSaturation(k, L, L2, axisMaxX, axisStepX),
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
			for (let x = axisMinX; x <= axisMaxX; x += axisStepX) {
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
						{ x: axisMinX, y: baseCap },
						{ x: axisMaxX, y: baseCap }
					],
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				}
			];
		} else if (mode === 'cip-7') {
			lineDatasets = [
				{
					label: 'Saturation Cap',
					data: [
						{ x: axisMinX, y: baseCap },
						{ x: axisMaxX, y: baseCap }
					],
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
						min: axisMinX,
						max: axisMaxX,
						ticks: {
							stepSize: axisStepX,
							callback: function (value: number | string): string {
								return new Intl.NumberFormat('en-US').format(Number(value));
							}
						}
					},
					y: {
						type: 'linear',
						title: {
							display: true,
							text: 'Stake'
						},
						min: 0,
						max: axisMaxY,
						suggestedMax: axisMaxY,
						ticks: {
							stepSize: axisStepY,
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
								if ((name === 'Custom Pool' || name === 'Custom Pool 2') && y < x) {
									lines.push('Stake cannot be lower than pledge');
								}
								return lines;
							}
						}
					}
				}
			}
		});
		enableCustomPoolDrag(chart, canvas);
	}

	$: if (
		chart &&
		$sliderParams &&
		$graphSettings &&
		$saturationMode !== undefined &&
		$showCustomPool !== undefined &&
		$showCustomPool2 !== undefined &&
		$customPool &&
		$customPool2
	) {
		const params = $sliderParams;
		const { k, L, L2, crossover, curveRoot, rho, tau } = params;
		const { maxX, stepSizeX } = $graphSettings;
		const base = (ADA_TOTAL_SUPPLY - ADA_RESERVES) / k;
		const zoomState = $zoomLevel;

		const extraPools: ExtraPoolInput[] = [];
		if ($showCustomPool) {
			const { pledge, stake } = $customPool;
			if (!isNaN(pledge) && !isNaN(stake) && stake > 0) {
				extraPools.push({ stake, pledge });
			}
		}
		if ($showCustomPool2) {
			const { pledge, stake } = $customPool2;
			if (!isNaN(pledge) && !isNaN(stake) && stake > 0) {
				extraPools.push({ stake, pledge });
			}
		}
		const { rewardScale, stakeScale } = computeRewardScale(
			params,
			maxX,
			$saturationMode,
			$rewardsMode,
			extraPools
		);

		// Calculate stake totals for k-based saturation cap (all modes)
		let aboveK = 0;
		let belowK = 0;

		pools.forEach((pool) => {
			const stake = pool.active_stake;
			if (stake > base) {
				aboveK += stake;
			} else {
				belowK += stake;
			}
		});

		if ($showCustomPool) {
			const { pledge, stake } = $customPool;
			if (!isNaN(pledge) && !isNaN(stake)) {
				if (stake > base) {
					aboveK += stake;
				} else {
					belowK += stake;
				}
			}
		}

		if ($showCustomPool2) {
			const { pledge, stake } = $customPool2;
			if (!isNaN(pledge) && !isNaN(stake)) {
				if (stake > base) {
					aboveK += stake;
				} else {
					belowK += stake;
				}
			}
		}

		kStakeTotals.set({ aboveK, belowK });

		// Calculate stake totals for cip-50 (L-based, only in cip-50 mode)
		if ($saturationMode === 'cip-50') {
			let aboveL = 0;
			let belowL = 0;

			pools.forEach((pool) => {
				const stake = pool.active_stake;
				const pledge = pool.pledge;
				if (stake > L * pledge) {
					aboveL += stake;
				} else {
					belowL += stake;
				}
			});

			if ($showCustomPool) {
				const { pledge, stake } = $customPool;
				if (!isNaN(pledge) && !isNaN(stake)) {
					if (stake > L * pledge) {
						aboveL += stake;
					} else {
						belowL += stake;
					}
				}
			}

			if ($showCustomPool2) {
				const { pledge, stake } = $customPool2;
				if (!isNaN(pledge) && !isNaN(stake)) {
					if (stake > L * pledge) {
						aboveL += stake;
					} else {
						belowL += stake;
					}
				}
			}

			cip50StakeTotals.set({ aboveL, belowL });
		} else {
			cip50StakeTotals.set({ aboveL: 0, belowL: 0 });
		}

		let axisMinX = 0;
		let axisMaxX: number;
		let axisStepX: number;
		switch (zoomState) {
			case '3x':
				axisMaxX = GRAPH_X_ZOOM_3X_MAX;
				axisStepX = GRAPH_X_ZOOM_3X_STEP;
				axisMinX = 0;
				break;
			case '2x':
				axisMaxX = GRAPH_X_ZOOM_2X_MAX;
				axisStepX = GRAPH_X_ZOOM_2X_STEP;
				break;
			case '1x':
				axisMaxX = GRAPH_X_ZOOM_1X_MAX;
				axisStepX = GRAPH_X_ZOOM_1X_STEP;
				break;
			case 'off':
			default:
				axisMaxX = maxX || GRAPH_X_ZOOM_OFF_MAX;
				axisStepX = stepSizeX || GRAPH_X_ZOOM_OFF_STEP;
				break;
		}

		// Update line datasets
		{
			// Keep scatter datasets, remove all line datasets
			chart.data.datasets = chart.data.datasets.filter((ds) => ds.type !== 'line');

			// Add new line datasets based on mode
			const lineDatasets: any[] = [];
			if ($saturationMode === 'current') {
				lineDatasets.push({
					label: 'Saturation Cap',
					data: [
						{ x: axisMinX, y: base },
						{ x: axisMaxX, y: base }
					],
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				});
			} else if ($saturationMode === 'linear') {
				lineDatasets.push({
					label: 'Saturation Cap',
					data: getSaturationCapLinear(k, L, axisMaxX, axisStepX),
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				});
			} else if ($saturationMode === 'exponential') {
				lineDatasets.push({
					label: 'Saturation Cap',
					data: getSaturationCapExpSaturation(k, L, L2, axisMaxX, axisStepX),
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				});
			} else if ($saturationMode === 'cip-50') {
				const dottedData: { x: number; y: number }[] = [];
				for (let x = axisMinX; x <= axisMaxX; x += axisStepX) {
					dottedData.push({ x, y: L * x });
				}
				lineDatasets.push({
					label: 'Saturation Cap (soft)',
					data: dottedData,
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					borderDash: [5, 5],
					fill: false,
					pointRadius: 0,
					showLine: true
				});
				lineDatasets.push({
					label: 'Saturation Cap',
					data: [
						{ x: axisMinX, y: base },
						{ x: axisMaxX, y: base }
					],
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				});
			} else if ($saturationMode === 'cip-7') {
				lineDatasets.push({
					label: 'Saturation Cap',
					data: [
						{ x: axisMinX, y: base },
						{ x: axisMaxX, y: base }
					],
					type: 'line' as const,
					borderColor: 'red',
					borderWidth: 2,
					fill: false,
					pointRadius: 0,
					showLine: true
				});
			}

			chart.data.datasets.push(...lineDatasets);
		}

		// Update scatter datasets
		chart.data.datasets.forEach((ds: any) => {
			if (ds.type === 'bubble') {
				ds.data = (ds.data as any[]).map((pt: any) => {
					const roi = getRewards(
						pt.y,
						pt.x,
						params,
						maxX,
						$saturationMode,
						$rewardsMode,
						rewardScale,
						stakeScale
					);
					return { ...pt, roi, r: getPointRadius(roi) };
				});
			}
		});

		// Handle first custom pool
		const customIdx = chart.data.datasets.findIndex((ds: any) => ds.label === 'Custom Pool');
		if ($showCustomPool) {
			const { pledge, stake } = $customPool;
			if (!isNaN(pledge) && !isNaN(stake)) {
				const roi = getRewards(
					stake,
					pledge,
					params,
					maxX,
					$saturationMode,
					$rewardsMode,
					rewardScale,
					stakeScale
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

		// Handle second custom pool
		const customIdx2 = chart.data.datasets.findIndex((ds: any) => ds.label === 'Custom Pool 2');
		if ($showCustomPool2) {
			const { pledge, stake } = $customPool2;
			if (!isNaN(pledge) && !isNaN(stake)) {
				const roi = getRewards(
					stake,
					pledge,
					params,
					maxX,
					$saturationMode,
					$rewardsMode,
					rewardScale,
					stakeScale
				);
				const rVal = getPointRadius(roi);
				const customData = {
					x: pledge,
					y: stake,
					ticker: 'CUSTOM2',
					name: 'Custom Pool 2',
					group: 'Custom Pool 2',
					roi,
					r: rVal
				};
				if (customIdx2 === -1) {
					chart.data.datasets.unshift({
						label: 'Custom Pool 2',
						data: [customData],
						type: 'bubble' as const,
						backgroundColor: groupColors['Custom Pool 2']
					});
				} else {
					(chart.data.datasets[customIdx2].data as any[]) = [customData];
				}
			}
		} else if (customIdx2 !== -1) {
			chart.data.datasets.splice(customIdx2, 1);
		}

		chart.update('none');
	}

	$: if (chart && $graphSettings) {
		const { maxX, stepSizeX } = $graphSettings;
		const zoomState = $zoomLevel;
		const scales: any = chart.options.scales as any;
		const xScale: any = scales.x;
		const yScale: any = scales.y;

		switch (zoomState) {
			case '3x':
				xScale.min = 0;
				xScale.max = GRAPH_X_ZOOM_3X_MAX;
				xScale.ticks.stepSize = GRAPH_X_ZOOM_3X_STEP;
				break;
			case '2x':
				xScale.min = 0;
				xScale.max = GRAPH_X_ZOOM_2X_MAX;
				xScale.ticks.stepSize = GRAPH_X_ZOOM_2X_STEP;
				break;
			case '1x':
				xScale.min = 0;
				xScale.max = GRAPH_X_ZOOM_1X_MAX;
				xScale.ticks.stepSize = GRAPH_X_ZOOM_1X_STEP;
				break;
			case 'off':
			default:
				xScale.min = 0;
				xScale.max = maxX || GRAPH_X_ZOOM_OFF_MAX;
				xScale.ticks.stepSize = stepSizeX || GRAPH_X_ZOOM_OFF_STEP;
				break;
		}

		yScale.max = zoomState === 'off' ? GRAPH_Y_SCALE_DEFAULT_MAX : GRAPH_Y_ZOOM_MAX;
		yScale.suggestedMax = zoomState === 'off' ? GRAPH_Y_SCALE_DEFAULT_MAX : GRAPH_Y_ZOOM_MAX;
		yScale.ticks.stepSize = zoomState === 'off' ? GRAPH_Y_SCALE_DEFAULT_STEP : GRAPH_Y_ZOOM_STEP;
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
