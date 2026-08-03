(function () {
  "use strict";

  const core = window.SparkBudgetCore;
  if (!core) return;

  const byId = (id) => document.getElementById(id);
  const form = byId("budget-form");
  if (!form) return;

  const elements = {
    clientName: byId("client-name"),
    contact: byId("client-contact"),
    projectType: byId("project-type"),
    format: byId("project-format"),
    model: byId("contract-model"),
    desiredDate: byId("desired-date"),
    serviceTitle: byId("service-title"),
    emptyConfiguration: byId("empty-configuration"),
    packagePanel: byId("package-panel"),
    packageTemplate: byId("package-template"),
    packageProfessional: byId("package-professional"),
    packageQuantity: byId("package-quantity"),
    packageHours: byId("package-hours"),
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
    allPackagesMessage: byId("all-packages-message"),
    eventStageItems: byId("event-stage-items"),
    eventStageTotalMinutes: byId("event-stage-total-minutes"),
    eventTechnicalCost: byId("event-technical-cost"),
    technicalPanel: byId("technical-panel"),
    technicalProfessional: byId("technical-professional"),
    technicalUnit: byId("technical-unit"),
    technicalQuantity: byId("technical-quantity"),
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
    locationFields: byId("location-fields"),
    address: byId("address"),
    distanceKm: byId("distance-km"),
    travelFee: byId("travel-fee"),
    travelExtras: byId("travel-extras"),
    notes: byId("notes"),
    previewType: byId("preview-type"),
    previewTitle: byId("preview-title"),
    previewDescription: byId("preview-description"),
    previewPackageDeliveries: byId("preview-package-deliveries"),
    previewFormat: byId("preview-format"),
    previewDate: byId("preview-date"),
    previewAttendance: byId("preview-attendance"),
    previewHours: byId("preview-hours"),
    previewServices: byId("preview-services"),
    previewServicesLabel: byId("preview-services-label"),
    previewTravel: byId("preview-travel"),
    previewTotal: byId("preview-total"),
    previewTotalLabel: byId("preview-total-label"),
    sendWhatsapp: byId("send-whatsapp"),
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

  const updateFormats = () => {
    const type = getProjectType(elements.projectType.value);
    if (!type) {
      elements.format.innerHTML = '<option value="">Escolha o tipo primeiro</option>';
      elements.format.disabled = true;
      return;
    }
    elements.format.innerHTML = [
      '<option value="">Selecione</option>',
      ...type.formatos.map((format) => `<option value="${escapeHtml(format)}">${escapeHtml(format)}</option>`)
    ].join("");
    elements.format.disabled = false;
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
            <strong class="event-package-option-price">${core.money(eventPackage.preco)}</strong>
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
        hourlyRate: professional.valorHora
      };
    });
    return eventStageLines;
  };

  const renderEventStageLines = () => {
    elements.eventStageItems.innerHTML = eventStageLines
      .map((line, index) => {
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
            <strong class="event-stage-cost">${core.money((line.minutes / 60) * professional.valorHora)}</strong>
          </div>`;
      })
      .join("");
  };

  const loadEventPackage = (packageId, force = false) => {
    const eventPackage = getEventPackage(packageId);
    if (!eventPackage) return;
    const changed = selectedEventPackageId !== eventPackage.id;
    selectedEventPackageId = eventPackage.id;

    if (changed || force || eventStageLines.length === 0) {
      eventStageLines = eventPackage.etapas.map((stage) => ({
        name: stage.nome,
        professionalId: stage.profissionalId,
        minutes: stage.minutos
      }));
      renderEventStageLines();
    }

    elements.eventPackageTeam.textContent = `${eventPackage.profissionaisEmCampo} ${eventPackage.profissionaisEmCampo === 1 ? "profissional em campo" : "profissionais em campo"} · ${eventPackage.subtitulo}`;
    elements.eventPackageName.textContent = eventPackage.nome;
    elements.eventPackagePrice.textContent = core.money(eventPackage.preco);
    elements.eventPackageDeliveries.innerHTML = eventPackage.entregas.map((delivery) => `<li>${escapeHtml(delivery)}</li>`).join("");
  };

  const updateEventStageCosts = () => {
    elements.eventStageItems.querySelectorAll("[data-event-stage-index]").forEach((row) => {
      const professional = getProfessional(row.dataset.professionalId);
      const minutes = core.asNumber(row.querySelector(".event-stage-minutes-input").value);
      row.querySelector(".event-stage-cost").textContent = core.money((minutes / 60) * professional.valorHora);
    });
  };

  const readCustomLines = () => {
    customLines = Array.from(elements.lineItems.querySelectorAll("[data-line-index]")).map((row) => ({
      name: row.querySelector(".line-name").value.trim() || "Etapa sem nome",
      billingType: row.dataset.billingType,
      professionalId: row.querySelector(".line-professional").value,
      quantity: core.asNumber(row.querySelector(".line-quantity").value),
      unitValue: core.asNumber(row.querySelector(".line-rate").value)
    }));
    return customLines;
  };

  const renderCustomLines = () => {
    if (customLines.length === 0) {
      elements.lineItems.innerHTML = '<div class="empty-configuration">Nenhuma etapa adicionada.</div>';
      return;
    }

    elements.lineItems.innerHTML = customLines
      .map((line, index) => {
        const isHourly = line.billingType === "hora";
        const quantityLabel = isHourly ? "Horas" : "Qtd.";
        const professionalSelect = isHourly
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
              <select class="line-professional" ${isHourly ? "" : "disabled"}>${professionalSelect}</select>
            </label>
            <label class="field">
              <span>${quantityLabel}</span>
              <input class="line-quantity" type="number" min="0" step="${isHourly ? "0.5" : "1"}" value="${line.quantity}" />
            </label>
            <label class="field">
              <span>Valor unit.</span>
              <input class="line-rate" type="number" min="0" step="0.01" value="${core.roundMoney(line.unitValue)}" />
            </label>
            <div class="line-total" aria-label="Total da etapa">${core.money(line.quantity * line.unitValue)}</div>
            <button class="remove-line" type="button" data-remove-line="${index}" aria-label="Remover ${escapeHtml(line.name)}">×</button>
          </div>`;
      })
      .join("");
  };

  const loadTemplateLines = () => {
    const template = getTemplate(elements.customTemplate.value);
    if (!template) return;
    const defaultProfessional = catalog.profissionais[0];
    customLines = template.etapas.map((step) => ({
      name: step.nome,
      billingType: step.tipoCobranca,
      professionalId: defaultProfessional.id,
      quantity: step.tipoCobranca === "fixo" ? 1 : 0,
      unitValue: step.tipoCobranca === "fixo" ? 0 : defaultProfessional.valorHora
    }));
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
    elements.eventSelectedTools.hidden = presentingAllPackages;
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
    const eventInputLines = eventPackageMode ? readEventStageLines() : [];

    return {
      clientName: elements.clientName.value.trim(),
      contact: elements.contact.value.trim(),
      projectType: elements.projectType.value,
      projectTypeName: projectType?.nome || "",
      format: elements.format.value,
      model: elements.model.value,
      modelName: model?.nome || "",
      desiredDate: elements.desiredDate.value,
      serviceTitle: elements.serviceTitle.value.trim(),
      packageTemplateName: getTemplate(elements.packageTemplate.value)?.nome || "",
      packageQuantity: elements.packageQuantity.value,
      hoursPerPackage: elements.packageHours.value,
      eventPackageId: eventPackage?.id || "",
      eventQuoteMode: eventPackageMode ? getEventQuoteMode() : "escolhido",
      eventPackageName: eventPackage?.nome || "",
      eventPackageTeam: eventPackage
        ? `${eventPackage.profissionaisEmCampo} ${eventPackage.profissionaisEmCampo === 1 ? "profissional" : "profissionais"} · ${eventPackage.subtitulo}`
        : "",
      eventPackagePrice: eventPackage?.preco,
      eventPackageQuantity: elements.eventPackageQuantity.value,
      eventCoverageHours: eventPackage?.horasCoberturaIncluidas,
      eventPackageDeliveries: eventPackage?.entregas || [],
      allEventPackages: eventPackageMode
        ? catalog.pacotesEventos.map((item) => ({
            name: item.nome,
            price: item.preco,
            team: `${item.profissionaisEmCampo} ${item.profissionaisEmCampo === 1 ? "profissional" : "profissionais"} · ${item.subtitulo}`,
            deliveries: item.entregas
          }))
        : [],
      eventStageLines: eventInputLines,
      hourlyRate: elements.model.value === "tecnico" ? technicalProfessional?.valorHora : packageProfessional?.valorHora,
      professionalName: elements.model.value === "tecnico" ? technicalProfessional?.nome : packageProfessional?.nome,
      technicalUnit: elements.technicalUnit.value,
      technicalQuantity: elements.technicalQuantity.value,
      hoursPerDay: catalog?.parametros.horasPorDiaria || 8,
      lines: customInputLines,
      serviceValue: includeManualValue ? Number(elements.serviceValue.value) : undefined,
      attendance,
      address: elements.address.value.trim(),
      distanceKm: elements.distanceKm.value,
      travelFee: elements.travelFee.value,
      travelExtras: elements.travelExtras.value,
      notes: elements.notes.value.trim()
    };
  };

  const updateLineTotals = () => {
    elements.lineItems.querySelectorAll("[data-line-index]").forEach((row) => {
      const quantity = core.asNumber(row.querySelector(".line-quantity").value);
      const rate = core.asNumber(row.querySelector(".line-rate").value);
      row.querySelector(".line-total").textContent = core.money(quantity * rate);
    });
  };

  const renderPreview = () => {
    const input = currentInput;
    const totals = currentTotals;
    const eventPackageMode = Boolean(input.eventPackageId);
    const presentingAllPackages = eventPackageMode && input.eventQuoteMode === "todos";
    const modelDescription = {
      pacote: `${totals.quantity} ${totals.unitLabel} · aproximadamente ${totals.estimatedHours} horas`,
      tecnico: `${totals.quantity} ${totals.unitLabel} · aproximadamente ${totals.estimatedHours} horas`,
      "sob-medida": `${totals.quantity} ${totals.unitLabel} · aproximadamente ${totals.estimatedHours} horas`
    };

    elements.previewType.textContent = input.projectTypeName || "Produção audiovisual";
    elements.previewTitle.textContent = input.serviceTitle || "Seu orçamento começa aqui";
    elements.previewDescription.textContent = presentingAllPackages
      ? "Essencial, Spark e Flame para o cliente comparar e escolher."
      : eventPackageMode
        ? `${input.eventPackageTeam} · até ${input.eventCoverageHours} horas de cobertura · ${totals.estimatedMinutes} minutos de trabalho interno`
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
    elements.previewAttendance.textContent = input.attendance === "presencial"
      ? input.address || "Presencial · local a definir"
      : "Remoto";
    elements.previewHours.textContent = presentingAllPackages
      ? "Após a escolha"
      : eventPackageMode
        ? `${totals.estimatedMinutes} min`
        : `${totals.estimatedHours} ${totals.estimatedHours === 1 ? "hora" : "horas"}`;
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
    const referenceInput = collectInput(false);
    const referenceTotals = core.calculateBudget(referenceInput);

    if (!manualServiceValue) elements.serviceValue.value = referenceTotals.reference.toFixed(2);

    currentInput = collectInput(true);
    currentTotals = core.calculateBudget(currentInput);
    const eventPackageMode = Boolean(currentInput.eventPackageId);
    elements.referenceLabel.textContent = eventPackageMode ? "Valor comercial do pacote" : "Valor sugerido pela base";
    elements.referenceValue.textContent = core.money(referenceTotals.reference);
    elements.referenceDetail.textContent = eventPackageMode
      ? `${referenceTotals.quantity} ${referenceTotals.unitLabel} · cobertura de até ${currentInput.eventCoverageHours} h por pacote.`
      : referenceTotals.estimatedHours > 0
        ? `${referenceTotals.estimatedHours} h estimadas com a base selecionada.`
        : "Informe horas, diárias ou valores nas etapas.";
    elements.eventStageTotalMinutes.textContent = `${referenceTotals.estimatedMinutes} min`;
    elements.eventTechnicalCost.textContent = core.money(referenceTotals.technicalCost);
    elements.locationFields.hidden = currentInput.attendance !== "presencial";
    renderPreview();
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
      signature: catalog.empresa.assinatura
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

  const bindEvents = () => {
    elements.projectType.addEventListener("change", () => {
      updateFormats();
      if (elements.projectType.value === "evento") {
        elements.model.value = "pacote";
        form.querySelector('input[name="attendance"][value="presencial"]').checked = true;
        manualServiceValue = false;
        updateModelPanels();
        const eventPackage = getEventPackage();
        elements.serviceTitle.value = getEventQuoteMode() === "todos"
          ? "Opções de cobertura de evento"
          : eventPackage?.nome || "Cobertura de evento";
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
      loadEventPackage(event.target.value, true);
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
        billingType: "hora",
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
        row.querySelector(".line-rate").value = core.roundMoney(professional.valorHora);
      }
      refresh();
    });

    elements.lineItems.addEventListener("input", refresh);

    elements.serviceValue.addEventListener("input", () => {
      manualServiceValue = true;
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
      const url = `https://wa.me/${catalog.empresa.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setFeedback("WhatsApp aberto com o orçamento preenchido.", true);
    });

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
      elements.format.innerHTML = '<option value="">Escolha o tipo primeiro</option>';
      elements.format.disabled = true;
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

      updatePackageScope();
      bindEvents();
      refresh();
    } catch (error) {
      setFeedback("Não foi possível carregar a base de serviços. Abra o site por um servidor local ou pelo GitHub Pages.");
      console.error("Erro ao carregar catálogo de serviços:", error);
    }
  };

  initialize();
})();
