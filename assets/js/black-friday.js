(() => {
  const body = document.body;
  const form = document.querySelector("[data-bf-form]");
  const feedback = document.querySelector("[data-bf-feedback]");
  const dateInput = document.querySelector("#bf-prazo");
  const whatsappNumber = String(body?.dataset.whatsappNumber || "").trim();

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
      service_type: serviceType
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
