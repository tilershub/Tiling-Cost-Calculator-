document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("data/content.json");
  const content = await res.json();

  // HEADER
  document.getElementById("header").innerHTML = `
    <div class="header">
      <div class="logo-container">
        <img src="/icons/logo.png" alt="Logo" />
        <span class="site-name">TILERSHUB</span>
      </div>
      <div class="nav-toggle" onclick="toggleMenu()">☰</div>
      <nav id="nav-menu">${content.nav.map(item => `<a href="#">${item}</a>`).join("")}</nav>
    </div>`;

  // BANNER
  document.getElementById("banner").innerHTML = `
    <div class="promo-banner">
      <p>${content.banner.message} <strong>Use Code: ${content.banner.code}</strong></p>
    </div>`;

  // ESTIMATOR
  document.getElementById("estimator").innerHTML = `
    <h2>Tiling Estimator</h2>
    <div id="estimator-form">
      <label>Total Floor Area (sqft): <input type="number" id="area" placeholder="e.g. 100" /></label><br/>
      <label>Tile Size (in inches): 
        <select id="tileSize">
          <option value="12x12">12x12</option>
          <option value="24x24">24x24</option>
          <option value="12x24">12x24</option>
        </select>
      </label><br/>
      <label>Skirting Length (optional in feet): <input type="number" id="skirting" /></label><br/>
      <label>Labor Cost per sqft: <input type="number" id="labor" value="150" /></label><br/>
      <button onclick="calculateEstimate()">Calculate</button>
    </div>
    <div id="estimator-result" style="margin-top:20px;"></div>`;

  // TILERS
  document.getElementById("tilers").innerHTML = `
    <h2>Top Tilers</h2>
    <div class="grid">${content.tilers.map(t => `
      <div class="card">
        <img src="${t.image}" alt="${t.name}" />
        <h3>${t.name}</h3>
        <p>${t.city} - ${t.rating}</p>
        <p>Available: ${t.available}</p>
      </div>`).join("")}</div>`;

  // BLOG
  document.getElementById("blog").innerHTML = `
    <h2>Latest Blogs</h2>
    <div class="grid">${content.blogs.map(b => `
      <div class="card">
        <h3>${b.title}</h3>
        <p>${b.description}</p>
        <a href="${b.link}">Read More</a>
      </div>`).join("")}</div>`;

  // SHOP
  document.getElementById("shop").innerHTML = `
    <h2>Shop</h2>
    <div class="grid">${content.shop.map(s => `
      <div class="card">
        <h3>${s.title}</h3>
        <p>${s.price}</p>
        <a href="${s.link}">View Product</a>
      </div>`).join("")}</div>`;

  // FOOTER
  document.getElementById("footer").innerHTML = `
    <footer class="container">
      <p><a href="#">${content.footer.about}</a> | 
         <a href="#">${content.footer.contact}</a> | 
         <a href="#">${content.footer.privacy}</a> | 
         <a href="#">${content.footer.terms}</a></p>
      <p>WhatsApp: ${content.footer.whatsapp}</p>
    </footer>`;
});

function toggleMenu() {
  const nav = document.getElementById("nav-menu");
  nav.classList.toggle("active");
}

function calculateEstimate() {
  const area = parseFloat(document.getElementById("area").value) || 0;
  const tileSize = document.getElementById("tileSize").value;
  const skirting = parseFloat(document.getElementById("skirting").value) || 0;
  const laborRate = parseFloat(document.getElementById("labor").value) || 0;

  const sizeMap = {
    "12x12": 1,
    "24x24": 4,
    "12x24": 2
  };

  const tilesNeeded = Math.ceil(area / sizeMap[tileSize]);
  const skirtingTiles = skirting > 0 ? Math.ceil(skirting / 1.5) : 0;
  const totalTiles = tilesNeeded + Math.ceil(tilesNeeded * 0.1) + skirtingTiles;

  const adhesive = Math.ceil(area / 55);
  const grout = Math.ceil(area / 100);
  const clips = Math.ceil(area / 15);
  const cementBags = Math.ceil(area / 45);
  const sandBags = Math.ceil(area / 35);

  const laborCost = area * laborRate;
  const materialCost = cementBags * 1850 + sandBags * 950 + adhesive * 2200 + grout * 850 + clips * 250;

  const total = laborCost + materialCost;

  document.getElementById("estimator-result").innerHTML = `
    <h3>Estimate Breakdown</h3>
    <p><strong>Tiles Needed:</strong> ${tilesNeeded} + Skirting: ${skirtingTiles} + Wastage: 10%</p>
    <p><strong>Adhesive:</strong> ${adhesive} Bags</p>
    <p><strong>Grout:</strong> ${grout} Packs</p>
    <p><strong>Clips:</strong> ${clips} Sets</p>
    <p><strong>Cement:</strong> ${cementBags} Bags</p>
    <p><strong>Sand:</strong> ${sandBags} Bags</p>
    <p><strong>Labor:</strong> Rs. ${laborCost.toLocaleString()}</p>
    <p><strong>Material:</strong> Rs. ${materialCost.toLocaleString()}</p>
    <h3>Total Estimate: Rs. ${total.toLocaleString()}</h3>
  `;
}
