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
    // Add empty stars to make up to 5
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
        starsHtml += '<i class="far fa-star"></i>'; // Empty star outline
    }
    return starsHtml;
}

// Function to handle sharing
function shareTilerProfile(tilerName, tilerCity, whatsappLink) {
    const shareText = `Check out ${tilerName}, a verified tiler in ${tilerCity} from TILERSHUB! Contact them via ${whatsappLink}.`;
    const shareUrl = window.location.href; // Or a specific URL for the tiler's individual page if you have one

    if (navigator.share) {
        navigator.share({
            title: `TILERSHUB: ${tilerName} in ${tilerCity}`,
            text: shareText,
            url: shareUrl
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    } else {
        // Fallback for browsers that don't support Web Share API
        alert('You can manually share this link: ' + shareUrl + '\n\n' + shareText);
        console.log('Web Share API not supported. Fallback activated.');
    }
}

// Load tilers from JSON
fetch('tilers.json')
  .then(response => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const container = document.getElementById('tiler-list');

    // Sort featured first, then by name
    data.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    data.forEach(tiler => {
      let whatsapp = tiler.whatsapp ? tiler.whatsapp.trim() : '';
      if (whatsapp.startsWith('0')) whatsapp = whatsapp.substring(1);

      // Get rating, default to 4.5 if not provided or invalid
      // (As per your JSON, 'rating' is not present, so it will default to 4.5 stars)
      const tilerRating = (tiler.rating && typeof tiler.rating === 'number' && tiler.rating >= 0 && tiler.rating <= 5) ? tiler.rating : 4.5;
      const stars = getStarRating(tilerRating);

      const tilerImage = tiler.image || '/icons/default-tiler.png';
      const tilerName = tiler.name;
      const tilerCity = tiler.city;
      const facebookLink = tiler.facebook || '#';
      const isFeatured = tiler.featured;

      // Construct WhatsApp link
      const whatsappLink = `https://wa.me/94${whatsapp}?text=${encodeURIComponent(`Hi ${tilerName}, I found you on TILERSHUB and would like to inquire about your tiling services.`)}`;


      const card = document.createElement('div');
      card.className = 'tiler-card';

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
                    </div>
            ` : ''}
            <h4>${tilerName}</h4>
            <p class="city">${tilerCity}</p>
            <div class="social-links">
                <a href="${facebookLink}" target="_blank" rel="noopener noreferrer" class="facebook-btn">
                    <i class="fab fa-facebook"></i> Facebook
                </a>
                <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-btn">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
            </div>
        </div>

        <div class="share-icon" onclick="shareTilerProfile('${tilerName}', '${tilerCity}', '${whatsappLink}')">
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

