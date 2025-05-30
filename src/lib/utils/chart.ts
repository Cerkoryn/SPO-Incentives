// chart.ts
import type { Chart, TooltipModel } from 'chart.js';
import { customPool, customPool2 } from '$lib/stores/store';

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
	tooltip.title.forEach((line: string) => {
		const el = document.createElement('div');
		el.classList.add('tooltip-title');
		el.textContent = line;
		tooltipEl.appendChild(el);
	});
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

export function enableCustomPoolDrag(chart: Chart, canvas: HTMLCanvasElement) {
	let dragging = false;
	let dsIdx = 0;
	let ptIdx = 0;
	let selectedPool: 'Custom Pool' | 'Custom Pool 2' | null = null;

	canvas.addEventListener('mousedown', (e) => {
		const pts = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
		if (pts.length) {
			const label = chart.data.datasets[pts[0].datasetIndex].label;
			if (label === 'Custom Pool' || label === 'Custom Pool 2') {
				dragging = true;
				dsIdx = pts[0].datasetIndex;
				ptIdx = pts[0].index;
				selectedPool = label as 'Custom Pool' | 'Custom Pool 2';
			}
		}
	});

	canvas.addEventListener('mousemove', (e) => {
		if (!dragging || !selectedPool) return;

		// Get values from pixel coordinates, handling undefined cases
		const xValRaw = chart.scales.x.getValueForPixel(e.offsetX);
		const yValRaw = chart.scales.y.getValueForPixel(e.offsetY);

		// Default to 0 if undefined (outside scale range)
		const xVal = xValRaw !== undefined ? Math.max(0, Math.round(xValRaw)) : 0;
		const yVal = yValRaw !== undefined ? Math.max(0, Math.round(yValRaw)) : 0;

		const ds = chart.data.datasets[dsIdx];
		const pt = (ds.data as any[])[ptIdx];
		pt.x = xVal;
		pt.y = yVal;

		// Update the appropriate store based on which pool is being dragged
		if (selectedPool === 'Custom Pool') {
			customPool.set({ pledge: xVal, stake: yVal });
		} else if (selectedPool === 'Custom Pool 2') {
			customPool2.set({ pledge: xVal, stake: yVal });
		}

		chart.update('none');
	});

	canvas.addEventListener('mouseup', () => {
		dragging = false;
		selectedPool = null;
	});
}
