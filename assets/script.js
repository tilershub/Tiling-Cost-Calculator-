function getTileSettings(size) {
  return {
    "600x600": { sqft: 3.87, laborMin: 80, laborMax: 120, skirtingCoverage: 12 },
    "600x1200": { sqft: 7.75, laborMin: 110, laborMax: 150, skirtingCoverage: 24 },
    "800x800": { sqft: 6.89, laborMin: 110, laborMax: 150, skirtingCoverage: 20 }
  }[size];
}

function startCalculation() {
  const area = parseFloat(document.getElementById("area").value);
  const tileSize = document.getElementById("tileSize").value;
  const tilePrice = parseFloat(document.getElementById("tilePrice").value);
  if (!area || !tileSize || !tilePrice) return alert("Please fill all fields.");
  generateReport(area, tileSize, tilePrice);
}

function generateReport(area, tileSize, tilePrice) {
  const s = getTileSettings(tileSize);
  const skirting = Math.ceil(area * 0.2);
  const floorTiles = Math.ceil(area / s.sqft);
  const skirtingTiles = Math.ceil(skirting / s.skirtingCoverage);
  const totalTiles = Math.ceil((floorTiles + skirtingTiles) * 1.05);
  const adhesiveMin = Math.ceil(area / 40), adhesiveMax = Math.ceil(area / 30);
  const clips = Math.ceil(area / 100);
  const grout = Math.ceil(area / 175);
  const cementMin = Math.round(8 * area / 800), cementMax = Math.round(8 * area / 600);
  const sandMin = Math.round((area / 800) * 4) / 4;
  const sandMax = Math.round((area / 600) * 4) / 4;
  const tileCost = totalTiles * tilePrice;
  const adhesiveCostMin = adhesiveMin * 2200, adhesiveCostMax = adhesiveMax * 2200;
  const clipsCost = clips * 1500;
  const groutCost = grout * 300;
  const cementCostMin = cementMin * 1900, cementCostMax = cementMax * 1900;
  const sandCostMin = sandMin * 25000, sandCostMax = sandMax * 25000;
  const laborMin = area * s.laborMin;
  const laborMax = area * s.laborMax;
  const materialMin = tileCost + cementCostMin + sandCostMin + adhesiveCostMin + clipsCost + groutCost;
  const materialMax = tileCost + cementCostMax + sandCostMax + adhesiveCostMax + clipsCost + groutCost;
  const totalMin = materialMin + laborMin;
  const totalMax = materialMax + laborMax;
  document.getElementById("report").innerHTML = `
    <h3>📌 Project Summary</h3>
    <table><tr><th>Area</th><td>${area} sqft</td></tr><tr><th>Skirting</th><td>${skirting} ft</td></tr><tr><th>Tile Size</th><td>${tileSize}</td></tr></table>
    <h3>🧱 Floor Bed Estimate</h3>
    <table><tr><th>Material</th><th>Qty</th><th>Cost (LKR)</th></tr>
    <tr><td>Cement (50kg)</td><td>${cementMin} – ${cementMax}</td><td>${cementCostMin} – ${cementCostMax}</td></tr>
    <tr><td>Sand (1 cube)</td><td>${sandMin} – ${sandMax}</td><td>${sandCostMin} – ${sandCostMax}</td></tr></table>
    <h3>🧱 Tiling Estimate</h3>
    <table><tr><th>Item</th><th>Qty</th><th>Cost (LKR)</th></tr>
    <tr><td>Floor Tiles</td><td>${floorTiles}</td><td>-</td></tr>
    <tr><td>Skirting Tiles</td><td>${skirtingTiles}</td><td>-</td></tr>
    <tr><td><b>Total Tiles (with 5% wastage)</b></td><td>${totalTiles}</td><td>${tileCost}</td></tr>
    <tr><td>Adhesive (25kg)</td><td>${adhesiveMin} – ${adhesiveMax}</td><td>${adhesiveCostMin} – ${adhesiveCostMax}</td></tr>
    <tr><td>Clips (100 pcs)</td><td>${clips}</td><td>${clipsCost}</td></tr>
    <tr><td>Grout (1kg)</td><td>${grout}</td><td>${groutCost}</td></tr></table>
    <h3>👷 Labor Cost</h3><table><tr><td>Labor</td><td>LKR ${laborMin} – ${laborMax}</td></tr></table>
    <h3>💰 Total Cost Estimate</h3>
    <table><tr><th>Materials</th><td>LKR ${materialMin} – ${materialMax}</td></tr>
    <tr><th>Labor</th><td>LKR ${laborMin} – ${laborMax}</td></tr>
    <tr><th>Total</th><td><b>LKR ${totalMin} – ${totalMax}</b></td></tr></table>
  `;
  document.getElementById("report").style.display = "block";
  document.getElementById("shareIcon").style.display = "inline-block";
}

function shareOnWhatsApp() {
  const area = document.getElementById("area").value;
  const tileSize = document.getElementById("tileSize").value;
  const tilePrice = document.getElementById("tilePrice").value;
  const link = `${location.origin}${location.pathname}?area=${area}&tileSize=${tileSize}&price=${tilePrice}`;
  const message = `📐 Your tiling estimate: ${link} \nShared via tilershub.lk`;
  const url = `https://api.whatsapp.com/send