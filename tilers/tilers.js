function toggleNav() {
  document.getElementById('nav-menu').classList.toggle('active');
}

// Highlight active nav link
const currentPath = window.location.pathname;
document.querySelectorAll('#nav-menu a').forEach(link => {
  if (link.getAttribute('href') === currentPath) {
    link.classList.add('active');
  }
});

// Load tilers from JSON
fetch('tilers.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('tiler-list');

    // Sort featured first
    data.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    data.forEach(tiler => {
      let whatsapp = tiler.whatsapp.trim();
      if (whatsapp.startsWith('0')) whatsapp = whatsapp.substring(1);

      const card = document.createElement('div');
      card.className = 'tiler-card';

      card.innerHTML = `
        ${tiler.featured ? '<div class="badge">⭐ Top</div>' : ''}
        <img src="${tiler.image}" alt="${tiler.name}" loading="lazy" onerror="this.src='/icons/default-tiler.png'" />
        <h4>${tiler.name}</h4>
        <p>${tiler.city}</p>
        <a href="${tiler.facebook}" target="_blank" rel="noopener noreferrer">Facebook</a>
        <a href="https://wa.me/94${whatsapp}?text=${encodeURIComponent(`Hi ${tiler.name}, I found you on TILERSHUB`)}&utm_source=tilershub" target="_blank" rel="noopener noreferrer">WhatsApp</a>
      `;
      container.appendChild(card);
    });
  })
  .catch(error => {
    console.error('Failed to load tilers data:', error);
  });