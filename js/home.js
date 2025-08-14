/* Home page logic to populate Popular Projects + Testimonials */
(function(){
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  const elProjects = qs('#popular-projects');
  const elTestimonials = qs('#home-testimonials');

  const escapeHtml = (str) => String(str||"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
  const stars = (rating=0) => {
    const r = Math.round(Number(rating)||0);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  };

  // Build one project/tiler card (TaskRabbit-like horizontal)
  function projectCard(t){
    const id = encodeURIComponent(t.id);
    const name = escapeHtml(t.name);
    const city = escapeHtml(t.city || '');
    const img = t.image || '/icons/placeholder-tile.png';
    const rating = Number(t.rating || 0);
    const rc = Number(t.reviewCount || 0);

    return `
      <article class="project-card" role="article" aria-label="${name}">
        <img class="project-thumb" src="${img}" alt="${name} profile photo" loading="lazy" decoding="async">
        <div class="project-body">
          <div class="project-name">${name}</div>
          <div class="project-meta">${city ? `Verified · ${city}` : `Verified`}</div>
          <div>
            <span class="stars" aria-hidden="true">${stars(rating)}</span>
            <span class="revcount">(${rc})</span>
          </div>
          <div class="project-actions">
            <a class="btn btn-primary" href="/tilers/tiler.html?id=${id}" aria-label="Book ${name}">Book Now</a>
            <a class="btn" href="/tilers/tiler.html?id=${id}" aria-label="View ${name} profile">View Profile</a>
          </div>
        </div>
      </article>
    `;
  }

  async function loadProjects(){
    try{
      const res = await fetch('/tilers/tilers.json', { cache:'no-cache' });
      if(!res.ok) throw new Error('Failed to load /tilers/tilers.json');
      const data = await res.json();

      // Choose a mix resembling "Popular Projects": featured first, then top rated
      const featured = data.filter(t => !!t.featured);
      const topRated = data
        .slice()
        .sort((a,b) => (b.rating||0) - (a.rating||0) || (b.reviewCount||0) - (a.reviewCount||0));

      // Merge unique (avoid duplicates)
      const seen = new Set();
      const merged = [...featured, ...topRated].filter(t => {
        if(seen.has(t.id)) return false; seen.add(t.id); return true;
      }).slice(0, 6);

      elProjects.innerHTML = merged.map(projectCard).join('') ||
        `<div class="project-card"><div class="project-body"><p>No projects yet.</p></div></div>`;

      // Make card clickable (except buttons/links)
      qsa('.project-card').forEach(card => {
        const link = card.querySelector('.btn-primary');
        if(!link) return;
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          const tag = (e.target && e.target.tagName) || '';
          if(tag !== 'A' && tag !== 'BUTTON') location.href = link.href;
        });
      });

    }catch(err){
      console.error(err);
      elProjects.innerHTML = `<div class="project-card"><div class="project-body"><p style="color:#b91c1c">Could not load tilers. Check <code>/tilers/tilers.json</code>.</p></div></div>`;
    }
  }

  // OPTIONAL: pull a couple of approved reviews from Supabase for the testimonials row
  async function loadTestimonials(){
    try{
      if(!window.supabase) return; // supabase loaded by index.html; safe guard
      const supabase = window.supabase.createClient(
        "https://todzlrbaovbqdwxdlcxs.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZHpscmJhb3ZicWR3eGRsY3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzM1MjIsImV4cCI6MjA3MDc0OTUyMn0.zsE2fHxF8QUPpiOfYXKz4oe8wVccN76ewDd56u2F6FY"
      );
      const { data, error } = await supabase
        .from('reviews')
        .select('name, comment, quality, service, timeline, pricing, cleanliness, created_at')
        .eq('approved', true)
        .order('created_at', { ascending:false })
        .limit(2);
      if(error){ console.warn(error); return; }
      if(!data || !data.length){ return; }

      const starAvg = r => {
        const v = ((r.quality||0)+(r.service||0)+(r.timeline||0)+(r.pricing||0)+(r.cleanliness||0))/5;
        const rounded = Math.round(v);
        return '★'.repeat(rounded) + '☆'.repeat(5-rounded);
      };
      elTestimonials.innerHTML = data.map(r=>`
        <div class="testi">
          <div class="who">${escapeHtml(r.name || 'Customer')} <span class="stars" aria-hidden="true">${starAvg(r)}</span></div>
          ${r.comment ? `<p class="what">${escapeHtml(r.comment)}</p>` : ``}
        </div>
      `).join('');
    }catch(e){ console.warn(e); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    loadTestimonials();
  });
  document.addEventListener('includes:ready', () => {
    // No-op, but here if you later want to refetch after header/footer load
  });
})();