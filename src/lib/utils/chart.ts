// --- Imports ------------------------------------------------------
import type { Chart, TooltipModel } from 'chart.js';
import { customPool } from '$lib/stores/store';

// --- Tooltip Handling --------------------------------------------
/**
 * Render a custom HTML tooltip for Chart.js and position it within the viewport.
 */
export function externalTooltipHandler({
	chart,
	tooltip
}: {
	chart: any;
	tooltip: TooltipModel<'scatter'>;
}) {
	const tooltipEl = chart.canvas.parentNode.querySelector('#chartjs-tooltip') as HTMLElement;
	if (!tooltipEl || tooltip.opacity === 0) {
		tooltipEl && (tooltipEl.style.opacity = '0');
		return;
	}
	tooltipEl.innerHTML = '';
	// Title
	tooltip.title.forEach((line: string) => {
		const el = document.createElement('div');
		el.classList.add('tooltip-title');
		el.textContent = line;
		tooltipEl.appendChild(el);
	});
	// Body lines
	tooltip.dataPoints?.forEach((_, i) => {
		const lines = tooltip.body[i]?.lines || [];
		const rawBg = tooltip.labelColors?.[i]?.backgroundColor;
		const bg = typeof rawBg === 'string' ? rawBg : 'transparent';
		lines.forEach((txt: string, idx: number) => {
			const item = document.createElement('div');
			item.classList.add('tooltip-item');
			const box = document.createElement('span');
			box.classList.add('tooltip-box');
			box.style.backgroundColor = idx === 0 ? bg : 'transparent';
			const span = document.createElement('span');
			if (txt === 'Stake cannot be lower than pledge') {
				span.classList.add('warning-text');
				txt = '⚠ ' + txt;
			}
			span.textContent = txt;
			item.append(box, span);
			tooltipEl.appendChild(item);
		});
	});
	// Position
	const { caretX, caretY } = tooltip;
	tooltipEl.style.opacity = '1';
	const rect = chart.canvas.getBoundingClientRect();
	let x = rect.left + caretX;
	let y = rect.top + caretY;
	const w = tooltipEl.offsetWidth;
	const h = tooltipEl.offsetHeight;
	if (x + w > window.innerWidth) x -= w;
	if (x < 0) x = 0;
	if (y + h > window.innerHeight) y -= h;
	if (y < 0) y = 0;
	tooltipEl.style.left = x + 'px';
	tooltipEl.style.top = y + 'px';
}

// --- Custom Pool Dragging ----------------------------------------
/**
 * Make the 'Custom Pool' bubble draggable, updating its store values.
 */
export function enableCustomPoolDrag(chart: Chart, canvas: HTMLCanvasElement) {
	let dragging = false;
	let dsIdx = 0;
	let ptIdx = 0;
	canvas.addEventListener('mousedown', (e) => {
		const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
		if (pts.length && chart.data.datasets[pts[0].datasetIndex].label === 'Custom Pool') {
			dragging = true;
			dsIdx = pts[0].datasetIndex;
			ptIdx = pts[0].index;
		}
	});
	canvas.addEventListener('mousemove', (e) => {
		if (!dragging) return;
		const xVal = Math.max(0, Math.round((chart as any).scales.x.getValueForPixel(e.offsetX)));
		const yVal = Math.max(0, Math.round((chart as any).scales.y.getValueForPixel(e.offsetY)));
		const ds = chart.data.datasets[dsIdx];
		const pt = (ds.data as any[])[ptIdx];
		pt.x = xVal;
		pt.y = yVal;
		customPool.set({ pledge: xVal, stake: yVal });
		chart.update('none');
	});
	canvas.addEventListener('mouseup', () => (dragging = false));
}
