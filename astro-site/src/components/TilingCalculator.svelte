<script lang="ts">
  type Unit = 'ft' | 'in' | 'cm' | 'mm';

  let unit = $state<Unit>('ft');
  let roomL = $state('');
  let roomW = $state('');
  let tileL = $state('');
  let tileW = $state('');
  let skirting = $state(false);

  function toMM(val: number, u: Unit): number {
    if (u === 'ft') return val * 304.8;
    if (u === 'in') return val * 25.4;
    if (u === 'cm') return val * 10;
    return val; // mm
  }

  function round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  // Dimensions in mm
  const rlMM  = $derived(toMM(parseFloat(roomL) || 0, unit));
  const rwMM  = $derived(toMM(parseFloat(roomW) || 0, unit));
  const tlMM  = $derived(toMM(parseFloat(tileL) || 0, unit));
  const twMM  = $derived(toMM(parseFloat(tileW) || 0, unit));

  // Areas in m²
  const roomM2 = $derived(round2((rlMM * rwMM) / 1_000_000));
  const tileM2 = $derived(round2((tlMM * twMM) / 1_000_000));

  // Floor tiles
  const floorBase  = $derived(tileM2 > 0 ? Math.ceil(roomM2 / tileM2) : 0);
  const floorTotal = $derived(Math.ceil(floorBase * 1.05));

  // Skirting: perimeter = 2(L+W), each 600×600 tile → 6 pcs × 600mm = 3600mm
  const perimeterM  = $derived(round2(2 * (rlMM + rwMM) / 1000));
  const skirtBase   = $derived(Math.ceil((perimeterM * 1000) / 3600));
  const skirtTotal  = $derived(Math.ceil(skirtBase * 1.05));

  const grandTotal = $derived(skirting ? floorTotal + skirtTotal : floorTotal);
  const ready      = $derived(rlMM > 0 && rwMM > 0 && tlMM > 0 && twMM > 0);
</script>

<div class="wrap">
  <div class="card">
    <!-- Header -->
    <div class="header">
      <h1>Tile Quantity Calculator</h1>
      <p>Enter dimensions to find how many tiles you need.</p>
    </div>

    <!-- Unit toggle -->
    <div class="unit-toggle">
      <span class="toggle-label">Units</span>
      <div class="toggle-pills">
        <button
          class="pill"
          class:active={unit === 'ft'}
          onclick={() => unit = 'ft'}
        >ft</button>
        <button
          class="pill"
          class:active={unit === 'in'}
          onclick={() => unit = 'in'}
        >in</button>
        <button
          class="pill"
          class:active={unit === 'cm'}
          onclick={() => unit = 'cm'}
        >cm</button>
        <button
          class="pill"
          class:active={unit === 'mm'}
          onclick={() => unit = 'mm'}
        >mm</button>
      </div>
    </div>

    <!-- Inputs grid -->
    <div class="section-grid">
      <!-- Room -->
      <div class="input-group">
        <div class="group-label">Room</div>
        <div class="fields">
          <div class="field">
            <label for="rl">Length <span class="u">({unit})</span></label>
            <input id="rl" type="number" min="0" step="any"
              placeholder={unit === 'ft' ? 'e.g. 12' : unit === 'in' ? 'e.g. 144' : unit === 'cm' ? 'e.g. 365' : 'e.g. 3650'}
              bind:value={roomL} />
          </div>
          <div class="field">
            <label for="rw">Width <span class="u">({unit})</span></label>
            <input id="rw" type="number" min="0" step="any"
              placeholder={unit === 'ft' ? 'e.g. 10' : unit === 'in' ? 'e.g. 120' : unit === 'cm' ? 'e.g. 305' : 'e.g. 3050'}
              bind:value={roomW} />
          </div>
        </div>
        {#if roomM2 > 0}
          <div class="dim-badge">Area: {roomM2} m²</div>
        {/if}
      </div>

      <!-- Tile -->
      <div class="input-group">
        <div class="group-label">Tile</div>
        <div class="fields">
          <div class="field">
            <label for="tl">Length <span class="u">({unit})</span></label>
            <input id="tl" type="number" min="0" step="any"
              placeholder={unit === 'ft' ? 'e.g. 2' : unit === 'in' ? 'e.g. 24' : unit === 'cm' ? 'e.g. 60' : 'e.g. 600'}
              bind:value={tileL} />
          </div>
          <div class="field">
            <label for="tw">Width <span class="u">({unit})</span></label>
            <input id="tw" type="number" min="0" step="any"
              placeholder={unit === 'ft' ? 'e.g. 2' : unit === 'in' ? 'e.g. 24' : unit === 'cm' ? 'e.g. 60' : 'e.g. 600'}
              bind:value={tileW} />
          </div>
        </div>
        {#if tileM2 > 0}
          <div class="dim-badge">Tile area: {tileM2} m²</div>
        {/if}
      </div>
    </div>

    <!-- Skirting toggle -->
    <div class="skirting-row">
      <div class="skirting-info">
        <span class="skirting-title">Skirting tiles?</span>
        <span class="skirting-hint">Perimeter = 2(L+W) · Uses 600×600 tiles (6 pcs / tile = 3600 mm)</span>
      </div>
      <div class="yes-no">
        <button class="yn" class:yn-active={!skirting} onclick={() => skirting = false}>No</button>
        <button class="yn" class:yn-active={skirting}  onclick={() => skirting = true}>Yes</button>
      </div>
    </div>
  </div>

  <!-- Results -->
  {#if ready}
    <div class="results">
      <!-- Floor tiles -->
      <div class="result-block">
        <div class="rb-icon">⬜</div>
        <div class="rb-body">
          <div class="rb-title">Floor Tiles</div>
          <div class="rb-main">{floorTotal} <span class="rb-unit">tiles</span></div>
          <div class="rb-breakdown">
            {floorBase} base + {floorTotal - floorBase} wastage (5%)
          </div>
        </div>
      </div>

      {#if skirting}
        <!-- Skirting tiles -->
        <div class="result-block">
          <div class="rb-icon">📐</div>
          <div class="rb-body">
            <div class="rb-title">Skirting Tiles <span class="rb-note">(600×600)</span></div>
            <div class="rb-main">{skirtTotal} <span class="rb-unit">tiles</span></div>
            <div class="rb-breakdown">
              Perimeter {perimeterM} m · {skirtBase} base + {skirtTotal - skirtBase} wastage (5%)
            </div>
          </div>
        </div>
      {/if}

      <!-- Total -->
      <div class="result-block result-total">
        <div class="rb-icon">🧮</div>
        <div class="rb-body">
          <div class="rb-title">Total Tiles to Purchase</div>
          <div class="rb-main rb-big">{grandTotal} <span class="rb-unit">tiles</span></div>
          {#if skirting}
            <div class="rb-breakdown">{floorTotal} floor + {skirtTotal} skirting</div>
          {:else}
            <div class="rb-breakdown">Includes 5% wastage allowance</div>
          {/if}
        </div>
      </div>

      <button class="reset-btn" onclick={() => {
        roomL = ''; roomW = ''; tileL = ''; tileW = '';
        skirting = false;
      }}>Reset</button>
    </div>
  {/if}
</div>

<style>
  .wrap {
    max-width: 640px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
    font-family: 'Inter', sans-serif;
  }

  .card {
    background: #fff;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 4px 24px rgba(0,0,0,.07);
  }

  /* Header */
  .header { margin-bottom: 1.75rem; }
  .header h1 {
    font-size: 1.55rem;
    font-weight: 800;
    color: #1e3a8a;
    margin-bottom: .3rem;
  }
  .header p { color: #64748b; font-size: .95rem; }

  /* Unit toggle */
  .unit-toggle {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
  .toggle-label { font-weight: 600; font-size: .9rem; color: #475569; }
  .toggle-pills {
    display: flex;
    background: #f1f5f9;
    border-radius: 10px;
    padding: 4px;
    gap: 4px;
  }
  .pill {
    padding: 6px 20px;
    border-radius: 8px;
    border: none;
    background: transparent;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
    color: #64748b;
    transition: all .15s;
    font-family: inherit;
  }
  .pill.active {
    background: #1e3a8a;
    color: #fff;
    box-shadow: 0 2px 8px rgba(30,58,138,.25);
  }

  /* Section grid */
  .section-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 480px) { .section-grid { grid-template-columns: 1fr; } }

  .input-group {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 1rem;
  }
  .group-label {
    font-size: .75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #94a3b8;
    margin-bottom: .75rem;
  }
  .fields { display: flex; flex-direction: column; gap: .65rem; }

  .field { display: flex; flex-direction: column; gap: 4px; }
  label { font-size: .85rem; font-weight: 600; color: #334155; }
  .u { font-weight: 400; color: #94a3b8; }

  input {
    padding: 9px 12px;
    border: 1.5px solid #e2e8f0;
    border-radius: 9px;
    font-size: .95rem;
    font-family: inherit;
    background: #fff;
    transition: border-color .15s;
    color: #1e293b;
  }
  input:focus { outline: none; border-color: #1e3a8a; }

  .dim-badge {
    margin-top: .6rem;
    font-size: .8rem;
    font-weight: 600;
    color: #1e3a8a;
    background: #eff6ff;
    border-radius: 6px;
    padding: 3px 8px;
    display: inline-block;
  }

  /* Skirting */
  .skirting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 1rem 1.25rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .skirting-info { display: flex; flex-direction: column; gap: 3px; }
  .skirting-title { font-weight: 700; font-size: .95rem; color: #1e293b; }
  .skirting-hint { font-size: .78rem; color: #94a3b8; }

  .yes-no { display: flex; gap: 6px; flex-shrink: 0; }
  .yn {
    padding: 7px 18px;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: #fff;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
    color: #64748b;
    font-family: inherit;
    transition: all .15s;
  }
  .yn.yn-active {
    background: #1e3a8a;
    border-color: #1e3a8a;
    color: #fff;
  }

  /* Results */
  .results {
    margin-top: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: .75rem;
  }

  .result-block {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.1rem 1.35rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
  }
  .result-total {
    background: #1e3a8a;
    border-color: #1e3a8a;
  }
  .result-total .rb-title,
  .result-total .rb-breakdown,
  .result-total .rb-unit,
  .result-total .rb-note { color: rgba(255,255,255,.7); }
  .result-total .rb-main { color: #fff; }

  .rb-icon { font-size: 1.4rem; line-height: 1; padding-top: 2px; }
  .rb-body { flex: 1; }
  .rb-title {
    font-size: .8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    color: #64748b;
    margin-bottom: .25rem;
  }
  .rb-note { text-transform: none; letter-spacing: 0; font-weight: 400; }
  .rb-main {
    font-size: 2rem;
    font-weight: 800;
    color: #1e3a8a;
    line-height: 1.1;
  }
  .rb-big { font-size: 2.4rem; }
  .rb-unit { font-size: 1rem; font-weight: 500; color: #94a3b8; }
  .rb-breakdown { font-size: .8rem; color: #94a3b8; margin-top: .2rem; }

  .reset-btn {
    align-self: flex-start;
    padding: 9px 22px;
    border: 1.5px solid #e2e8f0;
    border-radius: 9px;
    background: #fff;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
    color: #64748b;
    font-family: inherit;
    transition: all .15s;
  }
  .reset-btn:hover { background: #f1f5f9; }
</style>
