// Portfolio — theme toggle, mobile menu, project filter, active nav link.
// Plain DOM, no dependencies; every block is optional so a missing element is a no-op.
(function () {
  "use strict";

  const root = document.documentElement;

  // ---- Theme: OS preference by default, the button pins the opposite choice.
  const themeButton = document.querySelector("[data-theme-toggle]");
  if (themeButton) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const currentTheme = () => root.dataset.theme || (prefersDark.matches ? "dark" : "light");
    themeButton.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        // Private mode / blocked storage: the choice just won't survive a reload.
      }
    });
  }

  // ---- Mobile navigation.
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.getElementById("site-nav");
  if (navToggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    };
    navToggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  // ---- Project filter by category.
  const filters = document.querySelector("[data-filters]");
  const projects = document.querySelectorAll("[data-projects] [data-category]");
  if (filters && projects.length) {
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      const value = button.dataset.filter;
      filters.querySelectorAll("[data-filter]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      projects.forEach((card) => {
        card.hidden = value !== "*" && card.dataset.category !== value;
      });
    });
  }

  // ---- Highlight the nav link of the section in view.
  if (nav && "IntersectionObserver" in window) {
    const links = new Map();
    nav.querySelectorAll('a[href*="#"]').forEach((link) => {
      const id = link.hash.slice(1);
      const section = id && document.getElementById(id);
      if (section) links.set(section, link);
    });
    if (links.size) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((link) => link.classList.remove("is-active"));
            links.get(entry.target).classList.add("is-active");
          });
        },
        { rootMargin: "-45% 0px -50% 0px" },
      );
      links.forEach((link, section) => observer.observe(section));
    }
  }
})();