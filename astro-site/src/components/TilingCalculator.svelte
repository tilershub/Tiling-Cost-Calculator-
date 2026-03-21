<script lang="ts">
  // Tile size data (inlined from tile-sizes.json)
  const tileSizes = [
    { label: '300×300 mm', value: '300x300', sqft: 0.96, laborMin: 80, laborMax: 120, skirtingCoverage: 3 },
    { label: '300×600 mm', value: '300x600', sqft: 1.94, laborMin: 80, laborMax: 120, skirtingCoverage: 6 },
    { label: '600×600 mm', value: '600x600', sqft: 3.87, laborMin: 80, laborMax: 120, skirtingCoverage: 12 },
    { label: '600×1200 mm', value: '600x1200', sqft: 7.75, laborMin: 110, laborMax: 150, skirtingCoverage: 24 },
    { label: '800×800 mm', value: '800x800', sqft: 6.89, laborMin: 110, laborMax: 150, skirtingCoverage: 20 },
    { label: '1200×1200 mm', value: '1200x1200', sqft: 12.9, laborMin: 150, laborMax: 250, skirtingCoverage: 48 },
    { label: '800×1800 mm', value: '800x1800', sqft: 15.3, laborMin: 150, laborMax: 250, skirtingCoverage: 48 },
  ];

  // Form inputs
  let area = $state('');
  let tileSize = $state('');
  let tilePrice = $state('');
  let skirtingInput = $state('');
  let laborRateInput = $state('');

  // Result state
  let result = $state<ReturnType<typeof calculate> | null>(null);
  let error = $state('');
  let showResult = $state(false);

  function fmt(n: number) {
    return n.toLocaleString('en-LK', { maximumFractionDigits: 0 });
  }

  function calculate() {
    const a = parseFloat(area);
    const tp = parseFloat(tilePrice);
    const settings = tileSizes.find(t => t.value === tileSize);

    if (!a || a <= 0 || !settings || !tp || tp <= 0) {
      error = 'Please enter a valid area, tile size, and tile price.';
      return null;
    }
    error = '';

    const userSkirting = parseFloat(skirtingInput);
    const userLaborRate = parseFloat(laborRateInput);
    const skirting = isNaN(userSkirting) || userSkirting <= 0 ? Math.ceil(a * 0.2) : userSkirting;
    const useDefaultLabor = isNaN(userLaborRate) || userLaborRate <= 0;

    const floorTiles = Math.ceil(a / settings.sqft);
    const skirtingTiles = Math.ceil(skirting / settings.skirtingCoverage);
    const totalTiles = Math.ceil((floorTiles + skirtingTiles) * 1.05);

    // Floor bed
    const cementMin = Math.ceil(8 * a / 800);
    const cementMax = Math.ceil(8 * a / 600);
    const sandMin = Math.round((a / 800) * 4) / 4;
    const sandMax = Math.round((a / 600) * 4) / 4;
    const cementCostMin = cementMin * 1900;
    const cementCostMax = cementMax * 1900;
    const sandCostMin = sandMin * 25000;
    const sandCostMax = sandMax * 25000;

    // Tiling materials
    const adhesiveMin = Math.ceil(a / 40);
    const adhesiveMax = Math.ceil(a / 30);
    const clips = Math.ceil(a / 100);
    const grout = Math.ceil(a / 175);
    const adhesiveCostMin = adhesiveMin * 2200;
    const adhesiveCostMax = adhesiveMax * 2200;
    const clipsCost = clips * 1500;
    const groutCost = grout * 300;
    const tileCost = totalTiles * tp;

    // Labor
    let floorLaborMin: number, floorLaborMax: number;
    let skirtingLaborMin: number, skirtingLaborMax: number;

    if (useDefaultLabor) {
      floorLaborMin = a * settings.laborMin;
      floorLaborMax = a * settings.laborMax;
      skirtingLaborMin = skirting * settings.laborMin;
      skirtingLaborMax = skirting * settings.laborMax;
    } else {
      floorLaborMin = floorLaborMax = a * userLaborRate;
      skirtingLaborMin = skirtingLaborMax = skirting * userLaborRate;
    }
    const laborMin = floorLaborMin + skirtingLaborMin;
    const laborMax = floorLaborMax + skirtingLaborMax;

    const materialMin = tileCost + cementCostMin + sandCostMin + adhesiveCostMin + clipsCost + groutCost;
    const materialMax = tileCost + cementCostMax + sandCostMax + adhesiveCostMax + clipsCost + groutCost;
    const totalMin = materialMin + laborMin;
    const totalMax = materialMax + laborMax;

    return {
      area: a, skirting, tileSize: settings.label,
      floorTiles, skirtingTiles, totalTiles,
      cementMin, cementMax, cementCostMin, cementCostMax,
      sandMin, sandMax, sandCostMin, sandCostMax,
      adhesiveMin, adhesiveMax, adhesiveCostMin, adhesiveCostMax,
      clips, clipsCost, grout, groutCost, tileCost,
      floorLaborMin, floorLaborMax, skirtingLaborMin, skirtingLaborMax,
      laborMin, laborMax, materialMin, materialMax, totalMin, totalMax,
    };
  }

  function handleCalculate() {
    const r = calculate();
    if (r) {
      result = r;
      showResult = true;
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      showResult = false;
    }
  }

  function reset() {
    area = '';
    tileSize = '';
    tilePrice = '';
    skirtingInput = '';
    laborRateInput = '';
    result = null;
    showResult = false;
    error = '';
  }
</script>

<div class="calc-wrap">
  <div class="calc-card">
    <h1 class="calc-title">🧮 Tiling Cost Estimator</h1>
    <p class="calc-sub">Get an instant cost estimate for your tiling project in Sri Lanka.</p>

    <div class="form-grid">
      <div class="field">
        <label for="area">Total Area <span class="unit">(sq ft)</span></label>
        <input id="area" type="number" min="1" placeholder="e.g. 200" bind:value={area} />
      </div>

      <div class="field">
        <label for="tileSize">Tile Size</label>
        <select id="tileSize" bind:value={tileSize}>
          <option value="">Select size…</option>
          {#each tileSizes as t}
            <option value={t.value}>{t.label}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <label for="tilePrice">Tile Price <span class="unit">(LKR per tile)</span></label>
        <input id="tilePrice" type="number" min="1" placeholder="e.g. 450" bind:value={tilePrice} />
      </div>
    </div>

    <details class="optional-section">
      <summary>Optional inputs</summary>
      <div class="form-grid optional-grid">
        <div class="field">
          <label for="skirting">Skirting Length <span class="unit">(ft, optional)</span></label>
          <input id="skirting" type="number" min="0" placeholder="Leave blank to auto-calculate" bind:value={skirtingInput} />
        </div>
        <div class="field">
          <label for="laborRate">Custom Labour Rate <span class="unit">(LKR/sq ft, optional)</span></label>
          <input id="laborRate" type="number" min="0" placeholder="Leave blank for default range" bind:value={laborRateInput} />
        </div>
      </div>
    </details>

    {#if error}
      <p class="error-msg">⚠️ {error}</p>
    {/if}

    <button class="calc-btn" onclick={handleCalculate}>📊 Calculate Cost</button>
  </div>

  {#if showResult && result}
    <div class="result-card" id="result-section">
      <h2>Estimate Results</h2>

      <div class="result-summary">
        <div class="summary-chip">
          <span class="label">Area</span>
          <span class="value">{result.area} sqft</span>
        </div>
        <div class="summary-chip">
          <span class="label">Skirting</span>
          <span class="value">{result.skirting} ft</span>
        </div>
        <div class="summary-chip">
          <span class="label">Tile Size</span>
          <span class="value">{result.tileSize}</span>
        </div>
      </div>

      <!-- Floor Bed -->
      <h3>🧱 Floor Bed</h3>
      <table>
        <thead>
          <tr><th>Material</th><th>Qty (min–max)</th><th>Cost LKR (min–max)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Cement (50 kg bag)</td>
            <td>{result.cementMin} – {result.cementMax}</td>
            <td>{fmt(result.cementCostMin)} – {fmt(result.cementCostMax)}</td>
          </tr>
          <tr>
            <td>Sand (1 cube)</td>
            <td>{result.sandMin} – {result.sandMax}</td>
            <td>{fmt(result.sandCostMin)} – {fmt(result.sandCostMax)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Tiling Materials -->
      <h3>🪣 Tiling Materials</h3>
      <table>
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Cost LKR</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Floor tiles</td>
            <td>{result.floorTiles}</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Skirting tiles</td>
            <td>{result.skirtingTiles}</td>
            <td>—</td>
          </tr>
          <tr class="highlight-row">
            <td><strong>Total tiles (incl. 5% wastage)</strong></td>
            <td><strong>{result.totalTiles}</strong></td>
            <td><strong>{fmt(result.tileCost)}</strong></td>
          </tr>
          <tr>
            <td>Tile adhesive (25 kg bag)</td>
            <td>{result.adhesiveMin} – {result.adhesiveMax}</td>
            <td>{fmt(result.adhesiveCostMin)} – {fmt(result.adhesiveCostMax)}</td>
          </tr>
          <tr>
            <td>Leveling clips (100 pcs)</td>
            <td>{result.clips}</td>
            <td>{fmt(result.clipsCost)}</td>
          </tr>
          <tr>
            <td>Grout (1 kg)</td>
            <td>{result.grout}</td>
            <td>{fmt(result.groutCost)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Labour -->
      <h3>👷 Labour Cost</h3>
      <table>
        <thead>
          <tr><th>Type</th><th>Min (LKR)</th><th>Max (LKR)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Floor labour</td>
            <td>{fmt(result.floorLaborMin)}</td>
            <td>{fmt(result.floorLaborMax)}</td>
          </tr>
          <tr>
            <td>Skirting labour</td>
            <td>{fmt(result.skirtingLaborMin)}</td>
            <td>{fmt(result.skirtingLaborMax)}</td>
          </tr>
          <tr class="highlight-row">
            <td><strong>Total labour</strong></td>
            <td><strong>{fmt(result.laborMin)}</strong></td>
            <td><strong>{fmt(result.laborMax)}</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- Grand Total -->
      <div class="total-box">
        <div class="total-row">
          <span>Materials</span>
          <span>LKR {fmt(result.materialMin)} – {fmt(result.materialMax)}</span>
        </div>
        <div class="total-row">
          <span>Labour</span>
          <span>LKR {fmt(result.laborMin)} – {fmt(result.laborMax)}</span>
        </div>
        <div class="total-row grand">
          <span>💰 Grand Total</span>
          <span>LKR {fmt(result.totalMin)} – {fmt(result.totalMax)}</span>
        </div>
      </div>

      <div class="result-actions">
        <a class="action-btn action-btn--primary" href="/tilers">Find a Tiler 👷</a>
        <button class="action-btn action-btn--secondary" onclick={reset}>Recalculate 🔄</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .calc-wrap {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  .calc-card {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  }

  .calc-title {
    font-size: 1.8rem;
    font-weight: 800;
    color: #1e3a8a;
    margin-bottom: 0.4rem;
  }

  .calc-sub {
    color: #64748b;
    margin-bottom: 1.75rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.1rem;
  }

  @media (min-width: 560px) {
    .form-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-weight: 600;
    font-size: 0.9rem;
    color: #1e293b;
  }

  .unit {
    font-weight: 400;
    color: #64748b;
  }

  input, select {
    padding: 11px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
    background: #f8fafc;
  }

  input:focus, select:focus {
    outline: none;
    border-color: #1e3a8a;
    background: white;
  }

  .optional-section {
    margin: 1.5rem 0;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.75rem 1rem;
  }

  .optional-section summary {
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    color: #1e3a8a;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .optional-section summary::before {
    content: '▶';
    font-size: 0.7rem;
    transition: transform 0.2s;
  }

  .optional-section[open] summary::before {
    transform: rotate(90deg);
  }

  .optional-grid {
    margin-top: 1rem;
  }

  .error-msg {
    background: #fef2f2;
    color: #b91c1c;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    margin: 0.75rem 0;
  }

  .calc-btn {
    width: 100%;
    padding: 14px;
    background: #1e3a8a;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
    margin-top: 0.5rem;
    transition: background 0.2s, transform 0.1s;
  }

  .calc-btn:hover {
    background: #1e40af;
  }

  .calc-btn:active {
    transform: scale(0.99);
  }

  /* Result card */
  .result-card {
    background: white;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    margin-top: 1.5rem;
  }

  .result-card h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e3a8a;
    margin-bottom: 1rem;
  }

  .result-card h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #1e3a8a;
    margin: 1.5rem 0 0.75rem;
  }

  .result-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .summary-chip {
    background: #f1f5f9;
    border-radius: 10px;
    padding: 0.5rem 1rem;
    display: flex;
    flex-direction: column;
  }

  .summary-chip .label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
  }

  .summary-chip .value {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e3a8a;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }

  th, td {
    border: 1px solid #e2e8f0;
    padding: 9px 12px;
    text-align: left;
  }

  th {
    background: #f1f5f9;
    font-weight: 600;
    color: #1e3a8a;
  }

  .highlight-row {
    background: #eff6ff;
  }

  .total-box {
    background: #1e3a8a;
    color: white;
    border-radius: 14px;
    padding: 1.25rem 1.5rem;
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
    opacity: 0.85;
  }

  .total-row.grand {
    font-size: 1.1rem;
    font-weight: 700;
    opacity: 1;
    border-top: 1px solid rgba(255, 255, 255, 0.25);
    padding-top: 0.5rem;
    margin-top: 0.25rem;
  }

  .result-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .action-btn {
    padding: 11px 22px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    text-decoration: none;
    border: none;
    flex: 1;
    text-align: center;
    min-width: 160px;
  }

  .action-btn--primary {
    background: #f59e0b;
    color: #1e3a8a;
  }

  .action-btn--primary:hover {
    background: #d97706;
  }

  .action-btn--secondary {
    background: #f1f5f9;
    color: #1e3a8a;
  }

  .action-btn--secondary:hover {
    background: #e2e8f0;
  }
</style>
