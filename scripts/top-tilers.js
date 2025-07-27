
fetch('/tilers/tilers.json')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('home-tiler-list');
    const topTilers = data.filter(t => t.featured).slice(0, 2);
    container.innerHTML = topTilers.map(tiler => `
      <div class="tiler-card" onclick="location.href='/tilers/tilers.html'">
        <img src="${tiler.image}" alt="${tiler.name}" />
        <h4>${tiler.name}</h4>
        <p>${tiler.city}</p>
      </div>
    `).join('');
  })
  .catch(() => {
    document.getElementById('home-tiler-list').innerText = "Failed to load tilers.";
  });
