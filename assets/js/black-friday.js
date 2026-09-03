(() => {
  const body = document.body;
  const form = document.querySelector("[data-bf-form]");
  const feedback = document.querySelector("[data-bf-feedback]");
  const dateInput = document.querySelector("#bf-prazo");
  const whatsappNumber = String(body?.dataset.whatsappNumber || "").trim();
  const attributionStorageKey = "sparkfilmes_black_friday_attribution";
  const attributionKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_id",
    "utm_term",
    "utm_content",
    "adset_id",
    "ad_id",
    "placement",
    "sck"
  ];
  const attributionLabels = {
    utm_source: "Origem",
    utm_medium: "Mídia",
    utm_campaign: "Campanha",
    utm_id: "ID da campanha",
    utm_term: "Conjunto de anúncios",
    utm_content: "Anúncio",
    adset_id: "ID do conjunto",
    ad_id: "ID do anúncio",
    placement: "Posicionamento",
    sck: "SCK"
  };

  const sanitizeAttributionValue = (value) =>
    String(value || "").replace(/[\r\n]+/g, " ").trim().slice(0, 200);

  const getAttribution = () => {
    let storedAttribution = {};

    try {
      storedAttribution = JSON.parse(sessionStorage.getItem(attributionStorageKey) || "{}") || {};
    } catch (_) {
      storedAttribution = {};
    }

    const searchParams = new URLSearchParams(window.location.search);
    const currentAttribution = {};

    attributionKeys.forEach((key) => {
      if (!searchParams.has(key)) return;
      const value = sanitizeAttributionValue(searchParams.get(key));
      if (value) currentAttribution[key] = value;
    });

    const attribution = { ...storedAttribution, ...currentAttribution };

    if (Object.keys(currentAttribution).length) {
      try {
        sessionStorage.setItem(attributionStorageKey, JSON.stringify(attribution));
      } catch (_) {
        // O rastreamento continua funcionando mesmo quando o armazenamento é bloqueado.
      }
    }

    return attribution;
  };

  const attribution = getAttribution();

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  if (dateInput) {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateInput.min = today.toISOString().slice(0, 10);
  }

  if (!form) return;

  const setFeedback = (message, isError = false) => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.toggle("is-error", isError);
  };

  const trackWhatsAppContact = (serviceType) => {
    if (typeof window.fbq !== "function") return;

    window.fbq("track", "Contact", {
      content_name: "WhatsApp — Landing Page Black Friday",
      content_category: "Produção de conteúdo",
      service_type: serviceType,
      ...attribution
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;
    if (!whatsappNumber) {
      setFeedback("O WhatsApp ainda não foi configurado.", true);
      return;
    }

    const data = new FormData(form);
    const rawDate = String(data.get("prazo") || "");
    const formattedDate = rawDate
      ? new Date(`${rawDate}T12:00:00`).toLocaleDateString("pt-BR")
      : "Não informado";
    const attributionLines = attributionKeys
      .filter((key) => attribution[key])
      .map((key) => `${attributionLabels[key]}: ${attribution[key]}`);

    const message = [
      "*Olá, SparkFilmes!*",
      "Vi a landing page da promoção de Black Friday e gostaria de conversar sobre a produção de conteúdo.",
      "",
      "*Resumo do contato*",
      `Nome: ${data.get("nome")}`,
      `Nome da loja: ${data.get("loja")}`,
      `Bairro: ${data.get("bairro")}`,
      `Formato de interesse: ${data.get("modelo")}`,
      `Preciso dos conteúdos até: ${formattedDate}`,
      ...(attributionLines.length ? ["", "*Origem do anúncio*", ...attributionLines] : []),
      "",
      "Podemos conversar sobre a disponibilidade?"
    ].join("\n");

    trackWhatsAppContact(String(data.get("modelo") || "Não informado"));

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    const whatsappWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!whatsappWindow) window.location.href = url;
    setFeedback("Resumo pronto. Abrindo o WhatsApp…");
  });
})();
