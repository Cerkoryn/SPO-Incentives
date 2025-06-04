<!-- Controls.svelte -->
<script lang="ts">
    import SliderControl from '$lib/components/SliderControl.svelte';
    import type { SaturationMode, SliderParameters, ZoomLevel } from '$lib/stores/store';
    import {
        sliderParams,
        showCustomPool,
        saturationMode,
        customPool,
        showCustomPool2,
        customPool2,
        zoomLevel,
        graphSettings,
        rewardsMode,
        cip50StakeTotals
    } from '$lib/stores/store';
    import {
        CUSTOM_POOL_PLEDGE_STEP,
        CUSTOM_POOL_STAKE_STEP,
        CUSTOM_POOL_DEFAULT_PLEDGE,
        CUSTOM_POOL_DEFAULT_STAKE,
        GRAPH_X_ZOOM_OFF_MAX,
        GRAPH_X_ZOOM_1X_MAX,
        GRAPH_X_ZOOM_2X_MAX,
        GRAPH_X_ZOOM_3X_MAX,
        GRAPH_Y_SCALE_DEFAULT_MAX,
        GRAPH_Y_ZOOM_MAX
    } from '$lib/utils/constants';
    import descriptions from '$lib/slider-descriptions.json' assert { type: 'json' };
    const desc: Record<string, string> = descriptions;

    function applyModeDefaults(mode: SaturationMode) {
        saturationMode.set(mode);
        if (mode === 'linear') {
            sliderParams.update((s: SliderParameters) => ({ ...s, L: 2 }));
        } else if (mode === 'exponential') {
            sliderParams.update((s: SliderParameters) => ({ ...s, L: 12, L2: 20 }));
        } else if (mode === 'cip-50') {
            sliderParams.update((s: SliderParameters) => ({ ...s, L: 2000 }));
        } else if (mode === 'cip-7') {
            sliderParams.update((s) => ({ ...s, crossover: 8, curveRoot: 3 }));
        }
    }

    function resetDefaults() {
        if ($saturationMode === 'exponential') {
            sliderParams.set({
                k: 500,
                a0: 0.3,
                L: 12,
                L2: 20,
                crossover: 8,
                curveRoot: 3,
                rho: 0.003,
                tau: 0.2,
                stakedRatio: 0.6
            });
        } else if ($saturationMode === 'cip-50') {
            sliderParams.set({
                k: 500,
                a0: 0.3,
                L: 2000,
                L2: 20,
                crossover: 8,
                curveRoot: 3,
                rho: 0.003,
                tau: 0.2,
                stakedRatio: 0.6
            });
        } else if ($saturationMode === 'cip-7') {
            sliderParams.set({
                k: 500,
                a0: 0.3,
                L: 2,
                L2: 20,
                crossover: 8,
                curveRoot: 3,
                rho: 0.003,
                tau: 0.2,
                stakedRatio: 0.6
            });
        } else {
            sliderParams.set({
                k: 500,
                a0: 0.3,
                L: 2,
                L2: 20,
                crossover: 8,
                curveRoot: 3,
                rho: 0.003,
                tau: 0.2,
                stakedRatio: 0.6
            });
        }
    }

    // Calculate midpoint for initial pool placement based on zoom level
    function getMidpointValues(offset: boolean = false) {
        let maxX: number;
        let maxY: number;

        // Determine x-axis max based on zoom level
        switch ($zoomLevel) {
            case '3x':
                maxX = GRAPH_X_ZOOM_3X_MAX; // 20,000
                break;
            case '2x':
                maxX = GRAPH_X_ZOOM_2X_MAX; // 1,000,000
                break;
            case '1x':
                maxX = GRAPH_X_ZOOM_1X_MAX; // 5,000,000
                break;
            case 'off':
            default:
                maxX = $graphSettings.maxX || GRAPH_X_ZOOM_OFF_MAX; // Use graphSettings.maxX or default to 50M
                break;
        }

        // Determine y-axis max based on zoom level
        maxY = $zoomLevel === 'off' ? GRAPH_Y_SCALE_DEFAULT_MAX : GRAPH_Y_ZOOM_MAX;

        // Calculate midpoints, rounded to step sizes
        let pledge = $zoomLevel === '3x' ? 10000 : Math.round(maxX / 2 / CUSTOM_POOL_PLEDGE_STEP) * CUSTOM_POOL_PLEDGE_STEP;
        let stake = Math.round(maxY / 2 / CUSTOM_POOL_STAKE_STEP) * CUSTOM_POOL_STAKE_STEP;

        // Apply offset for Custom Pool 2 to avoid overlap
        if (offset) {
            pledge = Math.min(maxX, pledge + CUSTOM_POOL_PLEDGE_STEP); // +10,000
            stake = Math.min(maxY, stake + CUSTOM_POOL_STAKE_STEP); // +1,000,000
        }

        // Ensure values are within bounds and positive
        pledge = Math.max(1, Math.min(maxX, pledge));
        stake = Math.max(1, Math.min(maxY, stake));

        return { pledge, stake };
    }

    // Format stake totals for display
    const formatNumber = (num: number): string => new Intl.NumberFormat('en-US').format(num);
</script>

<button
    type="button"
    on:click={resetDefaults}
    class="mb-4 cursor-pointer rounded border border-gray-300 bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
>
    Reset Sliders
</button>

<div class="flex flex-col gap-4">
    <SliderControl
        id="rho-slider"
        label="Rho:"
        value={$sliderParams.rho}
        min={0}
        max={0.005}
        step={0.0001}
        hint="min: 0, max: 0.005"
        wide={true}
        onChange={(value: number) =>
            sliderParams.update((s: SliderParameters) => ({ ...s, rho: value }))}
    />
    <SliderControl
        id="tau-slider"
        label="Tau:"
        value={$sliderParams.tau}
        min={0}
        max={0.3}
        step={0.01}
        hint="min: 0, max: 0.3"
        onChange={(value: number) =>
            sliderParams.update((s: SliderParameters) => ({ ...s, tau: value }))}
    />
    <SliderControl
        id="staked-ratio-slider"
        label="Staked Ratio"
        unit="%"
        value={Math.round($sliderParams.stakedRatio * 100)}
        min={30}
        max={100}
        step={1}
        hint="min: 30%, max: 100%"
        wide={true}
        onChange={(value: number) =>
            sliderParams.update((s: SliderParameters) => ({ ...s, stakedRatio: value / 100 }))}
    />
    <SliderControl
        id="k-slider"
        label="k:"
        value={$sliderParams.k}
        min={1}
        max={2000}
        step={1}
        hint="min: 1, max: 2000"
        onChange={(value: number) => sliderParams.update((s: SliderParameters) => ({ ...s, k: value }))}
    />
    <SliderControl
        id="a0-slider"
        label="a<sub>0</sub>:"
        value={$sliderParams.a0}
        min={0}
        max={1}
        step={0.01}
        hint="min: 0, max: 1"
        onChange={(value: number) =>
            sliderParams.update((s: SliderParameters) => ({ ...s, a0: value }))}
    />
    {#if $saturationMode === 'linear' || $saturationMode === 'exponential' || $saturationMode === 'cip-50'}
        <SliderControl
            id="L-slider"
            label="L"
            value={$sliderParams.L}
            min={$saturationMode === 'cip-50' ? 1 : 0}
            max={$saturationMode === 'cip-50' ? 10000 : 50}
            step={$saturationMode === 'cip-50' ? 1 : 0.1}
            hint={$saturationMode === 'cip-50' ? 'min: 1, max: 10000' : 'min: 0, max: 50'}
            onChange={(value: number) =>
                sliderParams.update((s: SliderParameters) => ({ ...s, L: value }))}
        />
    {/if}
    {#if $saturationMode === 'exponential'}
        <SliderControl
            id="L2-slider"
            label="L2:"
            value={$sliderParams.L2}
            min={1}
            max={100}
            step={1}
            hint="min: 1, max: 100"
            onChange={(value: number) =>
                sliderParams.update((s: SliderParameters) => ({ ...s, L2: value }))}
        />
    {/if}
    {#if $saturationMode === 'cip-7'}
        <SliderControl
            id="crossover-slider"
            label="Crossover Factor:"
            value={$sliderParams.crossover}
            min={1}
            max={20}
            step={1}
            hint="min: 1, max: 20"
            onChange={(value: number) =>
                sliderParams.update((s: SliderParameters) => ({ ...s, crossover: value }))}
        />
        <SliderControl
            id="curve-root-slider"
            label="Curve Root:"
            value={$sliderParams.curveRoot}
            min={1}
            max={20}
            step={1}
            hint="min: 1, max: 20"
            onChange={(value: number) =>
                sliderParams.update((s: SliderParameters) => ({ ...s, curveRoot: value }))}
        />
    {/if}
</div>

{#if $saturationMode === 'cip-50'}
    <div class="mt-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
            <span>Stake Above Dotted Line:</span>
            <span class="font-mono">{formatNumber($cip50StakeTotals.aboveL)} ADA</span>
            <span
                class="flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
                title="Total stake for pools where stake > L * pledge"
            >?</span>
        </div>
        <div class="flex items-center gap-2">
            <span>Stake Below Dotted Line:</span>
            <span class="font-mono">{formatNumber($cip50StakeTotals.belowL)} ADA</span>
            <span
                class="flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
                title="Total stake for pools where stake <= L * pledge"
            >?</span>
        </div>
    </div>
{/if}

<div class="mt-4 flex flex-wrap gap-4">
    <!-- First Custom Pool -->
    <div class="flex items-center">
        <label for="custom-checkbox">
            <input
                type="checkbox"
                id="custom-checkbox"
                checked={$showCustomPool}
                on:change={(e: Event) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    showCustomPool.set(checked);
                    if (checked) {
                        customPool.set(getMidpointValues(false));
                    }
                }}
            />
            Show Custom Pool 1
            <span
                class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
                title={desc.show_custom_pool}>?</span
            >
        </label>
        {#if $showCustomPool && $customPool.stake < $customPool.pledge}
            <span class="ml-2 text-xs text-amber-600">⚠ Stake cannot be lower than pledge</span>
        {/if}
    </div>
    <!-- Second Custom Pool -->
    <div class="flex items-center">
        <label for="custom-checkbox-2">
            <input
                type="checkbox"
                id="custom-checkbox-2"
                checked={$showCustomPool2}
                on:change={(e: Event) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    showCustomPool2.set(checked);
                    if (checked) {
                        customPool2.set(getMidpointValues(true));
                    }
                }}
            />
            Show Custom Pool 2
            <span
                class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
                title={desc.show_custom_pool}>?</span
            >
        </label>
        {#if $showCustomPool2 && $customPool2.stake < $customPool2.pledge}
            <span class="ml-2 text-xs text-amber-600">⚠ Stake cannot be lower than pledge</span>
        {/if}
    </div>
</div>

{#if $showCustomPool}
    <div class="mt-4 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
            <label for="custom-pledge">
                Pool 1 Pledge:
                <span
                    class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
                    title={desc.custom_pledge}>?</span
                >
            </label>
            <input
                type="number"
                id="custom-pledge"
                min="0"
                step={CUSTOM_POOL_PLEDGE_STEP}
                value={$customPool.pledge}
                on:input={(e: Event) => {
                    const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
                    const v = parseInt(raw, 10);
                    if (!isNaN(v)) {
                        const pledgeVal = Math.max(1, v);
                        customPool.update((c) => ({ ...c, pledge: pledgeVal }));
                    }
                }}
                class="w-[12ch] bg-white"
            />
        </div>
        <div class="flex flex-wrap items-center gap-2">
            <label for="custom-stake">
                Pool 1 Stake:
                <span
                    class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
                    title={desc.custom_stake}>?</span
                >
            </label>
            <input
                type="number"
                id="custom-stake"
                min="0"
                step={CUSTOM_POOL_STAKE_STEP}
                value={$customPool.stake}
                on:input={(e: Event) => {
                    const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
                    const v = parseInt(raw, 10);
                    if (!isNaN(v)) {
                        const stakeVal = Math.max(1, v);
                        customPool.update((c) => ({ ...c, stake: stakeVal }));
                    }
                }}
                class="w-[12ch] bg-white"
            />
        </div>
    </div>
{/if}

{#if $showCustomPool2}
    <div class="mt-4 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
            <label for="custom-pledge-2">
                Pool 2 Pledge:
                <span
                    class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
                    title={desc.custom_pledge}>?</span
                >
            </label>
            <input
                type="number"
                id="custom-pledge-2"
                min="0"
                step={CUSTOM_POOL_PLEDGE_STEP}
                value={$customPool2.pledge}
                on:input={(e: Event) => {
                    const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
                    const v = parseInt(raw, 10);
                    if (!isNaN(v)) {
                        const pledgeVal = Math.max(1, v);
                        customPool2.update((c) => ({ ...c, pledge: pledgeVal }));
                    }
                }}
                class="w-[12ch] bg-white"
            />
        </div>
        <div class="flex flex-wrap items-center gap-2">
            <label for="custom-stake-2">
                Pool 2 Stake:
                <span
                    class="ml-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
                    title={desc.custom_stake}>?</span
                >
            </label>
            <input
                type="number"
                id="custom-stake-2"
                min="0"
                step={CUSTOM_POOL_STAKE_STEP}
                value={$customPool2.stake}
                on:input={(e: Event) => {
                    const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
                    const v = parseInt(raw, 10);
                    if (!isNaN(v)) {
                        const stakeVal = Math.max(1, v);
                        customPool2.update((c) => ({ ...c, stake: stakeVal }));
                    }
                }}
                class="w-[12ch] bg-white"
            />
        </div>
    </div>
{/if}

<div class="mt-4 flex items-center gap-4">
    <span>Rewards:</span>
    <label class="flex items-center gap-1">
        <input
            type="radio"
            name="rewards-mode"
            value="current"
            on:change={() => rewardsMode.set('current')}
            checked={$rewardsMode === 'current'}
        />
        Current
    </label>
    <label class="flex items-center gap-1">
        <input
            type="radio"
            name="rewards-mode"
            value="full"
            on:change={() => rewardsMode.set('full')}
            checked={$rewardsMode === 'full'}
        />
        Full
    </label>
    <label class="flex items-center gap-1">
        <input
            type="radio"
            name="rewards-mode"
            value="max"
            on:change={() => rewardsMode.set('max')}
            checked={$rewardsMode === 'max'}
        />
        Max
    </label>
    <span
        class="ml-1 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
        title={desc.rewards}>?</span
    >
</div>

<div class="mt-4 grid grid-cols-[auto_auto_auto_auto] items-center gap-x-2 gap-y-2">
    <span class="col-start-1 row-start-1">Formula:</span>
    <label class="col-start-2 row-start-1">
        <input
            type="radio"
            name="saturation-mode"
            value="current"
            on:change={() => applyModeDefaults('current')}
            checked={$saturationMode === 'current'}
        />
        Current
    </label>
    <label class="col-start-3 row-start-1">
        <input
            type="radio"
            name="saturation-mode"
            value="linear"
            on:change={() => applyModeDefaults('linear')}
            checked={$saturationMode === 'linear'}
        />
        Linear
    </label>
    <label class="col-start-4 row-start-1">
        <input
            type="radio"
            name="saturation-mode"
            value="exponential"
            on:change={() => applyModeDefaults('exponential')}
            checked={$saturationMode === 'exponential'}
        />
        Exponential
    </label>
    <label class="col-start-2 row-start-2">
        <input
            type="radio"
            name="saturation-mode"
            value="cip-50"
            on:change={() => applyModeDefaults('cip-50')}
            checked={$saturationMode === 'cip-50'}
        />
        CIP-50
    </label>
    <label class="col-start-3 row-start-2">
        <input
            type="radio"
            name="saturation-mode"
            value="cip-7"
            on:change={() => applyModeDefaults('cip-7')}
            checked={$saturationMode === 'cip-7'}
        />
        CIP-7
    </label>
    <span
        class="col-start-4 row-start-2 flex inline-block h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-center text-xs font-bold text-white"
        title={desc.formula}>?</span
    >
</div>

<div class="mt-4 grid grid-cols-[auto_auto_auto_auto_auto] items-center gap-x-2 gap-y-2">
    <span class="col-start-1 row-start-1">Zoom:</span>
    <label class="col-start-2 row-start-1">
        <input
            type="radio"
            name="zoom-level"
            value="off"
            on:change={() => zoomLevel.set('off')}
            checked={$zoomLevel === 'off'}
        />
        Off
    </label>
    <label class="col-start-3 row-start-1">
        <input
            type="radio"
            name="zoom-level"
            value="1x"
            on:change={() => zoomLevel.set('1x')}
            checked={$zoomLevel === '1x'}
        />
        1x
    </label>
    <label class="col-start-4 row-start-1">
        <input
            type="radio"
            name="zoom-level"
            value="2x"
            on:change={() => zoomLevel.set('2x')}
            checked={$zoomLevel === '2x'}
        />
        2x
    </label>
    <label class="col-start-5 row-start-1">
        <input
            type="radio"
            name="zoom-level"
            value="3x"
            on:change={() => zoomLevel.set('3x')}
            checked={$zoomLevel === '3x'}
        />
        3x
    </label>
</div>