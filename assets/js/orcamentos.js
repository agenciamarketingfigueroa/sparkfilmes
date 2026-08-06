(function () {
  "use strict";

  const core = window.SparkBudgetCore;
  if (!core) return;

  const BUDGET_CACHE_KEY = "sparkfilmes-last-budget";
  const BUDGET_EXPORT_VERSION = 3;
  const CONTRACT_DRAFT_KEY = "sparkfilmes-contract-draft";
  const CONTRACT_DRAFT_VERSION = 1;
  const byId = (id) => document.getElementById(id);
  const form = byId("budget-form");
  if (!form) return;

  const elements = {
    clientName: byId("client-name"),
    contact: byId("client-contact"),
    startTime: byId("start-time"),
    endTime: byId("end-time"),
    venueName: byId("venue-name"),
    locationLink: byId("location-link"),
    serviceLocationFields: Array.from(document.querySelectorAll(".service-location-field")),
    projectType: byId("project-type"),
    formatInputs: Array.from(document.querySelectorAll(".service-format-input")),
    model: byId("contract-model"),
    desiredDate: byId("desired-date"),
    serviceTitle: byId("service-title"),
    emptyConfiguration: byId("empty-configuration"),
    packagePanel: byId("package-panel"),
    packageTemplate: byId("package-template"),
    packageProfessional: byId("package-professional"),
    packageQuantity: byId("package-quantity"),
    packageMinutes: byId("package-minutes"),
    packageScope: byId("package-scope"),
    eventPackagePanel: byId("event-package-panel"),
    genericPackagePanel: byId("generic-package-panel"),
    eventPackageOptions: byId("event-package-options"),
    eventPackageQuantity: byId("event-package-quantity"),
    eventPackageTeam: byId("event-package-team"),
    eventPackageName: byId("event-package-name"),
    eventPackagePrice: byId("event-package-price"),
    eventPackageDeliveries: byId("event-package-deliveries"),
    eventSelectedTools: byId("event-selected-tools"),
    selectedEventPackage: byId("selected-event-package"),
    allPackagesMessage: byId("all-packages-message"),
    eventStageItems: byId("event-stage-items"),
    eventStageTotalMinutes: byId("event-stage-total-minutes"),
    eventTechnicalCost: byId("event-technical-cost"),
    technicalPanel: byId("technical-panel"),
    technicalProfessional: byId("technical-professional"),
    technicalUnit: byId("technical-unit"),
    technicalMinutes: byId("technical-minutes"),
    customPanel: byId("custom-panel"),
    customTemplate: byId("custom-template"),
    lineItems: byId("line-items"),
    addLine: byId("add-line"),
    pricingBox: byId("pricing-box"),
    referenceLabel: byId("reference-label"),
    referenceValue: byId("reference-value"),
    referenceDetail: byId("reference-detail"),
    serviceValue: byId("service-value"),
    useReference: byId("use-reference"),
    partnershipLevel: byId("partnership-level"),
    locationFields: byId("location-fields"),
    address: byId("address"),
    distanceKm: byId("distance-km"),
    travelTime: byId("travel-time"),
    travelFee: byId("travel-fee"),
    foodFee: byId("food-fee"),
    travelExtras: byId("travel-extras"),
    notes: byId("notes"),
    contractDetails: byId("contract-details"),
    contractTemplate: byId("contract-template"),
    contractClientLegalName: byId("contract-client-legal-name"),
    contractClientDocument: byId("contract-client-document"),
    contractClientRepresentative: byId("contract-client-representative"),
    contractClientRepresentativeDocument: byId("contract-client-representative-document"),
    contractClientEmail: byId("contract-client-email"),
    contractClientZip: byId("contract-client-zip"),
    contractClientAddress: byId("contract-client-address"),
    contractClientAddressNumber: byId("contract-client-address-number"),
    contractClientNeighborhood: byId("contract-client-neighborhood"),
    contractClientCityState: byId("contract-client-city-state"),
    contractDeliveryDate: byId("contract-delivery-date"),
    contractRevisions: byId("contract-revisions"),
    contractPaymentMethod: byId("contract-payment-method"),
    contractPaymentDescription: byId("contract-payment-description"),
    contractEntryValue: byId("contract-entry-value"),
    contractEntryDate: byId("contract-entry-date"),
    contractInstallments: byId("contract-installments"),
    contractInstallmentFirstDate: byId("contract-installment-first-date"),
    contractValidityStart: byId("contract-validity-start"),
    contractValidityEnd: byId("contract-validity-end"),
    contractRightsUse: byId("contract-rights-use"),
    contractCancellation: byId("contract-cancellation"),
    contractSignatureCity: byId("contract-signature-city"),
    contractForum: byId("contract-forum"),
    previewType: byId("preview-type"),
    previewTitle: byId("preview-title"),
    previewDescription: byId("preview-description"),
    previewClient: byId("preview-client"),
    previewContact: byId("preview-contact"),
    previewPackageDeliveries: byId("preview-package-deliveries"),
    previewFormat: byId("preview-format"),
    previewDate: byId("preview-date"),
    previewTime: byId("preview-time"),
    previewLocation: byId("preview-location"),
    previewLocationWrap: byId("preview-location-wrap"),
    previewLocationLink: byId("preview-location-link"),
    previewTeam: byId("preview-team"),
    previewAttendance: byId("preview-attendance"),
    previewHours: byId("preview-hours"),
    previewServices: byId("preview-services"),
    previewServicesLabel: byId("preview-services-label"),
    previewTravel: byId("preview-travel"),
    previewTotal: byId("preview-total"),
    previewTotalLabel: byId("preview-total-label"),
    sendWhatsapp: byId("send-whatsapp"),
    generatePdf: byId("generate-pdf"),
    createContract: byId("create-contract"),
    exportBudget: byId("export-budget"),
    importBudget: byId("import-budget"),
    importBudgetFile: byId("import-budget-file"),
    copyMessage: byId("copy-message"),
    clearBudget: byId("clear-budget"),
    feedback: byId("budget-feedback")
  };

  let catalog = null;
  let customLines = [];
  let eventStageLines = [];
  let selectedEventPackageId = "";
  let manualServiceValue = false;
  let currentInput = {};
  let currentTotals = core.calculateBudget({});

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const localIsoDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatBrazilianPhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const brazilianWhatsAppNumber = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length === 10 || digits.length === 11 ? `55${digits}` : "";
  };

  const selectedRadioValue = (name, fallback = "") =>
    form.querySelector('input[name="' + name + '"]:checked')?.value || fallback;

  const readContractData = () => {
    const readValue = (element) => String(element?.value || "").trim();
    return {
      templateId: readValue(elements.contractTemplate),
      clientType: selectedRadioValue("contract-party-type", "juridica") === "fisica" ? "pf" : "pj",
      clientLegalName: readValue(elements.contractClientLegalName),
      clientDocument: readValue(elements.contractClientDocument),
      clientRepresentative: readValue(elements.contractClientRepresentative),
      clientRepresentativeDocument: readValue(elements.contractClientRepresentativeDocument),
      clientEmail: readValue(elements.contractClientEmail),
      clientZip: readValue(elements.contractClientZip),
      clientAddress: readValue(elements.contractClientAddress),
      clientAddressNumber: readValue(elements.contractClientAddressNumber),
      clientNeighborhood: readValue(elements.contractClientNeighborhood),
      clientCityState: readValue(elements.contractClientCityState),
      deliveryDate: readValue(elements.contractDeliveryDate),
      revisions: readValue(elements.contractRevisions),
      paymentMethod: readValue(elements.contractPaymentMethod),
      paymentDescription: readValue(elements.contractPaymentDescription),
      entryValue: readValue(elements.contractEntryValue),
      entryDate: readValue(elements.contractEntryDate),
      installments: readValue(elements.contractInstallments),
      installmentFirstDate: readValue(elements.contractInstallmentFirstDate),
      billingType: selectedRadioValue("contract-billing-type", "unica"),
      validityStart: readValue(elements.contractValidityStart),
      validityEnd: readValue(elements.contractValidityEnd),
      rightsUse: readValue(elements.contractRightsUse),
      cancellation: readValue(elements.contractCancellation),
      signatureCity: readValue(elements.contractSignatureCity),
      forum: readValue(elements.contractForum)
    };
  };

  const suggestedContractTemplate = (projectType) => {
    if (projectType === "evento" || projectType === "fotografia") return "eventos";
    if (projectType === "institucional") return "institucional";
    if (["social", "campanha", "podcast", "motion", "edicao-conteudo"].includes(projectType)) return "conteudos";
    return "personalizado";
  };

  const createContractDraft = () => {
    currentInput = collectInput(true);
    currentTotals = core.calculateBudget(currentInput);
    const errors = core.validateBudget(currentInput);
    if (errors.length) {
      setFeedback(errors.map((error) => "• " + error).join("\n"));
      return;
    }
    if (currentInput.projectType === "evento" && currentInput.eventQuoteMode === "todos") {
      setFeedback("Escolha um pacote de evento antes de criar o contrato. A opção com os três pacotes ainda não define um escopo único.");
      return;
    }

    const contract = readContractData();
    if (!contract.templateId) contract.templateId = suggestedContractTemplate(currentInput.projectType);
    const draft = {
      version: CONTRACT_DRAFT_VERSION,
      createdAt: new Date().toISOString(),
      sourceBudget: {
        input: currentInput,
        totals: currentTotals,
        quotedAt: new Date().toISOString(),
        catalogVersion: catalog?.meta?.versao || null
      },
      contract
    };

    try {
      sessionStorage.setItem(CONTRACT_DRAFT_KEY, JSON.stringify(draft));
      window.location.assign("../contratos/?origem=orcamento");
    } catch (error) {
      setFeedback("Não foi possível preparar o contrato neste navegador. Verifique se o armazenamento da sessão está disponível.");
    }
  };

  const fillSelect = (select, items, placeholder = "") => {
    const options = [];
    if (placeholder) options.push(`<option value="">${escapeHtml(placeholder)}</option>`);
    options.push(...items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.nome)}</option>`));
    select.innerHTML = options.join("");
  };

  const getProfessional = (id) =>
    catalog?.profissionais.find((professional) => professional.id === id) || catalog?.profissionais[0];

  const getTemplate = (id) => catalog?.templates.find((template) => template.id === id) || catalog?.templates[0];
  const getEventPackage = (id = selectedEventPackageId) =>
    catalog?.pacotesEventos.find((eventPackage) => eventPackage.id === id) || catalog?.pacotesEventos[0];
  const getProjectType = (id) => catalog?.tiposProducao.find((type) => type.id === id);
  const getModel = (id) => catalog?.modelosContratacao.find((model) => model.id === id);
  const isEventPackageMode = () => elements.projectType.value === "evento" && elements.model.value === "pacote";
  const getEventQuoteMode = () => form.querySelector('input[name="event-quote-mode"]:checked')?.value || "escolhido";

  const professionalOptions = (selectedId, includeEmpty = false) => {
    const options = includeEmpty ? ['<option value="">—</option>'] : [];
    catalog.profissionais.forEach((professional) => {
      const selected = professional.id === selectedId ? " selected" : "";
      options.push(`<option value="${professional.id}"${selected}>${escapeHtml(professional.nome)}</option>`);
    });
    return options.join("");
  };

  const setFeedback = (message = "", success = false) => {
    elements.feedback.textContent = message;
    elements.feedback.classList.toggle("is-success", success);
  };

  const partnershipOptions = {
    novo: { name: "Novo", discount: 0 },
    indicacao: { name: "Indicação", discount: 0.1 },
    parceiro: { name: "Parceiro", discount: 0.2 },
    familia: { name: "Família", discount: 0.3 }
  };

  const selectedServiceFormats = () => elements.formatInputs
    .filter((input) => input.checked)
    .map((input) => {
      const quantityInput = input.closest(".service-format-option")?.querySelector(".service-format-quantity");
      return {
        name: input.value,
        professionalId: input.dataset.professionalId || "",
        quantity: quantityInput ? Math.max(1, core.asNumber(quantityInput.value) || 1) : 0
      };
    });

  const formatServiceTeam = (formats = selectedServiceFormats()) => formats
    .map((item) => {
      if (item.quantity <= 1) return item.name;
      const pluralNames = { Storiemaker: "Storiemakers", Fotografia: "Fotógrafos", Vídeo: "Videomakers", Edição: "Editores" };
      return `(${String(item.quantity).padStart(2, "0")}) ${pluralNames[item.name] || item.name}`;
    })
    .join(" + ");

  const updateFormats = () => {
    elements.formatInputs.forEach((input) => {
      const quantityInput = input.closest(".service-format-option")?.querySelector(".service-format-quantity");
      if (quantityInput) quantityInput.disabled = !input.checked;
    });
  };

  const updateServiceLocationFields = () => {
    const isEditingService = elements.projectType.value === "edicao-conteudo";
    elements.serviceLocationFields.forEach((field) => {
      field.hidden = isEditingService;
    });
    const inPersonOption = form.querySelector('input[name="attendance"][value="presencial"]');
    if (inPersonOption) inPersonOption.disabled = isEditingService;
    if (isEditingService) form.querySelector('input[name="attendance"][value="remoto"]').checked = true;
  };

  const currentPartnership = () => partnershipOptions[elements.partnershipLevel.value] || partnershipOptions.novo;

  const teamQuantityFor = (professionalId) => {
    const format = selectedServiceFormats().find((item) => item.professionalId === professionalId);
    return format?.quantity || 1;
  };

  const eventPackageProfessionalIds = (eventPackage) => {
    if (eventPackage?.id === "essencial") return ["fotografo", "storymaker"];
    if (eventPackage?.id === "spark") return ["fotografo", "videomaker"];
    return ["fotografo", "videomaker", "storymaker"];
  };

  const sharedEventStageLines = () => {
    if (eventStageLines.length) return eventStageLines;
    const flamePackage = catalog.pacotesEventos.find((eventPackage) => eventPackage.id === "flame") || catalog.pacotesEventos[0];
    return (flamePackage?.etapas || []).map((stage) => ({
      name: stage.nome,
      professionalId: stage.profissionalId,
      minutes: stage.minutos
    }));
  };

  const calculateEventPackageQuote = (eventPackage) => core.calculateBudget({
    model: "pacote",
    projectType: "evento",
    eventPackageId: eventPackage.id,
    eventPackageQuantity: 1,
    eventStageLines: sharedEventStageLines()
      .filter((stage) => eventPackageProfessionalIds(eventPackage).includes(stage.professionalId))
      .map((stage) => ({
        ...stage,
        hourlyRate: getProfessional(stage.professionalId)?.valorHora || 0,
        quantity: teamQuantityFor(stage.professionalId)
      })),
    partnershipDiscount: currentPartnership().discount
  });

  const updateEventPackageOptionPrices = () => {
    catalog.pacotesEventos.forEach((eventPackage) => {
      const price = core.money(calculateEventPackageQuote(eventPackage).reference);
      const target = elements.eventPackageOptions.querySelector(`[data-event-package-price="${eventPackage.id}"]`);
      if (target) target.textContent = price;
    });
  };

  const updatePackageScope = () => {
    const template = getTemplate(elements.packageTemplate.value);
    elements.packageScope.textContent = template ? template.etapas.map((step) => step.nome).join(" · ") : "Selecione uma complexidade.";
  };

  const renderEventPackageOptions = () => {
    elements.eventPackageOptions.innerHTML = catalog.pacotesEventos
      .map((eventPackage, index) => `
        <label class="event-package-option">
          <input type="radio" name="event-package" value="${eventPackage.id}" ${index === 0 ? "checked" : ""} />
          <span class="event-package-option-content">
            <strong class="event-package-option-name">${escapeHtml(eventPackage.nome)}</strong>
            <small>${escapeHtml(eventPackage.subtitulo)}</small>
            <strong class="event-package-option-price" data-event-package-price="${eventPackage.id}">${core.money(calculateEventPackageQuote(eventPackage).reference)}</strong>
          </span>
        </label>`)
      .join("");
    selectedEventPackageId = catalog.pacotesEventos[0]?.id || "";
  };

  const readEventStageLines = () => {
    eventStageLines = Array.from(elements.eventStageItems.querySelectorAll("[data-event-stage-index]")).map((row) => {
      const professional = getProfessional(row.dataset.professionalId);
      return {
        name: row.dataset.stageName,
        professionalId: professional.id,
        professionalName: professional.nome,
        minutes: core.asNumber(row.querySelector(".event-stage-minutes-input").value),
        hourlyRate: professional.valorHora,
        quantity: teamQuantityFor(professional.id)
      };
    });
    return eventStageLines;
  };

  const renderEventStageLines = () => {
    const stageMarkup = (line, index) => {
        const professional = getProfessional(line.professionalId);
        return `
          <div class="event-stage-item" data-event-stage-index="${index}" data-stage-name="${escapeHtml(line.name)}" data-professional-id="${professional.id}">
            <div class="event-stage-name">
              <strong>${escapeHtml(line.name)}</strong>
              <small>${core.money(professional.valorHora)}/hora</small>
            </div>
            <span class="event-stage-role">${escapeHtml(professional.nome)}</span>
            <label class="event-stage-minutes">
              <input class="event-stage-minutes-input" type="number" min="0" step="5" value="${line.minutes}" aria-label="Minutos em ${escapeHtml(line.name)}" />
              <span>min</span>
            </label>
            <strong class="event-stage-cost">${core.money((line.minutes / 60) * professional.valorHora * (line.quantity || 1))}</strong>
          </div>`;
      };

    elements.eventStageItems.innerHTML = catalog.profissionais
      .map((professional) => {
        const stages = eventStageLines
          .map((line, index) => ({ line, index }))
          .filter(({ line }) => line.professionalId === professional.id);
        return `
          <section class="event-stage-professional">
            <header><h4>${escapeHtml(professional.nome)}</h4><span>${core.money(professional.valorHora)}/hora</span></header>
            <div class="event-stage-professional-items">${stages.map(({ line, index }) => stageMarkup(line, index)).join("")}</div>
          </section>`;
      })
      .join("");
  };

  const loadEventPackage = (packageId, force = false) => {
    const eventPackage = getEventPackage(packageId);
    if (!eventPackage) return;
    selectedEventPackageId = eventPackage.id;

    if (force || eventStageLines.length === 0) {
      const flamePackage = getEventPackage("flame") || eventPackage;
      eventStageLines = flamePackage.etapas.map((stage) => ({
        name: stage.nome,
        professionalId: stage.profissionalId,
        minutes: stage.minutos
      }));
      renderEventStageLines();
    }

    elements.eventPackageTeam.textContent = `${eventPackage.profissionaisEmCampo} ${eventPackage.profissionaisEmCampo === 1 ? "profissional em campo" : "profissionais em campo"} · ${eventPackage.subtitulo}`;
    elements.eventPackageName.textContent = eventPackage.nome;
    elements.eventPackagePrice.textContent = core.money(calculateEventPackageQuote(eventPackage).reference);
    elements.eventPackageDeliveries.innerHTML = eventPackage.entregas.map((delivery) => `<li>${escapeHtml(delivery)}</li>`).join("");
  };

  const updateEventStageCosts = () => {
    elements.eventStageItems.querySelectorAll("[data-event-stage-index]").forEach((row) => {
      const professional = getProfessional(row.dataset.professionalId);
      const minutes = core.asNumber(row.querySelector(".event-stage-minutes-input").value);
      row.querySelector(".event-stage-cost").textContent = core.money((minutes / 60) * professional.valorHora * teamQuantityFor(professional.id));
    });
  };

  const normalizeCustomTimeLine = (line) => line?.billingType === "hora"
    ? {
        ...line,
        billingType: "minuto",
        quantity: core.asNumber(line.quantity) * 60,
        unitValue: core.asNumber(line.unitValue)
      }
    : line?.billingType === "fixo"
      ? line
      : { ...line, billingType: "minuto" };

  const readCustomLines = () => {
    customLines = Array.from(elements.lineItems.querySelectorAll("[data-line-index]")).map((row) => {
      const billingType = row.dataset.billingType;
      const rate = core.asNumber(row.querySelector(".line-rate").value);
      return {
        name: row.querySelector(".line-name").value.trim() || "Etapa sem nome",
        billingType,
        professionalId: row.querySelector(".line-professional").value,
        quantity: core.asNumber(row.querySelector(".line-quantity").value),
        unitValue: billingType === "minuto" ? rate / 60 : rate
      };
    });
    return customLines;
  };

  const renderCustomLines = () => {
    customLines = customLines.map(normalizeCustomTimeLine);
    if (customLines.length === 0) {
      elements.lineItems.innerHTML = '<div class="empty-configuration">Nenhuma etapa adicionada.</div>';
      return;
    }

    elements.lineItems.innerHTML = customLines
      .map((line, index) => {
        const isMinute = line.billingType === "minuto";
<<<<<<< HEAD
        const isTimeBased = isHourly || isMinute;
        const quantityLabel = isMinute ? "Minutos" : isHourly ? "Horas" : "Qtd.";
        const lineTotal = line.quantity * line.unitValue;
        const displayedRate = isMinute ? line.unitValue * 60 : line.unitValue;
=======
        const isTimeBased = isMinute;
        const quantityLabel = isMinute ? "Minutos" : "Qtd.";
>>>>>>> 02973ca0b850b7b78b04dbad2991c959c118d8f7
        const professionalSelect = isTimeBased
          ? professionalOptions(line.professionalId)
          : '<option value="">Custo direto</option>';
        return `
          <div class="line-item" data-line-index="${index}" data-billing-type="${line.billingType}">
            <label class="field">
              <span>Etapa</span>
              <input class="line-name" type="text" maxlength="90" value="${escapeHtml(line.name)}" />
            </label>
            <label class="field">
              <span>Profissional</span>
              <select class="line-professional" ${isTimeBased ? "" : "disabled"}>${professionalSelect}</select>
            </label>
            <label class="field">
              <span>${quantityLabel}</span>
              <input class="line-quantity" type="number" min="0" step="${isMinute ? "5" : "1"}" value="${line.quantity}" />
            </label>
            <label class="field">
<<<<<<< HEAD
              <span>${isTimeBased ? "Valor/hora." : "Valor unit."}</span>
              <input class="line-rate" type="number" min="0" step="0.01" value="${isMinute ? displayedRate : core.roundMoney(displayedRate)}" />
            </label>
            <div class="line-total" aria-label="Total da etapa">${core.money(lineTotal)}</div>
=======
              <span>${isMinute ? "Valor/hora" : "Valor unit."}</span>
              <input class="line-rate" type="number" min="0" step="0.01" value="${core.roundMoney(line.unitValue)}" />
            </label>
            <div class="line-total" aria-label="Total da etapa">${core.money(isMinute ? (line.quantity / 60) * line.unitValue : line.quantity * line.unitValue)}</div>
>>>>>>> 02973ca0b850b7b78b04dbad2991c959c118d8f7
            <button class="remove-line" type="button" data-remove-line="${index}" aria-label="Remover ${escapeHtml(line.name)}">×</button>
          </div>`;
      })
      .join("");
  };

  const loadTemplateLines = () => {
    const template = getTemplate(elements.customTemplate.value);
    if (!template) return;
    const defaultProfessional = catalog.profissionais[0];
    customLines = template.etapas.map((step) => {
      const professional = getProfessional(step.profissionalId) || defaultProfessional;
      const isFixed = step.tipoCobranca === "fixo";
      return {
        name: step.nome,
<<<<<<< HEAD
        billingType: step.tipoCobranca,
        professionalId: professional.id,
        quantity: step.tipoCobranca === "fixo" ? 1 : 0,
        unitValue: step.tipoCobranca === "fixo"
          ? 0
          : step.tipoCobranca === "minuto"
            ? professional.valorHora / 60
            : professional.valorHora
=======
        billingType: isFixed ? "fixo" : "minuto",
        professionalId: professional.id,
        quantity: isFixed ? 1 : 0,
        unitValue: isFixed ? 0 : professional.valorHora
>>>>>>> 02973ca0b850b7b78b04dbad2991c959c118d8f7
      };
    });
    renderCustomLines();
    refresh();
  };

  const updateModelPanels = () => {
    const model = elements.model.value;
    const eventPackageMode = isEventPackageMode();
    const presentingAllPackages = eventPackageMode && getEventQuoteMode() === "todos";
    elements.emptyConfiguration.hidden = Boolean(model);
    elements.packagePanel.hidden = model !== "pacote";
    elements.eventPackagePanel.hidden = !eventPackageMode;
    elements.genericPackagePanel.hidden = eventPackageMode;
    elements.technicalPanel.hidden = model !== "tecnico";
    elements.customPanel.hidden = model !== "sob-medida";
    elements.pricingBox.hidden = !model || presentingAllPackages;
    elements.eventSelectedTools.hidden = false;
    elements.selectedEventPackage.hidden = presentingAllPackages;
    elements.allPackagesMessage.hidden = !presentingAllPackages;

    if (eventPackageMode) {
      const checkedPackage = elements.eventPackageOptions.querySelector('input[name="event-package"]:checked');
      loadEventPackage(checkedPackage?.value || selectedEventPackageId, eventStageLines.length === 0);
    }
    if (model === "sob-medida" && customLines.length === 0) loadTemplateLines();
    if (!elements.serviceTitle.value.trim()) {
      if (eventPackageMode) elements.serviceTitle.value = presentingAllPackages
        ? "Opções de cobertura de evento"
        : getEventPackage()?.nome || "Cobertura de evento";
      else if (model === "pacote") elements.serviceTitle.value = `Pacote ${getTemplate(elements.packageTemplate.value)?.nome || "audiovisual"}`;
      if (model === "tecnico") elements.serviceTitle.value = `Contratação de ${getProfessional(elements.technicalProfessional.value)?.nome || "profissional"}`;
      if (model === "sob-medida") elements.serviceTitle.value = `${getTemplate(elements.customTemplate.value)?.nome || "Projeto audiovisual"}`;
    }
  };

  const collectInput = (includeManualValue = manualServiceValue) => {
    const projectType = getProjectType(elements.projectType.value);
    const model = getModel(elements.model.value);
    const attendance = form.querySelector('input[name="attendance"]:checked')?.value || "remoto";
    const packageProfessional = getProfessional(elements.packageProfessional.value);
    const technicalProfessional = getProfessional(elements.technicalProfessional.value);
    const customInputLines = elements.model.value === "sob-medida" ? readCustomLines() : [];
    const eventPackageMode = isEventPackageMode();
    const eventPackage = eventPackageMode ? getEventPackage() : null;
    const sharedEventInputLines = eventPackageMode ? readEventStageLines() : [];
    const eventInputLines = eventPackage
      ? sharedEventInputLines.filter((line) => eventPackageProfessionalIds(eventPackage).includes(line.professionalId))
      : [];
    const partnership = currentPartnership();
    const serviceFormats = selectedServiceFormats();

    return {
      clientName: elements.clientName.value.trim(),
      contact: elements.contact.value.trim(),
      startTime: elements.startTime.value,
      endTime: elements.endTime.value,
      venueName: elements.venueName.value.trim(),
      locationLink: elements.locationLink.value.trim(),
      projectType: elements.projectType.value,
      projectTypeName: projectType?.nome || "",
      format: formatServiceTeam(serviceFormats),
      serviceFormats,
      model: elements.model.value,
      modelName: model?.nome || "",
      partnershipName: partnership.name,
      partnershipDiscount: partnership.discount,
      desiredDate: elements.desiredDate.value,
      serviceTitle: elements.serviceTitle.value.trim(),
      packageTemplateName: getTemplate(elements.packageTemplate.value)?.nome || "",
      packageQuantity: elements.packageQuantity.value,
      minutesPerPackage: elements.packageMinutes.value,
      eventPackageId: eventPackage?.id || "",
      eventQuoteMode: eventPackageMode ? getEventQuoteMode() : "escolhido",
      eventPackageName: eventPackage?.nome || "",
      eventPackageTeam: eventPackage
        ? `${eventPackage.profissionaisEmCampo} ${eventPackage.profissionaisEmCampo === 1 ? "profissional" : "profissionais"} · ${eventPackage.subtitulo}`
        : "",
      eventPackageQuantity: elements.eventPackageQuantity.value,
      eventCoverageHours: eventPackage?.horasCoberturaIncluidas,
      eventPackageDeliveries: eventPackage?.entregas || [],
      allEventPackages: eventPackageMode
        ? catalog.pacotesEventos.map((item) => ({
            name: item.nome,
            price: calculateEventPackageQuote(item).reference,
            team: `${item.profissionaisEmCampo} ${item.profissionaisEmCampo === 1 ? "profissional" : "profissionais"} · ${item.subtitulo}`,
            deliveries: item.entregas
          }))
        : [],
      eventStageLines: eventInputLines,
      hourlyRate: elements.model.value === "tecnico" ? technicalProfessional?.valorHora : packageProfessional?.valorHora,
      professionalName: elements.model.value === "tecnico" ? technicalProfessional?.nome : packageProfessional?.nome,
      technicalUnit: elements.technicalUnit.value,
      technicalMinutes: elements.technicalMinutes.value,
      lines: customInputLines,
      serviceValue: includeManualValue ? Number(elements.serviceValue.value) : undefined,
      attendance,
      address: elements.address.value.trim(),
      distanceKm: elements.distanceKm.value,
      travelTime: elements.travelTime.value,
      travelFee: elements.travelFee.value,
      foodFee: elements.foodFee.value,
      travelExtras: elements.travelExtras.value,
      notes: elements.notes.value.trim()
    };
  };

  const updateLineTotals = () => {
    elements.lineItems.querySelectorAll("[data-line-index]").forEach((row) => {
      const quantity = core.asNumber(row.querySelector(".line-quantity").value);
      const rate = core.asNumber(row.querySelector(".line-rate").value);
<<<<<<< HEAD
      const billedQuantity = row.dataset.billingType === "minuto" ? quantity / 60 : quantity;
      row.querySelector(".line-total").textContent = core.money(billedQuantity * rate);
=======
      const total = row.dataset.billingType === "minuto" ? (quantity / 60) * rate : quantity * rate;
      row.querySelector(".line-total").textContent = core.money(total);
>>>>>>> 02973ca0b850b7b78b04dbad2991c959c118d8f7
    });
  };

  const renderPreview = () => {
    const input = currentInput;
    const totals = currentTotals;
    const eventPackageMode = Boolean(input.eventPackageId);
    const presentingAllPackages = eventPackageMode && input.eventQuoteMode === "todos";
    const modelDescription = {
      pacote: `${totals.quantity} ${totals.unitLabel} · aproximadamente ${core.formatHours(totals.estimatedHours)}`,
      tecnico: `Aproximadamente ${core.formatHours(totals.estimatedHours)} de trabalho`,
      "sob-medida": `${totals.quantity} ${totals.unitLabel} · aproximadamente ${core.formatHours(totals.estimatedHours)}`
    };

    elements.previewType.textContent = input.projectTypeName || "Produção audiovisual";
    elements.previewTitle.textContent = input.serviceTitle || "Seu orçamento começa aqui";
    elements.previewClient.textContent = input.clientName || "A definir";
    elements.previewContact.textContent = input.contact || "A definir";
    elements.previewDescription.textContent = presentingAllPackages
      ? "Essencial, Spark e Flame para o cliente comparar e escolher."
      : eventPackageMode
        ? `${input.eventPackageTeam} · até ${input.eventCoverageHours} horas de cobertura`
      : input.model
        ? modelDescription[input.model]
        : "Preencha os dados ao lado para montar a estimativa.";
    elements.previewPackageDeliveries.hidden = !eventPackageMode;
    elements.previewPackageDeliveries.innerHTML = presentingAllPackages
      ? input.allEventPackages.map((item) => `<li><strong>${escapeHtml(item.name)} — ${core.money(item.price)}</strong><br>${escapeHtml(item.team)}</li>`).join("")
      : eventPackageMode
        ? input.eventPackageDeliveries.map((delivery) => `<li>${escapeHtml(delivery)}</li>`).join("")
        : "";
    elements.previewFormat.textContent = input.format || "A definir";
    elements.previewDate.textContent = core.formatDate(input.desiredDate);
    elements.previewTime.textContent = input.startTime || input.endTime
      ? `${input.startTime || "?"} às ${input.endTime || "?"}`
      : "A definir";
    elements.previewLocation.textContent = [input.venueName, input.address].filter(Boolean).join(" · ") || "A definir";
    const safeLocationLink = /^https?:\/\//i.test(input.locationLink) ? input.locationLink : "";
    elements.previewLocationWrap.hidden = !safeLocationLink;
    if (safeLocationLink) elements.previewLocationLink.href = safeLocationLink;
    elements.previewTeam.textContent = input.format || "A definir";
    elements.previewAttendance.textContent = input.attendance === "presencial" ? "Presencial" : "Remoto";
    elements.previewHours.textContent = presentingAllPackages
      ? "Após a escolha"
      : core.formatHours(totals.estimatedHours);
    elements.previewServicesLabel.textContent = presentingAllPackages ? "Opções de investimento" : "Serviços";
    elements.previewServices.textContent = presentingAllPackages
      ? `${core.money(Math.min(...input.allEventPackages.map((item) => item.price)))} a ${core.money(Math.max(...input.allEventPackages.map((item) => item.price)))}`
      : core.money(totals.services);
    elements.previewTravel.textContent = core.money(totals.travel);
    elements.previewTotalLabel.textContent = presentingAllPackages ? "Definição do cliente" : "Total estimado";
    elements.previewTotal.textContent = presentingAllPackages ? "A escolher" : core.money(totals.total);
  };

  const refresh = () => {
    if (!catalog) return;
    updateLineTotals();
    updateEventStageCosts();
    updateEventPackageOptionPrices();
    const referenceInput = collectInput(false);
    const referenceTotals = core.calculateBudget(referenceInput);

    if (!manualServiceValue) elements.serviceValue.value = referenceTotals.reference.toFixed(2);

    currentInput = collectInput(true);
    currentTotals = core.calculateBudget(currentInput);
    const eventPackageMode = Boolean(currentInput.eventPackageId);
    elements.referenceLabel.textContent = eventPackageMode ? "Valor calculado pelas etapas" : "Valor sugerido pela base";
    elements.referenceValue.textContent = core.money(referenceTotals.reference);
    elements.referenceDetail.textContent = eventPackageMode
      ? `${referenceTotals.quantity} ${referenceTotals.unitLabel} · calculado pelos tempos das etapas${referenceTotals.discountAmount ? ` e ${Math.round(referenceTotals.discountRate * 100)}% de desconto` : ""}.`
      : referenceTotals.estimatedMinutes > 0
        ? `${referenceTotals.estimatedMinutes} minutos estimados com a base selecionada${referenceTotals.discountAmount ? ` e ${Math.round(referenceTotals.discountRate * 100)}% de desconto` : ""}.`
        : "Informe minutos ou valores nas etapas.";
    const sharedMinutes = sharedEventStageLines().reduce((total, line) => total + core.asNumber(line.minutes) * teamQuantityFor(line.professionalId), 0);
    elements.eventStageTotalMinutes.textContent = `${Math.round(sharedMinutes * 100) / 100} min`;
    elements.eventTechnicalCost.textContent = core.money(referenceTotals.technicalCost);
    if (eventPackageMode) elements.eventPackagePrice.textContent = core.money(referenceTotals.unitValue);
    elements.locationFields.hidden = currentInput.attendance !== "presencial";
    renderPreview();
    saveBudgetCache();
  };

  const createBudgetSnapshot = () => ({
    version: BUDGET_EXPORT_VERSION,
    savedAt: new Date().toISOString(),
    fields: {
      clientName: elements.clientName.value,
      contact: elements.contact.value,
      startTime: elements.startTime.value,
      endTime: elements.endTime.value,
      venueName: elements.venueName.value,
      address: elements.address.value,
      locationLink: elements.locationLink.value,
      projectType: elements.projectType.value,
      model: elements.model.value,
      desiredDate: elements.desiredDate.value,
      serviceTitle: elements.serviceTitle.value,
      packageTemplate: elements.packageTemplate.value,
      packageProfessional: elements.packageProfessional.value,
      packageQuantity: elements.packageQuantity.value,
      packageMinutes: elements.packageMinutes.value,
      technicalProfessional: elements.technicalProfessional.value,
      technicalUnit: elements.technicalUnit.value,
      technicalMinutes: elements.technicalMinutes.value,
      customTemplate: elements.customTemplate.value,
      serviceValue: elements.serviceValue.value,
      partnershipLevel: elements.partnershipLevel.value,
      distanceKm: elements.distanceKm.value,
      travelTime: elements.travelTime.value,
      travelFee: elements.travelFee.value,
      foodFee: elements.foodFee.value,
      travelExtras: elements.travelExtras.value,
      notes: elements.notes.value
    },
    attendance: form.querySelector('input[name="attendance"]:checked')?.value || "remoto",
    serviceFormats: elements.formatInputs.map((input) => ({
      professionalId: input.dataset.professionalId,
      checked: input.checked,
      quantity: input.closest(".service-format-option")?.querySelector(".service-format-quantity")?.value || "1"
    })),
    eventQuoteMode: getEventQuoteMode(),
    eventPackageId: elements.eventPackageOptions.querySelector('input[name="event-package"]:checked')?.value || selectedEventPackageId,
    eventPackageQuantity: elements.eventPackageQuantity.value,
    eventStageLines: eventStageLines.length && elements.eventStageItems.querySelector("[data-event-stage-index]") ? readEventStageLines() : eventStageLines,
    customLines: elements.model.value === "sob-medida" && customLines.length ? readCustomLines() : customLines,
    manualServiceValue
  });

  const hasBudgetContent = (snapshot) => {
    const fields = snapshot.fields || {};
    return Boolean(fields.clientName || fields.projectType || fields.serviceTitle || fields.notes || snapshot.customLines?.length);
  };

  const saveBudgetCache = () => {
    try {
      const snapshot = createBudgetSnapshot();
      if (hasBudgetContent(snapshot)) localStorage.setItem(BUDGET_CACHE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      // O orçamento continua funcional quando o armazenamento local não está disponível.
    }
  };

  const migrateBudgetSnapshot = (snapshot) => {
    if (!snapshot || !snapshot.fields || ![1, 2, BUDGET_EXPORT_VERSION].includes(snapshot.version)) {
      throw new Error("Arquivo de orçamento inválido.");
    }

    const fields = { ...snapshot.fields };
    if (snapshot.version === 1) {
      fields.packageMinutes = core.asNumber(fields.packageHours) * 60;
      const technicalMultiplier = fields.technicalUnit === "diaria"
        ? (catalog?.parametros.horasPorDiaria || 8) * 60
        : 60;
      fields.technicalMinutes = core.asNumber(fields.technicalQuantity) * technicalMultiplier;
    }
    fields.technicalUnit = "minuto";

    return {
      ...snapshot,
      version: BUDGET_EXPORT_VERSION,
      fields,
      customLines: Array.isArray(snapshot.customLines)
        ? snapshot.customLines.map((line) => {
            const normalizedLine = normalizeCustomTimeLine(line);
            if (line?.billingType === "minuto" && snapshot.version < BUDGET_EXPORT_VERSION) {
              normalizedLine.unitValue = core.asNumber(line.unitValue) * 60;
            }
            return normalizedLine;
          })
        : []
    };
  };

  const restoreBudgetSnapshot = (rawSnapshot) => {
    const snapshot = migrateBudgetSnapshot(rawSnapshot);
    const fields = snapshot.fields;
    const fieldElements = {
      clientName: elements.clientName, contact: elements.contact, startTime: elements.startTime, endTime: elements.endTime,
      venueName: elements.venueName, address: elements.address, locationLink: elements.locationLink, projectType: elements.projectType,
      model: elements.model, desiredDate: elements.desiredDate, serviceTitle: elements.serviceTitle, packageTemplate: elements.packageTemplate,
      packageProfessional: elements.packageProfessional, packageQuantity: elements.packageQuantity, packageMinutes: elements.packageMinutes,
      technicalProfessional: elements.technicalProfessional, technicalUnit: elements.technicalUnit, technicalMinutes: elements.technicalMinutes,
      customTemplate: elements.customTemplate, serviceValue: elements.serviceValue, partnershipLevel: elements.partnershipLevel,
      distanceKm: elements.distanceKm, travelTime: elements.travelTime, travelFee: elements.travelFee, foodFee: elements.foodFee,
      travelExtras: elements.travelExtras, notes: elements.notes
    };
    Object.entries(fieldElements).forEach(([key, element]) => {
      if (element && fields[key] !== undefined) element.value = fields[key];
    });
    form.querySelector(`input[name="attendance"][value="${snapshot.attendance === "presencial" ? "presencial" : "remoto"}"]`).checked = true;
    elements.formatInputs.forEach((input) => {
      const savedFormat = (snapshot.serviceFormats || []).find((item) => item.professionalId === input.dataset.professionalId);
      input.checked = Boolean(savedFormat?.checked);
      const quantityInput = input.closest(".service-format-option")?.querySelector(".service-format-quantity");
      if (quantityInput && savedFormat?.quantity) quantityInput.value = savedFormat.quantity;
    });
    form.querySelectorAll('input[name="event-quote-mode"]').forEach((input) => {
      input.checked = input.value === (snapshot.eventQuoteMode || "escolhido");
    });
    selectedEventPackageId = snapshot.eventPackageId || selectedEventPackageId;
    elements.eventPackageOptions.querySelectorAll('input[name="event-package"]').forEach((input) => {
      input.checked = input.value === selectedEventPackageId;
    });
    elements.eventPackageQuantity.value = snapshot.eventPackageQuantity || "1";
    eventStageLines = Array.isArray(snapshot.eventStageLines) ? snapshot.eventStageLines : [];
    customLines = Array.isArray(snapshot.customLines) ? snapshot.customLines : [];
    manualServiceValue = Boolean(snapshot.manualServiceValue);
    updateFormats();
    updateServiceLocationFields();
    updateModelPanels();
    if (eventStageLines.length) renderEventStageLines();
    if (customLines.length) renderCustomLines();
    updatePackageScope();
    refresh();
  };

  const restoreLastBudgetCache = () => {
    try {
      const raw = localStorage.getItem(BUDGET_CACHE_KEY);
      if (!raw) return false;
      restoreBudgetSnapshot(JSON.parse(raw));
      return true;
    } catch (error) {
      localStorage.removeItem(BUDGET_CACHE_KEY);
      return false;
    }
  };

  const validateAndBuildMessage = () => {
    currentInput = collectInput(true);
    currentTotals = core.calculateBudget(currentInput);
    const errors = core.validateBudget(currentInput);
    if (errors.length) {
      setFeedback(errors.map((error) => `• ${error}`).join("\n"));
      return "";
    }
    setFeedback("");
    return core.buildWhatsAppMessage(currentInput, currentTotals, {
      name: catalog.empresa.nome,
      signature: catalog.empresa.assinatura,
      payment: catalog.empresa.pagamento
    });
  };

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  const pdfRow = (label, value) => value ? `<div class="pdf-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>` : "";

  const generatePdf = () => {
    const message = validateAndBuildMessage();
    if (!message) return;

    const input = currentInput;
    const totals = currentTotals;
    const presentingAllPackages = input.model === "pacote" && input.eventQuoteMode === "todos";
    const payment = catalog.empresa.pagamento || {};
    const safeLocationLink = /^https?:\/\//i.test(input.locationLink) ? input.locationLink : "";
    const serviceHours = core.formatHours(totals.estimatedHours);
    const location = [input.venueName, input.address].filter(Boolean).join(" · ");
    const pdfDescription = String(input.notes || "").trim();
    const logoUrl = new URL("../assets/img/logo-home.svg", window.location.href).href;
    const packageOptions = presentingAllPackages
      ? `<section class="pdf-section"><h2>Opções de investimento</h2>${input.allEventPackages.map((item) => `
          <article class="pdf-package"><h3>${escapeHtml(item.name)} <strong>${core.money(item.price)}</strong></h3>
          <p>${escapeHtml(item.team)}</p><ul>${item.deliveries.map((delivery) => `<li>${escapeHtml(delivery)}</li>`).join("")}</ul></article>`).join("")}</section>`
      : `<section class="pdf-total"><span>Total do investimento</span><strong>${core.money(totals.total)}</strong></section>`;
    const paymentSection = payment.pixNome || payment.pixChave || payment.cartao
      ? `<section class="pdf-section pdf-payment"><h2>Condições de pagamento</h2>
          <div><h3>Pix</h3><p>${payment.pixNome ? `Nome: ${escapeHtml(payment.pixNome)}<br>` : ""}${payment.pixChave ? `Chave Pix: ${escapeHtml(payment.pixChave)}<br>` : ""}${payment.pixBanco ? `Banco: ${escapeHtml(payment.pixBanco)}` : ""}</p></div>
          ${payment.cartao ? `<div><h3>Cartão de crédito</h3><p>${escapeHtml(payment.cartao)}</p></div>` : ""}
        </section>`
      : "";
    const documentHtml = `<!doctype html>
      <html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Orçamento ${escapeHtml(input.clientName || "SparkFilmes")}</title>
      <style>
        @page { size: A4; margin: 14mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #101014; background: #f3f1ee; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.5; }
        .pdf-document { max-width: 182mm; min-height: 267mm; margin: 0 auto; padding: 0 0 16mm; background: white; }
        .pdf-header { position: relative; min-height: 102mm; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: 17mm 16mm 14mm; color: white; background: linear-gradient(135deg, #0d0d0f 0%, #17151a 55%, #5f1730 100%); }
        .pdf-header::before, .pdf-header::after { content: ""; position: absolute; border: 1px solid rgba(255,255,255,.13); border-radius: 50%; pointer-events: none; }
        .pdf-header::before { width: 115mm; height: 115mm; right: -44mm; top: -61mm; }
        .pdf-header::after { width: 70mm; height: 70mm; right: -6mm; bottom: -39mm; border-color: rgba(239,40,82,.65); }
        .pdf-brand, .pdf-cover-copy, .pdf-cover-meta { position: relative; z-index: 1; }
        .pdf-brand { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .pdf-header img { width: 145px; max-height: 42px; filter: brightness(0) invert(1); }
        .pdf-brand p { margin: 0; color: #d9d5db; font-size: 8pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
        .pdf-kicker { margin: 18px 0 7px; color: #ff8aa1; font-size: 8pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
        h1 { max-width: 135mm; margin: 0; font-size: 29pt; line-height: 1.04; letter-spacing: -.05em; }
        .pdf-subtitle { margin: 8px 0 0; color: #d6d1d8; font-size: 10pt; font-weight: 700; }
        .pdf-lead { max-width: 132mm; margin: 12px 0 0; color: #f0ebef; white-space: pre-wrap; }
        .pdf-cover-meta { display: flex; gap: 26px; margin-top: 18px; }
        .pdf-cover-meta div { display: grid; gap: 2px; }
        .pdf-cover-meta span { color: #bcb4bd; font-size: 7.5pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
        .pdf-cover-meta strong { font-size: 10pt; }
        .pdf-content { padding: 0 16mm; }
        .pdf-section { margin-top: 24px; break-inside: avoid; }
        .pdf-section h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 11px; font-size: 10pt; letter-spacing: .12em; text-transform: uppercase; }
        .pdf-section h2::after { content: ""; height: 1px; flex: 1; background: #dedbd6; }
        .pdf-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .pdf-row { border: 1px solid #e5e1dd; border-radius: 10px; padding: 11px 12px; background: #fbfaf8; }
        dt { margin-bottom: 2px; color: #77727b; font-size: 7.5pt; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
        dd { margin: 0; font-weight: 700; overflow-wrap: anywhere; }
        .pdf-link { color: #c91840; font-weight: 700; text-decoration: none; }
        .pdf-total { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 27px 0 0; border-radius: 14px; padding: 19px 20px; color: white; background: linear-gradient(135deg, #101014, #25232a); break-inside: avoid; box-shadow: 0 10px 26px rgba(16,16,20,.15); }
        .pdf-total span { font-size: 10pt; font-weight: 700; }
        .pdf-total strong { color: #ff6483; font-size: 22pt; }
        .pdf-package { border: 1px solid #dedbd6; border-radius: 12px; margin-top: 10px; padding: 14px; break-inside: avoid; background: #fbfaf8; }
        .pdf-package h3 { display: flex; justify-content: space-between; gap: 12px; margin: 0; font-size: 11pt; }
        .pdf-package h3 strong { color: #c91840; white-space: nowrap; }
        .pdf-package p { margin: 4px 0 8px; color: #66616a; font-size: 9pt; }
        .pdf-package ul { margin: 0; padding-left: 18px; font-size: 9pt; }
        .pdf-payment { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; border-top: 1px solid #dedbd6; padding-top: 18px; }
        .pdf-payment h2 { grid-column: 1 / -1; }
        .pdf-payment h3 { margin: 0; font-size: 10pt; }
        .pdf-payment p { margin: 4px 0 0; color: #58545c; font-size: 9pt; }
        .pdf-payment > div { border: 1px solid #e5e1dd; border-radius: 10px; padding: 11px; background: #fbfaf8; }
        .pdf-footer { border-top: 1px solid #dedbd6; margin: 30px 16mm 0; padding-top: 12px; color: #77727b; font-size: 8.5pt; text-align: center; }
      </style></head><body><main class="pdf-document">
        <header class="pdf-header">
          <div class="pdf-brand"><img src="${logoUrl}" alt="SparkFilmes"><p>Proposta comercial</p></div>
          <div class="pdf-cover-copy"><p class="pdf-kicker">Orçamento audiovisual</p><h1>${escapeHtml(input.serviceTitle || "Proposta SparkFilmes")}</h1>
          <p class="pdf-subtitle">${escapeHtml(input.projectTypeName || "Produção audiovisual")} · ${escapeHtml(input.modelName || "")}</p>
          ${pdfDescription ? `<p class="pdf-lead">${escapeHtml(pdfDescription)}</p>` : ""}</div>
          <div class="pdf-cover-meta"><div><span>Cliente</span><strong>${escapeHtml(input.clientName || "SparkFilmes")}</strong></div><div><span>Emitido em</span><strong>${core.formatDate(new Date().toISOString().slice(0, 10))}</strong></div></div>
        </header>
        <div class="pdf-content"><section class="pdf-section"><h2>Cliente</h2><dl class="pdf-grid">${pdfRow("Cliente", input.clientName)}${pdfRow("Contato", input.contact)}</dl></section>
        <section class="pdf-section"><h2>Informações do serviço</h2><dl class="pdf-grid">
          ${pdfRow("Data", input.desiredDate ? core.formatDate(input.desiredDate) : "")}${pdfRow("Horário", input.startTime || input.endTime ? `${input.startTime || ""}${input.startTime && input.endTime ? " às " : ""}${input.endTime || ""}` : "")}
          ${pdfRow("Atendimento", input.attendance === "presencial" ? "Presencial" : "Remoto")}${pdfRow("Equipe", input.format)}
          ${totals.estimatedHours > 0 ? pdfRow("Tempo estimado", serviceHours) : ""}${pdfRow("Local", location)}
          ${safeLocationLink ? `<div class="pdf-row"><dt>Localização</dt><dd><a class="pdf-link" href="${escapeHtml(safeLocationLink)}">Abrir mapa</a></dd></div>` : ""}
        </dl></section>
        ${packageOptions}
        ${paymentSection}</div>
        <footer class="pdf-footer">${escapeHtml(catalog.empresa.assinatura || "SparkFilmes — histórias com linguagem de cinema.")}</footer>
      </main><script>window.onload = () => window.print();<\/script></body></html>`;

    const pdfWindow = window.open("", "_blank");
    if (!pdfWindow) {
      setFeedback("Não foi possível abrir o PDF. Verifique se o navegador bloqueou a nova janela.");
      return;
    }
    pdfWindow.opener = null;
    pdfWindow.document.open();
    pdfWindow.document.write(documentHtml);
    pdfWindow.document.close();
    setFeedback("Documento aberto. Na janela de impressão, escolha Salvar como PDF.", true);
  };

  const exportBudget = () => {
    const snapshot = createBudgetSnapshot();
    const content = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    const client = (snapshot.fields.clientName || "orcamento").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "orcamento";
    link.href = url;
    link.download = `sparkfilmes-${client}-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setFeedback("Orçamento exportado em JSON.", true);
  };

  const importBudget = async (file) => {
    if (!file) return;
    try {
      const snapshot = JSON.parse(await file.text());
      restoreBudgetSnapshot(snapshot);
      saveBudgetCache();
      setFeedback("Orçamento importado e salvo neste navegador.", true);
    } catch (error) {
      setFeedback("Não foi possível importar este arquivo. Escolha um orçamento exportado pela SparkFilmes.");
    } finally {
      elements.importBudgetFile.value = "";
    }
  };

  const bindEvents = () => {
    elements.projectType.addEventListener("change", () => {
      updateFormats();
      updateServiceLocationFields();
      if (elements.projectType.value === "evento") {
        elements.model.value = "pacote";
        form.querySelector('input[name="attendance"][value="presencial"]').checked = true;
        manualServiceValue = false;
        updateModelPanels();
        const eventPackage = getEventPackage();
        elements.serviceTitle.value = getEventQuoteMode() === "todos"
          ? "Opções de cobertura de evento"
          : eventPackage?.nome || "Cobertura de evento";
      } else if (elements.projectType.value === "edicao-conteudo") {
        elements.model.value = "sob-medida";
        elements.customTemplate.value = "edicao-conteudo";
        form.querySelector('input[name="attendance"][value="remoto"]').checked = true;
        elements.venueName.value = "";
        elements.address.value = "";
        elements.locationLink.value = "";
        elements.formatInputs.forEach((input) => {
          input.checked = input.dataset.professionalId === "editor";
        });
        updateFormats();
        manualServiceValue = false;
        updateModelPanels();
        loadTemplateLines();
      } else {
        updateModelPanels();
      }
      refresh();
    });

    elements.model.addEventListener("change", () => {
      manualServiceValue = false;
      updateModelPanels();
      refresh();
    });

    elements.eventPackageOptions.addEventListener("change", (event) => {
      if (!event.target.matches('input[name="event-package"]')) return;
      loadEventPackage(event.target.value);
      if (getEventQuoteMode() === "escolhido") {
        elements.serviceTitle.value = getEventPackage()?.nome || "Cobertura de evento";
      }
      manualServiceValue = false;
      refresh();
    });

    form.querySelectorAll('input[name="event-quote-mode"]').forEach((input) => {
      input.addEventListener("change", () => {
        const presentingAllPackages = getEventQuoteMode() === "todos";
        elements.serviceTitle.value = presentingAllPackages
          ? "Opções de cobertura de evento"
          : getEventPackage()?.nome || "Cobertura de evento";
        manualServiceValue = false;
        updateModelPanels();
        refresh();
      });
    });

    elements.eventStageItems.addEventListener("input", refresh);

    elements.packageTemplate.addEventListener("change", () => {
      updatePackageScope();
      refresh();
    });

    elements.customTemplate.addEventListener("change", loadTemplateLines);

    elements.addLine.addEventListener("click", () => {
      readCustomLines();
      const professional = catalog.profissionais[0];
      customLines.push({
        name: "Nova etapa",
        billingType: "minuto",
        professionalId: professional.id,
        quantity: 0,
        unitValue: professional.valorHora
      });
      renderCustomLines();
      refresh();
    });

    elements.lineItems.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-line]");
      if (!button) return;
      readCustomLines();
      customLines.splice(Number(button.dataset.removeLine), 1);
      renderCustomLines();
      refresh();
    });

    elements.lineItems.addEventListener("change", (event) => {
      if (event.target.matches(".line-professional")) {
        const row = event.target.closest("[data-line-index]");
        const professional = getProfessional(event.target.value);
<<<<<<< HEAD
        row.querySelector(".line-rate").value = row.dataset.billingType === "minuto"
          ? professional.valorHora
          : core.roundMoney(professional.valorHora);
=======
        row.querySelector(".line-rate").value = core.roundMoney(professional.valorHora);
>>>>>>> 02973ca0b850b7b78b04dbad2991c959c118d8f7
      }
      refresh();
    });

    elements.lineItems.addEventListener("input", refresh);

    elements.serviceValue.addEventListener("input", () => {
      manualServiceValue = true;
      refresh();
    });

    elements.contact.addEventListener("input", () => {
      elements.contact.value = formatBrazilianPhone(elements.contact.value);
    });

    elements.formatInputs.forEach((input) => {
      input.addEventListener("change", () => {
        updateFormats();
        manualServiceValue = false;
        refresh();
      });
    });

    elements.partnershipLevel.addEventListener("change", () => {
      manualServiceValue = false;
      refresh();
    });

    elements.useReference.addEventListener("click", () => {
      manualServiceValue = false;
      refresh();
    });

    form.addEventListener("input", (event) => {
      if (event.target === elements.serviceValue || event.target.closest("#line-items") || event.target.closest("#event-stage-items")) return;
      setFeedback("");
      refresh();
    });
    form.addEventListener("change", (event) => {
      if ([elements.projectType, elements.model, elements.packageTemplate, elements.customTemplate].includes(event.target)) return;
      refresh();
    });

    elements.sendWhatsapp.addEventListener("click", () => {
      const message = validateAndBuildMessage();
      if (!message) return;
      const clientWhatsApp = brazilianWhatsAppNumber(elements.contact.value);
      const recipient = clientWhatsApp || catalog.empresa.whatsapp;
      const url = `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setFeedback(clientWhatsApp ? "WhatsApp do cliente aberto com o orçamento preenchido." : "WhatsApp da SparkFilmes aberto para aprovação do orçamento.", true);
    });

    elements.generatePdf.addEventListener("click", generatePdf);

    elements.createContract.addEventListener("click", createContractDraft);

    elements.exportBudget.addEventListener("click", exportBudget);

    elements.importBudget.addEventListener("click", () => elements.importBudgetFile.click());

    elements.importBudgetFile.addEventListener("change", () => importBudget(elements.importBudgetFile.files?.[0]));

    elements.copyMessage.addEventListener("click", async () => {
      const message = validateAndBuildMessage();
      if (!message) return;
      try {
        await copyText(message);
        setFeedback("Mensagem copiada. Agora é só colar onde quiser.", true);
      } catch (error) {
        setFeedback("Não foi possível copiar automaticamente. Tente abrir pelo WhatsApp.");
      }
    });

    elements.clearBudget.addEventListener("click", () => {
      form.reset();
      try {
        localStorage.removeItem(BUDGET_CACHE_KEY);
      } catch (error) {
        // O formulário ainda pode ser limpo quando o armazenamento local não estiver disponível.
      }
      updateFormats();
      updateServiceLocationFields();
      elements.desiredDate.min = localIsoDate();
      customLines = [];
      eventStageLines = [];
      elements.lineItems.innerHTML = "";
      manualServiceValue = false;
      const firstEventPackageInput = elements.eventPackageOptions.querySelector('input[name="event-package"]');
      if (firstEventPackageInput) firstEventPackageInput.checked = true;
      selectedEventPackageId = firstEventPackageInput?.value || "";
      loadEventPackage(selectedEventPackageId, true);
      updateModelPanels();
      updatePackageScope();
      setFeedback("Orçamento limpo.", true);
      refresh();
      elements.clientName.focus();
    });
  };

  const initialize = async () => {
    try {
      const response = await fetch("../data/servicos.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      catalog = await response.json();

      fillSelect(elements.projectType, catalog.tiposProducao, "Selecione");
      fillSelect(elements.model, catalog.modelosContratacao, "Selecione");
      fillSelect(elements.packageTemplate, catalog.templates);
      fillSelect(elements.customTemplate, catalog.templates);
      fillSelect(elements.packageProfessional, catalog.profissionais);
      fillSelect(elements.technicalProfessional, catalog.profissionais);
      renderEventPackageOptions();
      loadEventPackage(selectedEventPackageId, true);
      elements.desiredDate.min = localIsoDate();

      updateFormats();
      updateServiceLocationFields();
      updatePackageScope();
      bindEvents();
      if (restoreLastBudgetCache()) setFeedback("Último orçamento recuperado deste navegador.", true);
      else refresh();
    } catch (error) {
      setFeedback("Não foi possível carregar a base de serviços. Abra o site por um servidor local ou pelo GitHub Pages.");
      console.error("Erro ao carregar catálogo de serviços:", error);
    }
  };

  initialize();
})();
