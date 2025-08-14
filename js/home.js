/* ========= Inline SVG icons ========= */
const SVG = {
  pin:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-4.438 7-10a7 7 0 10-14 0c0 5.562 7 10 7 10z" stroke="currentColor" stroke-width="2"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.73L5.82 21z"/></svg>'
};

/* ========= Helpers ========= */
function starsHTML(rating=0){
  const full=Math.floor(rating), half=rating-full>=0.5?1:0, empty=5-full-half;
  const seg=(n,cls)=>Array.from({length:n}).map(()=>`<span class="${cls}" aria-hidden="true">${SVG.star}</span>`).join('');
  return `<span class="stars" aria-label="${rating} out of 5">
    ${seg(full,'star-full')}${seg(half,'star-half')}${seg(empty,'star-empty')}
  </span>`;
}
const tag = (t) => `<span class="tiler-tag">${t}</span>`;

/* ========= Horizontal card (Book Now only) ========= */
function tilerCardHTML(t){
  const rating = Number(t.rating || 0);
  const reviewCount = Number(t.reviewCount || 0);
  // Limit chips to 3 (2 on narrow screens)
  const isNarrow = window.matchMedia('(max-width:520px)').matches;
  const highlights = Array.isArray(t.highlights) ? t.highlights.slice(0, isNarrow ? 2 : 3) : [];
  const profileUrl = `/tilers/tiler.html?id=${encodeURIComponent(t.id)}`;

  return `
    <article class="tiler-card" role="article" aria-label="${t.name}">
      <!-- whole-card link (except button) -->
      <a class="stretched-link" href="${profileUrl}" aria-hidden="true" tabindex="-1"></a>

      <div class="tiler-avatar-wrap">
        ${t.featured ? `<span class="tiler-pill">Certified</span>` : ``}
        <img class="tiler-avatar"
             src="${t.image}"
             alt="${t.name}"
             loading="lazy"
             decoding="async"
             sizes="(max-width:520px) 64px, 72px" />
      </div>

      <div class="tiler-body">
        <h3 class="tiler-name">
          <a href="${profileUrl}" style="color:inherit;text-decoration:none;position:relative;z-index:2">${t.name}</a>
        </h3>

        <div class="tiler-meta">
          ${t.city ? `<span class="tiler-city">${SVG.pin}<span>${t.city}</span></span>` : ``}
          <span class="tiler-rating">
            ${starsHTML(rating)} <span>${rating ? rating.toFixed(1) : 'New'}</span>
            ${reviewCount ? `<span class="reviews-count">(${reviewCount})</span>` : ``}
          </span>
        </div>

        ${highlights.length ? `<div class="tiler-tags">${highlights.map(tag).join('')}</div>` : ``}
      </div>

      <!-- Single CTA -->
      <a class="book-btn" href="${profileUrl}&book=1" aria-label="Book ${t.name} now">Book Now</a>
    </article>
  `;
}

/* ========= CTA tile used inside grids ========= */
const estimatorCTAHTML = () => `
  <div class="tiler-card tiler-cta" tabindex="0" role="link" aria-label="Open Tiling Cost Estimator"
       onclick="window.location.href='/estimator/estimator.html'"
       onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.href='/estimator/estimator.html'}">
    <div>
      <div style="font-size:32px;line-height:1">🧮</div>
      <h3>Calculate Your Cost</h3>
      <p>Tiles • Adhesive • Labor • Skirting</p>
      <a href="/estimator/estimator.html">Open Estimator</a>
    </div>
  </div>
`;

/* ========= Lightweight skeletons ========= */
function skeletonCardHTML(){
  return `
    <article class="tiler-card" aria-hidden="true">
      <div class="tiler-avatar-wrap">
        <div style="width:72px;height:72px;border-radius:50%;background:#e5e7eb;"></div>
      </div>
      <div class="tiler-body">
        <div style="height:16px;width:60%;background:#e5e7eb;border-radius:6px;margin:6px 0 8px;"></div>
        <div style="height:12px;width:40%;background:#e5e7eb;border-radius:6px;margin:0 0 10px;"></div>
        <div style="display:flex;gap:6px;">
          <div class="sk-chip"></div><div class="sk-chip" style="width:60px"></div>
        </div>
      </div>
      <div class="book-btn" style="background:#e5e7eb;color:transparent">Book Now</div>
    </article>`;
}
function injectSkeletons(id,count=4){
  const el=document.getElementById(id); if(!el) return;
  el.innerHTML = Array.from({length:count}).map(skeletonCardHTML).join('');
}

/* ========= Fetch once, render Featured + Top Rated ========= */
injectSkeletons('featured-tilers',4);
injectSkeletons('top-rated-tilers',6);

fetch('/tilers/tilers.json')
  .then(r=>r.json())
  .then(list=>{
    const tilers=(Array.isArray(list)?list:[]).map(t=>({
      ...t,
      rating:Number(t.rating||0),
      reviewCount:Number(t.reviewCount||0),
      featured:Boolean(t.featured)
    }));

    // FEATURED: featured=true, sort by rating desc then reviews
    const featured = tilers
      .filter(t=>t.featured)
      .sort((a,b)=>(b.rating-a.rating)||(b.reviewCount-a.reviewCount))
      .slice(0,6);

    // TOP-RATED: >=4.5 stars, >=3 reviews, exclude featured
    const featuredIds=new Set(featured.map(t=>t.id));
    let topRated = tilers
      .filter(t=>t.rating>=4.5 && t.reviewCount>=3 && !featuredIds.has(t.id))
      .sort((a,b)=>{
        if(b.rating!==a.rating) return b.rating-a.rating;
        if(b.reviewCount!==a.reviewCount) return b.reviewCount-a.reviewCount;
        return String(a.name||'').localeCompare(String(b.name||''));
      })
      .slice(0,9);

    // Insert Estimator CTA after 3rd item
    if(topRated.length>=3){
      topRated = [...topRated.slice(0,3), '__CTA__', ...topRated.slice(3)];
    }

    const mount=(id,items)=>{
      const el=document.getElementById(id); if(!el) return;
      if(!items || !items.length){
        el.innerHTML = `<p style="margin:8px 0;color:#64748b">No tilers to show yet.</p>`;
        return;
      }
      el.innerHTML = items.map(i => i==='__CTA__' ? estimatorCTAHTML() : tilerCardHTML(i)).join('');
    };

    mount('featured-tilers', featured);
    mount('top-rated-tilers', topRated);
  })
  .catch(err=>{
    console.error('Failed to load tilers.json', err);
    const msg=`<p style="color:#b91c1c">Couldn’t load tilers right now. Please refresh.</p>`;
    const f=document.getElementById('featured-tilers'); if(f) f.innerHTML=msg;
    const t=document.getElementById('top-rated-tilers'); if(t) t.innerHTML=msg;
  });