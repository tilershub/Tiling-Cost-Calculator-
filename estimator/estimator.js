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

function getTileSqft(value, tileSizes) {
  const match = tileSizes.find(t => t.value === value);
  return match ? match.sqft : 0;
}

async function startCalculation() {
  const area = parseFloat(document.getElementById('area').value);
  const tileSize = document.getElementById('tileSize').value;
  const tilePrice = parseFloat(document.getElementById('tilePrice').value);
  const skirting = parseFloat(document.getElementById('skirting').value) || 0;
  const laborRate = parseFloat(document.getElementById('laborRate').value);

  const response = await fetch('tile-sizes.json');
  const data = await response.json();
  const sqftPerTile = getTileSqft(tileSize, data.tileSizes);
  if (!area || !sqftPerTile || !tilePrice) return alert("Please enter valid inputs");

  const tilesNeeded = Math.ceil(area / sqftPerTile);
  const skirtingTiles = Math.ceil(skirting / 3);
  const totalTiles = tilesNeeded + skirtingTiles;
  const wastage = Math.ceil(totalTiles * 0.1);
  const finalTiles = totalTiles + wastage;

  const materialCost = finalTiles * tilePrice;
  const laborCost = laborRate ? laborRate * area : 0;
  const totalCost = materialCost + laborCost;

  document.getElementById('report').innerHTML = `
    <table>
      <tr><th colspan="2">Tile Estimation Report</th></tr>
      <tr><td>Tile Size</td><td>${tileSize}</td></tr>
      <tr><td>Tiles Needed</td><td>${tilesNeeded}</td></tr>
      <tr><td>Skirting Tiles</td><td>${skirtingTiles}</td></tr>
      <tr><td>Wastage (10%)</td><td>${wastage}</td></tr>
      <tr><td><strong>Total Tiles</strong></td><td><strong>${finalTiles}</strong></td></tr>
      <tr><td>Material Cost</td><td>LKR ${materialCost.toLocaleString()}</td></tr>
      <tr><td>Labor Cost</td><td>LKR ${laborCost.toLocaleString()}</td></tr>
      <tr><td><strong>Total Cost</strong></td><td><strong>LKR ${totalCost.toLocaleString()}</strong></td></tr>
    </table>
  `;
  document.getElementById('report').style.display = 'block';
}

loadTileSizes();