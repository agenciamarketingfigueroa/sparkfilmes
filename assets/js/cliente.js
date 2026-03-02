const clientRoot = document.querySelector("[data-client-page]");

if (clientRoot) {
  const headerEl = document.getElementById("cliente-header");
  const metricsEl = document.getElementById("cliente-metricas");
  const metricsHeadEl = metricsEl ? metricsEl.previousElementSibling : null;
  const metricsSectionEl = metricsEl ? metricsEl.closest(".section") : null;
  const deliveriesEl = document.getElementById("cliente-entregas");
  const deliveriesSectionEl = deliveriesEl ? deliveriesEl.closest(".section") : null;
  const deliveriesContainerEl = deliveriesEl ? deliveriesEl.parentElement : null;
  const deliveriesHeadEl = deliveriesContainerEl ? deliveriesContainerEl.querySelector(".section-head") : null;
  const filtersEl = document.getElementById("cliente-filtros");
  const noteEl = document.getElementById("cliente-note");

  const formatDatePtBr = (isoDate) => {
    if (!isoDate) return "--";
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return "--";
    return new Intl.DateTimeFormat("pt-BR").format(parsed);
  };

  let allWorks = [];
  const activeDeliveryFilters = {
    title: "",
    date: "",
    format: "",
  };

  const normalizeFilterValue = (value) => String(value || "").trim();

  const hasActiveDeliveryFilters = () => Boolean(activeDeliveryFilters.title || activeDeliveryFilters.date || activeDeliveryFilters.format);

  const getDeliveryFilterOptions = (trabalhos) => {
    if (!Array.isArray(trabalhos) || trabalhos.length === 0) {
      return {
        dateValues: [],
        formatValues: [],
      };
    }

    const dateValues = Array.from(
      new Set(
        trabalhos
          .map((work) => normalizeFilterValue(work?.dataTrabalho))
          .filter(Boolean)
      )
    ).sort((a, b) => b.localeCompare(a));

    const formatValues = Array.from(
      new Set(
        trabalhos
          .map((work) => normalizeFilterValue(work?.formato))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    return {
      dateValues,
      formatValues,
    };
  };

  const getFilteredWorks = (trabalhos) => {
    if (!Array.isArray(trabalhos) || trabalhos.length === 0) return [];

    return trabalhos.filter((work) => {
      const normalizedTitleFilter = normalizeFilterValue(activeDeliveryFilters.title).toLowerCase();
      const normalizedWorkTitle = normalizeFilterValue(work?.titulo).toLowerCase();
      const matchesTitle = !normalizedTitleFilter || normalizedWorkTitle.includes(normalizedTitleFilter);
      const matchesDate = !activeDeliveryFilters.date || normalizeFilterValue(work?.dataTrabalho) === activeDeliveryFilters.date;
      const matchesFormat = !activeDeliveryFilters.format || normalizeFilterValue(work?.formato) === activeDeliveryFilters.format;
      return matchesTitle && matchesDate && matchesFormat;
    });
  };

  const getClientSlug = () => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("cliente");
    if (fromQuery) return fromQuery;

    const fromDataset = clientRoot.dataset.defaultSlug;
    if (fromDataset) return fromDataset;

    return "";
  };

  const getDataPath = () => {
    const legacyPath = clientRoot.dataset.jsonPath;
    if (legacyPath) return legacyPath;

    const slug = getClientSlug();
    if (!slug) return "";

    return `../data/clientes/${slug}.json`;
  };

  const getIndexPath = () => {
    const basePath = String(clientRoot.dataset.basePath || ".").replace(/\/$/, "");
    return `${basePath}/data/clientes/index.json`;
  };

  const getAccessKey = (slug) => `client-access:${slug}`;

  const hasClientAccess = (slug) => {
    if (!slug) return true;

    try {
      return sessionStorage.getItem(getAccessKey(slug)) === "ok";
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const setClientAccess = (slug) => {
    if (!slug) return;

    try {
      sessionStorage.setItem(getAccessKey(slug), "ok");
    } catch (error) {
      console.error(error);
    }
  };

  const getClientAccessConfig = async () => {
    const slug = getClientSlug();
    if (!slug) return null;

    try {
      const response = await fetch(getIndexPath(), { cache: "no-store" });
      if (!response.ok) return null;

      const data = await response.json();
      const clients = Array.isArray(data.clientes) ? data.clientes : [];
      return clients.find((client) => client.slug === slug) || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const createStatusBadge = (statusText) => {
    const badge = document.createElement("span");
    badge.className = "status-badge";
    badge.dataset.status = statusText || "Em andamento";
    badge.textContent = statusText || "Em andamento";
    return badge;
  };

  const resolveClientAsset = (assetPath) => {
    const basePath = String(clientRoot.dataset.basePath || ".").replace(/\/$/, "");

    if (!assetPath) return `${basePath}/assets/img/perfil-spark.svg`;

    const raw = String(assetPath).trim();
    if (!raw) return `${basePath}/assets/img/perfil-spark.svg`;

    if (/^(https?:)?\/\//.test(raw) || raw.startsWith("data:")) return raw;
    if (/^(?:\.\.\/|\.\/|\/)/.test(raw)) return raw;

    return `${basePath}/${raw.replace(/^\.?\//, "")}`;
  };

  const buildFallbackImage = (label) => {
    const safeLabel = label || "Entrega SparkFilmes";
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
        <rect width="800" height="1000" fill="#0f1014" />
        <circle cx="690" cy="120" r="160" fill="#ff2c58" fill-opacity="0.23" />
        <text x="72" y="170" font-family="Manrope, Arial, sans-serif" font-size="42" fill="#f1f0f0">SparkFilmes</text>
        <text x="72" y="300" font-family="Sora, Arial, sans-serif" font-size="78" font-weight="700" fill="#ff2c58">ENTREGA</text>
        <text x="72" y="380" font-family="Manrope, Arial, sans-serif" font-size="30" fill="#b8b8c2">${safeLabel}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const applyDeliveryCoverConfig = (coverEl, work) => {
    if (!coverEl || !work) return;

    if (work.coverRatio) {
      coverEl.style.setProperty("--delivery-cover-ratio", String(work.coverRatio));
    }

    if (work.coverInset) {
      coverEl.style.setProperty("--delivery-cover-inset", String(work.coverInset));
    }

    if (work.coverFlush) {
      coverEl.classList.add("delivery-cover-flush");
    }
  };

  const getDownloadDeadline = (work) => {
    const isoDate = work?.dataTrabalho;
    const start = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return null;

    const deadline = new Date(start);
    const customMonths = Number(work?.prazoMeses);
    const customYears = Number(work?.prazoAnos);
    const normalizedFormat = normalizeFilterValue(work?.formato).toLowerCase();

    if (Number.isFinite(customMonths) && customMonths > 0) {
      deadline.setMonth(deadline.getMonth() + customMonths);
      return deadline;
    }

    if (Number.isFinite(customYears) && customYears > 0) {
      deadline.setFullYear(deadline.getFullYear() + customYears);
      return deadline;
    }

    if (normalizedFormat === "bruto") {
      deadline.setMonth(deadline.getMonth() + 3);
      return deadline;
    }

    deadline.setFullYear(deadline.getFullYear() + 1);
    return deadline;
  };

  const getExplicitDeadline = (isoDate) => {
    if (!isoDate) return null;

    const explicit = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(explicit.getTime())) return null;
    return explicit;
  };

  const getRemainingDays = (deadlineDate) => {
    if (!deadlineDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const renderAccessGate = (clientConfig) => {
    allWorks = [];
    activeDeliveryFilters.title = "";
    activeDeliveryFilters.date = "";
    activeDeliveryFilters.format = "";

    if (filtersEl) {
      filtersEl.hidden = true;
      filtersEl.innerHTML = "";
    }

    if (metricsEl) {
      metricsEl.innerHTML = '<p class="empty-state">Acesso protegido. Digite a senha acima.</p>';
    }

    if (deliveriesEl) {
      deliveriesEl.innerHTML = '<p class="empty-state">Acesso protegido. Digite a senha acima.</p>';
    }

    if (noteEl) {
      noteEl.textContent = "Acesso protegido por senha.";
    }

    if (!headerEl) return;

    headerEl.innerHTML = "";

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Area protegida";

    const title = document.createElement("h1");
    title.textContent = clientConfig?.nome || "Material protegido";

    const description = document.createElement("p");
    description.className = "client-description";
    description.textContent = "Digite a senha deste cliente para visualizar os materiais.";

    const form = document.createElement("form");
    form.className = "material-form";

    const label = document.createElement("label");
    label.htmlFor = "cliente-access-password";
    label.textContent = "Senha de acesso";

    const row = document.createElement("div");
    row.className = "search-row";

    const input = document.createElement("input");
    input.id = "cliente-access-password";
    input.className = "field";
    input.name = "senha";
    input.type = "password";
    input.placeholder = "Digite sua senha";
    input.autocomplete = "current-password";
    input.required = true;

    const button = document.createElement("button");
    button.type = "submit";
    button.className = "btn btn-primary";
    button.textContent = "Entrar";

    const feedback = document.createElement("p");
    feedback.className = "form-feedback";

    row.append(input, button);
    form.append(label, row, feedback);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (input.value !== String(clientConfig?.senha || "")) {
        feedback.textContent = "Senha incorreta. Verifique e tente novamente.";
        input.select();
        return;
      }

      setClientAccess(clientConfig?.slug || "");
      initClientPage();
    });

    headerEl.append(eyebrow, title, description, form);
    input.focus();
  };

  const renderHeader = (cliente) => {
    if (!headerEl) return;

    headerEl.innerHTML = "";

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Painel exclusivo do cliente";
    if (cliente.eyebrow) {
      eyebrow.textContent = cliente.eyebrow;
    }

    const title = document.createElement("h1");
    title.textContent = cliente.nome || "Cliente SparkFilmes";

    const subtitle = document.createElement("p");
    subtitle.className = "client-subtitle";
    subtitle.textContent = `Nicho: ${cliente.nicho || cliente.segmento || "Não informado"}`;

    const description = document.createElement("p");
    description.className = "client-description";
    description.textContent = cliente.resumo || "Catalogo de trabalhos e entregas organizadas pela SparkFilmes.";
    if (cliente.ocultarSubtitulo) {
      subtitle.textContent = "";
      subtitle.hidden = true;
    }
    if (cliente.subtitulo) {
      subtitle.textContent = cliente.subtitulo;
      subtitle.hidden = false;
    }

    const meta = document.createElement("div");
    meta.className = "spotlight-meta";
    meta.appendChild(createStatusBadge(cliente.status || "Ativo"));

    const updateInfo = document.createElement("span");
    updateInfo.className = "text-muted";
    updateInfo.textContent = `Última atualização: ${formatDatePtBr(cliente.ultimaAtualizacao)}`;
    meta.appendChild(updateInfo);

    const copy = document.createElement("div");
    copy.className = "client-spotlight-copy";
    copy.append(eyebrow, title, subtitle, description, meta);

    const photo = document.createElement("figure");
    photo.className = "client-spotlight-photo";
    if (cliente.fotoPerfilRatio) {
      photo.style.setProperty("--client-spotlight-photo-ratio", String(cliente.fotoPerfilRatio));
    }
    if (cliente.fotoPerfilWidth) {
      photo.style.setProperty("--client-spotlight-photo-width", String(cliente.fotoPerfilWidth));
    }

    const image = document.createElement("img");
    image.loading = "lazy";
    image.decoding = "async";
    image.src = resolveClientAsset(cliente.fotoPerfil);
    image.alt = cliente.fotoPerfilAlt || (cliente.nome ? `Foto de perfil de ${cliente.nome}` : "Foto de perfil do cliente");
    image.width = 1080;
    image.height = 1080;
    image.addEventListener("error", () => {
      image.src = resolveClientAsset("");
    });
    photo.appendChild(image);

    const layout = document.createElement("div");
    layout.className = "client-spotlight-layout";
    layout.append(copy, photo);

    headerEl.appendChild(layout);
  };

  const renderMetrics = (_cliente, trabalhos) => {
    if (!metricsEl) return;

    if (metricsSectionEl) {
      metricsSectionEl.hidden = Boolean(_cliente?.ocultarMetricas);
    }

    if (_cliente?.ocultarMetricas) {
      metricsEl.innerHTML = "";
      return;
    }

    metricsEl.innerHTML = "";

    if (metricsHeadEl && _cliente?.metricasEyebrow) {
      const eyebrowEl = metricsHeadEl.querySelector(".eyebrow");
      if (eyebrowEl) {
        eyebrowEl.textContent = _cliente.metricasEyebrow;
      }
    }

    if (metricsHeadEl && _cliente?.metricasTitulo) {
      const titleEl = metricsHeadEl.querySelector(".section-title");
      if (titleEl) {
        titleEl.textContent = _cliente.metricasTitulo;
      }
    }

    const workItems = Array.isArray(trabalhos) ? trabalhos : [];
    const customMetrics = Array.isArray(_cliente?.metricas) ? _cliente.metricas : null;

    const latestWork = workItems.reduce((currentLatest, work) => {
      const workDate = new Date(`${work?.dataTrabalho || ""}T00:00:00`);
      if (Number.isNaN(workDate.getTime())) return currentLatest;

      if (!currentLatest || workDate > currentLatest.date) {
        return { work, date: workDate };
      }

      return currentLatest;
    }, null);

    const nearestActiveDeadline = workItems.reduce((currentClosest, work) => {
      const deadline = getExplicitDeadline(work?.prazoDownloadAte) || getDownloadDeadline(work);
      const remainingDays = getRemainingDays(deadline);

      if (!deadline || remainingDays === null || remainingDays < 0) return currentClosest;

      if (!currentClosest || deadline < currentClosest.deadline) {
        return { work, deadline, remainingDays };
      }

      return currentClosest;
    }, null);

    const sharedDeadline = getExplicitDeadline(_cliente?.prazoDownloadGeralAte);
    const sharedRemainingDays = getRemainingDays(sharedDeadline);

    const defaultMetrics = [
      { label: "Trabalhos feitos", value: String(workItems.length) },
      {
        label: "Data do ultimo trabalho",
        value: latestWork ? formatDatePtBr(latestWork.work.dataTrabalho) : "--"
      },
      sharedDeadline && sharedRemainingDays !== null
        ? {
            label:
              sharedRemainingDays < 0
                ? "Prazo para download encerrado"
                : `Prazo para download: ${sharedRemainingDays} dias`,
            value: formatDatePtBr(_cliente.prazoDownloadGeralAte)
          }
        : nearestActiveDeadline
        ? {
            label: `Menor prazo para download: ${nearestActiveDeadline.remainingDays} dias`,
            value: nearestActiveDeadline.work.titulo || "Trabalho sem titulo"
          }
        : {
            label: "Trabalho com menor prazo para download",
            value: "Sem prazo ativo"
          }
    ];

    const metricSource =
      customMetrics && customMetrics.length > 0
        ? [...customMetrics, ...defaultMetrics.slice(customMetrics.length)]
        : defaultMetrics;

    metricSource.forEach((metric) => {
      const card = document.createElement("article");
      card.className = "metric-card";

      const value = document.createElement("strong");
      value.textContent = metric.value || "--";

      const label = document.createElement("span");
      label.textContent = metric.label || "Métrica";

      card.append(value, label);
      metricsEl.appendChild(card);
    });
  };

  const normalizeVisualPassword = (value, mode) => {
    const raw = String(value || "").trim();

    if (mode === "digits") {
      return raw.replace(/\D/g, "");
    }

    return raw;
  };

  const openWorkLink = (link) => {
    if (!link) return;

    if (/^(https?:)?\/\//.test(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.href = link;
  };

  const buildDeliveryCard = (work) => {
    const card = document.createElement("article");
    card.className = "delivery-card";
    if (work.cardWide) {
      card.classList.add("delivery-card-wide");
    }

    const cover = document.createElement("figure");
    cover.className = "delivery-cover";
    applyDeliveryCoverConfig(cover, work);

    if (work.coverText) {
      const coverBadge = document.createElement("div");
      coverBadge.className = "delivery-cover-badge";
      coverBadge.textContent = String(work.coverText);
      cover.appendChild(coverBadge);
    } else {
      const image = document.createElement("img");
      image.loading = "lazy";
      image.alt = work.titulo || "Capa do trabalho";
      let coverSrc = work.capa || buildFallbackImage(work.titulo);
      if (
        clientData.usarThumbsAluno &&
        typeof work.capa === "string" &&
        work.capa.includes("/Clientes/") &&
        !work.capa.includes("/thumbs/") &&
        /\.svg$/i.test(work.capa)
      ) {
        coverSrc = work.capa.replace(/\/([^\/]+)\.svg$/i, "/thumbs/$1.jpg");
      }
      image.src = resolveClientAsset(coverSrc);
      image.addEventListener("error", () => {
        image.src = buildFallbackImage(work.titulo);
      });
      cover.appendChild(image);
    }

    const content = document.createElement("div");
    content.className = "delivery-content";

    const title = document.createElement("h3");
    title.textContent = work.titulo || "Trabalho sem titulo";

    const status = createStatusBadge(work.statusEntrega || "Em andamento");

    const metaList = document.createElement("ul");
    metaList.className = "delivery-meta";

    const dateItem = document.createElement("li");
    dateItem.innerHTML = `<strong>Data do trabalho:</strong> ${formatDatePtBr(work.dataTrabalho)}`;
    metaList.appendChild(dateItem);

    const formatItem = document.createElement("li");
    formatItem.innerHTML = `<strong>Formato:</strong> ${work.formato || "Não informado"}`;
    metaList.appendChild(formatItem);

    const quantityItem = document.createElement("li");
    quantityItem.innerHTML = `<strong>Volume:</strong> ${work.volume || "Não informado"}`;
    metaList.appendChild(quantityItem);

    if (work.tipo) {
      const typeItem = document.createElement("li");
      typeItem.innerHTML = `<strong>Tipo:</strong> ${work.tipo}`;
      metaList.appendChild(typeItem);
    }

    if (work.observacao) {
      const noteItem = document.createElement("li");
      noteItem.innerHTML = `<strong>Nota:</strong> ${work.observacao}`;
      metaList.appendChild(noteItem);
    }

    const deadline = getExplicitDeadline(work.prazoDownloadAte) || getDownloadDeadline(work);
    const remainingDays = getRemainingDays(deadline);
    const countdown = document.createElement("p");
    countdown.className = "countdown";

    if (!deadline || remainingDays === null) {
      countdown.textContent = "Prazo de download: não informado.";
    } else if (remainingDays < 0) {
      countdown.textContent = `Prazo expirado em ${formatDatePtBr(deadline.toISOString().slice(0, 10))}.`;
    } else {
      countdown.textContent = `Prazo de download: ${remainingDays} dias restantes (até ${formatDatePtBr(
        deadline.toISOString().slice(0, 10)
      )}).`;
    }

    const actions = document.createElement("div");
    actions.className = "delivery-actions";

    const folderButton = document.createElement("a");
    folderButton.className = "btn btn-ghost btn-small";
    folderButton.textContent = "Abrir pasta";
    if (work.linkPasta) {
      folderButton.href = work.linkPasta;
      folderButton.target = "_blank";
      folderButton.rel = "noreferrer";
    } else {
      folderButton.href = "#";
      folderButton.setAttribute("aria-disabled", "true");
    }

    actions.appendChild(folderButton);
    content.append(title, status, metaList, countdown, actions);
    card.append(cover, content);
    return card;
  };

  const buildFlexibleDeliveryCard = (work) => {
    const clientData = window.__sparkClientData || {};
    const card = document.createElement("article");
    card.className = "delivery-card";
    if (work.cardWide) {
      card.classList.add("delivery-card-wide");
    }
    const cover = document.createElement("figure");
    cover.className = "delivery-cover";
    applyDeliveryCoverConfig(cover, work);

    if (work.coverText) {
      const coverBadge = document.createElement("div");
      coverBadge.className = "delivery-cover-badge";
      coverBadge.textContent = String(work.coverText);
      cover.appendChild(coverBadge);
    } else {
      const image = document.createElement("img");
      image.loading = "lazy";
      image.alt = work.titulo || "Capa do trabalho";
      image.src = resolveClientAsset(work.capa || buildFallbackImage(work.titulo));
      image.addEventListener("error", () => {
        image.src = buildFallbackImage(work.titulo);
      });
      cover.appendChild(image);
    }
    card.appendChild(cover);

    const content = document.createElement("div");
    content.className = "delivery-content";

    const title = document.createElement("h3");
    title.textContent = work.titulo || "Trabalho sem titulo";

    const status = createStatusBadge(work.statusEntrega || "Em andamento");

    const metaList = document.createElement("ul");
    metaList.className = "delivery-meta";

    const appendMetaItem = (labelText, valueText) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${labelText}:</strong> ${valueText}`;
      metaList.appendChild(item);
    };

    const hasTipoMeta =
      Array.isArray(work.meta) &&
      work.meta.some((entry) => String(entry?.label || "").trim().toLowerCase() === "tipo");

    if (Array.isArray(work.meta) && work.meta.length > 0) {
      work.meta.forEach((entry) => {
        if (!entry) return;
        appendMetaItem(entry.label || "Informacao", entry.value || "--");
      });

      if (work.tipo && !hasTipoMeta) {
        appendMetaItem("Tipo", work.tipo);
      }
    } else {
      appendMetaItem("Data do trabalho", formatDatePtBr(work.dataTrabalho));
      appendMetaItem("Formato", work.formato || "Nao informado");
      appendMetaItem("Volume", work.volume || "Nao informado");

      if (work.tipo) {
        appendMetaItem("Tipo", work.tipo);
      }

      if (work.observacao) {
        appendMetaItem("Nota", work.observacao);
      }
    }

    const actions = document.createElement("div");
    actions.className = "delivery-actions";

    const actionLabel = clientData.textoBotaoEntrega || work.linkPastaTexto || "Abrir pasta";
    let accessFormEl = null;

    if (work.senhaVisual) {
      const toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.className = "btn btn-ghost btn-small";
      toggleButton.textContent = actionLabel;

      const accessForm = document.createElement("form");
      accessForm.className = "material-form delivery-access-form";
      accessForm.hidden = true;

      const fieldId = `work-visual-password-${String(work.id || "item").replace(/[^a-zA-Z0-9_-]/g, "")}`;

      const label = document.createElement("label");
      label.htmlFor = fieldId;
      label.textContent = work.senhaVisualLabel || "Senha";

      const helpText = document.createElement("p");
      helpText.className = "delivery-access-note";
      helpText.textContent = clientData.senhaVisualPadrao
        ? "Digite a senha de teste para liberar o material."
        : work.senhaVisualAjuda || "Digite a senha para liberar o material.";

      const row = document.createElement("div");
      row.className = "search-row";

      const input = document.createElement("input");
      input.id = fieldId;
      input.className = "field";
      input.name = "senha-visual";
      input.type = "password";
      input.placeholder = clientData.senhaVisualPadrao ? "Digite a senha" : work.senhaVisualPlaceholder || "Digite a senha";
      input.autocomplete = "off";
      input.required = true;

      const submitButton = document.createElement("button");
      submitButton.type = "submit";
      submitButton.className = "btn btn-primary btn-small";
      submitButton.textContent = work.senhaVisualBotao || "Liberar acesso";

      const feedback = document.createElement("p");
      feedback.className = "form-feedback";

      row.append(input, submitButton);
      accessForm.append(label, helpText, row, feedback);

      toggleButton.addEventListener("click", () => {
        const shouldOpen = accessForm.hidden;
        accessForm.hidden = !shouldOpen;
        feedback.textContent = "";

        if (shouldOpen) {
          input.focus();
        }
      });

      accessForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const inputValue = normalizeVisualPassword(input.value, work.senhaVisualModo);
        const expectedRawValue = clientData.senhaVisualPadrao || work.senhaVisual;
        const expectedValue = normalizeVisualPassword(expectedRawValue, work.senhaVisualModo);

        if (inputValue !== expectedValue) {
          feedback.textContent = clientData.senhaVisualPadrao
            ? "Senha incorreta. Use a senha de teste informada."
            : work.senhaVisualErro || "Senha incorreta. Verifique e tente novamente.";
          input.select();
          return;
        }

        if (!work.linkPasta) {
          feedback.textContent = "O link do Google Drive ainda nao foi configurado.";
          return;
        }

        feedback.textContent = "";
        openWorkLink(work.linkPasta);
      });

      actions.appendChild(toggleButton);
      accessFormEl = accessForm;
    } else {
      const folderButton = document.createElement("a");
      folderButton.className = "btn btn-ghost btn-small";
      folderButton.textContent = actionLabel;
      if (work.linkPasta) {
        folderButton.href = work.linkPasta;

        if (/^(https?:)?\/\//.test(work.linkPasta)) {
          folderButton.target = "_blank";
          folderButton.rel = "noreferrer";
        }
      } else {
        folderButton.href = "#";
        folderButton.setAttribute("aria-disabled", "true");
      }

      actions.appendChild(folderButton);
    }

    if (Array.isArray(work.acoes) && work.acoes.length > 0) {
      work.acoes.forEach((action) => {
        const button = document.createElement("a");
        button.className = `btn btn-small ${action?.variant === "primary" ? "btn-primary" : "btn-ghost"}`;
        button.textContent = action?.label || "Abrir";

        if (action?.link) {
          button.href = action.link;

          if (action?.novaAba || /^(https?:)?\/\//.test(action.link)) {
            button.target = "_blank";
            button.rel = "noreferrer";
          }
        } else {
          button.href = "#";
          button.setAttribute("aria-disabled", "true");
        }

        actions.appendChild(button);
      });
    }

    if (Array.isArray(clientData.acoesComuns) && clientData.acoesComuns.length > 0) {
      clientData.acoesComuns.forEach((action) => {
        const button = document.createElement("a");
        button.className = `btn btn-small ${action?.variant === "primary" ? "btn-primary" : "btn-ghost"}`;
        button.textContent = action?.label || "Abrir";

        if (action?.link) {
          button.href = action.link;

          if (action?.novaAba || /^(https?:)?\/\//.test(action.link)) {
            button.target = "_blank";
            button.rel = "noreferrer";
          }
        } else {
          button.href = "#";
          button.setAttribute("aria-disabled", "true");
        }

        actions.appendChild(button);
      });
    }

    if (accessFormEl) {
      actions.appendChild(accessFormEl);
    }

    if (!clientData.ocultarTituloCardsEntrega && !work.hideTitle) {
      content.appendChild(title);
    }

    if (!clientData.ocultarStatusCardsEntrega && !work.hideStatus) {
      content.appendChild(status);
    }

    content.appendChild(metaList);

    if (!work.hideCountdown) {
      const deadline = getExplicitDeadline(work.prazoDownloadAte) || getDownloadDeadline(work);
      const remainingDays = getRemainingDays(deadline);
      const countdown = document.createElement("p");
      countdown.className = "countdown";

      if (!deadline || remainingDays === null) {
        countdown.textContent = "Prazo de download: nao informado.";
      } else if (remainingDays < 0) {
        countdown.textContent = `Prazo expirado em ${formatDatePtBr(deadline.toISOString().slice(0, 10))}.`;
      } else {
        countdown.textContent = `Prazo de download: ${remainingDays} dias restantes (ate ${formatDatePtBr(
          deadline.toISOString().slice(0, 10)
        )}).`;
      }

      content.appendChild(countdown);
    }

    content.appendChild(actions);
    card.appendChild(content);
    return card;
  };

  const renderDeliveryFilters = (trabalhos) => {
    if (!filtersEl) return;

    filtersEl.innerHTML = "";

    const { dateValues, formatValues } = getDeliveryFilterOptions(trabalhos);
    const shouldShowFilters = trabalhos.length > 1 || dateValues.length > 1 || formatValues.length > 1;

    if (!shouldShowFilters) {
      filtersEl.hidden = true;
      return;
    }

    const filteredWorks = getFilteredWorks(trabalhos);
    filtersEl.hidden = false;

    const panel = document.createElement("div");
    panel.className = "client-filter-bar";

    const topRow = document.createElement("div");
    topRow.className = "client-filter-top";

    const title = document.createElement("p");
    title.className = "client-filter-title";
    title.textContent = "Filtrar materiais";

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "btn btn-ghost btn-small";
    resetButton.textContent = "Limpar filtros";
    resetButton.disabled = !hasActiveDeliveryFilters();

    resetButton.addEventListener("click", () => {
      activeDeliveryFilters.title = "";
      activeDeliveryFilters.date = "";
      activeDeliveryFilters.format = "";
      updateDeliveryResults();
    });

    topRow.append(title, resetButton);

    const grid = document.createElement("div");
    grid.className = "client-filter-grid";

    const titleField = document.createElement("label");
    titleField.className = "client-filter-field";
    titleField.textContent = "Titulo";

    const titleInput = document.createElement("input");
    titleInput.className = "field";
    titleInput.type = "search";
    titleInput.placeholder = "Buscar por titulo";
    titleInput.setAttribute("aria-label", "Buscar por titulo");
    titleInput.value = activeDeliveryFilters.title;
    titleInput.addEventListener("input", () => {
      activeDeliveryFilters.title = titleInput.value;
      updateDeliveryResults({ preserveFilters: true });
    });

    titleField.appendChild(titleInput);

    const dateField = document.createElement("label");
    dateField.className = "client-filter-field";
    dateField.textContent = "Data";

    const dateSelect = document.createElement("select");
    dateSelect.className = "field";
    dateSelect.setAttribute("aria-label", "Filtrar por data");

    const allDatesOption = document.createElement("option");
    allDatesOption.value = "";
    allDatesOption.textContent = "Todas as datas";
    dateSelect.appendChild(allDatesOption);

    dateValues.forEach((isoDate) => {
      const option = document.createElement("option");
      option.value = isoDate;
      option.textContent = formatDatePtBr(isoDate);
      dateSelect.appendChild(option);
    });

    dateSelect.value = activeDeliveryFilters.date;
    dateSelect.addEventListener("change", () => {
      activeDeliveryFilters.date = dateSelect.value;
      updateDeliveryResults();
    });

    dateField.appendChild(dateSelect);

    const formatField = document.createElement("label");
    formatField.className = "client-filter-field";
    formatField.textContent = "Formato";

    const formatSelect = document.createElement("select");
    formatSelect.className = "field";
    formatSelect.setAttribute("aria-label", "Filtrar por formato");

    const allFormatsOption = document.createElement("option");
    allFormatsOption.value = "";
    allFormatsOption.textContent = "Todos os formatos";
    formatSelect.appendChild(allFormatsOption);

    formatValues.forEach((formatValue) => {
      const option = document.createElement("option");
      option.value = formatValue;
      option.textContent = formatValue;
      formatSelect.appendChild(option);
    });

    formatSelect.value = activeDeliveryFilters.format;
    formatSelect.addEventListener("change", () => {
      activeDeliveryFilters.format = formatSelect.value;
      updateDeliveryResults();
    });

    formatField.appendChild(formatSelect);
    grid.append(titleField, dateField, formatField);

    const summary = document.createElement("p");
    summary.className = "client-filter-summary";
    summary.textContent = hasActiveDeliveryFilters()
      ? `${filteredWorks.length} material${filteredWorks.length === 1 ? "" : "is"} encontrado${filteredWorks.length === 1 ? "" : "s"} com os filtros atuais.`
      : `${trabalhos.length} material${trabalhos.length === 1 ? "" : "is"} disponive${trabalhos.length === 1 ? "l" : "is"}.`;

    panel.append(topRow, grid, summary);
    filtersEl.appendChild(panel);
  };

  const renderDeliveries = (trabalhos) => {
    if (!deliveriesEl) return;
    deliveriesEl.innerHTML = "";

    const clientData = window.__sparkClientData || {};

    if (deliveriesHeadEl && clientData?.entregasEyebrow) {
      const eyebrowEl = deliveriesHeadEl.querySelector(".eyebrow");
      if (eyebrowEl) {
        eyebrowEl.textContent = clientData.entregasEyebrow;
      }
    }

    if (deliveriesHeadEl && clientData?.entregasTitulo) {
      const titleEl = deliveriesHeadEl.querySelector(".section-title");
      if (titleEl) {
        titleEl.textContent = clientData.entregasTitulo;
      }
    }

    if (deliveriesSectionEl) {
      deliveriesSectionEl.classList.toggle("section-flat-dark", Boolean(clientData?.entregasFundoEscuro));
    }

    if (deliveriesContainerEl) {
      let commonActionsEl = deliveriesContainerEl.querySelector("[data-client-common-actions]");

      if (commonActionsEl) {
        commonActionsEl.remove();
      }
    }

    if (!Array.isArray(trabalhos) || trabalhos.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nenhum trabalho registrado até o momento.";
      if (hasActiveDeliveryFilters()) {
        empty.textContent = "Nenhum trabalho encontrado com os filtros selecionados.";
      }

      deliveriesEl.appendChild(empty);
      return;
    }

    trabalhos.forEach((work) => {
      deliveriesEl.appendChild(buildFlexibleDeliveryCard(work));
    });
  };

  const syncDeliveryFilterUi = (trabalhos, filteredWorks) => {
    if (!filtersEl || filtersEl.hidden) return;

    const resetButton = filtersEl.querySelector(".client-filter-top .btn");
    if (resetButton) {
      resetButton.disabled = !hasActiveDeliveryFilters();
    }

    const summary = filtersEl.querySelector(".client-filter-summary");
    if (summary) {
      summary.textContent = hasActiveDeliveryFilters()
        ? `${filteredWorks.length} material${filteredWorks.length === 1 ? "" : "is"} encontrado${filteredWorks.length === 1 ? "" : "s"} com os filtros atuais.`
        : `${trabalhos.length} material${trabalhos.length === 1 ? "" : "is"} disponive${trabalhos.length === 1 ? "l" : "is"}.`;
    }
  };

  const updateDeliveryResults = (options = {}) => {
    const filteredWorks = getFilteredWorks(allWorks);

    if (options.preserveFilters) {
      syncDeliveryFilterUi(allWorks, filteredWorks);
    } else {
      renderDeliveryFilters(allWorks);
    }

    renderDeliveries(filteredWorks);
  };

  const initClientPage = async () => {
    const dataPath = getDataPath();
    if (!dataPath) {
      allWorks = [];
      activeDeliveryFilters.title = "";
      activeDeliveryFilters.date = "";
      activeDeliveryFilters.format = "";

      if (filtersEl) {
        filtersEl.hidden = true;
        filtersEl.innerHTML = "";
      }

      if (deliveriesEl) {
        deliveriesEl.innerHTML = '<p class="empty-state">Cliente não informado na URL.</p>';
      }
      return;
    }

    const accessConfig = await getClientAccessConfig();
    if (String(accessConfig?.senha || "").trim() && !hasClientAccess(accessConfig?.slug || "")) {
      renderAccessGate(accessConfig);
      return;
    }

    try {
      if (filtersEl) {
        filtersEl.hidden = true;
        filtersEl.innerHTML = "";
      }

      if (deliveriesEl) {
        deliveriesEl.innerHTML = '<p class="loading-state">Carregando trabalhos...</p>';
      }

      const response = await fetch(dataPath, { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao carregar dados do cliente.");

      const data = await response.json();
      const cliente = data.cliente || {};
      const trabalhos = Array.isArray(data.trabalhos) ? data.trabalhos : [];

      window.__sparkClientData = cliente;
      allWorks = trabalhos;
      activeDeliveryFilters.title = "";
      activeDeliveryFilters.date = "";
      activeDeliveryFilters.format = "";

      renderHeader(cliente);
      renderMetrics(cliente, trabalhos);
      updateDeliveryResults();

      if (noteEl) {
        noteEl.textContent =
          cliente.notaRodape || "Arquivos hospedados no Google Drive. Prazo padrao de download: 1 ano por trabalho.";
      }
    } catch (error) {
      console.error(error);
      allWorks = [];
      activeDeliveryFilters.title = "";
      activeDeliveryFilters.date = "";
      activeDeliveryFilters.format = "";

      if (filtersEl) {
        filtersEl.hidden = true;
        filtersEl.innerHTML = "";
      }

      if (deliveriesEl) {
        deliveriesEl.innerHTML =
          '<p class="empty-state">Não foi possível carregar os dados. Verifique se o arquivo JSON do cliente existe.</p>';
      }
      if (noteEl) {
        noteEl.textContent = "Erro ao carregar dados do cliente.";
      }
    }
  };

  initClientPage();
}
