(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SparkBudgetCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const asNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const positive = (value) => Math.max(0, asNumber(value));
  const roundMoney = (value) => Math.round((asNumber(value) + Number.EPSILON) * 100) / 100;
  const money = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(asNumber(value));
  const formatHours = (value) => {
    const hours = Math.round(positive(value) * 100) / 100;
    const formatted = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(hours);
    return `${formatted} ${hours === 1 ? "hora" : "horas"}`;
  };

  const formatDate = (isoDate) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate || ""))) return "A definir";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  };

  const calculateBudget = (input = {}) => {
    const model = input.model || "pacote";
    let reference = 0;
    let estimatedHours = 0;
    let estimatedMinutes = 0;
    let unitLabel = "serviço";
    let quantity = 1;
    let unitValue = 0;
    let technicalCost = 0;

    if (model === "pacote") {
      const isEventPackage = Boolean(input.eventPackageId);
      quantity = positive(isEventPackage ? input.eventPackageQuantity : input.packageQuantity) || 1;
      if (isEventPackage) {
        const stageLines = Array.isArray(input.eventStageLines) ? input.eventStageLines : [];
        stageLines.forEach((line) => {
          const minutes = positive(line.minutes);
          const stageQuantity = positive(line.quantity) || 1;
          estimatedMinutes += minutes * stageQuantity * quantity;
          technicalCost += (minutes / 60) * positive(line.hourlyRate) * stageQuantity * quantity;
        });
        reference = technicalCost;
        unitValue = quantity ? reference / quantity : 0;
      } else {
        const minutesPerPackage = positive(input.minutesPerPackage);
        const hourlyRate = positive(input.hourlyRate);
        estimatedMinutes = quantity * minutesPerPackage;
        unitValue = (minutesPerPackage / 60) * hourlyRate;
        reference = quantity * unitValue;
        technicalCost = reference;
      }
      unitLabel = quantity === 1 ? "pacote" : "pacotes";
    } else if (model === "tecnico") {
      quantity = positive(input.technicalMinutes);
      const hourlyRate = positive(input.hourlyRate);
      estimatedMinutes = quantity;
      unitValue = hourlyRate / 60;
      reference = quantity * unitValue;
      technicalCost = reference;
      unitLabel = quantity === 1 ? "minuto" : "minutos";
    } else {
      const lines = Array.isArray(input.lines) ? input.lines : [];
      reference = lines.reduce((total, line) => {
        const lineQuantity = positive(line.quantity);
        const lineUnitValue = positive(line.unitValue);
        if (line.billingType === "hora") estimatedMinutes += lineQuantity * 60;
        if (line.billingType === "minuto") estimatedMinutes += lineQuantity;
        return total + lineQuantity * lineUnitValue;
      }, 0);
      quantity = lines.length;
      unitLabel = quantity === 1 ? "etapa" : "etapas";
      technicalCost = reference;
    }

    estimatedHours = estimatedMinutes / 60;

    const referenceBeforeDiscount = reference;
    const discountRate = Math.min(0.3, Math.max(0, asNumber(input.partnershipDiscount)));
    const discountAmount = referenceBeforeDiscount * discountRate;
    reference -= discountAmount;
    if (model === "pacote") unitValue = quantity ? reference / quantity : 0;

    const services = Number.isFinite(Number(input.serviceValue))
      ? positive(input.serviceValue)
      : reference;
    const travelFee = input.attendance === "presencial" ? positive(input.travelFee) : 0;
    const foodFee = input.attendance === "presencial" ? positive(input.foodFee) : 0;
    const travelExtras = input.attendance === "presencial" ? positive(input.travelExtras) : 0;
    const travel = travelFee + foodFee + travelExtras;

    return {
      reference: roundMoney(reference),
      referenceBeforeDiscount: roundMoney(referenceBeforeDiscount),
      discountRate,
      discountAmount: roundMoney(discountAmount),
      services: roundMoney(services),
      travelFee: roundMoney(travelFee),
      foodFee: roundMoney(foodFee),
      travelExtras: roundMoney(travelExtras),
      travel: roundMoney(travel),
      total: roundMoney(services + travel),
      technicalCost: roundMoney(technicalCost),
      estimatedHours: Math.round(estimatedHours * 100) / 100,
      estimatedMinutes: Math.round(estimatedMinutes * 100) / 100,
      quantity,
      unitLabel,
      unitValue: roundMoney(unitValue)
    };
  };

  const validateBudget = (input = {}) => {
    const errors = [];
    if (!String(input.clientName || "").trim()) errors.push("Informe o nome do cliente ou empresa.");
    if (!String(input.projectTypeName || "").trim()) errors.push("Selecione o tipo de produção.");
    if (!String(input.modelName || "").trim()) errors.push("Selecione o modelo de contratação.");
    if (!String(input.format || "").trim()) errors.push("Selecione o formato.");
    if (!String(input.serviceTitle || "").trim()) errors.push("Informe o nome do serviço ou pacote.");
    if (!String(input.desiredDate || "").trim()) errors.push("Informe a data desejada.");

    if (input.desiredDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(`${input.desiredDate}T00:00:00`);
      if (!Number.isNaN(selected.getTime()) && selected < today) errors.push("A data desejada não pode estar no passado.");
    }

    if (input.model === "pacote" && input.projectType === "evento" && !String(input.eventPackageId || "").trim()) {
      errors.push("Selecione um pacote de cobertura de evento.");
    }
    if (input.model === "pacote" && input.projectType === "evento" && input.eventQuoteMode !== "todos" && positive(input.eventPackageQuantity) <= 0) {
      errors.push("Informe a quantidade de eventos ou pacotes.");
    }
    if (input.model === "pacote" && input.projectType === "evento" && input.eventQuoteMode !== "todos" && (!Array.isArray(input.eventStageLines) || input.eventStageLines.every((line) => positive(line.minutes) <= 0))) {
      errors.push("Informe o tempo previsto em pelo menos uma etapa do evento.");
    }
    if (input.model === "pacote" && input.projectType !== "evento" && positive(input.minutesPerPackage) <= 0) {
      errors.push("Informe os minutos estimados por pacote.");
    }
    if (input.model === "tecnico" && positive(input.technicalMinutes) <= 0) {
      errors.push("Informe a duração do trabalho técnico em minutos.");
    }
    if (input.model === "sob-medida" && (!Array.isArray(input.lines) || input.lines.length === 0)) {
      errors.push("Adicione ao menos uma etapa ao projeto sob medida.");
    }
    return errors;
  };

  const buildWhatsAppMessage = (input = {}, totals = calculateBudget(input), company = {}) => {
    const presentingAllEventPackages = input.model === "pacote" && input.eventQuoteMode === "todos";
    const serviceInformation = [
      `*Data:* ${formatDate(input.desiredDate)}`,
      input.startTime || input.endTime ? `*Horário:* ${input.startTime || "a definir"} às ${input.endTime || "a definir"}` : "",
      input.venueName ? `*Nome do local:* ${input.venueName}` : "",
      input.address ? `*Endereço:* ${input.address}` : "",
      input.locationLink ? `*Localização:* ${input.locationLink}` : ""
    ].filter(Boolean);
    const lines = [
      `*Orçamento ${company.name || "SparkFilmes"} 🔥*`,
      "",
      `*Cliente:* ${input.clientName || "-"}`,
      `*Contato:* ${input.contact || "Não informado"}`,
      "",
      "*Informações do serviço*",
      "",
      ...serviceInformation,
      "",
      `🔥 *${input.serviceTitle || "Serviço audiovisual"}*`,
      `${input.projectTypeName || "Produção audiovisual"} · ${input.modelName || "Sob consulta"}`,
      `*Formato e equipe:* ${input.format || "A definir"}`
    ];

    if (presentingAllEventPackages) {
      lines.push("", "*Escolha a melhor opção para o seu evento:*" );
      (input.allEventPackages || []).forEach((eventPackage) => {
        lines.push("", `*${eventPackage.name} — ${money(eventPackage.price)}*`);
        lines.push(eventPackage.team);
        eventPackage.deliveries.forEach((delivery) => lines.push(`• ${delivery}`));
      });
      lines.push("", `*Cobertura incluída:* até ${positive(input.eventCoverageHours) || 4} horas`);
      lines.push("*Horas extras:* cobradas à parte");
    } else if (input.model === "pacote" && input.eventPackageId) {
      lines.push(`*Pacote:* ${input.eventPackageName || input.serviceTitle}`);
      lines.push(`*Equipe:* ${input.eventPackageTeam || "Conforme pacote"}`);
      lines.push(`*Cobertura incluída:* até ${positive(input.eventCoverageHours) || 4} horas`);
      lines.push("*Horas extras:* cobradas à parte");
      lines.push(`*Quantidade:* ${totals.quantity} ${totals.unitLabel}`);
      if (Array.isArray(input.eventPackageDeliveries) && input.eventPackageDeliveries.length) {
        lines.push("*Entregas incluídas:*");
        input.eventPackageDeliveries.forEach((delivery) => lines.push(`• ${delivery}`));
      }
      lines.push(`*Valor por pacote:* ${money(totals.unitValue)}`);
    } else if (input.model === "pacote") {
      lines.push(`*Quantidade:* ${totals.quantity} ${totals.unitLabel}`);
      lines.push(`*Produção estimada:* aproximadamente ${formatHours(totals.estimatedHours)}`);
      lines.push(`*Valor de referência por pacote:* ${money(totals.unitValue)}`);
    } else if (input.model === "tecnico") {
      lines.push(`*Carga estimada:* aproximadamente ${formatHours(totals.estimatedHours)}`);
    } else {
      lines.push(`*Tempo estimado de serviço:* aproximadamente ${formatHours(totals.estimatedHours)}`);
    }

    lines.push(`*Atendimento:* ${input.attendance === "presencial" ? "Presencial" : "Remoto"}`);

    if (presentingAllEventPackages) {
    } else {
      lines.push("", `*Total:* ${money(totals.total)}`);
    }

    if (String(input.notes || "").trim()) lines.push("", `*Observações:* ${String(input.notes).trim()}`);
    if (company.payment) {
      lines.push("", "*Condições de pagamento*", "", "*Pix*");
      if (company.payment.pixNome) lines.push(`Nome: ${company.payment.pixNome}`);
      if (company.payment.pixChave) lines.push(`Chave Pix: ${company.payment.pixChave}`);
      if (company.payment.pixBanco) lines.push(`Banco: ${company.payment.pixBanco}`);
      if (company.payment.cartao) lines.push("", `*Cartão de crédito:* ${company.payment.cartao}`);
    }
    lines.push("", company.signature || "SparkFilmes — histórias com linguagem de cinema.");
    return lines.join("\n");
  };

  return { asNumber, calculateBudget, validateBudget, buildWhatsAppMessage, money, formatDate, formatHours, roundMoney };
});
