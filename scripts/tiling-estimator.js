
function startCalculation() {
  const area = parseFloat(document.getElementById('area').value);
  const tileSize = document.getElementById('tileSize').value;
  const tilePrice = parseFloat(document.getElementById('tilePrice').value);
  const skirting = parseFloat(document.getElementById('skirting').value) || 0;
  const laborRate = parseFloat(document.getElementById('laborRate').value) || 200;

  if (!area || !tileSize || !tilePrice) {
    alert("Please fill in all required fields.");
    return;
  }

  const [width, height] = tileSize.split('x').map(Number);
  const tileArea = (width / 1000) * (height / 1000); // in square meters
  const tileAreaSqft = tileArea * 10.7639;
  const totalTiles = Math.ceil(area / tileAreaSqft * 1.1); // 10% wastage
  const materialCost = totalTiles * tilePrice;
  const laborCost = area * laborRate;
  const totalCost = materialCost + laborCost;

  const report = document.getElementById("report");
  report.innerHTML = `
    <h3>Estimate Report</h3>
    <table>
      <tr><td>Total Area</td><td>${area.toFixed(2)} sqft</td></tr>
      <tr><td>Tile Size</td><td>${tileSize}</td></tr>
      <tr><td>Total Tiles Needed</td><td>${totalTiles}</td></tr>
      <tr><td>Material Cost</td><td>LKR ${materialCost.toFixed(2)}</td></tr>
      <tr><td>Labor Cost</td><td>LKR ${laborCost.toFixed(2)}</td></tr>
      <tr><td><strong>Total Cost</strong></td><td><strong>LKR ${totalCost.toFixed(2)}</strong></td></tr>
    </table>
  `;
  report.hidden = false;
}