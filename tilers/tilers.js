function toggleNav() {
  document.getElementById('nav-menu').classList.toggle('active');
}

// Highlight active nav link
const currentPath = window.location.pathname;
document.querySelectorAll('#nav-menu a').forEach(link => {
  if (currentPath.includes(link.getAttribute('href'))) {
    link.classList.add('active');
  }
});

// Function to generate star rating HTML based on a numeric rating
function getStarRating(rating) {
  let starsHtml = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>'; // Full star
  }
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>'; // Half star
  }

  const remainingStars = 5 - Math.ceil(rating);
  for (let i = 0; i < remainingStars; i++) {
    starsHtml += '<i class="far fa-star"></i>'; // Empty star
  }
  return starsHtml;
}

// Function to handle sharing
function shareTilerProfile(tilerName, tilerCity, whatsappLink) {
  const shareText = `Check out ${tilerName}, a verified tiler in ${tilerCity} from TILERSHUB! Contact them via ${whatsappLink}.`;
  const shareUrl = window.location.href;

  if (navigator.share) {
    navigator.share({
      title: `TILERSHUB: ${tilerName} in ${tilerCity}`,
      text: shareText,
      url: shareUrl
    }).then(() => console.log('Successful share'))
      .catch((error) => console.log('Error sharing', error));
  } else {
    alert('You can manually share this link: ' + shareUrl + '\n\n' + shareText);
    console.log('Web Share API not supported. Fallback activated.');
  }
}

// Load tilers from JSON and render
fetch('tilers.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const container = document.getElementById('tiler-list');

    // Sort featured first, then alphabetically
    data.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    data.forEach(tiler => {
      const id = tiler.id || tiler.name.toLowerCase().replace(/\s+/g, '-');
      let whatsapp = tiler.whatsapp ? tiler.whatsapp.trim() : '';
      if (whatsapp.startsWith('0')) whatsapp = whatsapp.substring(1);

      const tilerRating = (tiler.rating && typeof tiler.rating === 'number' && tiler.rating >= 0 && tiler.rating <= 5)
        ? tiler.rating
        : 4.5;
      const stars = getStarRating(tilerRating);
      const tilerImage = tiler.image || '/icons/default-tiler.png';
      const tilerName = tiler.name;
      const tilerCity = tiler.city;
      const facebookLink = tiler.facebook || '#';
      const isFeatured = tiler.featured;
      const whatsappLink = `https://wa.me/94${whatsapp}?text=${encodeURIComponent(`Hi ${tilerName}, I found you on TILERSHUB and would like to inquire about your tiling services.`)}`;

      // Create clickable card
      const card = document.createElement('a');
      card.className = 'tiler-card';
      card.href = `/tilers/tilers/${id}.html`;
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';

      card.innerHTML = `
        <div class="profile-section">
          <div class="profile-pic">
            <img src="${tilerImage}" alt="${tilerName}" loading="lazy" onerror="this.src='/icons/default-tiler.png'" />
          </div>
          <div class="rating">
            ${stars}
          </div>
        </div>

        <div class="details-section">
          ${isFeatured ? `
            <div class="certified-badge-image">
              <img src="/icons/TilersHUB_Certified_Badge.png" alt="TilersHUB Certified Badge">
            </div>` : ''}
          <h4>${tilerName}</h4>
          <p class="city">${tilerCity}</p>
          <div class="social-links">
            <a href="${facebookLink}" onclick="event.stopPropagation()" target="_blank" rel="noopener noreferrer" class="facebook-btn">
              <i class="fab fa-facebook"></i> Facebook
            </a>
            <a href="${whatsappLink}" onclick="event.stopPropagation()" target="_blank" rel="noopener noreferrer" class="whatsapp-btn">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
          </div>
        </div>

        <div class="share-icon" onclick="event.preventDefault(); event.stopPropagation(); shareTilerProfile('${tilerName}', '${tilerCity}', '${whatsappLink}')">
          <i class="fas fa-share-alt"></i>
        </div>
      `;
      container.appendChild(card);
    });
  })
  .catch(error => {
    console.error('Failed to load tilers data:', error);
    const container = document.getElementById('tiler-list');
    container.innerHTML = '<p style="text-align: center; color: #dc3545;">Failed to load tilers. Please ensure tilers.json is correctly formatted and accessible.</p>';
  });