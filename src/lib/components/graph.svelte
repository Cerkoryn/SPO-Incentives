<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { pools, getSaturationCapLinear, getSaturationCapExpSaturation, getRewards } from '$lib/utils/graphs';
  import { graphCheckboxes, sliderParams, graphSettings, saturationMode, customPool } from '$lib/stores/store';
  import { ADA_TOTAL_SUPPLY, ADA_RESERVES } from '$lib/utils/constants';
  import { get } from 'svelte/store';

  Chart.register(...registerables);
  
  function getPointRadius(roi: number): number {
    const minROI = 0;
    const maxROI = 10;      // 10% cap
    const minR   = 1;       // smallest bubble
    const maxR   = 50;      // largest bubble

    // normalize to [0…1]
    const t = Math.max(0, Math.min((roi - minROI) / (maxROI - minROI), 1));
    return minR + t * (maxR - minR);
  }
  
  let canvas: HTMLCanvasElement;
  let chart: Chart;

  const groupColors: Record<string, string> = {
    EDEN: 'rgba(75, 192, 192, 0.6)',
    COPPER: 'rgba(192, 75, 75, 0.6)',
    BLADE: 'rgba(75, 75, 192, 0.6)',
  CAG: 'rgba(192, 192, 75, 0.6)',
  // Custom pool color: bright opaque red
  'Custom Pool': 'rgba(255, 0, 0, 1)'
  };

  onMount(() => {
    createChart();
  });
  
  function createChart() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const currentCheckboxes = get(graphCheckboxes);
    const groups: Record<string, any[]> = {};
    pools.forEach(pool => {
      const key = pool.group.toLowerCase();
      if (currentCheckboxes[key]) {
        if (!groups[pool.group]) {
          groups[pool.group] = [];
        }
        groups[pool.group].push({
          x: pool.pledge,
          y: pool.stake,
          ticker: pool.ticker,
          name: pool.name,
          group: pool.group
        });
      }
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
    const mode = get(saturationMode);
    // Build bubble datasets: size proportional to annualized ROI
    const scatterDatasets = Object.entries(groups).map(([group, dataPoints]) => {
      const datasetData = dataPoints.map(dp => {
        const roi = getRewards(dp.y, dp.x, k, a0, L, L2, mode);
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
        datasets: [
          ...scatterDatasets,
          lineDataset
        ]
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
            max: maxX,
            ticks: {
              stepSize: stepSizeX,
              callback: function(value) {
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
            max: 1000000000,
            ticks: {
              stepSize: 100000000,
              callback: function(value) {
                return new Intl.NumberFormat('en-US').format(Number(value));
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const { ticker, name, x, y, roi } = context.raw as { ticker: string; name: string; x: number; y: number; roi: number };
                const formattedX = typeof x === 'number' ? new Intl.NumberFormat('en-US').format(x) : x;
                const formattedY = typeof y === 'number' ? new Intl.NumberFormat('en-US').format(y) : y;
                const formattedROI = typeof roi === 'number' ? roi.toFixed(2) : roi;
                return [
                  `Ticker: ${ticker}`,
                  `Name: ${name}`,
                  `Stake: ${formattedY}`,
                  `Pledge: ${formattedX}`,
                  `ROI: ${formattedROI}%`
                ];
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
      const pledge = Math.round(rawX);
      const stake = Math.round(rawY);
      const ds = chart.data.datasets[dragDatasetIndex];
      const point: any = (ds.data as any[])[dragDataIndex];
      point.x = pledge;
      point.y = stake;
      customPool.set({ pledge, stake });
      chart.update('none');
    });
    canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  // Update reactive block to listen to changes in both slider parameters and graph settings.
  $: if (chart && $sliderParams && $graphSettings && $saturationMode) {
    const idx = chart.data.datasets.findIndex(ds => ds.label === 'Saturation Cap');
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
      chart.data.datasets.forEach(ds => {
        if (ds.type === 'bubble') {
          ds.data = (ds.data as any[]).map(pt => {
            const roi = getRewards(pt.y, pt.x, k, $sliderParams.a0, L, L2, $saturationMode);
            return { ...pt, roi, r: getPointRadius(roi) };
          });
        }
      });

      chart.update();
    }
  }
</script>

<canvas bind:this={canvas} width="600" height="300"></canvas>

<style>
  canvas {
    width: 100%;
    height: auto;
    border: 1px solid #ccc;
  }
</style>