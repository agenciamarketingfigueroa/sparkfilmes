(() => {
  const grid = document.querySelector("#film-grid");
  if (!grid) return;

  const filters = [...document.querySelectorAll("[data-film-filter]")];
  const status = document.querySelector("[data-film-status]");
  const more = document.querySelector("[data-film-more]");
  const error = document.querySelector("[data-film-error]");
  const retry = document.querySelector("[data-film-retry]");
  const dialog = document.querySelector(".film-dialog");
  const screen = dialog.querySelector("[data-film-screen]");
  let projects = [];
  let activeFilter = "all";
  let visibleCount = 6;
  let opener = null;
  let loading = false;

  // Accept only the two providers already used by the site's portfolio.
  const getSource = (value) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") return null;
      let id = "";
      if (url.hostname === "youtu.be") id = url.pathname.slice(1);
      if (["youtube.com", "www.youtube.com"].includes(url.hostname)) {
        id = url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1] || "";
      }
      if (/^[\w-]{11}$/.test(id)) return { provider: "youtube", id, original: `https://www.youtube.com/watch?v=${id}`, embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1` };
      const driveId = url.hostname === "drive.google.com" && url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1];
      if (driveId) return { provider: "drive", id: driveId, original: `https://drive.google.com/file/d/${driveId}/view`, embed: `https://drive.google.com/file/d/${driveId}/preview` };
    } catch { /* The original link is never injected into player markup. */ }
    return null;
  };

  const selectedProjects = () => projects.filter((project) => activeFilter === "all" || project.type === activeFilter);

  const closeFilm = () => {
    screen.replaceChildren();
    document.body.classList.remove("film-is-open");
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  };

  const openFilm = (project, trigger) => {
    if (!project.source) return;
    // Keep a usable original link in older browsers without native dialogs.
    if (typeof dialog.showModal !== "function") {
      window.open(project.source.original, "_blank", "noopener,noreferrer");
      return;
    }
    opener = trigger;
    dialog.querySelector("#film-dialog-title").textContent = project.titulo;
    dialog.querySelector("#film-dialog-description").textContent = project.descricao || "";
    dialog.querySelector("[data-film-dialog-category]").textContent = `${project.categoria} / ${project.ratio}`;
    dialog.querySelector("[data-film-source]").href = project.source.original;
    screen.classList.toggle("is-vertical", project.type === "reels");
    const iframe = document.createElement("iframe");
    iframe.title = project.titulo;
    iframe.src = project.source.embed;
    iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    screen.replaceChildren(iframe);
    document.body.classList.add("film-is-open");
    dialog.showModal();
  };

  const createCard = (project) => {
    const card = document.createElement("article");
    card.className = `film-card${project.type === "cursos" ? " film-card--wide" : ""}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "film-poster";
    button.setAttribute("aria-label", `Assistir: ${project.titulo}`);
    button.setAttribute("aria-haspopup", "dialog");
    button.innerHTML = '<span class="film-poster-fallback" aria-hidden="true"><span>SparkFilmes / Em movimento</span><strong></strong></span><span class="film-number" aria-hidden="true"></span><span class="film-play" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3 1.5v13l11-6.5z"/></svg></span>';
    button.querySelector("strong").textContent = project.titulo;
    button.querySelector(".film-number").textContent = String(project.number).padStart(2, "0");
    if (project.source) {
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      const fallbackSources = project.source.provider === "youtube"
        ? ["sddefault", "hqdefault"].map((quality) => `https://i.ytimg.com/vi/${project.source.id}/${quality}.jpg`)
        : [`https://drive.google.com/thumbnail?id=${project.source.id}&sz=w1000`];
      let nextSource = 0;
      const fallback = () => {
        if (nextSource < fallbackSources.length) {
          img.src = fallbackSources[nextSource++];
        } else {
          img.remove();
          button.classList.remove("has-cover");
        }
      };
      img.addEventListener("load", () => {
        if (img.naturalWidth < 200) { fallback(); return; }
        img.classList.add("is-loaded");
        button.classList.add("has-cover");
      });
      img.addEventListener("error", fallback);
      img.src = project.source.provider === "youtube"
        ? `https://i.ytimg.com/vi/${project.source.id}/maxresdefault.jpg`
        : `https://drive.google.com/thumbnail?id=${project.source.id}&sz=w1600`;
      button.append(img);
      button.addEventListener("click", () => openFilm(project, button));
    } else {
      button.disabled = true;
      button.setAttribute("aria-label", `${project.titulo}: vídeo indisponível`);
    }
    const caption = document.createElement("div");
    caption.className = "film-caption";
    const text = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = project.titulo;
    const category = document.createElement("p");
    category.textContent = project.categoria;
    const ratio = document.createElement("span");
    ratio.className = "film-format";
    ratio.textContent = project.ratio;
    text.append(title, category);
    caption.append(text, ratio);
    card.append(button, caption);
    return card;
  };

  const render = ({ append = false } = {}) => {
    const selected = selectedProjects();
    const start = append ? grid.children.length : 0;
    if (!append) grid.replaceChildren();
    const fragment = document.createDocumentFragment();
    selected.slice(start, visibleCount).forEach((project) => fragment.append(createCard(project)));
    grid.append(fragment);
    status.textContent = `${Math.min(visibleCount, selected.length)} de ${selected.length} filmes`;
    more.hidden = visibleCount >= selected.length;
    // Appending leaves existing posters intact and moves keyboard users to new work.
    if (append) grid.children[start]?.querySelector("button")?.focus();
  };

  filters.forEach((filter) => filter.addEventListener("click", () => {
    activeFilter = filter.dataset.filmFilter;
    visibleCount = activeFilter === "reels" ? 8 : 6;
    filters.forEach((item) => item.setAttribute("aria-pressed", String(item === filter)));
    render();
  }));
  more.addEventListener("click", () => { visibleCount += activeFilter === "reels" ? 8 : 6; render({ append: true }); });
  dialog.querySelector(".film-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", closeFilm);
  dialog.addEventListener("cancel", () => { screen.replaceChildren(); });
  // Only a press and release on the backdrop closes it, not drags from the player.
  let backdropPress = false;
  dialog.addEventListener("pointerdown", (event) => { backdropPress = event.target === dialog; });
  dialog.addEventListener("click", (event) => { if (backdropPress && event.target === dialog) dialog.close(); backdropPress = false; });

  const load = async () => {
    if (loading) return;
    loading = true;
    grid.setAttribute("aria-busy", "true");
    error.hidden = true;
    filters.forEach((filter) => { filter.disabled = true; });
    status.textContent = "Carregando filmes…";
    try {
      const response = await fetch("../data/portfolio.json");
      if (!response.ok) throw new Error("Portfolio unavailable");
      const data = await response.json();
      if (!Array.isArray(data.reels) || !Array.isArray(data.cursos)) throw new Error("Invalid portfolio");
      const reels = data.reels.map((item) => ({ ...item, type: "reels" }));
      const wide = data.cursos.map((item) => ({ ...item, type: "cursos" }));
      // Four portraits followed by two landscape films give the page a visual rhythm.
      const ordered = [];
      for (let i = 0; i < Math.max(Math.ceil(reels.length / 4), Math.ceil(wide.length / 2)); i++) {
        ordered.push(...reels.slice(i * 4, i * 4 + 4), ...wide.slice(i * 2, i * 2 + 2));
      }
      projects = ordered.map((item, index) => ({ ...item, number: index + 1, source: getSource(item.id) }));
      document.querySelector('[data-film-count="all"]').textContent = projects.length;
      document.querySelector('[data-film-count="reels"]').textContent = reels.length;
      document.querySelector('[data-film-count="cursos"]').textContent = wide.length;
      render();
    } catch {
      error.hidden = false;
      more.hidden = true;
      status.textContent = "Filmes indisponíveis no momento";
    } finally {
      loading = false;
      filters.forEach((filter) => { filter.disabled = projects.length === 0; });
      grid.setAttribute("aria-busy", "false");
    }
  };
  retry.addEventListener("click", load);
  load();
})();
