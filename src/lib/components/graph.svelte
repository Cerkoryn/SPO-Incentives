<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { pools } from '$lib/utils/graphs';
  import { graphCheckboxes, sliderParams } from '$lib/stores/store'; // <-- Import sliderParams
  import { getSaturationCap } from '$lib/utils/graphs'; // <-- Import the saturation cap function
  import { get } from 'svelte/store';

  // Register all necessary chart components.
  Chart.register(...registerables);
  
  let canvas: HTMLCanvasElement;
  let chart: Chart;

  // Define color mapping based on the pool's group.
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
    
    // Use the current checkbox settings for initial grouping.
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
    
    const scatterDatasets = Object.entries(groups).map(([group, dataPoints]) => ({
      label: group,
      data: dataPoints,
      backgroundColor: groupColors[group] || 'rgba(0, 0, 0, 0.6)',
      pointRadius: 5,
      type: 'scatter'
    }));

    // Compute saturation cap using the current k value and incorporate L*pledge adjustment.
    const { k, L } = get(sliderParams);
    const baseCap = getSaturationCap(k);
    const lineDataset = {
      label: 'Saturation Cap',
      data: [
        { x: 0, y: baseCap + L * 0 },
        { x: 10000000, y: baseCap + L * 10000000 }
      ],
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
        animation: { duration: 0 }, // disable animations for instant updates
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Pledge'
            },
            min: 0,
            max: 10000000,
            ticks: {
              stepSize: 1000000,
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
                const { ticker, name, x, y } = context.raw as { ticker: string; name: string; x: number; y: number };
                const formattedX = typeof x === 'number' ? new Intl.NumberFormat('en-US').format(x) : x;
                const formattedY = typeof y === 'number' ? new Intl.NumberFormat('en-US').format(y) : y;
                return [
                  `Ticker: ${ticker}`,
                  `Name: ${name}`,
                  `Stake: ${formattedY}`,
                  `Pledge: ${formattedX}`
                ];
              }
            }
          }
        }
      }
    });
  }

  $: if (chart && $sliderParams) {
    const baseCap = getSaturationCap($sliderParams.k);
    // Find the saturation cap line dataset by looking for its label.
    const saturationDatasetIndex = chart.data.datasets.findIndex(ds => ds.label === 'Saturation Cap');
    if (saturationDatasetIndex !== -1) {
      // Update the line's data points with L*pledge adjustment.
      chart.data.datasets[saturationDatasetIndex].data = [
        { x: 0, y: baseCap + $sliderParams.L * 0 },
        { x: 10000000, y: baseCap + $sliderParams.L * 10000000 }
      ];
      chart.update();
    }
  }

  // Reactive block to update scatter datasets when checkbox selections change.
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
    const scatterDatasets = Object.entries(groups).map(([group, dataPoints]) => ({
      label: group,
      data: dataPoints,
      backgroundColor: groupColors[group] || 'rgba(0, 0, 0, 0.6)',
      pointRadius: 5,
      type: 'scatter'
    }));
    
    // Preserve the saturation cap dataset from the existing chart.
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