const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const yearEl = document.getElementById("current-year");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const syncHeaderOnScroll = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};

window.addEventListener("scroll", syncHeaderOnScroll, { passive: true });
syncHeaderOnScroll();

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealEls = document.querySelectorAll(".reveal");

if (prefersReducedMotion) {
  revealEls.forEach((el) => el.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.13 }
  );

  revealEls.forEach((el) => observer.observe(el));
}

const faqButtons = document.querySelectorAll(".faq-question");

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

const planSelect = document.getElementById("plano");
const contactSection = document.getElementById("contato");

document.querySelectorAll(".js-select-plan").forEach((button) => {
  button.addEventListener("click", () => {
    const planName = button.dataset.plan;
    if (planSelect && planName) {
      planSelect.value = planName;
    }

    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const whatsappNumber = "5511999999999";
const directLink = document.getElementById("whatsapp-direct");
const floatingLink = document.getElementById("floating-whatsapp");
const leadForm = document.getElementById("lead-form");
const formStatus = document.getElementById("form-status");

const buildWhatsappUrl = (message) => {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

const defaultMessage = "Ola, vim pela landing page da SparkFilmes e quero receber detalhes da producao de videos.";

if (directLink) {
  directLink.href = buildWhatsappUrl(defaultMessage);
}

if (floatingLink) {
  floatingLink.href = buildWhatsappUrl(defaultMessage);
}

if (leadForm) {
  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!leadForm.checkValidity()) {
      leadForm.reportValidity();
      return;
    }

    const data = new FormData(leadForm);
    const nome = data.get("nome");
    const empresa = data.get("empresa");
    const objetivo = data.get("objetivo");
    const plano = data.get("plano");
    const mensagem = data.get("mensagem");

    const composedMessage = [
      "Ola, vim pela landing page da SparkFilmes.",
      "",
      `Nome: ${nome}`,
      `Empresa/profissao: ${empresa}`,
      `Objetivo: ${objetivo}`,
      `Plano de interesse: ${plano}`,
      `Contexto: ${mensagem}`
    ].join("\n");

    window.open(buildWhatsappUrl(composedMessage), "_blank", "noopener,noreferrer");

    if (formStatus) {
      formStatus.textContent = "Mensagem pronta aberta no WhatsApp.";
    }

    leadForm.reset();
  });
}
