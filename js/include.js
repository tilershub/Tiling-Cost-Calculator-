// /js/include.js

function loadIncludes() {
  const loadComponent = (id, file) => {
    fetch(file)
      .then(res => res.text())
      .then(data => {
        document.getElementById(id).innerHTML = data;
        if (id === "header") handleActiveNav(); // Activate correct nav item
      })
      .catch(err => console.error(`Error loading ${file}:`, err));
  };

  function handleActiveNav() {
    const currentPath = window.location.pathname.replace(/\/$/, '');
    document.querySelectorAll('#nav-menu a').forEach(link => {
      const href = link.getAttribute('href').replace(/\/$/, '');
      if (href === currentPath) {
        link.classList.add('active');
      }
    });
  }

  loadComponent("header", "/partials/header.html");
  loadComponent("footer", "/partials/footer.html");
}

function toggleNav() {
  document.getElementById("nav-menu").classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", loadIncludes);