const clientPageRoot = document.querySelector("[data-client-page]");

if (clientPageRoot) {
  // O caminho do JSON é definido em data-json-path na página do cliente.
  const jsonPath = clientPageRoot.dataset.jsonPath;
  const clientHeaderEl = document.getElementById("cliente-header");
  const summaryGridEl = document.getElementById("cliente-summary");
  const deliveriesGridEl = document.getElementById("cliente-entregas");
  const pageNoteEl = document.getElementById("cliente-note");

  const formatDatePtBr = (isoDate) => {
    if (!isoDate) return "--";
    const normalized = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(normalized.getTime())) return "--";
    return new Intl.DateTimeFormat("pt-BR").format(normalized);
  };

  const buildFallbackImage = (label) => {
    const safeLabel = label || "Entrega Sparkfilmes";
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
        <rect width="1280" height="720" fill="#0d0d0f" />
        <circle cx="1080" cy="120" r="180" fill="#ff2c58" fill-opacity="0.24" />
        <text x="80" y="210" font-family="Montserrat, Arial, sans-serif" font-size="54" fill="#f1f0f0">Sparkfilmes</text>
        <text x="80" y="330" font-family="Montserrat, Arial, sans-serif" font-size="94" font-weight="800" fill="#ff2c58">SEM CAPA</text>
        <text x="80" y="420" font-family="Montserrat, Arial, sans-serif" font-size="34" fill="#b8b8be">${safeLabel}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const createStatusBadge = (statusText) => {
    const badge = document.createElement("span");
    badge.className = "status-badge";
    badge.dataset.status = statusText;
    badge.textContent = statusText;
    return badge;
  };

  const renderClientHeader = (cliente) => {
    if (!clientHeaderEl) return;

    clientHeaderEl.innerHTML = "";

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Portal de entregas";

    const title = document.createElement("h1");
    title.textContent = cliente.nome;

    const description = document.createElement("p");
    description.className = "text-muted";
    description.textContent = `Segmento: ${cliente.segmento}`;

    const metaWrap = document.createElement("div");
    metaWrap.className = "client-meta";
    metaWrap.appendChild(createStatusBadge(cliente.status));

    const updated = document.createElement("span");
    updated.className = "text-muted";
    updated.textContent = `Última atualização: ${formatDatePtBr(cliente.ultimaAtualizacao)}`;
    metaWrap.appendChild(updated);

    if (cliente.observacoes) {
      const notes = document.createElement("p");
      notes.className = "text-muted";
      notes.textContent = cliente.observacoes;
      clientHeaderEl.append(eyebrow, title, description, metaWrap, notes);
      return;
    }

    clientHeaderEl.append(eyebrow, title, description, metaWrap);
  };

  const renderSummary = (cliente, entregas) => {
    if (!summaryGridEl) return;

    summaryGridEl.innerHTML = "";

    const summaryItems = [
      {
        label: "Entregas registradas",
        value: String(entregas.length)
      },
      {
        label: "Tipo de serviço",
        value: cliente.tipoServico || "Não informado"
      },
      {
        label: "Contato/observação",
        value: cliente.contato || "Atualizações via WhatsApp"
      }
    ];

    summaryItems.forEach((item) => {
      const article = document.createElement("article");
      article.className = "summary-card";

      const value = document.createElement("strong");
      value.textContent = item.value;

      const label = document.createElement("span");
      label.textContent = item.label;

      article.append(value, label);
      summaryGridEl.appendChild(article);
    });
  };

  const renderTags = (tags = []) => {
    const list = document.createElement("ul");
    list.className = "tag-list";

    tags.forEach((tag) => {
      const item = document.createElement("li");
      item.textContent = tag;
      list.appendChild(item);
    });

    return list;
  };

  const buildDeliveryCard = (entrega) => {
    const article = document.createElement("article");
    article.className = "delivery-card";

    const figure = document.createElement("figure");
    figure.className = "delivery-thumb";

    const image = document.createElement("img");
    image.loading = "lazy";
    image.alt = entrega.titulo || "Capa da entrega";
    image.src = entrega.capa || buildFallbackImage(entrega.titulo);
    image.addEventListener("error", () => {
      image.src = buildFallbackImage(entrega.titulo);
    });

    figure.appendChild(image);

    const body = document.createElement("div");
    body.className = "delivery-body";

    const title = document.createElement("h3");
    title.textContent = entrega.titulo || "Entrega sem título";

    const date = document.createElement("p");
    date.className = "delivery-date";
    date.textContent = `Data da gravação: ${formatDatePtBr(entrega.data)}`;

    const description = document.createElement("p");
    description.textContent = entrega.descricao || "Sem descrição.";

    const actions = document.createElement("div");
    actions.className = "delivery-actions";

    const folderLink = document.createElement("a");
    folderLink.className = "btn btn-ghost btn-small";
    // linkPasta recebe a URL da pasta do Google Drive de cada diária.
    folderLink.textContent = "Abrir pasta";
    if (entrega.linkPasta) {
      folderLink.href = entrega.linkPasta;
      folderLink.target = "_blank";
      folderLink.rel = "noreferrer";
    } else {
      folderLink.href = "#";
      folderLink.setAttribute("aria-disabled", "true");
    }
    actions.appendChild(folderLink);

    if (entrega.linkDownload) {
      const downloadLink = document.createElement("a");
      downloadLink.className = "btn btn-primary btn-small";
      // linkDownload é opcional: quando existir, habilita o botão de download.
      downloadLink.href = entrega.linkDownload;
      downloadLink.target = "_blank";
      downloadLink.rel = "noreferrer";
      downloadLink.textContent = "Baixar material";
      actions.appendChild(downloadLink);
    }

    body.append(title, date, description, renderTags(entrega.tags), actions);
    article.append(figure, body);
    return article;
  };

  const renderDeliveries = (entregas) => {
    if (!deliveriesGridEl) return;
    deliveriesGridEl.innerHTML = "";

    if (!Array.isArray(entregas) || entregas.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nenhuma entrega disponível neste momento.";
      deliveriesGridEl.appendChild(empty);
      return;
    }

    entregas.forEach((entrega) => {
      deliveriesGridEl.appendChild(buildDeliveryCard(entrega));
    });
  };

  const initClientPage = async () => {
    if (!jsonPath) {
      if (deliveriesGridEl) {
        deliveriesGridEl.innerHTML = '<p class="empty-state">Caminho do JSON não configurado.</p>';
      }
      return;
    }

    try {
      if (deliveriesGridEl) {
        deliveriesGridEl.innerHTML = '<p class="loading-state">Carregando entregas...</p>';
      }

      const response = await fetch(jsonPath, { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao carregar dados do cliente.");

      const data = await response.json();
      const cliente = data?.cliente || {};
      const entregas = Array.isArray(data?.entregas) ? data.entregas : [];

      renderClientHeader(cliente);
      renderSummary(cliente, entregas);
      renderDeliveries(entregas);

      if (pageNoteEl) {
        pageNoteEl.textContent =
          "Arquivos hospedados no Google Drive. Em breve: filtros por mês/ano, busca e status de entrega.";
      }
    } catch (error) {
      if (deliveriesGridEl) {
        deliveriesGridEl.innerHTML =
          '<p class="empty-state">Não foi possível carregar as entregas. Verifique o caminho do JSON.</p>';
      }
      if (pageNoteEl) {
        pageNoteEl.textContent = "Erro ao carregar dados do cliente.";
      }
      // Mantemos no console para debug local sem quebrar a experiência do cliente.
      console.error(error);
    }
  };

  initClientPage();
}
