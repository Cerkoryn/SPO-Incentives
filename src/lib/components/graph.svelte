<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { pools } from '$lib/utils/graphs';
  import { graphCheckboxes } from '$lib/stores/store';
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
    
    const datasets = Object.entries(groups).map(([group, dataPoints]) => ({
      label: group,
      data: dataPoints,
      backgroundColor: groupColors[group] || 'rgba(0, 0, 0, 0.6)',
      pointRadius: 5
    }));

    chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets
      },
      options: {
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
                return new Intl.NumberFormat('en-US').format(value);
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Stake'
            },
            min: 0,
            max: 300000000,
            ticks: {
              stepSize: 50000000,
              callback: function(value) {
                return new Intl.NumberFormat('en-US').format(value);
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const { ticker, name, x, y } = context.raw;
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

  // Reactive block to update chart when the checkbox selections change.
  $: if (chart) {
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
    const datasets = Object.entries(groups).map(([group, dataPoints]) => ({
      label: group,
      data: dataPoints,
      backgroundColor: groupColors[group] || 'rgba(0, 0, 0, 0.6)',
      pointRadius: 5
    }));
    chart.data.datasets = datasets;
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