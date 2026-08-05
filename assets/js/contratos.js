(function () {
  "use strict";

  const core = window.SparkContractCore;
  const form = document.getElementById("contract-form");
  if (!core || !form) return;

  const CONTRACT_DRAFT_KEY = "sparkfilmes-contract-draft";
  const CONTRACT_DRAFT_VERSION = 1;
  const byId = (id) => document.getElementById(id);
  const elements = {
    template: byId("contract-template"),
    templateDescription: byId("contract-template-description"),
    preview: byId("contract-preview"),
    previewStatus: byId("contract-preview-status"),
    feedback: byId("contract-feedback"),
    teamList: byId("contract-team-list"),
    deliveriesList: byId("contract-deliveries-list"),
    paymentsList: byId("contract-payments-list"),
    addTeam: byId("add-contract-team"),
    addDelivery: byId("add-contract-delivery"),
    addPayment: byId("add-contract-payment"),
    importButton: byId("contract-import"),
    importFile: byId("contract-import-file"),
    exportJson: byId("contract-export-json"),
    exportHtml: byId("contract-export-html"),
    print: byId("contract-print"),
    reset: byId("contract-reset")
  };
  const repeaters = {
    team: { list: elements.teamList, template: byId("contract-team-template"), empty: document.querySelector("[data-contract-team-empty]"), path: ["project", "team"] },
    delivery: { list: elements.deliveriesList, template: byId("contract-delivery-template"), empty: document.querySelector("[data-contract-deliveries-empty]"), path: ["project", "deliveries"] },
    payment: { list: elements.paymentsList, template: byId("contract-payment-template"), empty: document.querySelector("[data-contract-payments-empty]"), path: ["commercial", "payments"] }
  };

  let catalog = { modelos: [], termosPadrao: {} };
  let contract = createBlankContract();

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const readValue = (input) => input.type === "checkbox" ? input.checked : input.value;

  function createBlankContract(templateId) {
    const base = typeof core.createDefaultContract === "function"
      ? core.createDefaultContract(templateId ? { template: templateId } : {})
      : {};
    return typeof core.normalizeContract === "function" ? core.normalizeContract(base) : base;
  }

  function setFeedback(message, success) {
    elements.feedback.textContent = message || "";
    elements.feedback.classList.toggle("is-success", Boolean(success));
  }

  function getPath(target, path) {
    return String(path || "").split(".").reduce((value, key) => value == null ? undefined : value[key], target);
  }

  function setPath(target, path, value) {
    const keys = String(path || "").split(".");
    let cursor = target;
    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      if (isLast) {
        cursor[key] = value;
        return;
      }
      if (!isObject(cursor[key]) && !Array.isArray(cursor[key])) cursor[key] = /^\d+$/.test(keys[index + 1]) ? [] : {};
      cursor = cursor[key];
    });
  }

  async function loadCatalog() {
    try {
      const response = await fetch("../data/contratos.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Catálogo indisponível");
      const data = await response.json();
      if (isObject(data)) catalog = data;
    } catch (error) {
      // A ferramenta continua usando os modelos incorporados ao núcleo.
    }
  }

  function updateTemplateDescription() {
    const selected = (catalog.modelos || []).find((model) => model.id === contract.template);
    if (elements.templateDescription) {
      elements.templateDescription.textContent = selected?.descricao
        || "Escolha o modelo que mais se aproxima do serviço e adapte as cláusulas conforme necessário.";
    }
  }

  function writeContractToForm() {
    form.querySelectorAll("[data-path]").forEach((input) => {
      const value = getPath(contract, input.dataset.path);
      if (input.type === "checkbox") input.checked = Boolean(value);
      else input.value = value == null ? "" : value;
    });
    if (elements.template && contract.template) elements.template.value = contract.template;
    updateTemplateDescription();
  }

  function readRepeater(name) {
    const config = repeaters[name];
    const items = Array.from(config.list.querySelectorAll("[data-repeat-item]")).map((row) => {
      const item = {};
      row.querySelectorAll("[data-item-path]").forEach((input) => {
        item[input.dataset.itemPath] = readValue(input);
      });
      return item;
    });
    setPath(contract, config.path.join("."), items);
  }

  function readContractFromForm() {
    form.querySelectorAll("[data-path]").forEach((input) => {
      setPath(contract, input.dataset.path, readValue(input));
    });
    Object.keys(repeaters).forEach(readRepeater);
    if (typeof core.normalizeContract === "function") contract = core.normalizeContract(contract);
  }

  function renderRepeater(name) {
    const config = repeaters[name];
    const items = getPath(contract, config.path.join(".")) || [];
    config.list.innerHTML = "";
    items.forEach((item, index) => {
      const fragment = config.template.content.cloneNode(true);
      const row = fragment.querySelector("[data-repeat-item]");
      row.dataset.repeatIndex = String(index);
      row.querySelectorAll("[data-item-path]").forEach((input) => {
        const value = item[input.dataset.itemPath];
        input.value = value == null ? "" : value;
      });
      config.list.appendChild(fragment);
    });
    config.empty.hidden = items.length > 0;
  }

  function renderRepeaters() {
    Object.keys(repeaters).forEach(renderRepeater);
  }

  function validationMessages() {
    if (typeof core.validateForPrint === "function") {
      const result = core.validateForPrint(contract);
      return Array.isArray(result) ? result : (result?.errors || []);
    }
    if (typeof core.validateContract === "function") {
      const result = core.validateContract(contract);
      return Array.isArray(result) ? result : (result?.errors || []);
    }
    return [];
  }

  function refreshPreview() {
    updateTemplateDescription();
    const markup = typeof core.buildContractMarkup === "function"
      ? core.buildContractMarkup(contract, catalog)
      : "";
    if (markup) elements.preview.innerHTML = markup;
    const errors = validationMessages();
    if (errors.length) {
      elements.previewStatus.textContent = "Campos pendentes";
      elements.previewStatus.title = errors.join(" ");
    } else {
      elements.previewStatus.textContent = "Pronto para revisão";
      elements.previewStatus.removeAttribute("title");
    }
  }

  function loadBudgetDraft() {
    try {
      const raw = sessionStorage.getItem(CONTRACT_DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (!draft || draft.version !== CONTRACT_DRAFT_VERSION) return false;
      contract = typeof core.createContractFromBudget === "function"
        ? core.createContractFromBudget(draft, catalog)
        : createBlankContract(draft.contract?.templateId);
      sessionStorage.removeItem(CONTRACT_DRAFT_KEY);
      return true;
    } catch (error) {
      try {
        sessionStorage.removeItem(CONTRACT_DRAFT_KEY);
      } catch (storageError) {
        // Sem ação necessária quando a sessão não está disponível.
      }
      return false;
    }
  }

  function blankRepeaterItem(name) {
    if (name === "team") return { role: "", name: "", quantity: "1" };
    if (name === "delivery") return { description: "", quantity: "", deadline: "" };
    return { description: "", dueDate: "", amount: "", condition: "" };
  }

  function addRepeaterItem(name) {
    readContractFromForm();
    const config = repeaters[name];
    const items = getPath(contract, config.path.join(".")) || [];
    items.push(blankRepeaterItem(name));
    setPath(contract, config.path.join("."), items);
    renderRepeater(name);
    refreshPreview();
    config.list.querySelector("[data-repeat-item]:last-child input")?.focus();
  }

  function removeRepeaterItem(name, row) {
    readContractFromForm();
    const config = repeaters[name];
    const items = getPath(contract, config.path.join(".")) || [];
    items.splice(Number(row.dataset.repeatIndex), 1);
    setPath(contract, config.path.join("."), items);
    renderRepeater(name);
    refreshPreview();
  }

  function fileName(extension) {
    const reference = String(contract.meta?.number || contract.client?.name || "contrato")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "contrato";
    return "sparkfilmes-" + reference + "-" + new Date().toISOString().slice(0, 10) + "." + extension;
  }

  function download(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function normalizeImportedContract(payload) {
    if (typeof core.validateImport === "function") {
      const validation = core.validateImport(payload);
      if (validation === false) throw new Error("Arquivo inválido");
      if (Array.isArray(validation) && validation.length) throw new Error(validation.join(" "));
      if (isObject(validation) && validation.valid === false) throw new Error((validation.errors || ["Arquivo inválido"]).join(" "));
      if (isObject(validation?.contract)) return validation.contract;
    }
    if (typeof core.normalizeContract !== "function") throw new Error("Núcleo de contratos indisponível");
    return core.normalizeContract(payload);
  }

  async function importContract(file) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      contract = normalizeImportedContract(payload);
      writeContractToForm();
      renderRepeaters();
      refreshPreview();
      setFeedback("Contrato importado. Revise os dados antes de gerar a versão final.", true);
    } catch (error) {
      setFeedback("Não foi possível importar este arquivo. Escolha um JSON exportado pela ferramenta de contratos.");
    } finally {
      elements.importFile.value = "";
    }
  }

  function exportContractJson() {
    readContractFromForm();
    const payload = typeof core.serializeContract === "function" ? core.serializeContract(contract) : contract;
    const content = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    download(content, "application/json", fileName("json"));
    setFeedback("Dados do contrato exportados em JSON.", true);
  }

  function contractHtml() {
    readContractFromForm();
    if (typeof core.buildPrintableHtml !== "function") return "";
    return core.buildPrintableHtml(contract, catalog);
  }

  function exportContractHtml() {
    const html = contractHtml();
    if (!html) {
      setFeedback("Não foi possível preparar o HTML do contrato.");
      return;
    }
    download(html, "text/html;charset=utf-8", fileName("html"));
    setFeedback("Contrato exportado em HTML.", true);
  }

  function printContract() {
    readContractFromForm();
    const errors = validationMessages();
    if (errors.length) {
      setFeedback("Antes de imprimir, complete: " + errors.slice(0, 4).join(" · "));
      return;
    }
    const html = typeof core.buildPrintableHtml === "function" ? core.buildPrintableHtml(contract, catalog) : "";
    if (!html) {
      setFeedback("Não foi possível preparar a versão de impressão.");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setFeedback("Não foi possível abrir a impressão. Verifique se o navegador bloqueou a nova janela.");
      return;
    }
    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setFeedback("Documento aberto. Na janela de impressão, escolha Salvar como PDF.", true);
  }

  function resetContract() {
    if (!window.confirm("Começar um contrato em branco? Os dados atuais desta página serão descartados.")) return;
    contract = createBlankContract();
    writeContractToForm();
    renderRepeaters();
    refreshPreview();
    setFeedback("Novo contrato em branco iniciado.", true);
    byId("contract-template")?.focus();
  }

  function bindEvents() {
    const update = () => {
      readContractFromForm();
      refreshPreview();
      setFeedback("");
    };
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    elements.addTeam.addEventListener("click", () => addRepeaterItem("team"));
    elements.addDelivery.addEventListener("click", () => addRepeaterItem("delivery"));
    elements.addPayment.addEventListener("click", () => addRepeaterItem("payment"));

    Object.entries(repeaters).forEach(([name, config]) => {
      config.list.addEventListener("click", (event) => {
        const button = event.target.closest("[data-remove-item]");
        if (button) removeRepeaterItem(name, button.closest("[data-repeat-item]"));
      });
    });

    elements.importButton.addEventListener("click", () => elements.importFile.click());
    elements.importFile.addEventListener("change", () => importContract(elements.importFile.files?.[0]));
    elements.exportJson.addEventListener("click", exportContractJson);
    elements.exportHtml.addEventListener("click", exportContractHtml);
    elements.print.addEventListener("click", printContract);
    elements.reset.addEventListener("click", resetContract);
  }

  // CONTROLLER_EVENTS

  async function initialize() {
    await loadCatalog();
    const importedFromBudget = loadBudgetDraft();
    writeContractToForm();
    renderRepeaters();
    refreshPreview();
    bindEvents();
    if (importedFromBudget) setFeedback("Dados do orçamento carregados. Complete os campos jurídicos antes de imprimir.", true);
  }

  initialize();
})();
