
function calculate() {
    const area = parseFloat(document.getElementById("area").value);
    const skirtingLength = parseFloat(document.getElementById("skirting").value) || 0;
    const tileSize = document.getElementById("tileSize").value;

    let tileCoverage = tileSize === "300" ? 0.96 : tileSize === "600" ? 3.87 : 15.5;
    let skirtingPerTile = tileSize === "300" ? 3 : tileSize === "600" ? 6 : 48;

    const tileCount = Math.ceil((area / tileCoverage) * 1.05);
    const skirtingTiles = Math.ceil(skirtingLength / skirtingPerTile);
    const totalTiles = tileCount + skirtingTiles;

    const tileCost = totalTiles * 250;

    const cementBags = Math.ceil((area / 700) * 8);
    const sandCubes = Math.ceil((area / 700) * 1 * 4) / 4;

    const adhesiveLow = Math.ceil(area / 45);
    const adhesiveHigh = Math.ceil(area / 25);
    const adhesiveCostLow = adhesiveLow * 2500;
    const adhesiveCostHigh = adhesiveHigh * 2500;

    const clipsCost = Math.ceil(area / 100) * 1000;
    const groutCost = Math.ceil(area / 300) * 300;

    const laborLow = area * 80;
    const laborHigh = area * 120;

    const totalLow = tileCost + adhesiveCostLow + clipsCost + groutCost + laborLow;
    const totalHigh = tileCost + adhesiveCostHigh + clipsCost + groutCost + laborHigh;

    const report = `
    <h3>Calculation Report</h3>
    <p><strong>Tiles (Floor + Skirting):</strong> ${totalTiles}</p>
    <p><strong>Tile Cost:</strong> LKR ${tileCost.toLocaleString()}</p>
    <p><strong>Floor Bedwork:</strong> ${cementBags} bags cement, ${sandCubes} cubes sand</p>
    <p><strong>Adhesive:</strong> LKR ${adhesiveCostLow.toLocaleString()} – ${adhesiveCostHigh.toLocaleString()}</p>
    <p><strong>Clips:</strong> LKR ${clipsCost.toLocaleString()}</p>
    <p><strong>Grout:</strong> LKR ${groutCost.toLocaleString()}</p>
    <p><strong>Labor:</strong> LKR ${laborLow.toLocaleString()} – ${laborHigh.toLocaleString()}</p>
    <h4>Total Estimated Cost: LKR ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}</h4>
    `;

    document.getElementById("report").innerHTML = report;

    window.open("https://www.profitableratecpm.com/kt9k1rrxm?key=de2f677dc7757f2334fea3a41a50ba74", "_blank");
}
