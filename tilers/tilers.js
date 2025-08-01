// Toggle hamburger menu
function toggleNav() {
  document.getElementById('nav-menu').classList.toggle('active');
}

// Highlight current active nav link
const currentPath = window.location.pathname;
document.querySelectorAll('#nav-menu a').forEach(link => {
  if (currentPath.includes(link.getAttribute('href'))) {
    link.classList.add('active');
  }
});

// Generate star rating icons based on rating value (0–5)
function getStarRating(rating) {
  let starsHtml = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }
  const remainingStars = 5 - Math.ceil(rating);
  for (let i = 0; i < remainingStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }
  return starsHtml;
}

// Share profile using Web Share API or fallback
function shareTilerProfile(tilerName, tilerCity, whatsappLink) {
  const shareText = `Check out ${tilerName}, a verified tiler in ${tilerCity} from TILERSHUB! Contact them via ${whatsappLink}.`;
  const shareUrl = window.location.href;

  if (navigator.share) {
    navigator.share({
      title: `TILERSHUB: ${tilerName} in ${tilerCity}`,
      text: shareText,
      url: shareUrl
    })
    .then(() => console.log('Share successful'))
    .catch((error) => console.log('Share failed:', error));
  } else {
    alert('You can manually share this link: ' + shareUrl + '\n\n' + shareText);
  }
}

// Fetch and render tilers
fetch('tilers.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    const container = document.getElementById('tiler-list');

    // Sort featured tilers first
    data.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    data.forEach(tiler => {
      const id = tiler.id || tiler.name.toLowerCase().replace(/\s+/g, '-');
      let whatsapp = tiler.whatsapp ? tiler.whatsapp.trim() : '';
      if (whatsapp.startsWith('0')) whatsapp = whatsapp.substring(1);

      const rating = (tiler.rating && typeof tiler.rating === 'number' && tiler.rating >= 0 && tiler.rating <= 5)
        ? tiler.rating : 4.5;
      const stars = getStarRating(rating);

      const tilerImage = tiler.image || '/icons/default-tiler.png';
      const facebookLink = tiler.facebook || '#';
      const whatsappLink = `https://wa.me/94${whatsapp}?text=${encodeURIComponent(`Hi ${tiler.name}, I found you on TILERSHUB and would like to inquire about your tiling services.`)}`;

      // Build card as clickable link
      const card = document.createElement('a');
      card.className = 'tiler-card';
      card.href = `/tilers/tilers/${id}.html`;
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';

      card.innerHTML = `
        <div class="profile-section">
          <div class="profile-pic">
            <img src="${tilerImage}" alt="${tiler.name}" loading="lazy" onerror="this.src='/icons/default-tiler.png'" />
          </div>
          <div class="rating">${stars}</div>
        </div>

        <div class="details-section">
          ${tiler.featured ? `
            <div class="certified-badge-image">
              <img src="/icons/TilersHUB_Certified_Badge.png" alt="Certified Badge">
            </div>` : ''}

          <h4>${tiler.name}</h4>
          <p class="city">${tiler.city}</p>
          ${tiler.bio ? `<p class="bio">${tiler.bio}</p>` : ''}
          ${tiler.highlights ? `<p class="highlights">${tiler.highlights}</p>` : ''}

          <div class="social-links">
            <a href="${facebookLink}" target="_blank" rel="noopener noreferrer" class="facebook-btn" onclick="event.stopPropagation()">
              <i class="fab fa-facebook"></i> Facebook
            </a>
            <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-btn" onclick="event.stopPropagation()">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
          </div>
        </div>

        <div class="share-icon" onclick="event.preventDefault(); event.stopPropagation(); shareTilerProfile('${tiler.name}', '${tiler.city}', '${whatsappLink}')">
          <i class="fas fa-share-alt"></i>
        </div>
      `;

      container.appendChild(card);
    });
  })
  .catch(error => {
    console.error('Failed to load tilers data:', error);
    const container = document.getElementById('tiler-list');
    container.innerHTML = '<p style="text-align:center;color:#dc3545;">Failed to load tilers. Check your tilers.json file.</p>';
  });