// Reveal-on-scroll for modern feel
(function(){
  const els = document.querySelectorAll('.hero, .banner-center, .stats-wrap > div, .project-tile, .testi, .promise, .how-it-works, .tags-cloud .tags a');
  els.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 });
  els.forEach(el => io.observe(el));
})();