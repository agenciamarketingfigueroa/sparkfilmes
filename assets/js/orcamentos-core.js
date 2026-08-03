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
        unitValue = positive(input.eventPackagePrice);
        reference = quantity * unitValue;
        stageLines.forEach((line) => {
          const minutes = positive(line.minutes);
          estimatedMinutes += minutes * quantity;
          estimatedHours += (minutes / 60) * quantity;
          technicalCost += (minutes / 60) * positive(line.hourlyRate) * quantity;
        });
      } else {
        const hoursPerPackage = positive(input.hoursPerPackage);
        const hourlyRate = positive(input.hourlyRate);
        estimatedHours = quantity * hoursPerPackage;
        unitValue = hoursPerPackage * hourlyRate;
        reference = quantity * unitValue;
        technicalCost = reference;
      }
      unitLabel = quantity === 1 ? "pacote" : "pacotes";
    } else if (model === "tecnico") {
      quantity = positive(input.technicalQuantity);
      const hoursPerDay = positive(input.hoursPerDay) || 8;
      const hourlyRate = positive(input.hourlyRate);
      const isDaily = input.technicalUnit === "diaria";
      estimatedHours = quantity * (isDaily ? hoursPerDay : 1);
      unitValue = hourlyRate * (isDaily ? hoursPerDay : 1);
      reference = quantity * unitValue;
      technicalCost = reference;
      unitLabel = isDaily ? (quantity === 1 ? "diária" : "diárias") : quantity === 1 ? "hora" : "horas";
    } else {
      const lines = Array.isArray(input.lines) ? input.lines : [];
      reference = lines.reduce((total, line) => {
        const lineQuantity = positive(line.quantity);
        const lineUnitValue = positive(line.unitValue);
        if (line.billingType === "hora") estimatedHours += lineQuantity;
        return total + lineQuantity * lineUnitValue;
      }, 0);
      quantity = lines.length;
      unitLabel = quantity === 1 ? "etapa" : "etapas";
      technicalCost = reference;
    }

    if (!input.eventPackageId) estimatedMinutes = estimatedHours * 60;

    const services = Number.isFinite(Number(input.serviceValue))
      ? positive(input.serviceValue)
      : reference;
    const travelFee = input.attendance === "presencial" ? positive(input.travelFee) : 0;
    const travelExtras = input.attendance === "presencial" ? positive(input.travelExtras) : 0;
    const travel = travelFee + travelExtras;

    return {
      reference: roundMoney(reference),
      services: roundMoney(services),
      travelFee: roundMoney(travelFee),
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
    if (input.model === "pacote" && input.projectType !== "evento" && positive(input.hoursPerPackage) <= 0) {
      errors.push("Informe as horas estimadas por pacote.");
    }
    if (input.model === "tecnico" && positive(input.technicalQuantity) <= 0) {
      errors.push("Informe a quantidade de horas ou diárias.");
    }
    if (input.model === "sob-medida" && (!Array.isArray(input.lines) || input.lines.length === 0)) {
      errors.push("Adicione ao menos uma etapa ao projeto sob medida.");
    }
    if (input.attendance === "presencial" && !String(input.address || "").trim()) {
      errors.push("Informe o local da gravação presencial.");
    }
    return errors;
  };

  const buildWhatsAppMessage = (input = {}, totals = calculateBudget(input), company = {}) => {
    const presentingAllEventPackages = input.model === "pacote" && input.eventQuoteMode === "todos";
    const lines = [
      `*Orçamento ${company.name || "SparkFilmes"} 🎬*`,
      "",
      `*Cliente:* ${input.clientName || "-"}`,
      `*Contato:* ${input.contact || "Não informado"}`,
      "",
      `🎬 *${input.serviceTitle || "Serviço audiovisual"}*`,
      `${input.projectTypeName || "Produção audiovisual"} · ${input.modelName || "Sob consulta"}`,
      `*Formato:* ${input.format || "A definir"}`
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
      lines.push(`*Produção estimada:* aproximadamente ${totals.estimatedHours} horas`);
      lines.push(`*Valor de referência por pacote:* ${money(totals.unitValue)}`);
    } else if (input.model === "tecnico") {
      lines.push(`*Quantidade:* ${totals.quantity} ${totals.unitLabel}`);
      lines.push(`*Carga estimada:* aproximadamente ${totals.estimatedHours} horas`);
      lines.push(`*Valor unitário:* ${money(totals.unitValue)}`);
    } else {
      lines.push(`*Escopo:* ${totals.quantity} ${totals.unitLabel} · aproximadamente ${totals.estimatedHours} horas`);
    }

    lines.push(`*Data desejada:* ${formatDate(input.desiredDate)}`);
    if (input.attendance === "presencial") {
      lines.push(`*Local:* ${input.address || "A definir"}`);
      if (positive(input.distanceKm) > 0) lines.push(`*Distância informada:* ${positive(input.distanceKm)} km`);
    } else {
      lines.push("*Atendimento:* Remoto");
    }

    if (presentingAllEventPackages) {
      lines.push("", "*Investimento:* conforme o pacote escolhido");
      if (input.attendance === "presencial" && totals.travel > 0) lines.push(`*Deslocamento e extras:* ${money(totals.travel)}`);
    } else {
      lines.push("", `*Serviços:* ${money(totals.services)}`);
      if (input.attendance === "presencial") lines.push(`*Deslocamento e extras:* ${money(totals.travel)}`);
      lines.push(`*Total estimado:* ${money(totals.total)}`);
    }

    if (String(input.notes || "").trim()) lines.push("", `*Observações:* ${String(input.notes).trim()}`);
    lines.push("", company.signature || "SparkFilmes — histórias com linguagem de cinema.");
    return lines.join("\n");
  };

  return { asNumber, calculateBudget, validateBudget, buildWhatsAppMessage, money, formatDate, roundMoney };
});
