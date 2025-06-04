<!-- Chart.svelte -->
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
        showCustomPool2,
        sliderParams,
        graphSettings,
        saturationMode,
        customPool,
        customPool2,
        zoomLevel,
        rewardsMode,
        cip50StakeTotals
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
        'Custom Pool': 'rgba(255, 0, 0, 1)', // Red for first custom pool
        'Custom Pool 2': 'rgba(0, 0, 255, 1)' // Blue for second custom pool
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

        // Add first custom pool
        if ($showCustomPool) {
            const { pledge, stake } = $customPool;
            if (!isNaN(pledge) && !isNaN(stake)) {
                const key = 'Custom Pool';
                groups[key] ||= [];
                groups[key].push({ x: pledge, y: stake, ticker: 'CUSTOM', name: key, group: key });
            }
        }

        // Add second custom pool
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

        // Determine x-axis range based on zoom level
        let axisMinX = 0;
        let axisMaxX: number;
        let axisStepX: number;
        switch (zoomState) {
            case '3x':
                axisMaxX = GRAPH_X_ZOOM_3X_MAX; // 20,000
                axisStepX = GRAPH_X_ZOOM_3X_STEP; // 2,000
                axisMinX = 0; // Center around 10k
                break;
            case '2x':
                axisMaxX = GRAPH_X_ZOOM_2X_MAX; // 1,000,000
                axisStepX = GRAPH_X_ZOOM_2X_STEP; // 100,000
                break;
            case '1x':
                axisMaxX = GRAPH_X_ZOOM_1X_MAX; // 5,000,000
                axisStepX = GRAPH_X_ZOOM_1X_STEP; // 500,000
                break;
            case 'off':
            default:
                axisMaxX = maxX || GRAPH_X_ZOOM_OFF_MAX; // Use graphSettings.maxX or default to 50M
                axisStepX = stepSizeX || GRAPH_X_ZOOM_OFF_STEP; // Use graphSettings.stepSizeX or default to 5M
                break;
        }

        const axisMaxY = zoomState === 'off' ? GRAPH_Y_SCALE_DEFAULT_MAX : GRAPH_Y_ZOOM_MAX;
        const axisStepY = zoomState === 'off' ? GRAPH_Y_SCALE_DEFAULT_STEP : GRAPH_Y_ZOOM_STEP;

        const scatterDatasets = Object.entries(groups).map(([group, dataPoints]) => {
            const data = dataPoints.map((dp) => {
                const roi = getRewards(dp.y, dp.x, params, maxX, mode, rMode);
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

        let lineDatasets: any[];
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
        } else {
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

        // Calculate stake totals for cip-50
        if ($saturationMode === 'cip-50') {
            let aboveL = 0;
            let belowL = 0;

            // Sum stake for regular pools
            pools.forEach((pool) => {
                const stake = pool.active_stake;
                const pledge = pool.pledge;
                if (stake > L * pledge) {
                    aboveL += stake;
                } else {
                    belowL += stake;
                }
            });

            // Include first custom pool
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

            // Include second custom pool
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

        // Determine x-axis range based on zoom level
        let axisMinX = 0;
        let axisMaxX: number;
        let axisStepX: number;
        switch (zoomState) {
            case '3x':
                axisMaxX = GRAPH_X_ZOOM_3X_MAX; // 20,000
                axisStepX = GRAPH_X_ZOOM_3X_STEP; // 2,000
                axisMinX = 0; // Center around 10k
                break;
            case '2x':
                axisMaxX = GRAPH_X_ZOOM_2X_MAX; // 1,000,000
                axisStepX = GRAPH_X_ZOOM_2X_STEP; // 100,000
                break;
            case '1x':
                axisMaxX = GRAPH_X_ZOOM_1X_MAX; // 5,000,000
                axisStepX = GRAPH_X_ZOOM_1X_STEP; // 500,000
                break;
            case 'off':
            default:
                axisMaxX = maxX || GRAPH_X_ZOOM_OFF_MAX; // Use graphSettings.maxX or default to 50M
                axisStepX = stepSizeX || GRAPH_X_ZOOM_OFF_STEP; // Use graphSettings.stepSizeX or default to 5M
                break;
        }

        // Update line datasets
        {
            const isCip50 = $saturationMode === 'cip-50';
            const datasets = chart.data.datasets;
            const dashedIdx = datasets.findIndex(
                (ds) => ds.type === 'line' && Array.isArray((ds as any).borderDash)
            );
            const flatIdx = datasets.findIndex(
                (ds) => ds.type === 'line' && !Array.isArray((ds as any).borderDash)
            );
            if (isCip50) {
                if (dashedIdx === -1) {
                    const dotted: { x: number; y: number }[] = [];
                    for (let x = axisMinX; x <= axisMaxX; x += axisStepX) {
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
                if (flatIdx === -1) {
                    datasets.push({
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
            } else {
                if (dashedIdx !== -1) datasets.splice(dashedIdx, 1);
                const lineIndices = datasets
                    .map((ds, i) => ({ ds, i }))
                    .filter(({ ds }) => ds.type === 'line')
                    .map(({ i }) => i);
                for (let j = lineIndices.length - 1; j > 0; j--) {
                    datasets.splice(lineIndices[j], 1);
                }
                const onlyIdx = datasets.findIndex((ds) => ds.type === 'line');
                if (onlyIdx !== -1) {
                    datasets[onlyIdx].label = 'Saturation Cap';
                    delete (datasets[onlyIdx] as any).borderDash;
                }
            }
        }

        chart.data.datasets.forEach((ds: any) => {
            if (ds.type === 'line') {
                let newData: { x: number; y: number }[] | undefined;
                if ($saturationMode === 'current') {
                    newData = [
                        { x: axisMinX, y: base },
                        { x: axisMaxX, y: base }
                    ];
                } else if ($saturationMode === 'linear') {
                    newData = getSaturationCapLinear(k, L, axisMaxX, axisStepX);
                } else if ($saturationMode === 'exponential') {
                    newData = getSaturationCapExpSaturation(k, L, L2, axisMaxX, axisStepX);
                } else if ($saturationMode === 'cip-50') {
                    if ((ds as any).borderDash) {
                        const dotted: { x: number; y: number }[] = [];
                        for (let x = axisMinX; x <= axisMaxX; x += axisStepX) {
                            dotted.push({ x, y: L * x });
                        }
                        newData = dotted;
                    } else {
                        newData = [
                            { x: axisMinX, y: base },
                            { x: axisMaxX, y: base }
                        ];
                    }
                }
                if (newData) {
                    ds.data = newData;
                }
            }
        });

        chart.data.datasets.forEach((ds: any) => {
            if (ds.type === 'bubble') {
                ds.data = (ds.data as any[]).map((pt: any) => {
                    const roi = getRewards(pt.y, pt.x, params, maxX, $saturationMode, $rewardsMode);
                    return { ...pt, roi, r: getPointRadius(roi) };
                });
            }
        });

        // Handle first custom pool
        const customIdx = chart.data.datasets.findIndex((ds: any) => ds.label === 'Custom Pool');
        if ($showCustomPool) {
            const { pledge, stake } = $customPool;
            if (!isNaN(pledge) && !isNaN(stake)) {
                const roi = getRewards(stake, pledge, params, maxX, $saturationMode, $rewardsMode);
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
                const roi = getRewards(stake, pledge, params, maxX, $saturationMode, $rewardsMode);
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

        // Update Anno
        switch (zoomState) {
            case '3x':
                xScale.min = 0; // Center around 10k
                xScale.max = GRAPH_X_ZOOM_3X_MAX; // 20,000
                xScale.ticks.stepSize = GRAPH_X_ZOOM_3X_STEP; // 2,000
                break;
            case '2x':
                xScale.min = 0;
                xScale.max = GRAPH_X_ZOOM_2X_MAX; // 1,000,000
                xScale.ticks.stepSize = GRAPH_X_ZOOM_2X_STEP; // 100,000
                break;
            case '1x':
                xScale.min = 0;
                xScale.max = GRAPH_X_ZOOM_1X_MAX; // 5,000,000
                xScale.ticks.stepSize = GRAPH_X_ZOOM_1X_STEP; // 500,000
                break;
            case 'off':
            default:
                xScale.min = 0;
                xScale.max = maxX || GRAPH_X_ZOOM_OFF_MAX; // Use graphSettings.maxX or default to 50M
                xScale.ticks.stepSize = stepSizeX || GRAPH_X_ZOOM_OFF_STEP; // Use graphSettings.stepSizeX or default to 5M
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