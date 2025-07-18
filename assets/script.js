function roundToQuarter(num) {
  return Math.round(num * 4) / 4;
}

function getTileSettings(size) {
  // tileSize: sqft, labor min/max, skirting coverage (linear ft per tile)
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

  if (!area || !tileSize || !tilePrice || area <= 0 || tilePrice <= 0) {
    alert("Please fill in all fields with valid positive numbers.");
    return;
  }

  const s = getTileSettings(tileSize);
  if (!s) {
    alert("Invalid tile size selected.");
    return;
  }

  // Open Adsterra link in new tab instantly
  window.open("https://www.profitableratecpm.com/kt9k1rrxm?key=de2f677dc7757f2334fea3a41a50ba74", "_blank");

  // Calculate skirting length (20% of area in linear ft)
  const skirting = Math.ceil(area * 0.2);

  // Tiles needed (floor)
  const floorTiles = Math.ceil(area / s.sqft);

  // Skirting tiles needed
  const skirtingTiles = Math.ceil(skirting / s.skirtingCoverage);

  // Total tiles including 5% wastage
  const totalTiles = Math.ceil((floorTiles + skirtingTiles) * 1.05);

  // Adhesive bags (25kg) 25 - 45 bags per area approx
  const adhesiveMin = 25;
  const adhesiveMax = 45;
  const adhesiveCostMin = adhesiveMin * 2200;
  const adhesiveCostMax = adhesiveMax * 2200;

  // Clips (100 pcs per 100 sqft)
  const clips = Math.ceil(area / 100);
  const clipsCost = clips * 1500;

  // Grout (1kg per 175 sqft)
  const grout = Math.ceil(area / 175);
  const groutCost = grout * 300;

  // Cement bags (50kg) 8 to 14 bags approx
  const cementMin = Math.round(8 * area / 1000); // scale by area (8 bags per 1000 sqft)
  const cementMax = Math.round(14 * area / 1000);

  const cementCostMin = cementMin * 1900;
  const cementCostMax = cementMax * 1900;

  // Sand cubes (rounded to nearest 0.25)
  const sandMinRaw = area / 800;
  const sandMaxRaw = area / 600;
  const sandMin = roundToQuarter(sandMinRaw);
  const sandMax = roundToQuarter(sandMaxRaw);

  const sandCostMin = sandMin * 25000;
  const sandCostMax = sandMax * 25000;

  // Tile cost
  const tileCost = totalTiles * tilePrice;

  // Labor cost
  const laborMin = area * s.laborMin;
  const laborMax = area * s.laborMax;

  // Material cost min/max
  const materialMin = tileCost + cementCostMin + sandCostMin + adhesiveCostMin + clipsCost + groutCost;
  const materialMax = tileCost + cementCostMax + sandCostMax + adhesiveCostMax + clipsCost + groutCost;

  // Total cost min/max
  const totalMin = materialMin + laborMin;
  const totalMax = materialMax + laborMax;

  // Build report string
  const report = `
📌 Project Summary
Area: ${area.toLocaleString()} sqft
Skirting length: ${skirting} ft
Tile Size: ${tileSize}

🧱 Floor Bed Estimate
Cement (50kg bags): ${cementMin} – ${cementMax} bags
Cement Cost: LKR ${cementCostMin.toLocaleString()} – ${cementCostMax.toLocaleString()}
Sand (cubes): ${sandMin} – ${sandMax}
Sand Cost: LKR ${sandCostMin.toLocaleString()} – ${sandCostMax.toLocaleString()}

🧱 Tiling Estimate
Floor Tiles: ${floorTiles}
Skirting Tiles: ${skirtingTiles}
Total Tiles (with 5% wastage): ${totalTiles}
Tile Cost: LKR ${tileCost.toLocaleString()}
Adhesive (25kg bags): ${adhesiveMin} – ${adhesiveMax}
Adhesive Cost: LKR ${adhesiveCostMin.toLocaleString()} – ${adhesiveCostMax.toLocaleString()}
Clips (packets of 100 pcs): ${clips}
Clips Cost: LKR ${clipsCost.toLocaleString()}
Grout (kg): ${grout}
Grout Cost: LKR ${groutCost.toLocaleString()}

👷 Labor Cost
Labor Cost Estimate: LKR ${laborMin.toLocaleString()} – ${laborMax.toLocaleString()}

💰 Total Cost Estimate
Materials: LKR ${materialMin.toLocaleString()} – ${materialMax.toLocaleString()}
Labor: LKR ${laborMin.toLocaleString()} – ${laborMax.toLocaleString()}
Total: LKR ${totalMin.toLocaleString()} – ${totalMax.toLocaleString()}
  `;

  const reportDiv = document.getElementById("report");
  reportDiv.style.display = "block";
  reportDiv.textContent = report;
}