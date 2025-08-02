function loadIncludes() {
  const loadComponent = (id, file) => {
    fetch(file)
      .then(res => res.text())
      .then(html => {
        document.getElementById(id).innerHTML = html;

        if (id === "header") {
          activateNav();      // Highlight current nav
          bindNavToggle();    // Bind hamburger after DOM is ready
        }
      })
      .catch(err => console.error(`Error loading ${file}`, err));
  };

  function activateNav() {
    const currentPath = window.location.pathname.replace(/\/$/, '');
    const navLinks = document.querySelectorAll('#nav-menu a');

    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace(/\/$/, '');
      if (href === currentPath) {
        link.classList.add('active');
      }
    });
  }

  function bindNavToggle() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.getElementById("nav-menu");

    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        menu.classList.toggle("active");
      });
    }
  }

  loadComponent("header", "/partials/header.html");
  loadComponent("footer", "/partials/footer.html");
}

document.addEventListener("DOMContentLoaded", loadIncludes);