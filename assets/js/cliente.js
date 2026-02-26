const clientRoot = document.querySelector("[data-client-page]");

if (clientRoot) {
  const headerEl = document.getElementById("cliente-header");
  const metricsEl = document.getElementById("cliente-metricas");
  const deliveriesEl = document.getElementById("cliente-entregas");
  const noteEl = document.getElementById("cliente-note");

  const formatDatePtBr = (isoDate) => {
    if (!isoDate) return "--";
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return "--";
    return new Intl.DateTimeFormat("pt-BR").format(parsed);
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

  const createStatusBadge = (statusText) => {
    const badge = document.createElement("span");
    badge.className = "status-badge";
    badge.dataset.status = statusText || "Em andamento";
    badge.textContent = statusText || "Em andamento";
    return badge;
  };

  const buildFallbackImage = (label) => {
    const safeLabel = label || "Entrega Sparkfilmes";
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
        <rect width="800" height="1000" fill="#0f1014" />
        <circle cx="690" cy="120" r="160" fill="#ff2c58" fill-opacity="0.23" />
        <text x="72" y="170" font-family="Manrope, Arial, sans-serif" font-size="42" fill="#f1f0f0">Sparkfilmes</text>
        <text x="72" y="300" font-family="Sora, Arial, sans-serif" font-size="78" font-weight="700" fill="#ff2c58">ENTREGA</text>
        <text x="72" y="380" font-family="Manrope, Arial, sans-serif" font-size="30" fill="#b8b8c2">${safeLabel}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const getDownloadDeadline = (isoDate, years = 1) => {
    const start = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return null;

    const deadline = new Date(start);
    deadline.setFullYear(deadline.getFullYear() + years);
    return deadline;
  };

  const getRemainingDays = (deadlineDate) => {
    if (!deadlineDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const renderHeader = (cliente) => {
    if (!headerEl) return;

    headerEl.innerHTML = "";

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Painel exclusivo do cliente";

    const title = document.createElement("h1");
    title.textContent = cliente.nome || "Cliente Sparkfilmes";

    const subtitle = document.createElement("p");
    subtitle.className = "client-subtitle";
    subtitle.textContent = `Nicho: ${cliente.nicho || cliente.segmento || "Não informado"}`;

    const description = document.createElement("p");
    description.className = "client-description";
    description.textContent = cliente.resumo || "Catalogo de trabalhos e entregas organizadas pela Sparkfilmes.";

    const meta = document.createElement("div");
    meta.className = "spotlight-meta";
    meta.appendChild(createStatusBadge(cliente.status || "Ativo"));

    const updateInfo = document.createElement("span");
    updateInfo.className = "text-muted";
    updateInfo.textContent = `Última atualização: ${formatDatePtBr(cliente.ultimaAtualizacao)}`;
    meta.appendChild(updateInfo);

    headerEl.append(eyebrow, title, subtitle, description, meta);
  };

  const renderMetrics = (cliente, trabalhos) => {
    if (!metricsEl) return;
    metricsEl.innerHTML = "";

    const fallbackMetrics = [
      { label: "Trabalhos feitos", value: String(trabalhos.length) },
      { label: "Formato principal", value: cliente.formatoPrincipal || "Reels e cursos" },
      { label: "Inicio da parceria", value: formatDatePtBr(cliente.inicioParceria) }
    ];

    const metricSource = Array.isArray(cliente.metricas) && cliente.metricas.length > 0 ? cliente.metricas : fallbackMetrics;

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

  const buildDeliveryCard = (work) => {
    const card = document.createElement("article");
    card.className = "delivery-card";

    const cover = document.createElement("figure");
    cover.className = "delivery-cover";

    const image = document.createElement("img");
    image.loading = "lazy";
    image.alt = work.titulo || "Capa do trabalho";
    image.src = work.capa || buildFallbackImage(work.titulo);
    image.addEventListener("error", () => {
      image.src = buildFallbackImage(work.titulo);
    });
    cover.appendChild(image);

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

    if (work.observacao) {
      const noteItem = document.createElement("li");
      noteItem.innerHTML = `<strong>Nota:</strong> ${work.observacao}`;
      metaList.appendChild(noteItem);
    }

    const deadline = getDownloadDeadline(work.dataTrabalho, Number(work.prazoAnos || 1));
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

    const downloadButton = document.createElement("a");
    downloadButton.className = "btn btn-primary btn-small";
    downloadButton.textContent = "Download";
    if (work.linkDownload) {
      downloadButton.href = work.linkDownload;
      downloadButton.target = "_blank";
      downloadButton.rel = "noreferrer";
    } else {
      downloadButton.href = "#";
      downloadButton.setAttribute("aria-disabled", "true");
    }

    actions.append(folderButton, downloadButton);
    content.append(title, status, metaList, countdown, actions);
    card.append(cover, content);
    return card;
  };

  const renderDeliveries = (trabalhos) => {
    if (!deliveriesEl) return;
    deliveriesEl.innerHTML = "";

    if (!Array.isArray(trabalhos) || trabalhos.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nenhum trabalho registrado até o momento.";
      deliveriesEl.appendChild(empty);
      return;
    }

    trabalhos.forEach((work) => {
      deliveriesEl.appendChild(buildDeliveryCard(work));
    });
  };

  const initClientPage = async () => {
    const dataPath = getDataPath();
    if (!dataPath) {
      if (deliveriesEl) {
        deliveriesEl.innerHTML = '<p class="empty-state">Cliente não informado na URL.</p>';
      }
      return;
    }

    try {
      if (deliveriesEl) {
        deliveriesEl.innerHTML = '<p class="loading-state">Carregando trabalhos...</p>';
      }

      const response = await fetch(dataPath, { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao carregar dados do cliente.");

      const data = await response.json();
      const cliente = data.cliente || {};
      const trabalhos = Array.isArray(data.trabalhos) ? data.trabalhos : [];

      renderHeader(cliente);
      renderMetrics(cliente, trabalhos);
      renderDeliveries(trabalhos);

      if (noteEl) {
        noteEl.textContent = "Arquivos hospedados no Google Drive. Prazo padrao de download: 1 ano por trabalho.";
      }
    } catch (error) {
      console.error(error);
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
