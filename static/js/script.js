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

  // ---- Smooth scroll for in-page links (header tabs, buttons).
  // Done in JS so it also works when the OS "reduce motion" setting turns the
  // CSS scroll-behavior off; it is a short, user-triggered movement.
  const headerOffset = () => {
    const header = document.querySelector(".site-header");
    return (header ? header.offsetHeight : 0) + 12;
  };
  const animateScroll = (targetY) => {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;
    const duration = Math.min(900, Math.max(400, Math.abs(distance) * 0.5));
    const startTime = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const cancel = () => { cancelled = true; };
    let cancelled = false;
    window.addEventListener("wheel", cancel, { once: true, passive: true });
    window.addEventListener("touchstart", cancel, { once: true, passive: true });
    const step = (now) => {
      if (cancelled) return;
      const t = Math.min(1, (now - startTime) / duration);
      window.scrollTo({ top: startY + distance * ease(t), behavior: "instant" });
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Only links that point at a section of THIS page ("#about" or "index.html#about").
    const normalize = (path) => path.replace(/index\.html$/, "");
    if (link.origin !== location.origin || normalize(link.pathname) !== normalize(location.pathname)) return;
    if (!link.hash) return;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id ? document.getElementById(id) : document.body;
    if (!target) return;
    event.preventDefault();
    const y = id ? target.getBoundingClientRect().top + window.pageYOffset - headerOffset() : 0;
    animateScroll(Math.max(0, y));
    if (id && history.pushState) history.pushState(null, "", "#" + id);
  });

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
  // ---- Back-to-top button with a scroll-progress ring.
  // It fades in gradually between FADE_START and FADE_END pixels of scroll, and
  // the visual state eases toward that target every frame, so even a fast flick
  // never makes it pop in.
  const toTop = document.querySelector("[data-to-top]");
  if (toTop) {
    const ring = toTop.querySelector(".to-top__progress");
    const circumference = 2 * Math.PI * 22;
    const FADE_START = 200;
    const FADE_END = 500;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let target = 0;
    let current = 0;
    let frame = 0;
    let ticking = false;

    const render = () => {
      toTop.style.opacity = current.toFixed(3);
      toTop.style.transform = "translateY(" + ((1 - current) * 16).toFixed(2) + "px) scale(" + (0.7 + 0.3 * current).toFixed(3) + ")";
      toTop.classList.toggle("is-visible", current > 0.02);
    };
    const tick = () => {
      frame = 0;
      const diff = target - current;
      if (reduceMotion.matches || Math.abs(diff) < 0.002) {
        current = target;
      } else {
        current += diff * 0.12;
        frame = requestAnimationFrame(tick);
      }
      render();
    };
    const update = () => {
      ticking = false;
      const y = window.pageYOffset;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (ring) ring.style.strokeDashoffset = String(circumference * (1 - progress));
      const p = Math.min(1, Math.max(0, (y - FADE_START) / (FADE_END - FADE_START)));
      target = p * p * (3 - 2 * p); // smoothstep
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    toTop.addEventListener("click", () => {
      animateScroll(0);
      toTop.blur();
    });
    update();
  }
})();