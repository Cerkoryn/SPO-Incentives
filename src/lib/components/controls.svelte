<script lang="ts">
  import type { SaturationMode } from '$lib/stores/store';
  import { sliderParams, graphCheckboxes, saturationMode, customPool } from '$lib/stores/store';

  function applyModeDefaults(mode: SaturationMode) {
    saturationMode.set(mode);
    if (mode === 'current') {
      sliderParams.set({ k: 500, a0: 0.3, L: 0, L2: 1 });
    } else if (mode === 'linear') {
      sliderParams.set({ k: 1000, a0: 0.2, L: 50, L2: 1 });
    } else if (mode === 'exponential') {
      sliderParams.set({ k: 1000, a0: 0.2, L: 30, L2: 10 });
    }
  }
</script>

<div class="slider-controls">
  <div class="slider-control">
    <div class="label-row">
      <label for="k-slider">k:</label>
      <input
        type="number"
        min="1"
        max="2000"
        step="1"
        value={$sliderParams.k}
        on:input={(e) => {
          const v = parseInt((e.target as HTMLInputElement).value, 10);
          if (!isNaN(v)) sliderParams.update(s => ({ ...s, k: Math.min(2000, Math.max(1, v)) }));
        }}
        class="value-input"
      />
      <span class="hint-text">min: 1, max: 2000</span>
    </div>
    <input
      id="k-slider"
      type="range"
      min="1"
      max="2000"
      step="1"
      value={$sliderParams.k}
      on:input={(e) => sliderParams.update(s => ({ ...s, k: parseInt((e.target as HTMLInputElement).value, 10) }))}
    />
  </div>

  <div class="slider-control">
    <div class="label-row">
      <label for="a0-slider">a0:</label>
      <input
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={$sliderParams.a0}
        on:input={(e) => {
          const v = parseFloat((e.target as HTMLInputElement).value);
          if (!isNaN(v)) sliderParams.update(s => ({ ...s, a0: Math.min(1, Math.max(0, v)) }));
        }}
        class="value-input"
      />
      <span class="hint-text">min: 0, max: 1</span>
    </div>
    <input
      id="a0-slider"
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={$sliderParams.a0}
      on:input={(e) => sliderParams.update(s => ({ ...s, a0: parseFloat((e.target as HTMLInputElement).value) }))}
    />
  </div>

  <div class="slider-control">
    <div class="label-row">
      <label for="L-slider">L:</label>
      <input
        type="number"
        min="0"
        max="100"
        step="1"
        value={$sliderParams.L}
        on:input={(e) => {
          const v = parseInt((e.target as HTMLInputElement).value, 10);
          if (!isNaN(v)) sliderParams.update(s => ({ ...s, L: Math.min(100, Math.max(0, v)) }));
        }}
        class="value-input"
      />
      <span class="hint-text">min: 0, max: 100</span>
    </div>
    <input
      id="L-slider"
      type="range"
      min="0"
      max="100"
      step="1"
      value={$sliderParams.L}
      on:input={(e) => sliderParams.update(s => ({ ...s, L: parseInt((e.target as HTMLInputElement).value, 10) }))}
    />
  </div>

  <div class="slider-control">
    <div class="label-row">
      <label for="L2-slider">L2:</label>
      <input
        type="number"
        min="1"
        max="100"
        step="1"
        value={$sliderParams.L2}
        on:input={(e) => {
          const v = parseInt((e.target as HTMLInputElement).value, 10);
          if (!isNaN(v)) sliderParams.update(s => ({ ...s, L2: Math.min(100, Math.max(0, v)) }));
        }}
        class="value-input"
      />
      <span class="hint-text">min: 1, max: 100</span>
    </div>
    <input
      id="L2-slider"
      type="range"
      min="1"
      max="100"
      step="1"
      value={$sliderParams.L2}
      on:input={(e) => sliderParams.update(s => ({ ...s, L2: parseInt((e.target as HTMLInputElement).value, 10) }))}
    />
  </div>
</div>

<!-- Checkbox controls for selecting graph points -->
<div class="checkbox-controls">
  <div class="checkbox-control">
    <label for="copper-checkbox">
      <input 
        type="checkbox" 
        id="copper-checkbox" 
        checked={$graphCheckboxes.copper} 
        on:change={(e) => graphCheckboxes.update(s => ({ ...s, copper: (e.target as HTMLInputElement).checked }))}
      />
      COPPER
    </label>
  </div>
  <div class="checkbox-control">
    <label for="eden-checkbox">
      <input 
        type="checkbox" 
        id="eden-checkbox" 
        checked={$graphCheckboxes.eden} 
        on:change={(e) => graphCheckboxes.update(s => ({ ...s, eden: (e.target as HTMLInputElement).checked }))}
      />
      EDEN
    </label>
  </div>
  <div class="checkbox-control">
    <label for="blade-checkbox">
      <input 
        type="checkbox" 
        id="blade-checkbox" 
        checked={$graphCheckboxes.blade} 
        on:change={(e) => graphCheckboxes.update(s => ({ ...s, blade: (e.target as HTMLInputElement).checked }))}
      />
      BLADE
    </label>
  </div>
  <div class="checkbox-control">
    <label for="cag-checkbox">
      <input 
        type="checkbox" 
        id="cag-checkbox" 
        checked={$graphCheckboxes.cag} 
        on:change={(e) => graphCheckboxes.update(s => ({ ...s, cag: (e.target as HTMLInputElement).checked }))}
      />
      CAG
    </label>
  </div>
  <div class="checkbox-control">
    <label for="custom-checkbox">
      <input 
        type="checkbox" 
        id="custom-checkbox" 
        checked={$graphCheckboxes.custom} 
        on:change={(e) => graphCheckboxes.update(s => ({ ...s, custom: (e.target as HTMLInputElement).checked }))}
      />
      Custom
    </label>
  </div>
</div>
{#if $graphCheckboxes.custom}
    <div class="custom-pool-inputs">
      <div class="label-row">
        <label for="custom-pledge">Pledge:</label>
        <input
          type="number"
          id="custom-pledge"
          min="0"
          step="10000"
          value={$customPool.pledge}
          on:input={(e) => {
            const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
            const v = parseInt(raw, 10);
            if (!isNaN(v)) customPool.update(c => ({ ...c, pledge: v }));
          }}
          class="value-input"
        />
      </div>
      <div class="label-row">
        <label for="custom-stake">Stake:</label>
        <input
          type="number"
          id="custom-stake"
          min="0"
          step="1000000"
          value={$customPool.stake}
          on:input={(e) => {
            const raw = (e.target as HTMLInputElement).value.replace(/,/g, '');
            const v = parseInt(raw, 10);
            if (!isNaN(v)) customPool.update(c => ({ ...c, stake: v }));
          }}
          class="value-input"
        />
      </div>
    </div>
  {/if}

  <!-- Radio Buttons for selecting the saturation function with default presets -->
  <div class="saturation-mode-toggle">
    <span>Saturation Mode:</span>
    <label>
      <input
        type="radio"
        name="saturation-mode"
        value="current"
        on:change={() => applyModeDefaults('current')}
        checked={$saturationMode === 'current'} />
      Current
    </label>
    <label>
      <input
        type="radio"
        name="saturation-mode"
        value="linear"
        on:change={() => applyModeDefaults('linear')}
        checked={$saturationMode === 'linear'} />
      Linear
    </label>
    <label>
      <input
        type="radio"
        name="saturation-mode"
        value="exponential"
        on:change={() => applyModeDefaults('exponential')}
        checked={$saturationMode === 'exponential'} />
      Exponential
    </label>
  </div>

<style>
  .slider-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .slider-control {
    display: flex;
    flex-direction: column;
  }
  .label-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  /* Global styling for numeric inputs */
  .value-input {
    width: 4rem;
    background-color: white;
  }
  .hint-text {
    font-size: 0.65rem;
    color: #aaa;
  }
  
  .checkbox-controls {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .checkbox-control {
    display: flex;
    align-items: center;
  }

  .saturation-mode-toggle {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .custom-pool-inputs {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  /* Widen custom inputs to show up to 10-digit values */
  .custom-pool-inputs .value-input {
    width: 12ch;
  }
</style>