async function loadTileSizes() {
  try {
    const response = await fetch('tile-sizes.json');
    const data = await response.json();
    const tileSizeSelect = document.getElementById('tileSize');

    data.tileSizes.forEach(size => {
      const option = document.createElement('option');
      option.value = size.value;
      option.textContent = size.label;
      tileSizeSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Tile sizes couldn't be loaded:", error);
  }
}

function getTileSettings(value, tileSizes) {
  return tileSizes.find(t => t.value === value);
}

async function startCalculation() {
  const area = parseFloat(document.getElementById('area').value);
  const tileSize = document.getElementById('tileSize').value;
  const tilePrice = parseFloat(document.getElementById('tilePrice').value);
  const userSkirting = parseFloat(document.getElementById('skirting').value);
  const userLaborRate = parseFloat(document.getElementById('laborRate').value);

  const response = await fetch('tile-sizes.json');
  const data = await response.json();
  const settings = getTileSettings(tileSize, data.tileSizes);
  if (!area || !settings || !tilePrice) return alert("Please enter valid inputs");

  const skirting = isNaN(userSkirting) || userSkirting <= 0 ? Math.ceil(area * 0.2) : userSkirting;
  const useDefaultLabor = isNaN(userLaborRate) || userLaborRate <= 0;

  const floorTiles = Math.ceil(area / settings.sqft);
  const skirtingTiles = Math.ceil(skirting / settings.skirtingCoverage);
  const totalTiles = Math.ceil((floorTiles + skirtingTiles) * 1.05);

  const cementMin = Math.ceil(8 * area / 800);
  const cementMax = Math.ceil(8 * area / 600);
  const sandMin = Math.round((area / 800) * 4) / 4;
  const sandMax = Math.round((area / 600) * 4) / 4;
  const cementCostMin = cementMin * 1900;
  const cementCostMax = cementMax * 1900;
  const sandCostMin = sandMin * 25000;
  const sandCostMax = sandMax * 25000;

  const adhesiveMin = Math.ceil(area / 40);
  const adhesiveMax = Math.ceil(area / 30);
  const adhesiveCostMin = adhesiveMin * 2200;
  const adhesiveCostMax = adhesiveMax * 2200;

  const clips = Math.ceil(area / 100);
  const grout = Math.ceil(area / 175);
  const clipsCost = clips * 1500;
  const groutCost = grout * 300;
  const tileCost = totalTiles * tilePrice;

  let floorLaborMin, floorLaborMax, skirtingLaborMin, skirtingLaborMax, laborMin, laborMax;

  if (useDefaultLabor) {
    floorLaborMin = area * settings.laborMin;
    floorLaborMax = area * settings.laborMax;
    skirtingLaborMin = skirting * settings.laborMin;
    skirtingLaborMax = skirting * settings.laborMax;
    laborMin = floorLaborMin + skirtingLaborMin;
    laborMax = floorLaborMax + skirtingLaborMax;
  } else {
    floorLaborMin = floorLaborMax = area * userLaborRate;
    skirtingLaborMin = skirtingLaborMax = skirting * userLaborRate;
    laborMin = laborMax = floorLaborMin + skirtingLaborMin;
  }

  const materialMin = tileCost + cementCostMin + sandCostMin + adhesiveCostMin + clipsCost + groutCost;
  const materialMax = tileCost + cementCostMax + sandCostMax + adhesiveCostMax + clipsCost + groutCost;
  const totalMin = materialMin + laborMin;
  const totalMax = materialMax + laborMax;

  document.getElementById("report").innerHTML = `
    <h3>📌 Project Summary</h3>
    <table>
      <tr><th>Area</th><td>${area} sqft</td></tr>
      <tr><th>Skirting</th><td>${skirting} ft</td></tr>
      <tr><th>Tile Size</th><td>${tileSize}</td></tr>
    </table>

    <h3>🧱 Floor Bed Estimate</h3>
    <table>
      <tr><th>Material</th><th>Qty</th><th>Cost (LKR)</th></tr>
      <tr><td>Cement (50kg)</td><td>${cementMin} – ${cementMax}</td><td>${cementCostMin} – ${cementCostMax}</td></tr>
      <tr><td>Sand (1 cube)</td><td>${sandMin} – ${sandMax}</td><td>${sandCostMin} – ${sandCostMax}</td></tr>
    </table>

    <h3>🧱 Tiling Estimate</h3>
    <table>
      <tr><td>Floor Tiles</td><td>${floorTiles}</td><td>-</td></tr>
      <tr><td>Skirting Tiles</td><td>${skirtingTiles}</td><td>-</td></tr>
      <tr><td><b>Total Tiles (5% wastage)</b></td><td>${totalTiles}</td><td>${tileCost}</td></tr>
      <tr><td>Adhesive (25kg)</td><td>${adhesiveMin} – ${adhesiveMax}</td><td>${adhesiveCostMin} – ${adhesiveCostMax}</td></tr>
      <tr><td>Clips (100 pcs)</td><td>${clips}</td><td>${clipsCost}</td></tr>
      <tr><td>Grout (1kg)</td><td>${grout}</td><td>${groutCost}</td></tr>
    </table>

    <h3>👷 Labor Cost</h3>
    <table>
      <tr><th>Type</th><th>Min</th><th>Max</th></tr>
      <tr><td>Floor Labor</td><td>LKR ${floorLaborMin.toFixed(0)}</td><td>LKR ${floorLaborMax.toFixed(0)}</td></tr>
      <tr><td>Skirting Labor</td><td>LKR ${skirtingLaborMin.toFixed(0)}</td><td>LKR ${skirtingLaborMax.toFixed(0)}</td></tr>
      <tr style="font-weight:bold;"><td>Total Labor</td><td>LKR ${laborMin.toFixed(0)}</td><td>LKR ${laborMax.toFixed(0)}</td></tr>
    </table>

    <h3>💰 Total Cost Estimate</h3>
    <table>
      <tr><th>Materials</th><td>LKR ${materialMin.toFixed(0)} – ${materialMax.toFixed(0)}</td></tr>
      <tr><th>Labor</th><td>LKR ${laborMin.toFixed(0)} – ${laborMax.toFixed(0)}</td></tr>
      <tr><th>Total</th><td><b>LKR ${totalMin.toFixed(0)} – ${totalMax.toFixed(0)}</b></td></tr>
    </table>
  `;

  document.getElementById("report").style.display = 'block';
  document.getElementById("report").scrollIntoView({ behavior: "smooth" });
}

loadTileSizes();