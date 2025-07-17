self.addEventListener('install', e => {
  e.waitUntil(caches.open('tilershub').then(cache => cache.addAll([
    '/index.html',
    '/assets/style.css',
    '/assets/script.js'
  ])));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
})
