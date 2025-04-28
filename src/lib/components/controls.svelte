<script lang="ts">
  import type { SaturationMode } from '$lib/stores/store';
  import { sliderParams, graphCheckboxes, saturationMode } from '$lib/stores/store';

  function applyModeDefaults(mode: SaturationMode) {
    saturationMode.set(mode);
    if (mode === 'current') {
      sliderParams.set({ k: 500, a0: 0.3, L: 0 });
    } else if (mode === 'linear') {
      sliderParams.set({ k: 1000, a0: 0.2, L: 50 });
    } else if (mode === 'exponential') {
      sliderParams.set({ k: 1000, a0: 0.2, L: 30 });
    }
  }
</script>

<div class="slider-controls">
  <div class="slider-control">
    <label for="k-slider">k: {$sliderParams.k}</label>
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
    <label for="a0-slider">a0: {$sliderParams.a0}</label>
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
    <label for="L-slider">L: {$sliderParams.L}</label>
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
</style>