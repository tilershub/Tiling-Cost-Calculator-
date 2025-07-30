fetch('tile-sizes.json')
  .then(response => response.json())
  .then(tileSizes => {
    const tileSizeSelect = document.getElementById('tileSize');
    tileSizes.forEach(size => {
      const option = document.createElement('option');
      option.value = JSON.stringify(size);
      option.textContent = size.label;
      tileSizeSelect.appendChild(option);
    });
  });

document.getElementById('tilingForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const area = parseFloat(document.getElementById('area').value);
  const tileData = JSON.parse(document.getElementById('tileSize').value);
  const tilePrice = parseFloat(document.getElementById('tilePrice').value);
  const skirtingLength = parseFloat(document.getElementById('skirtingLength').value) || 0;
  const laborRate = parseFloat(document.getElementById('laborRate').value) || 150;

  const tileArea = (tileData.width / 12) * (tileData.height / 12);
  const tilesNeeded = Math.ceil(area / tileArea * 1.1);
  const skirtingTiles = skirtingLength > 0 ? Math.ceil(skirtingLength / (tileData.width / 12)) : 0;

  const tileCost = tilesNeeded * tilePrice;
  const skirtingCost = skirtingTiles * tilePrice;
  const laborCost = area * laborRate;

  const total = tileCost + skirtingCost + laborCost;

  document.getElementById('result').innerHTML = `
    <div style="margin-top:20px;">
      <h3>Estimate Breakdown</h3>
      <p><strong>Total Tiles Needed:</strong> ${tilesNeeded}</p>
      ${skirtingLength > 0 ? `<p><strong>Skirting Tiles:</strong> ${skirtingTiles}</p>` : ''}
      <p><strong>Tile Cost:</strong> LKR ${tileCost.toFixed(2)}</p>
      ${skirtingLength > 0 ? `<p><strong>Skirting Cost:</strong> LKR ${skirtingCost.toFixed(2)}</p>` : ''}
      <p><strong>Labor Cost:</strong> LKR ${laborCost.toFixed(2)}</p>
      <p><strong>Total Estimate:</strong> <strong>LKR ${total.toFixed(2)}</strong></p>
    </div>
  `;
});