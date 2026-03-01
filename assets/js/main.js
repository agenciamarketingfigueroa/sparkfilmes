const headerEl = document.querySelector(".site-header");
const navToggleEl = document.querySelector(".nav-toggle");
const navEl = document.querySelector(".site-nav");
const yearEls = document.querySelectorAll("[data-current-year]");
const bodyEl = document.body;

const basePath = (bodyEl?.dataset.basePath || ".").replace(/\/$/, "");
const whatsappNumber = (bodyEl?.dataset.whatsappNumber || "").trim();
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let revealObserver = null;
let youtubeApiPromise = null;
const youtubePlayers = new Map();

const resolvePath = (relativePath) => {
  const cleanRelative = String(relativePath || "").replace(/^\//, "");
  return `${basePath}/${cleanRelative}`;
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const buildWhatsAppUrl = (message = "") => {
  if (!whatsappNumber) return "#";
  const payload = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${whatsappNumber}${payload}`;
};

const updateYear = () => {
  const year = String(new Date().getFullYear());
  yearEls.forEach((el) => {
    el.textContent = year;
  });
};

const syncHeaderOnScroll = () => {
  if (!headerEl) return;
  headerEl.classList.toggle("is-scrolled", window.scrollY > 8);
};

const initNavigation = () => {
  syncHeaderOnScroll();
  window.addEventListener("scroll", syncHeaderOnScroll, { passive: true });

  if (!navToggleEl || !navEl) return;

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
};

const initReveal = () => {
  const revealElements = document.querySelectorAll("[data-reveal]");
  if (revealElements.length === 0) return;

  if (prefersReducedMotion) {
    revealElements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((el) => {
    if (el.classList.contains("is-visible")) return;
    revealObserver.observe(el);
  });
};

const refreshReveal = (scope = document) => {
  const revealElements = scope.querySelectorAll("[data-reveal]");
  if (revealElements.length === 0) return;

  if (prefersReducedMotion) {
    revealElements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  if (!revealObserver) return;

  revealElements.forEach((el) => {
    if (el.classList.contains("is-visible")) return;
    revealObserver.observe(el);
  });
};

const initWhatsAppLinks = () => {
  const links = document.querySelectorAll(".js-wa-link");
  links.forEach((link) => {
    const message = link.dataset.waMessage || "";
    link.href = buildWhatsAppUrl(message);

    if (whatsappNumber) return;
    link.setAttribute("aria-disabled", "true");
    link.title = "Configure data-whatsapp-number no body.";
  });
};

const initWhatsAppForm = () => {
  const form = document.querySelector("[data-wa-form]");
  if (!form) return;

  const feedbackEl = form.querySelector("[data-form-feedback]");
  const setFeedback = (text) => {
    if (feedbackEl) feedbackEl.textContent = text;
  };

  if (!whatsappNumber) {
    setFeedback("Configure data-whatsapp-number para habilitar o envio.");
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const now = new Date().toLocaleDateString("pt-BR");

    const lines = [
      "*Novo briefing SparkFilmes*",
      `Data: ${now}`,
      "",
      `Nome: ${data.get("nome") || "-"}`,
      `Empresa/Nicho: ${data.get("marca") || "-"}`,
      `Objetivo: ${data.get("objetivo") || "-"}`,
      `Serviço: ${data.get("servico") || "-"}`,
      `Prazo: ${data.get("prazo") || "-"}`,
      "",
      `Detalhes: ${data.get("detalhes") || "-"}`,
      "",
      "Quero receber proposta personalizada."
    ];

    const url = buildWhatsAppUrl(lines.join("\n"));
    window.open(url, "_blank", "noopener,noreferrer");
    setFeedback("Abrindo WhatsApp com seu briefing preenchido.");
  });
};

const extractYouTubeId = (input) => {
  const raw = String(input || "").trim();
  if (!raw) return "";

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch?.[1]) return watchMatch[1];

  const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch?.[1]) return shortMatch[1];

  const shortsMatch = raw.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch?.[1]) return shortsMatch[1];

  const embedMatch = raw.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch?.[1]) return embedMatch[1];

  return "";
};

const loadYouTubeApi = () => {
  if (window.YT && typeof window.YT.Player === "function") {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReadyHandler === "function") {
        previousReadyHandler();
      }
      resolve(window.YT);
    };

    const currentScript = document.getElementById("youtube-iframe-api");
    if (currentScript) return;

    const script = document.createElement("script");
    script.id = "youtube-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
};

const createPlayerCard = (item, index, type) => {
  const youtubeId = extractYouTubeId(item.id);
  const safeType = normalizeText(type).replace(/\s+/g, "-");
  const cardId = `${safeType}-${index + 1}`;
  const ratioClass = String(item.ratio || "").includes("9:16") ? "ratio-9x16" : "ratio-16x9";

  const card = document.createElement("article");
  card.className = "video-card";
  card.setAttribute("data-reveal", "");

  const stage = document.createElement("div");
  stage.className = `video-stage ${ratioClass}`;

  const playerRoot = document.createElement("div");
  playerRoot.className = "yt-player";
  playerRoot.dataset.playerId = cardId;

  if (youtubeId) {
    playerRoot.dataset.youtubeId = youtubeId;
  } else {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "ID do YouTube inválido. Atualize em data/portfolio.json.";
    stage.appendChild(empty);
  }

  if (youtubeId) {
    stage.appendChild(playerRoot);
  }

  const controls = document.createElement("div");
  controls.className = "player-controls";

  const actions = [
    { label: "Play", action: "play" },
    { label: "Pause", action: "pause" },
    { label: "Stop", action: "stop" }
  ];

  actions.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "control-btn";
    button.textContent = entry.label;
    button.dataset.playerAction = entry.action;
    button.dataset.playerTarget = cardId;
    controls.appendChild(button);
  });

  const meta = document.createElement("div");
  meta.className = "video-meta";

  const title = document.createElement("h3");
  title.textContent = item.titulo || "Video SparkFilmes";

  const description = document.createElement("p");
  description.textContent = item.descricao || "Conteudo em destaque.";

  const tag = document.createElement("span");
  tag.className = "video-tag";
  tag.textContent = item.categoria || type;

  meta.append(title, description, tag);
  card.append(stage, controls, meta);
  return card;
};

const initYoutubePlayers = async () => {
  const playerContainers = document.querySelectorAll(".yt-player[data-youtube-id]");
  if (playerContainers.length === 0) return;

  try {
    await loadYouTubeApi();
  } catch (error) {
    console.error(error);
    return;
  }

  playerContainers.forEach((container, index) => {
    const youtubeId = container.dataset.youtubeId;
    const playerId = container.dataset.playerId || `yt-player-${index + 1}`;
    const domId = `yt-root-${playerId}`;

    if (!youtubeId || youtubePlayers.has(playerId)) return;

    container.id = domId;

    const player = new window.YT.Player(domId, {
      videoId: youtubeId,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        fs: 0,
        modestbranding: 1,
        disablekb: 1,
        iv_load_policy: 3,
        playsinline: 1,
        origin: window.location.origin
      }
    });

    youtubePlayers.set(playerId, player);
  });
};

const initPlayerControls = () => {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-player-action]");
    if (!button) return;

    const action = button.dataset.playerAction;
    const target = button.dataset.playerTarget;
    if (!action || !target) return;

    const player = youtubePlayers.get(target);
    if (!player) return;

    if (action === "play") {
      youtubePlayers.forEach((instance, key) => {
        if (key === target) return;
        if (typeof instance.pauseVideo === "function") instance.pauseVideo();
      });
      player.playVideo();
      return;
    }

    if (action === "pause") {
      player.pauseVideo();
      return;
    }

    if (action === "stop") {
      player.stopVideo();
    }
  });
};

const renderPortfolioFeeds = async () => {
  const targets = document.querySelectorAll("[data-portfolio-target]");
  if (targets.length === 0) return;

  try {
    const response = await fetch(resolvePath("data/portfolio.json"), { cache: "no-store" });
    if (!response.ok) throw new Error("Falha ao carregar portfólio.");

    const portfolioData = await response.json();

    targets.forEach((target) => {
      const type = target.dataset.portfolioType || "reels";
      const limit = Number(target.dataset.portfolioLimit || 0);
      const source = Array.isArray(portfolioData[type]) ? portfolioData[type] : [];
      const items = limit > 0 ? source.slice(0, limit) : source;

      target.innerHTML = "";

      if (items.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
      empty.textContent = "Nenhum vídeo cadastrado ainda.";
        target.appendChild(empty);
        return;
      }

      items.forEach((item, index) => {
        target.appendChild(createPlayerCard(item, index, type));
      });

      refreshReveal(target);
    });

    await initYoutubePlayers();
  } catch (error) {
    console.error(error);
    targets.forEach((target) => {
      target.innerHTML = '<p class="empty-state">Não foi possível carregar o portfólio. Verifique data/portfolio.json.</p>';
    });
  }
};

const initMaterialSearch = async () => {
  const searchRoot = document.querySelector("[data-material-search]");
  if (!searchRoot) return;

  const form = searchRoot.querySelector("[data-material-search-form]");
  const feedback = searchRoot.querySelector("[data-material-feedback]");
  const list = searchRoot.querySelector("[data-material-client-list]");
  const input = form?.querySelector("input[name='cliente']");
  const passwordWrap = form?.querySelector("[data-material-password-wrap]");
  const passwordInput = form?.querySelector("input[name='senha']");

  const setFeedback = (text) => {
    if (!feedback) return;
    feedback.textContent = text;
  };

  if (!form || !input) return;

  if (list) {
    list.innerHTML = "";
    list.hidden = true;
  }

  let pendingProtectedSlug = "";
  const getAccessKey = (slug) => `client-access:${slug}`;

  const resetPasswordPrompt = () => {
    pendingProtectedSlug = "";

    if (!passwordWrap || !passwordInput) return;
    passwordWrap.hidden = true;
    passwordInput.value = "";
  };

  input.addEventListener("input", () => {
    if (!pendingProtectedSlug) return;
    resetPasswordPrompt();
    setFeedback("");
  });

  const indexPath = searchRoot.dataset.materialIndexPath || resolvePath("data/clientes/index.json");
  let clients = [];

  try {
    const response = await fetch(indexPath, { cache: "no-store" });
    if (!response.ok) throw new Error("Falha ao carregar indice de clientes.");

    const data = await response.json();
    clients = Array.isArray(data.clientes) ? data.clientes : [];
  } catch (error) {
    console.error(error);
    setFeedback("Não foi possível carregar a lista de clientes.");
  }

  refreshReveal(searchRoot);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = normalizeText(input.value);

    if (query.length < 2) {
      setFeedback("Digite ao menos 2 letras para buscar.");
      return;
    }

    const matches = clients.filter((client) => {
      const name = normalizeText(client.nome);
      const slug = normalizeText(client.slug);
      const segment = normalizeText(client.segmento || client.nicho);
      return name.includes(query) || slug.includes(query) || segment.includes(query);
    });

    const exactMatch = clients.find((client) => {
      const name = normalizeText(client.nome);
      const slug = normalizeText(client.slug);
      return name === query || slug === query;
    });

    const selectedClient = exactMatch || matches[0];

    if (selectedClient) {
      const protectedPassword = String(selectedClient.senha || "").trim();

      if (protectedPassword) {
        if (passwordWrap && passwordInput) {
          passwordWrap.hidden = false;
        }

        if (pendingProtectedSlug && pendingProtectedSlug !== selectedClient.slug && passwordInput) {
          passwordInput.value = "";
        }

        pendingProtectedSlug = selectedClient.slug || "";

        if (!passwordInput || passwordInput.value !== protectedPassword) {
          setFeedback("Digite a senha do cliente para acessar o material.");

          if (passwordInput) {
            if (passwordInput.value) {
              setFeedback("Senha incorreta. Verifique e tente novamente.");
              passwordInput.select();
            } else {
              passwordInput.focus();
            }
          }
          return;
        }

        try {
          sessionStorage.setItem(getAccessKey(selectedClient.slug || ""), "ok");
        } catch (error) {
          console.error(error);
        }
      } else {
        resetPasswordPrompt();
      }

      const targetUrl =
        selectedClient.url || `./material.html?cliente=${encodeURIComponent(selectedClient.slug || "")}`;
      window.location.href = targetUrl;
      return;
    }

    resetPasswordPrompt();
    setFeedback("Nenhum resultado encontrado. Fale com o suporte para liberar acesso.");
  });
};

const init = async () => {
  updateYear();
  initNavigation();
  initReveal();
  initWhatsAppLinks();
  initWhatsAppForm();
  initPlayerControls();
  await renderPortfolioFeeds();
  await initMaterialSearch();
};

init();


