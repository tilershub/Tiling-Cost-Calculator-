document.addEventListener("DOMContentLoaded", function () {
  fetch("data/content.json")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("header").innerHTML = `
        <header class="site-header">
          <div class="container header-inner">
            <a href="/" class="logo-wrap">
              <img src="icons/logo.png" alt="TILERSHUB Logo" class="logo-img" />
              <span class="logo-text">TILERSHUB</span>
            </a>
            <div class="hamburger">&#9776;</div>
          </div>
        </header>
      `;

      document.getElementById("footer").innerHTML = `
        <footer class="container">
          <p>About Us</p>
          <p>Contact Us</p>
          <p>Privacy Policy</p>
          <p>Terms & Conditions</p>
          <p><a href="https://wa.me/94774503744">WhatsApp: 0774503744</a></p>
        </footer>
      `;

      document.getElementById("banner").innerHTML = `
        <section class="container"><h2>${data.banner.title}</h2><p>${data.banner.text}</p></section>
      `;

      document.getElementById("estimator").innerHTML = `
        <div class="estimator-form">
          <h2>Tiling Cost Estimator</h2>
          <input type="number" id="area" placeholder="Enter area in sq ft" />
          <input type="number" id="tilePrice" placeholder="Tile price per sq ft" />
          <input type="number" id="laborRate" placeholder="Labor cost per sq ft" />
          <button onclick="calculateEstimate()">Calculate</button>
          <div id="result" class="estimator-result"></div>
        </div>
      `;

      document.getElementById("tilers-list").innerHTML = data.tilers.slice(0, 2).map(t => `
        <div class="tiler-card">
          <img src="${t.image}" alt="${t.name}" />
          <h4>${t.name}</h4>
          <p>${t.city}</p>
        </div>
      `).join("");

      document.getElementById("blog-list").innerHTML = data.blogs.slice(0, 2).map(b => `
        <div class="blog-card">
          <h4>${b.title}</h4>
          <p>${b.excerpt}</p>
        </div>
      `).join("");

      document.getElementById("shop-list").innerHTML = data.products.slice(0, 2).map(p => `
        <div class="shop-card">
          <h4>${p.name}</h4>
          <p>${p.price} LKR</p>
        </div>
      `).join("");
    });
});

// Estimator Logic
function calculateEstimate() {
  const area = parseFloat(document.getElementById("area").value) || 0;
  const tilePrice = parseFloat(document.getElementById("tilePrice").value) || 0;
  const laborRate = parseFloat(document.getElementById("laborRate").value) || 0;

  const tileCost = area * tilePrice;
  const laborCost = area * laborRate;
  const total = tileCost + laborCost;

  document.getElementById("result").innerHTML = `
    <p><strong>Tile Cost:</strong> ${tileCost.toFixed(2)} LKR</p>
    <p><strong>Labor Cost:</strong> ${laborCost.toFixed(2)} LKR</p>
    <p><strong>Total Cost:</strong> ${total.toFixed(2)} LKR</p>
  `;
}