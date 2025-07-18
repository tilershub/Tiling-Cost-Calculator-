function startCalculation() {
  const area = parseFloat(document.getElementById("area").value);
  const tileSize = document.getElementById("tileSize").value;
  const tilePrice = parseFloat(document.getElementById("tilePrice").value);

  if (!area || !tileSize || !tilePrice) {
    alert("Please fill all fields");
    return;
  }

  // Redirect to Adsterra in a new tab
  window.open("https://www.profitableratecpm.com/kt9k1rrxm?key=de2f677dc7757f2334fea3a41a50ba74", "_blank");

  // Tile area in sqft
  const sizeMap = {
    "300x300": 0.96,
    "600x600": 3.87,
    "1200x1200": 15.5
  };

  const tileCoverage = sizeMap[tileSize] || 1; // fallback to 1 sqft
  const tileCount = Math.ceil(area / tileCoverage);
  const tileCost = tileCount * tilePrice;
  const wastage = Math.ceil(tileCount * 0.05);
  const totalTiles = tileCount + wastage;
  const totalCost = totalTiles * tilePrice;

  const report = `
    <h3>Calculation Report</h3>
    <p><strong>Total Area:</strong> ${area} sqft</p>
    <p><strong>Tile Size:</strong> ${tileSize}</p>
    <p><strong>Tiles Needed (without wastage):</strong> ${tileCount}</p>
    <p><strong>Wastage (5%):</strong> ${wastage} tiles</p>
    <p><strong>Total Tiles:</strong> ${totalTiles}</p>
    <p><strong>Total Tile Cost:</strong> LKR ${totalCost.toLocaleString()}</p>
  `;

  document.getElementById("report").style.display = "block";
  document.getElementById("report").innerHTML = report;
  document.getElementById("shareIcon").style.display = "block";
}

function shareOnWhatsApp() {
  const area = document.getElementById("area").value;
  const tileSize = document.getElementById("tileSize").value;
  const price = document.getElementById("tilePrice").value;
  const link = `${location.origin}${location.pathname}?area=${area}&tileSize=${tileSize}&price=${price}`;
  const message = `Check this Tiling Cost Report on TILERSHUB: ${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
}