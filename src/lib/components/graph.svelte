<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { pools, getSaturationCapLinear, getSaturationCapExpSaturation, getRewards } from '$lib/utils/graphs';
  import { graphCheckboxes, sliderParams, graphSettings, saturationMode } from '$lib/stores/store';
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
    CAG: 'rgba(192, 192, 75, 0.6)'
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
    
    const { k, a0, L } = get(sliderParams);
    const { maxX, stepSizeX } = get(graphSettings);
    // Build bubble datasets: size proportional to annualized ROI
    const scatterDatasets = Object.entries(groups).map(([group, dataPoints]) => {
      const datasetData = dataPoints.map(dp => {
        const roi = getRewards(dp.y, dp.x, k, a0);
        return { ...dp, roi, r: getPointRadius(roi) };
      });
      return {
        label: group,
        data: datasetData,
        backgroundColor: groupColors[group] || 'rgba(0, 0, 0, 0.6)',
        type: 'bubble'
      };
    });

    const mode = get(saturationMode);
    const getSaturationCap = mode === 'linear' ? getSaturationCapLinear : getSaturationCapExpSaturation;
    const lineDataset = {
      label: 'Saturation Cap',
      data: getSaturationCap(k, L, maxX, stepSizeX),  // Using the selected function
      type: 'line',
      borderColor: 'red',
      borderWidth: 2,
      fill: false,
      pointRadius: 0
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
  }

  // Update reactive block to listen to changes in both slider parameters and graph settings.
  $: if (chart && $sliderParams && $graphSettings && $saturationMode) {
    const saturationDatasetIndex = chart.data.datasets.findIndex(ds => ds.label === 'Saturation Cap');
    if (saturationDatasetIndex !== -1) {
      const getSaturationCap = $saturationMode === 'linear' ? getSaturationCapLinear : getSaturationCapExpSaturation;
      chart.data.datasets[saturationDatasetIndex].data = getSaturationCap($sliderParams.k, $sliderParams.L, $graphSettings.maxX, $graphSettings.stepSizeX);
      // Update bubble radii based on new ROI
      chart.data.datasets.forEach(ds => {
        if (ds.type === 'bubble') {
          ds.data = (ds.data as any[]).map(point => {
            const roiVal = getRewards(point.y, point.x, $sliderParams.k, $sliderParams.a0);
            return { ...point, roi: roiVal, r: getPointRadius(roiVal) };
          });
        }
      });
      chart.update();
    }
  }

  $: if (chart && $graphCheckboxes) {
    const groups: Record<string, any[]> = {};
    pools.forEach(pool => {
      const key = pool.group.toLowerCase();
      if ($graphCheckboxes[key]) {
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
    const scatterDatasets = Object.entries(groups).map(([group, dataPoints]) => {
      const datasetData = dataPoints.map(dp => {
        const roi = getRewards(dp.y, dp.x, $sliderParams.k, $sliderParams.a0);
        return { ...dp, roi, r: getPointRadius(roi) };
      });
      return {
        label: group,
        data: datasetData,
        backgroundColor: groupColors[group] || 'rgba(0, 0, 0, 0.6)',
        type: 'bubble'
      };
    });
    
    const saturationDataset = chart.data.datasets.find(ds => ds.label === 'Saturation Cap');
    chart.data.datasets = saturationDataset ? [...scatterDatasets, saturationDataset] : [...scatterDatasets];
    chart.update();
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