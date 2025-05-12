import type { Chart } from 'chart.js';
import { customPool } from '$lib/stores/store';

/**
 * External tooltip handler for Chart.js allowing custom HTML tooltips.
 */
export function externalTooltipHandler(context: any) {
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
	tooltip.title.forEach((line: string) => {
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
	// Position tooltip at caret, flipping to stay within viewport
	const { caretX, caretY } = tooltip;
	tooltipEl.style.opacity = '1';
	const canvasRect = chart.canvas.getBoundingClientRect();
	let x = canvasRect.left + window.pageXOffset + caretX;
	let y = canvasRect.top + window.pageYOffset + caretY;
	const tooltipWidth = tooltipEl.offsetWidth;
	const tooltipHeight = tooltipEl.offsetHeight;
	if (x + tooltipWidth > window.pageXOffset + window.innerWidth) {
		x -= tooltipWidth;
	}
	if (x < window.pageXOffset) {
		x = window.pageXOffset;
	}
	if (y + tooltipHeight > window.pageYOffset + window.innerHeight) {
		y -= tooltipHeight;
	}
	if (y < window.pageYOffset) {
		y = window.pageYOffset;
	}
	tooltipEl.style.left = x + 'px';
	tooltipEl.style.top = y + 'px';
}

/**
 * Enable dragging for 'Custom Pool' bubble on a Chart.js chart.
 */
export function enableCustomPoolDrag(chart: Chart, canvas: HTMLCanvasElement) {
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
		const rawX = (chart as any).scales.x.getValueForPixel(e.offsetX);
		const rawY = (chart as any).scales.y.getValueForPixel(e.offsetY);
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
