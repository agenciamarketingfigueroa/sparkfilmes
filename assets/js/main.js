const headerEl = document.querySelector(".site-header");
const navToggleEl = document.querySelector(".nav-toggle");
const navEl = document.querySelector(".site-nav");
const yearEls = document.querySelectorAll("[data-current-year]");

yearEls.forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

const syncHeaderOnScroll = () => {
  if (!headerEl) return;
  headerEl.classList.toggle("is-scrolled", window.scrollY > 8);
};

syncHeaderOnScroll();
window.addEventListener("scroll", syncHeaderOnScroll, { passive: true });

if (navToggleEl && navEl) {
  navToggleEl.addEventListener("click", () => {
    const isOpen = navEl.classList.toggle("is-open");
    navToggleEl.setAttribute("aria-expanded", String(isOpen));
  });

  navEl.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navEl.classList.remove("is-open");
      navToggleEl.setAttribute("aria-expanded", "false");
    });
  });
}

const faqButtons = document.querySelectorAll(".js-faq-button");

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    if (!item) return;

    const isOpen = item.classList.contains("is-open");

    faqButtons.forEach((otherButton) => {
      const otherItem = otherButton.closest(".faq-item");
      if (!otherItem) return;
      otherItem.classList.remove("is-open");
      otherButton.setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

const revealElements = document.querySelectorAll(".js-reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  revealElements.forEach((el) => el.classList.add("is-visible"));
} else if (revealElements.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
}
