function loadIncludes() {
  const loadComponent = (id, file) => {
    fetch(file)
      .then(res => res.text())
      .then(html => {
        document.getElementById(id).innerHTML = html;

        if (id === "header") {
          initHeaderNav();
        }
      })
      .catch(err => console.error(`Error loading ${file}`, err));
  };

  function initHeaderNav() {
    const header = document.getElementById("header");
    if (!header) return;

    const menu = header.querySelector(".nav-menu");
    const toggle = header.querySelector(".menu-toggle"); // <-- changed from .nav-toggle

    // Mobile menu toggle
    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        const open = menu.classList.toggle("active");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");

        // Swap Material symbol icon (menu <-> close)
        const icon = toggle.querySelector(".material-symbols-rounded");
        if (icon) {
          icon.textContent = open ? "close" : "menu";
        }
      });
    }

    // Highlight active nav link by path prefix
    const currentPath = window.location.pathname.replace(/\/$/, "");
    header.querySelectorAll(".nav-menu a").forEach(link => {
      const basePath = (link.dataset.path || link.getAttribute("href")).replace(/\/$/, "");
      if (currentPath.startsWith(basePath) && basePath !== "") {
        link.classList.add("active");
      }
    });

    // Basic ripple effect for .ripple elements in header/footer
    document.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".ripple");
      if (!el) return;
      el.classList.add("is-pressed");
      setTimeout(() => el.classList.remove("is-pressed"), 240);
    });
  }

  loadComponent("header", "/partials/header.html");
  loadComponent("footer", "/partials/footer.html");
}

document.addEventListener("DOMContentLoaded", loadIncludes);