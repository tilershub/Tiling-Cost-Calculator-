/* Home page logic — Flutter/Material feel */
(function () {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  const elProjects = qs('#popular-projects');
  const elTestimonials = qs('#home-testimonials');

  const PLACEHOLDER_IMG = '/icons/placeholder-tile.png';

  const escapeHtml = (str) =>
    String(str || '').replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));

  const stars = (rating = 0) => {
    const r = Math.round(Number(rating) || 0);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  };

  /* ---------- Skeletons (shimmer while fetching) ---------- */
  function skeletonCard() {
    return `
      <article class="card m-card m-elev-1 ripple project-skel" aria-hidden="true">
        <div class="skel skel-thumb"></div>
        <div class="skel skel-line w-60"></div>
        <div class="skel skel-line w-40"></div>
        <div class="skel skel-line w-80"></div>
      </article>
    `;
  }
  function showProjectSkeletons(n = 6) {
    elProjects.innerHTML = `<div class="cards-grid">${Array.from({ length: n }).map(skeletonCard).join('')}</div>`;
  }
  function showTestimonialSkeletons(n = 2) {
    elTestimonials.innerHTML = Array.from({ length: n })
      .map(
        () => `
      <div class="card m-card m-elev-1 testi ripple" aria-hidden="true">
        <div class="skel skel-line w-50" style="margin:12px;"></div>
        <div class="skel skel-line w-90" style="margin:0 12px 12px;"></div>
      </div>`
      )
      .join('');
  }

  /* ---------- Project (tiler) card — horizontal ListTile style ---------- */
  function projectCard(t) {
    const id = encodeURIComponent(t.id);
    const name = escapeHtml(t.name);
    const city = escapeHtml(t.city || '');
    const img = t.image || PLACEHOLDER_IMG;
    const rating = Number(t.rating || 0);
    const rc = Number(t.reviewCount || 0);
    const jobs = Number(t.completedJobs || t.jobs || 0);
    const featured = !!t.featured;

    return `
      <article class="card m-card m-elev-1 project-tile ripple" role="article" aria-label="${name}">
        <a class="thumb-wrap" href="/tilers/tiler.html?id=${id}" aria-label="${name} cover">
          <img class="thumb" src="${img}" alt="${name} project image" loading="lazy" decoding="async"
               onerror="this.src='${PLACEHOLDER_IMG}'">
          ${featured ? `<span class="chip chip--primary featured">Featured</span>` : ``}
        </a>

        <div class="tile-body">
          <a class="tile-title" href="/tilers/tiler.html?id=${id}">${name}</a>
          <div class="tile-meta">${city ? `Verified • ${city}` : `Verified`}</div>
          <div class="tile-rating">
            <span class="stars" aria-hidden="true">${stars(rating)}</span>
            <span class="rating-num" aria-label="Rating ${rating} out of 5">(${rating.toFixed(1)})</span>
            <span class="revcount">· ${rc} reviews</span>
            ${jobs ? `<span class="jobs">· ${jobs} jobs</span>` : ``}
          </div>

          <div class="tile-actions">
            <a class="btn btn--filled ripple" href="/tilers/tiler.html?id=${id}" aria-label="Book ${name}">Book Now</a>
            <a class="btn btn--tonal ripple" href="/tilers/tiler.html?id=${id}" aria-label="View ${name} profile">View Profile</a>
          </div>
        </div>
      </article>
    `;
  }

  /* ---------- Load Popular Projects ---------- */
  async function loadProjects() {
    showProjectSkeletons(6);
    try {
      const res = await fetch('/tilers/tilers.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Failed to load /tilers/tilers.json');
      const data = await res.json();

      const featured = data.filter((t) => !!t.featured);
      const topRated = data
        .slice()
        .sort(
          (a, b) =>
            (b.rating || 0) - (a.rating || 0) ||
            (b.reviewCount || 0) - (a.reviewCount || 0) ||
            (b.completedJobs || 0) - (a.completedJobs || 0)
        );

      const seen = new Set();
      const merged = [...featured, ...topRated].filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      const pick = merged.slice(0, 6);
      elProjects.innerHTML =
        pick.length > 0
          ? `<div class="cards-grid">${pick.map(projectCard).join('')}</div>`
          : `<div class="card m-card m-elev-1" style="padding:12px;">No projects yet.</div>`;

      // Make whole card clickable (except buttons/links)
      qsa('.project-tile').forEach((card) => {
        const link = card.querySelector('.tile-title');
        if (!link) return;
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          const tag = (e.target && e.target.tagName) || '';
          if (tag !== 'A' && tag !== 'BUTTON') location.href = link.href;
        });
      });
    } catch (err) {
      console.error(err);
      elProjects.innerHTML = `<div class="card m-card m-elev-1" style="padding:12px;color:#b91c1c">
        Could not load tilers. Check <code>/tilers/tilers.json</code>.
      </div>`;
    }
  }

  /* ---------- Load Testimonials (Supabase) ---------- */
  async function loadTestimonials() {
    showTestimonialSkeletons(2);
    try {
      if (!window.supabase) {
        elTestimonials.innerHTML = '';
        return;
      }

      // Prefer meta tags or globals if you add them; fallback to your values
      const m = (name) => (qs(`meta[name="${name}"]`) || {}).content;
      const SB_URL = window.SUPABASE_URL || m('supabase-url') || "https://todzlrbaovbqdwxdlcxs.supabase.co";
      const SB_KEY =
        window.SUPABASE_ANON_KEY ||
        m('supabase-anon-key') ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZHpscmJhb3ZicWR3eGRsY3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzM1MjIsImV4cCI6MjA3MDc0OTUyMn0.zsE2fHxF8QUPpiOfYXKz4oe8wVccN76ewDd56u2F6FY";

      const supabase = window.supabase.createClient(SB_URL, SB_KEY);

      const { data, error } = await supabase
        .from('reviews')
        .select('name, comment, quality, service, timeline, pricing, cleanliness, created_at')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) {
        console.warn(error);
        elTestimonials.innerHTML = '';
        return;
      }
      if (!data || !data.length) {
        elTestimonials.innerHTML = '';
        return;
      }

      const starAvg = (r) => {
        const v = ((r.quality || 0) + (r.service || 0) + (r.timeline || 0) + (r.pricing || 0) + (r.cleanliness || 0)) / 5;
        const rounded = Math.round(v);
        return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
      };

      elTestimonials.innerHTML = data
        .map(
          (r) => `
        <div class="card m-card m-elev-1 testi ripple">
          <div class="testi-body">
            <div class="who">
              ${escapeHtml(r.name || 'Customer')}
              <span class="stars" aria-hidden="true">${starAvg(r)}</span>
            </div>
            ${r.comment ? `<p class="what">${escapeHtml(r.comment)}</p>` : ``}
          </div>
        </div>`
        )
        .join('');
    } catch (e) {
      console.warn(e);
      elTestimonials.innerHTML = '';
    }
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    loadTestimonials();
  });

  // Optional hook after header/footer injection
  document.addEventListener('includes:ready', () => {});

  // Lightweight ripple helper for iOS Safari (matches CSS .ripple)
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.ripple');
    if (!el) return;
    el.classList.add('is-pressed');
    setTimeout(() => el.classList.remove('is-pressed'), 240);
  });
})();

/* ---------- Tiny CSS-in-JS additions (only if not already in your CSS) ---------- */
/* You can move these into /css/home.css; included here for convenience */
const __style = document.createElement('style');
__style.innerHTML = `
/* Horizontal ListTile look */
.project-tile{ display:grid; grid-template-columns: 120px 1fr; gap:12px; padding:12px; }
@media (min-width:560px){ .project-tile{ grid-template-columns: 160px 1fr; } }
.thumb-wrap{ position:relative; display:block; border-radius:12px; overflow:hidden; }
.thumb{ width:100%; height:100%; aspect-ratio:16/10; object-fit:cover; display:block; }
.featured{ position:absolute; left:8px; top:8px; }

.tile-body{ display:flex; flex-direction:column; gap:6px; }
.tile-title{ font-weight:700; font-size:16px; color:inherit; text-decoration:none; }
.tile-meta{ font-size:13px; opacity:.8; }
.tile-rating{ font-size:13px; display:flex; flex-wrap:wrap; gap:6px; align-items:center; opacity:.95; }
.tile-actions{ display:flex; gap:8px; margin-top:6px; }

/* Testimonials */
.testi .testi-body{ padding:12px; }
.testi .who{ font-weight:600; margin-bottom:6px; display:flex; gap:8px; align-items:center; }

/* Skeletons (shimmer) */
.skel{ position:relative; overflow:hidden; background: #e7ecf3; border-radius:10px; height:14px; }
.skel::after{ content:""; position:absolute; inset:0; translate:-100% 0;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent);
  animation: shimmer 1.1s infinite; }
.skel-thumb{ height:100px; border-radius:12px; }
.skel-line{ margin:10px 12px; }
.w-40{ width:40%; } .w-50{ width:50%; } .w-60{ width:60%; } .w-80{ width:80%; } .w-90{ width:90%; }
@keyframes shimmer{ to{ translate:100% 0; } }
`;
document.head.appendChild(__style);