(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SparkContractCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SCHEMA_VERSION = 1;
  const EXPORT_TYPE = "sparkfilmes-contract";
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
  const record = (value) => (isRecord(value) ? value : {});
  const cleanText = (value, fallback = "") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string" || typeof value === "number") return String(value).replace(/\r\n?/g, "\n").trim();
    return fallback;
  };
  const textOr = (value, fallback = "") => {
    const text = cleanText(value);
    return text || fallback;
  };
  const asNumber = (value, fallback = 0) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return fallback;
    const raw = value.trim();
    if (!raw) return fallback;
    const normalized = raw.includes(",")
      ? raw.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".")
      : raw.replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const moneyValue = (value, fallback = 0) => Math.max(0, asNumber(value, fallback));
  const roundMoney = (value) => Math.round((asNumber(value) + Number.EPSILON) * 100) / 100;
  const asInteger = (value, fallback = 0) => Math.max(0, Math.round(asNumber(value, fallback)));
  const pick = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");
  const pickText = (...values) => textOr(pick(...values));

  const COMMON_CLAUSES = {
    payment:
      "4.1. Pela execução dos serviços, a CONTRATANTE pagará à CONTRATADA o valor e as condições previstos no quadro comercial deste contrato. Qualquer alteração de escopo, prazo ou despesa extraordinária deverá ser aprovada previamente por escrito.",
    latePayment:
      "5.1. O atraso no pagamento de qualquer parcela sujeitará a CONTRATANTE à multa de 5% (cinco por cento) sobre o saldo vencido, acrescida de juros moratórios de 1% (um por cento) ao mês, calculados proporcionalmente ao período de atraso, sem prejuízo da atualização prevista neste instrumento.",
    breach:
      "6.1. O descumprimento de obrigação essencial deverá ser comunicado por escrito. A parte inadimplente terá prazo de até 45 (quarenta e cinco) dias, contados do recebimento da notificação, para sanar o inadimplemento. Não havendo regularização, a parte inocente poderá resolver o contrato, sem prejuízo de eventuais perdas e danos cabíveis.",
    termination:
      "7.1. A rescisão imotivada por qualquer das partes sujeitará a parte que lhe der causa ao pagamento de multa compensatória equivalente a 20% (vinte por cento) do valor total deste contrato, sem prejuízo do reembolso das despesas comprovadamente já assumidas e dos serviços efetivamente executados.",
    adjustment:
      "8.1. Em caso de necessidade de atualização monetária ou de execução continuada, os valores poderão ser corrigidos pela variação do IGP-M/FGV, ou pelo índice que legalmente o substitua, observada a periodicidade aplicável e a comunicação prévia entre as partes.",
    confidentiality:
      "9.1. As partes comprometem-se a preservar a confidencialidade de informações estratégicas, materiais ainda não divulgados e dados recebidos em razão deste contrato, salvo quando a divulgação for exigida por lei ou previamente autorizada por escrito.",
    general:
      "10.1. Qualquer tolerância entre as partes não constituirá novação ou renúncia de direito. Alterações deste contrato somente terão validade quando registradas por escrito e aceitas pelas partes. Este instrumento poderá ser assinado física ou eletronicamente, produzindo os mesmos efeitos.",
  };

  const TEMPLATE_DEFINITIONS = {
    eventos: {
      id: "eventos",
      label: "Fotografia e filmagem de eventos",
      title: "Contrato de Prestação de Serviços de Fotografia e Filmagem de Eventos",
      serviceType: "Cobertura audiovisual de evento",
      scope:
        "A CONTRATADA realizará a cobertura audiovisual do evento, incluindo as etapas, profissionais, período de captação e demais itens expressamente descritos no quadro-resumo. Horas adicionais, mudanças de local, itens extras ou demandas não previstas dependerão de aprovação prévia por escrito.",
      delivery:
        "As entregas serão disponibilizadas nos formatos, quantidades e prazo indicados no quadro-resumo. Materiais brutos, cópias extras, deslocamentos, licenças e itens não discriminados no escopo somente serão incluídos mediante ajuste escrito.",
      rights:
        "Os direitos de uso dos materiais entregues observarão a finalidade contratada. A CONTRATANTE responsabiliza-se por obter as autorizações necessárias de local, participantes, marcas e demais elementos presentes no evento, quando aplicável.",
    },
    conteudos: {
      id: "conteudos",
      label: "Produção de conteúdos",
      title: "Contrato de Prestação de Serviços de Produção de Conteúdos",
      serviceType: "Produção de conteúdos audiovisuais",
      scope:
        "A CONTRATADA realizará os serviços de planejamento, captação, edição e/ou finalização de conteúdos conforme as entregas, canais, formatos e equipe previstos no quadro-resumo. Alterações de briefing, escopo ou volume de peças deverão ser aprovadas previamente por escrito.",
      delivery:
        "As peças serão entregues nos formatos, quantidades, canais e prazos indicados no quadro-resumo. Rodadas adicionais de alteração, versões extras, mídia paga, trilhas, locações, elenco ou demais itens não previstos no escopo dependerão de novo ajuste.",
      rights:
        "A cessão ou licença de uso dos conteúdos limitar-se-á à finalidade, aos canais e ao período definidos neste contrato. A CONTRATANTE responderá pelas informações, marcas, textos, produtos e autorizações que fornecer para a produção.",
    },
    institucional: {
      id: "institucional",
      label: "Vídeo institucional",
      title: "Contrato de Prestação de Serviços de Produção de Vídeo Institucional",
      serviceType: "Produção de vídeo institucional",
      scope:
        "A CONTRATADA realizará a produção do vídeo institucional, compreendendo as fases de pré-produção, captação, edição, finalização e demais entregas expressamente previstas no quadro-resumo. Mudanças substanciais de roteiro, agenda, locação, equipe ou escopo dependerão de aprovação prévia por escrito.",
      delivery:
        "O vídeo e seus desdobramentos serão entregues nos formatos, versões e prazo definidos no quadro-resumo. Novas versões, captações adicionais, animações, locuções, licenças, materiais brutos ou itens não previstos no escopo serão tratados como serviço complementar.",
      rights:
        "Os direitos de uso do vídeo institucional observarão as finalidades, canais e período definidos neste contrato. A CONTRATANTE é responsável pela veracidade das informações institucionais e pelas autorizações de imagem, marca, local, trilha e demais elementos sob sua responsabilidade.",
    },
    personalizado: {
      id: "personalizado",
      label: "Contrato personalizado",
      title: "Contrato de Prestação de Serviços Audiovisuais",
      serviceType: "Serviços audiovisuais",
      scope:
        "A CONTRATADA prestará os serviços audiovisuais descritos no quadro-resumo, com escopo, equipe, etapas e recursos definidos pelas partes. Toda demanda adicional ou alteração relevante deverá ser aprovada previamente por escrito.",
      delivery:
        "As entregas, formatos e prazos serão aqueles previstos no quadro-resumo. Itens não descritos no escopo, versões extras, licenças, deslocamentos ou despesas extraordinárias dependerão de ajuste escrito entre as partes.",
      rights:
        "Os direitos de uso dos materiais produzidos serão definidos de acordo com a finalidade, os canais e o período previstos neste contrato. Cada parte permanecerá responsável pelas autorizações e conteúdos que estiver sob sua responsabilidade.",
    },
  };

  const CLAUSE_ORDER = [
    ["object", "DO OBJETO"],
    ["scope", "DO ESCOPO DOS SERVIÇOS"],
    ["delivery", "DAS ENTREGAS E DOS PRAZOS"],
    ["payment", "DO VALOR E DO PAGAMENTO"],
    ["latePayment", "DO ATRASO NO PAGAMENTO"],
    ["breach", "DO INADIMPLEMENTO E DA RESOLUÇÃO"],
    ["termination", "DA RESCISÃO"],
    ["adjustment", "DO REAJUSTE E DA ATUALIZAÇÃO"],
    ["rights", "DOS DIREITOS DE USO E AUTORIZAÇÕES"],
    ["confidentiality", "DA CONFIDENCIALIDADE"],
    ["general", "DAS DISPOSIÇÕES GERAIS"],
  ];

  const personTypeLabel = (value) => {
    if (value === "pf") return "Pessoa física";
    if (value === "pj") return "Pessoa jurídica";
    return "Pessoa";
  };

  const normalizeTemplateId = (value) => (own(TEMPLATE_DEFINITIONS, value) ? value : "personalizado");

  const templateFor = (value) => {
    const template = TEMPLATE_DEFINITIONS[normalizeTemplateId(value)];
    return {
      id: template.id,
      label: template.label,
      title: template.title,
      serviceType: template.serviceType,
      scope: template.scope,
      delivery: template.delivery,
      rights: template.rights,
      clauses: {
        object: `1.1. ${template.scope}`,
        scope: `2.1. ${template.scope}`,
        delivery: `3.1. ${template.delivery}`,
        ...COMMON_CLAUSES,
        rights: `9.1. ${template.rights}`,
      },
    };
  };

  const listTemplates = () =>
    Object.keys(TEMPLATE_DEFINITIONS).map((id) => {
      const template = templateFor(id);
      return { id: template.id, label: template.label, title: template.title };
    });

  const normalizeStringList = (value) => {
    if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean);
    if (typeof value === "string") {
      return value
        .split(/\r?\n|[•;]+/)
        .map((item) => cleanText(item))
        .filter(Boolean);
    }
    return [];
  };

  const normalizeTeam = (value) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (typeof item === "string") return { role: "", name: cleanText(item), details: "" };
        const row = record(item);
        return {
          role: cleanText(row.role || row.funcao || row.position),
          name: cleanText(row.name || row.nome),
          details: cleanText(row.details || row.detalhes || row.description),
        };
      })
      .filter((item) => item.role || item.name || item.details);
  };

  const normalizeWitnesses = (value) => {
    const rows = Array.isArray(value) ? value : [];
    const normalized = rows
      .slice(0, 4)
      .map((item) => {
        const row = record(item);
        return { name: cleanText(row.name || row.nome), document: cleanText(row.document || row.documento) };
      });
    while (normalized.length < 2) normalized.push({ name: "", document: "" });
    return normalized;
  };

  const createLegacyDefaultContract = (options = {}) => {
    const template = templateFor(options.template || options.templateId);
    return {
      schemaVersion: SCHEMA_VERSION,
      id: cleanText(options.id),
      template: template.id,
      templateId: template.id,
      title: cleanText(options.title, template.title),
      status: cleanText(options.status, "rascunho"),
      createdAt: cleanText(options.createdAt),
      updatedAt: cleanText(options.updatedAt),
      origin: { type: cleanText(record(options.origin).type, "manual"), budgetId: cleanText(record(options.origin).budgetId) },
      contractor: {
        legalName: "",
        personType: "pj",
        document: "",
        stateRegistration: "",
        representative: "",
        representativeDocument: "",
        email: "",
        phone: "",
        address: "",
        addressNumber: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        cityState: "",
        zip: "",
      },
      contracted: {
        legalName: "Spark Filmes",
        personType: "pj",
        document: "",
        stateRegistration: "",
        representative: "",
        representativeDocument: "",
        email: "",
        phone: "",
        address: "",
        addressNumber: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        cityState: "",
        zip: "",
      },
      project: {
        title: "",
        serviceType: template.serviceType,
        description: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        venueName: "",
        venueAddress: "",
        venueCity: "",
        venueState: "",
        deliveryDate: "",
        deliveryDescription: "",
        format: "",
        attendance: "",
        scope: template.scope,
        inclusions: [],
        exclusions: [],
        team: [],
        revisions: 0,
      },
      commercial: {
        total: 0,
        serviceValue: 0,
        additionalExpenses: 0,
        paymentMethod: "",
        paymentDescription: "",
        paymentTerms: "",
        entryValue: 0,
        entryDate: "",
        installments: 0,
        installmentFirstDate: "",
        billingType: "",
        validityStart: "",
        validityEnd: "",
      },
      clauses: { ...template.clauses },
      terms: { rightsUse: "", cancellation: "", forum: "" },
      signatures: {
        city: "",
        signingDate: "",
        contractorName: "",
        contractorRole: "",
        contractedName: "",
        contractedRole: "",
        witnesses: [{ name: "", document: "" }, { name: "", document: "" }],
      },
      additionalClauses: [],
      notes: "",
    };
  };

  const sourceValue = (primary, fallback, key, defaultValue) => {
    if (isRecord(primary) && own(primary, key)) return primary[key];
    if (isRecord(fallback) && own(fallback, key)) return fallback[key];
    return defaultValue;
  };

  const normalizeParty = (base, source, legacy = {}) => {
    const row = record(source);
    const personType = cleanText(sourceValue(row, legacy, "personType", base.personType)).toLowerCase();
    const state = cleanText(sourceValue(row, legacy, "state", base.state)).toUpperCase().slice(0, 2);
    return {
      legalName: cleanText(sourceValue(row, legacy, "legalName", base.legalName)),
      personType: personType === "pf" || personType === "pj" ? personType : base.personType,
      document: cleanText(sourceValue(row, legacy, "document", base.document)),
      stateRegistration: cleanText(sourceValue(row, legacy, "stateRegistration", base.stateRegistration)),
      representative: cleanText(sourceValue(row, legacy, "representative", base.representative)),
      representativeDocument: cleanText(sourceValue(row, legacy, "representativeDocument", base.representativeDocument)),
      email: cleanText(sourceValue(row, legacy, "email", base.email)),
      phone: cleanText(sourceValue(row, legacy, "phone", base.phone)),
      address: cleanText(sourceValue(row, legacy, "address", base.address)),
      addressNumber: cleanText(sourceValue(row, legacy, "addressNumber", base.addressNumber)),
      complement: cleanText(sourceValue(row, legacy, "complement", base.complement)),
      neighborhood: cleanText(sourceValue(row, legacy, "neighborhood", base.neighborhood)),
      city: cleanText(sourceValue(row, legacy, "city", base.city)),
      state,
      cityState: cleanText(sourceValue(row, legacy, "cityState", base.cityState)),
      zip: cleanText(sourceValue(row, legacy, "zip", base.zip)),
    };
  };

  const normalizeAdditionalClauses = (value) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        const row = record(item);
        return { title: cleanText(row.title || row.titulo), text: cleanText(row.text || row.texto) };
      })
      .filter((item) => item.title || item.text);
  };

  const normalizeLegacyContract = (source = {}, options = {}) => {
    const raw = record(source);
    const templateId = normalizeTemplateId(raw.template || raw.templateId || options.template || options.templateId);
    const base = createLegacyDefaultContract({ template: templateId });
    const contractorSource = record(raw.contractor);
    const contractedSource = record(raw.contracted);
    const projectSource = record(raw.project);
    const commercialSource = record(raw.commercial);
    const clauseSource = record(raw.clauses);
    const termSource = record(raw.terms);
    const signatureSource = record(raw.signatures);
    const originSource = record(raw.origin);

    const paymentDescription = cleanText(
      sourceValue(commercialSource, raw, "paymentDescription", sourceValue(commercialSource, raw, "paymentTerms", base.commercial.paymentDescription))
    );
    const paymentTerms = cleanText(sourceValue(commercialSource, raw, "paymentTerms", paymentDescription));
    const result = {
      ...base,
      id: cleanText(raw.id, base.id),
      template: templateId,
      templateId,
      title: cleanText(raw.title, base.title),
      status: cleanText(raw.status, base.status),
      createdAt: cleanText(raw.createdAt, base.createdAt),
      updatedAt: cleanText(raw.updatedAt, base.updatedAt),
      origin: {
        type: cleanText(sourceValue(originSource, raw, "type", base.origin.type)),
        budgetId: cleanText(sourceValue(originSource, raw, "budgetId", base.origin.budgetId)),
      },
      contractor: normalizeParty(base.contractor, contractorSource, raw),
      contracted: normalizeParty(base.contracted, contractedSource, raw),
      project: {
        title: cleanText(sourceValue(projectSource, raw, "title", base.project.title)),
        serviceType: cleanText(sourceValue(projectSource, raw, "serviceType", base.project.serviceType)),
        description: cleanText(sourceValue(projectSource, raw, "description", base.project.description)),
        eventDate: cleanText(sourceValue(projectSource, raw, "eventDate", base.project.eventDate)),
        startTime: cleanText(sourceValue(projectSource, raw, "startTime", base.project.startTime)),
        endTime: cleanText(sourceValue(projectSource, raw, "endTime", base.project.endTime)),
        venueName: cleanText(sourceValue(projectSource, raw, "venueName", base.project.venueName)),
        venueAddress: cleanText(sourceValue(projectSource, raw, "venueAddress", base.project.venueAddress)),
        venueCity: cleanText(sourceValue(projectSource, raw, "venueCity", base.project.venueCity)),
        venueState: cleanText(sourceValue(projectSource, raw, "venueState", base.project.venueState)).toUpperCase().slice(0, 2),
        deliveryDate: cleanText(sourceValue(projectSource, raw, "deliveryDate", base.project.deliveryDate)),
        deliveryDescription: cleanText(sourceValue(projectSource, raw, "deliveryDescription", base.project.deliveryDescription)),
        format: cleanText(sourceValue(projectSource, raw, "format", base.project.format)),
        attendance: cleanText(sourceValue(projectSource, raw, "attendance", base.project.attendance)),
        scope: cleanText(sourceValue(projectSource, raw, "scope", base.project.scope)),
        inclusions: normalizeStringList(sourceValue(projectSource, raw, "inclusions", base.project.inclusions)),
        exclusions: normalizeStringList(sourceValue(projectSource, raw, "exclusions", base.project.exclusions)),
        team: normalizeTeam(sourceValue(projectSource, raw, "team", base.project.team)),
        revisions: asInteger(sourceValue(projectSource, raw, "revisions", base.project.revisions)),
      },
      commercial: {
        total: roundMoney(moneyValue(sourceValue(commercialSource, raw, "total", base.commercial.total))),
        serviceValue: roundMoney(moneyValue(sourceValue(commercialSource, raw, "serviceValue", base.commercial.serviceValue))),
        additionalExpenses: roundMoney(moneyValue(sourceValue(commercialSource, raw, "additionalExpenses", base.commercial.additionalExpenses))),
        paymentMethod: cleanText(sourceValue(commercialSource, raw, "paymentMethod", base.commercial.paymentMethod)),
        paymentDescription,
        paymentTerms,
        entryValue: roundMoney(moneyValue(sourceValue(commercialSource, raw, "entryValue", base.commercial.entryValue))),
        entryDate: cleanText(sourceValue(commercialSource, raw, "entryDate", base.commercial.entryDate)),
        installments: asInteger(sourceValue(commercialSource, raw, "installments", base.commercial.installments)),
        installmentFirstDate: cleanText(sourceValue(commercialSource, raw, "installmentFirstDate", base.commercial.installmentFirstDate)),
        billingType: cleanText(sourceValue(commercialSource, raw, "billingType", base.commercial.billingType)),
        validityStart: cleanText(sourceValue(commercialSource, raw, "validityStart", base.commercial.validityStart)),
        validityEnd: cleanText(sourceValue(commercialSource, raw, "validityEnd", base.commercial.validityEnd)),
      },
      clauses: {},
      terms: {
        rightsUse: cleanText(sourceValue(termSource, raw, "rightsUse", base.terms.rightsUse)),
        cancellation: cleanText(sourceValue(termSource, raw, "cancellation", base.terms.cancellation)),
        forum: cleanText(sourceValue(termSource, raw, "forum", base.terms.forum)),
      },
      signatures: {
        city: cleanText(sourceValue(signatureSource, raw, "city", base.signatures.city)),
        signingDate: cleanText(sourceValue(signatureSource, raw, "signingDate", base.signatures.signingDate)),
        contractorName: cleanText(sourceValue(signatureSource, raw, "contractorName", base.signatures.contractorName)),
        contractorRole: cleanText(sourceValue(signatureSource, raw, "contractorRole", base.signatures.contractorRole)),
        contractedName: cleanText(sourceValue(signatureSource, raw, "contractedName", base.signatures.contractedName)),
        contractedRole: cleanText(sourceValue(signatureSource, raw, "contractedRole", base.signatures.contractedRole)),
        witnesses: normalizeWitnesses(sourceValue(signatureSource, raw, "witnesses", base.signatures.witnesses)),
      },
      additionalClauses: normalizeAdditionalClauses(raw.additionalClauses),
      notes: cleanText(raw.notes, base.notes),
    };

    CLAUSE_ORDER.forEach(([key]) => {
      result.clauses[key] = cleanText(sourceValue(clauseSource, raw, key, base.clauses[key]));
    });
    return result;
  };

  /*
   * The internal interface uses the names below (`client` and `contractor`).
   * The first contract prototype used a flatter vocabulary, so these adapters
   * keep imports from that prototype readable without leaking that shape into
   * the page controller.
   */
  const normalizeAddress = (source = {}) => {
    const row = record(source);
    return {
      zip: cleanText(row.zip || row.cep),
      street: cleanText(row.street || row.logradouro || row.address),
      number: cleanText(row.number || row.addressNumber),
      complement: cleanText(row.complement),
      neighborhood: cleanText(row.neighborhood || row.bairro),
      city: cleanText(row.city),
      state: cleanText(row.state || row.uf).toUpperCase().slice(0, 2),
    };
  };

  const addressFromLegacy = (party = {}) =>
    normalizeAddress({
      zip: party.zip,
      street: party.address,
      number: party.addressNumber,
      complement: party.complement,
      neighborhood: party.neighborhood,
      city: party.city || party.cityState,
      state: party.state,
    });

  const addressToLegacy = (address = {}) => {
    const row = normalizeAddress(address);
    return {
      address: row.street,
      addressNumber: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      cityState: [row.city, row.state].filter(Boolean).join(" - "),
      zip: row.zip,
    };
  };

  const normalizePayments = (value) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        const row = record(item);
        return {
          description: cleanText(row.description || row.descricao),
          dueDate: cleanText(row.dueDate || row.date || row.data),
          amount: roundMoney(moneyValue(row.amount || row.value || row.valor)),
          condition: cleanText(row.condition || row.condicao),
        };
      })
      .filter((item) => item.description || item.dueDate || item.amount || item.condition);
  };

  const normalizeDeliveries = (value) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (typeof item === "string") return { description: cleanText(item), quantity: "", deadline: "" };
        const row = record(item);
        return {
          description: cleanText(row.description || row.descricao || row.name),
          quantity: cleanText(row.quantity || row.quantidade),
          deadline: cleanText(row.deadline || row.deliveryDate || row.prazo),
        };
      })
      .filter((item) => item.description || item.quantity || item.deadline);
  };

  const normalizeShellClient = (source = {}, fallback = {}) => {
    const row = record(source);
    const address = normalizeAddress(row.address);
    return {
      type: ["pf", "pj"].includes(cleanText(row.type || row.personType).toLowerCase())
        ? cleanText(row.type || row.personType).toLowerCase()
        : fallback.type || "pj",
      name: cleanText(row.name || row.legalName, fallback.name),
      tradeName: cleanText(row.tradeName || row.nomeFantasia, fallback.tradeName),
      document: cleanText(row.document || row.documento, fallback.document),
      email: cleanText(row.email, fallback.email),
      phone: cleanText(row.phone || row.telefone, fallback.phone),
      representative: cleanText(row.representative || row.representante, fallback.representative),
      representativeDocument: cleanText(row.representativeDocument || row.documentoRepresentante, fallback.representativeDocument),
      address: Object.values(address).some(Boolean) ? address : fallback.address || normalizeAddress(),
    };
  };

  const normalizeShellContractor = (source = {}, fallback = {}) => {
    const row = record(source);
    const address = normalizeAddress(row.address);
    return {
      legalName: cleanText(row.legalName || row.name || row.razaoSocial, fallback.legalName || "Spark Filmes"),
      tradeName: cleanText(row.tradeName || row.nomeFantasia, fallback.tradeName),
      document: cleanText(row.document || row.documento, fallback.document),
      email: cleanText(row.email, fallback.email),
      phone: cleanText(row.phone || row.telefone, fallback.phone),
      representative: cleanText(row.representative || row.representante, fallback.representative),
      representativeDocument: cleanText(row.representativeDocument || row.documentoRepresentante, fallback.representativeDocument),
      address: Object.values(address).some(Boolean) ? address : fallback.address || normalizeAddress(),
    };
  };

  const looksLikeShellContract = (value) => {
    const row = record(value);
    return own(row, "client") || own(row, "meta") || (isRecord(row.project) && (own(row.project, "category") || own(row.project, "location"))) || (isRecord(row.commercial) && own(row.commercial, "payments"));
  };

  const addMonthsToIsoDate = (value, months) => {
    if (!ISO_DATE.test(cleanText(value))) return "";
    const [year, month, day] = String(value).split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1 + months, day));
    return date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0");
  };

  const legacyToShell = (legacySource = {}) => {
    const legacy = normalizeLegacyContract(legacySource);
    const payments = [];
    const total = roundMoney(legacy.commercial.total);
    const entryValue = Math.min(total, roundMoney(legacy.commercial.entryValue));
    const installments = asInteger(legacy.commercial.installments);
    const paymentCondition = legacy.commercial.paymentDescription || legacy.commercial.paymentTerms;
    if (legacy.commercial.entryValue > 0) {
      payments.push({
        description: "Sinal / entrada",
        dueDate: legacy.commercial.entryDate,
        amount: entryValue,
        condition: paymentCondition,
      });
    }
    if (installments > 0) {
      const remaining = roundMoney(Math.max(0, total - entryValue));
      const installmentValue = roundMoney(remaining / installments);
      let accumulated = 0;
      for (let index = 0; index < installments; index += 1) {
        const amount = index === installments - 1 ? roundMoney(remaining - accumulated) : installmentValue;
        accumulated = roundMoney(accumulated + amount);
        payments.push({
          description: "Parcela " + (index + 1) + " de " + installments,
          dueDate: addMonthsToIsoDate(legacy.commercial.installmentFirstDate, index),
          amount,
          condition: paymentCondition,
        });
      }
    }
    if (!payments.length && total > 0) {
      payments.push({
        description: "Pagamento único",
        dueDate: "",
        amount: total,
        condition: paymentCondition,
      });
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      template: legacy.template,
      templateId: legacy.template,
      meta: { number: legacy.id, status: legacy.status, createdAt: legacy.createdAt, updatedAt: legacy.updatedAt, origin: legacy.origin.type, budgetId: legacy.origin.budgetId },
      title: legacy.title,
      client: {
        type: legacy.contractor.personType,
        name: legacy.contractor.legalName,
        tradeName: "",
        document: legacy.contractor.document,
        email: legacy.contractor.email,
        phone: legacy.contractor.phone,
        representative: legacy.contractor.representative,
        representativeDocument: legacy.contractor.representativeDocument,
        address: addressFromLegacy(legacy.contractor),
      },
      contractor: {
        legalName: legacy.contracted.legalName,
        tradeName: "",
        document: legacy.contracted.document,
        email: legacy.contracted.email,
        phone: legacy.contracted.phone,
        representative: legacy.contracted.representative,
        representativeDocument: legacy.contracted.representativeDocument,
        address: addressFromLegacy(legacy.contracted),
      },
      project: {
        title: legacy.project.title,
        category: legacy.project.serviceType,
        summary: legacy.project.description,
        date: legacy.project.eventDate,
        startTime: legacy.project.startTime,
        endTime: legacy.project.endTime,
        deliveryDate: legacy.project.deliveryDate,
        expiry: "",
        revisions: legacy.project.revisions,
        rights: legacy.terms.rightsUse,
        rightsNotes: legacy.terms.rightsUse,
        location: {
          type: legacy.project.attendance,
          name: legacy.project.venueName,
          city: legacy.project.venueCity,
          address: legacy.project.venueAddress,
          link: "",
        },
        team: legacy.project.team.map((item) => ({ role: item.role, name: item.name, quantity: "" })),
        deliveries: legacy.project.inclusions.map((description) => ({ description, quantity: "", deadline: legacy.project.deliveryDate })),
      },
      commercial: {
        type: legacy.commercial.billingType,
        total: legacy.commercial.total,
        currency: "BRL",
        vigencyStart: legacy.commercial.validityStart,
        vigencyEnd: legacy.commercial.validityEnd,
        renewal: "",
        renewalNotes: "",
        notes: legacy.commercial.paymentDescription || legacy.commercial.paymentTerms,
        payments,
      },
      clauses: {
        deliveryDays: "",
        revisionDays: "",
        rescheduleDays: "",
        cancellationDays: "",
        lateFeePercent: 5,
        lateInterestPercent: 1,
        defaultDays: 45,
        terminationFeePercent: 20,
        adjustmentIndex: "IGP-M/FGV",
        object: legacy.clauses.object,
        scope: legacy.clauses.scope,
        changes: "",
        rights: legacy.clauses.rights,
        cancellation: [legacy.clauses.termination, legacy.terms.cancellation].filter(Boolean).join("\n\n"),
        default: legacy.clauses.breach,
        confidentiality: legacy.clauses.confidentiality,
      },
      signatures: { city: legacy.signatures.city, date: legacy.signatures.signingDate, forum: legacy.terms.forum },
      witnesses: legacy.signatures.witnesses.map((item) => ({ name: item.name, document: item.document, email: "" })),
      additionalClauses: legacy.additionalClauses,
      notes: legacy.notes,
    };
  };

  const shellToLegacy = (source = {}) => {
    const raw = record(source);
    if (!looksLikeShellContract(raw)) return raw;
    const client = normalizeShellClient(raw.client);
    const contractor = normalizeShellContractor(raw.contractor);
    const project = record(raw.project);
    const commercial = record(raw.commercial);
    const clauses = record(raw.clauses);
    const signatures = record(raw.signatures);
    const deliveries = normalizeDeliveries(project.deliveries);
    const payments = normalizePayments(commercial.payments);
    const firstPayment = payments[0] || {};
    const numeric = (value, fallback) => (value === undefined || value === null || value === "" ? fallback : moneyValue(value));
    const lateFee = numeric(clauses.lateFeePercent, 5);
    const lateInterest = numeric(clauses.lateInterestPercent, 1);
    const defaultDays = asInteger(clauses.defaultDays, 45) || 45;
    const terminationFee = numeric(clauses.terminationFeePercent, 20);
    const adjustmentIndex = cleanText(clauses.adjustmentIndex, "IGP-M/FGV");
    const template = templateFor(raw.template || raw.templateId);
    const defaultClauses = template.clauses;
    return {
      schemaVersion: SCHEMA_VERSION,
      id: cleanText(record(raw.meta).number || raw.id),
      template: template.id,
      title: cleanText(raw.title, template.title),
      status: cleanText(record(raw.meta).status || raw.status, "rascunho"),
      createdAt: cleanText(record(raw.meta).createdAt || raw.createdAt),
      updatedAt: cleanText(record(raw.meta).updatedAt || raw.updatedAt),
      origin: { type: cleanText(record(raw.meta).origin || "manual"), budgetId: cleanText(record(raw.meta).budgetId) },
      contractor: {
        legalName: client.name,
        personType: client.type,
        document: client.document,
        representative: client.representative,
        representativeDocument: client.representativeDocument,
        email: client.email,
        phone: client.phone,
        ...addressToLegacy(client.address),
      },
      contracted: {
        legalName: contractor.legalName,
        personType: "pj",
        document: contractor.document,
        representative: contractor.representative,
        representativeDocument: contractor.representativeDocument,
        email: contractor.email,
        phone: contractor.phone,
        ...addressToLegacy(contractor.address),
      },
      project: {
        title: cleanText(project.title),
        serviceType: cleanText(project.category, template.serviceType),
        description: cleanText(project.summary),
        eventDate: cleanText(project.date),
        startTime: cleanText(project.startTime),
        endTime: cleanText(project.endTime),
        venueName: cleanText(record(project.location).name),
        venueAddress: cleanText(record(project.location).address),
        venueCity: cleanText(record(project.location).city),
        venueState: "",
        deliveryDate: cleanText(project.deliveryDate),
        deliveryDescription: deliveries.map((item) => [item.description, item.quantity && `Quantidade: ${item.quantity}`, item.deadline && `Prazo: ${item.deadline}`].filter(Boolean).join(" · ")).join("\n"),
        format: cleanText(project.format),
        attendance: cleanText(record(project.location).type),
        scope: cleanText(clauses.scope, template.scope),
        inclusions: deliveries.map((item) => item.description),
        exclusions: [],
        team: Array.isArray(project.team)
          ? project.team.map((item) => {
              const row = record(item);
              return { role: cleanText(row.role), name: cleanText(row.name), details: cleanText(row.quantity) };
            })
          : [],
        revisions: asInteger(project.revisions),
      },
      commercial: {
        total: moneyValue(commercial.total),
        serviceValue: moneyValue(commercial.total),
        additionalExpenses: 0,
        paymentMethod: cleanText(commercial.type),
        paymentDescription: cleanText(commercial.notes || firstPayment.condition),
        paymentTerms: cleanText(commercial.notes || firstPayment.condition),
        entryValue: firstPayment.amount || 0,
        entryDate: firstPayment.dueDate || "",
        installments: payments.length > 1 ? payments.length : 0,
        installmentFirstDate: payments[1] ? payments[1].dueDate : "",
        billingType: cleanText(commercial.type),
        validityStart: cleanText(commercial.vigencyStart),
        validityEnd: cleanText(commercial.vigencyEnd),
      },
      clauses: {
        object: cleanText(clauses.object, defaultClauses.object),
        scope: cleanText(clauses.scope, defaultClauses.scope),
        delivery: cleanText(clauses.delivery, defaultClauses.delivery),
        payment: cleanText(clauses.payment, defaultClauses.payment),
        latePayment: cleanText(
          clauses.latePayment,
          `5.1. O atraso no pagamento de qualquer parcela sujeitará a CONTRATANTE à multa de ${lateFee}% (${numberToWords(lateFee)} por cento) sobre o saldo vencido, acrescida de juros moratórios de ${lateInterest}% (${numberToWords(lateInterest)} por cento) ao mês, calculados proporcionalmente ao período de atraso, sem prejuízo da atualização prevista neste instrumento.`
        ),
        breach: cleanText(
          clauses.default,
          `6.1. O descumprimento de obrigação essencial deverá ser comunicado por escrito. A parte inadimplente terá prazo de até ${defaultDays} (${numberToWords(defaultDays)}) dias, contados do recebimento da notificação, para sanar o inadimplemento. Não havendo regularização, a parte inocente poderá resolver o contrato, sem prejuízo de eventuais perdas e danos cabíveis.`
        ),
        termination: cleanText(
          clauses.cancellation,
          `7.1. A rescisão imotivada por qualquer das partes sujeitará a parte que lhe der causa ao pagamento de multa compensatória equivalente a ${terminationFee}% (${numberToWords(terminationFee)} por cento) do valor total deste contrato, sem prejuízo do reembolso das despesas comprovadamente já assumidas e dos serviços efetivamente executados.`
        ),
        adjustment: cleanText(
          clauses.adjustment,
          `8.1. Em caso de necessidade de atualização monetária ou de execução continuada, os valores poderão ser corrigidos pela variação do ${adjustmentIndex}, ou pelo índice que legalmente o substitua, observada a periodicidade aplicável e a comunicação prévia entre as partes.`
        ),
        rights: cleanText(clauses.rights, defaultClauses.rights),
        confidentiality: cleanText(clauses.confidentiality, defaultClauses.confidentiality),
        general: cleanText(clauses.general, defaultClauses.general),
      },
      terms: { rightsUse: cleanText(project.rightsNotes || project.rights), cancellation: "", forum: cleanText(signatures.forum) },
      signatures: {
        city: cleanText(signatures.city),
        signingDate: cleanText(signatures.date),
        contractorName: cleanText(client.representative || client.name),
        contractorRole: "",
        contractedName: cleanText(contractor.representative),
        contractedRole: "",
        witnesses: Array.isArray(raw.witnesses)
          ? raw.witnesses.map((item) => ({ name: cleanText(record(item).name), document: cleanText(record(item).document) }))
          : [],
      },
      additionalClauses: raw.additionalClauses,
      notes: cleanText(raw.notes),
    };
  };

  const normalizeShellContract = (source = {}, options = {}) => {
    const raw = record(source);
    const shellInput = looksLikeShellContract(raw) ? raw : null;
    const shell = legacyToShell(normalizeLegacyContract(shellToLegacy(raw), options));
    if (!shellInput) return shell;
    const inputMeta = record(shellInput.meta);
    const inputProject = record(shellInput.project);
    const inputCommercial = record(shellInput.commercial);
    const inputClauses = record(shellInput.clauses);
    const inputSignatures = record(shellInput.signatures);
    const templateId = normalizeTemplateId(shellInput.template || shellInput.templateId || shell.template);
    shell.template = templateId;
    shell.templateId = templateId;
    shell.title = cleanText(shellInput.title, templateFor(templateId).title);
    shell.meta = {
      number: cleanText(inputMeta.number || shellInput.id || shell.meta.number),
      status: cleanText(inputMeta.status || shellInput.status || shell.meta.status, "rascunho"),
      createdAt: cleanText(inputMeta.createdAt || shellInput.createdAt || shell.meta.createdAt),
      updatedAt: cleanText(inputMeta.updatedAt || shellInput.updatedAt || shell.meta.updatedAt),
      origin: cleanText(inputMeta.origin || shell.meta.origin, "manual"),
      budgetId: cleanText(inputMeta.budgetId || shell.meta.budgetId),
    };
    shell.client = normalizeShellClient(shellInput.client, shell.client);
    shell.contractor = normalizeShellContractor(shellInput.contractor, shell.contractor);
    const location = record(inputProject.location);
    shell.project = {
      title: cleanText(inputProject.title, shell.project.title),
      category: cleanText(inputProject.category, shell.project.category),
      summary: cleanText(inputProject.summary, shell.project.summary),
      date: cleanText(inputProject.date, shell.project.date),
      startTime: cleanText(inputProject.startTime, shell.project.startTime),
      endTime: cleanText(inputProject.endTime, shell.project.endTime),
      deliveryDate: cleanText(inputProject.deliveryDate, shell.project.deliveryDate),
      expiry: cleanText(inputProject.expiry, shell.project.expiry),
      revisions: asInteger(inputProject.revisions, shell.project.revisions),
      rights: cleanText(inputProject.rights, shell.project.rights),
      rightsNotes: cleanText(inputProject.rightsNotes, shell.project.rightsNotes),
      location: {
        type: cleanText(location.type, shell.project.location.type),
        name: cleanText(location.name, shell.project.location.name),
        city: cleanText(location.city, shell.project.location.city),
        address: cleanText(location.address, shell.project.location.address),
        link: cleanText(location.link, shell.project.location.link),
      },
      team: Array.isArray(inputProject.team)
        ? inputProject.team.map((item) => {
            const row = record(item);
            return { role: cleanText(row.role), name: cleanText(row.name), quantity: cleanText(row.quantity) };
          }).filter((item) => item.role || item.name || item.quantity)
        : shell.project.team,
      deliveries: Array.isArray(inputProject.deliveries) ? normalizeDeliveries(inputProject.deliveries) : shell.project.deliveries,
    };
    shell.commercial = {
      type: cleanText(inputCommercial.type, shell.commercial.type),
      total: roundMoney(moneyValue(own(inputCommercial, "total") ? inputCommercial.total : shell.commercial.total)),
      currency: cleanText(inputCommercial.currency, shell.commercial.currency || "BRL"),
      vigencyStart: cleanText(inputCommercial.vigencyStart, shell.commercial.vigencyStart),
      vigencyEnd: cleanText(inputCommercial.vigencyEnd, shell.commercial.vigencyEnd),
      renewal: cleanText(inputCommercial.renewal, shell.commercial.renewal),
      renewalNotes: cleanText(inputCommercial.renewalNotes, shell.commercial.renewalNotes),
      notes: cleanText(inputCommercial.notes, shell.commercial.notes),
      payments: Array.isArray(inputCommercial.payments) ? normalizePayments(inputCommercial.payments) : shell.commercial.payments,
    };
    shell.clauses = {
      ...shell.clauses,
      deliveryDays: cleanText(inputClauses.deliveryDays, shell.clauses.deliveryDays),
      revisionDays: cleanText(inputClauses.revisionDays, shell.clauses.revisionDays),
      rescheduleDays: cleanText(inputClauses.rescheduleDays, shell.clauses.rescheduleDays),
      cancellationDays: cleanText(inputClauses.cancellationDays, shell.clauses.cancellationDays),
      lateFeePercent: roundMoney(numericOr(inputClauses.lateFeePercent, shell.clauses.lateFeePercent)),
      lateInterestPercent: roundMoney(numericOr(inputClauses.lateInterestPercent, shell.clauses.lateInterestPercent)),
      defaultDays: asInteger(inputClauses.defaultDays, shell.clauses.defaultDays),
      terminationFeePercent: roundMoney(numericOr(inputClauses.terminationFeePercent, shell.clauses.terminationFeePercent)),
      adjustmentIndex: cleanText(inputClauses.adjustmentIndex, shell.clauses.adjustmentIndex),
      object: cleanText(inputClauses.object, shell.clauses.object),
      scope: cleanText(inputClauses.scope, shell.clauses.scope),
      changes: cleanText(inputClauses.changes, shell.clauses.changes),
      rights: cleanText(inputClauses.rights, shell.clauses.rights),
      cancellation: cleanText(inputClauses.cancellation, shell.clauses.cancellation),
      default: cleanText(inputClauses.default, shell.clauses.default),
      confidentiality: cleanText(inputClauses.confidentiality, shell.clauses.confidentiality),
    };
    shell.signatures = {
      city: cleanText(inputSignatures.city, shell.signatures.city),
      date: cleanText(inputSignatures.date, shell.signatures.date),
      forum: cleanText(inputSignatures.forum, shell.signatures.forum),
    };
    shell.witnesses = Array.isArray(shellInput.witnesses)
      ? shellInput.witnesses.map((item) => {
          const row = record(item);
          return { name: cleanText(row.name), document: cleanText(row.document), email: cleanText(row.email) };
        }).filter((item) => item.name || item.document || item.email)
      : shell.witnesses;
    shell.additionalClauses = Array.isArray(shellInput.additionalClauses) ? normalizeAdditionalClauses(shellInput.additionalClauses) : shell.additionalClauses;
    shell.notes = cleanText(shellInput.notes, shell.notes);
    return shell;
  };

  const numericOr = (value, fallback) => (value === undefined || value === null || value === "" ? fallback : moneyValue(value));

  const createDefaultContract = (options = {}) => normalizeShellContract(createLegacyDefaultContract(options));
  const normalizeContract = (source = {}, options = {}) => normalizeShellContract(source, options);

  const inferTemplateFromBudget = (input = {}, details = {}) => {
    const requested = cleanText(details.templateId || details.template || input.contractTemplate || input.templateId || input.template).toLowerCase();
    if (own(TEMPLATE_DEFINITIONS, requested)) return requested;
    const haystack = [input.projectType, input.projectTypeName, input.serviceTitle, input.format]
      .map((value) => cleanText(value).toLowerCase())
      .join(" ");
    if (/evento|fotografia|filmagem/.test(haystack)) return "eventos";
    if (/conte[uú]do|redes? sociais|social media/.test(haystack)) return "conteudos";
    if (/institucional/.test(haystack)) return "institucional";
    return "personalizado";
  };

  const parseCityState = (value) => {
    const text = cleanText(value);
    if (!text) return { city: "", state: "", cityState: "" };
    const match = text.match(/^(.+?)(?:\s*[-/,]\s*)([A-Za-z]{2})$/);
    return match
      ? { city: cleanText(match[1]), state: String(match[2]).toUpperCase(), cityState: text }
      : { city: text, state: "", cityState: text };
  };

  const sourceList = (...values) => {
    for (const value of values) {
      const list = normalizeStringList(value);
      if (list.length) return list;
    }
    return [];
  };

  const createContractFromBudget = (draft = {}) => {
    const rootDraft = record(draft);
    const sourceBudget = record(rootDraft.sourceBudget || rootDraft.budget);
    const input = record(sourceBudget.input || rootDraft.input || rootDraft);
    const totals = record(sourceBudget.totals || rootDraft.totals);
    const details = record(rootDraft.contract);
    const templateId = inferTemplateFromBudget(input, details);
    const cityState = parseCityState(pickText(details.clientCityState, input.clientCityState));
    const eventDeliveries = sourceList(
      details.inclusions,
      input.contractInclusions,
      input.eventPackageDeliveries,
      input.deliveries,
      input.deliveryDescription
    );
    const team = Array.isArray(details.team)
      ? details.team
      : Array.isArray(input.team)
      ? input.team
      : Array.isArray(input.serviceFormats)
      ? input.serviceFormats
        .filter((item) => item && (item.checked === undefined || item.checked) && cleanText(item.name || item.role))
        .map((item) => ({ role: cleanText(item.name || item.role), name: "", quantity: cleanText(item.quantity || "1") }))
      : input.eventPackageTeam
      ? [{ role: "Equipe prevista", name: cleanText(input.eventPackageTeam) }]
      : [];
    const paymentDescription = pickText(details.paymentDescription, details.paymentTerms, input.paymentDescription, input.paymentTerms);
    const paymentTerms = pickText(details.paymentTerms, details.paymentDescription, input.paymentTerms, input.paymentDescription);
    const projectScope = pickText(details.scope, details.projectScope, input.contractScope);
    const mapped = {
      template: templateId,
      origin: {
        type: "orcamento",
        budgetId: pickText(rootDraft.id, sourceBudget.id, input.id, input.quoteId),
      },
      contractor: {
        legalName: pickText(details.clientLegalName, input.clientLegalName, input.clientName),
        personType: pickText(details.clientType, input.clientType, "pj").toLowerCase(),
        document: pickText(details.clientDocument, input.clientDocument),
        representative: pickText(details.clientRepresentative, input.clientRepresentative),
        representativeDocument: pickText(details.clientRepresentativeDocument, input.clientRepresentativeDocument),
        email: pickText(details.clientEmail, input.clientEmail, input.clientContactEmail),
        phone: pickText(details.clientPhone, input.clientPhone, input.contact),
        address: pickText(details.clientAddress, input.clientAddress, input.address),
        addressNumber: pickText(details.clientAddressNumber, input.clientAddressNumber),
        complement: pickText(details.clientAddressComplement, input.clientAddressComplement),
        neighborhood: pickText(details.clientNeighborhood, input.clientNeighborhood),
        city: pickText(details.clientCity, input.clientCity, cityState.city),
        state: pickText(details.clientState, input.clientState, cityState.state),
        cityState: pickText(details.clientCityState, input.clientCityState, cityState.cityState),
        zip: pickText(details.clientZip, input.clientZip),
      },
      project: {
        title: pickText(details.projectTitle, input.serviceTitle, input.projectTitle),
        serviceType: pickText(details.serviceType, input.projectTypeName, input.projectType),
        description: pickText(details.projectDescription, input.notes, input.description),
        eventDate: pickText(details.eventDate, input.desiredDate, input.eventDate),
        startTime: pickText(details.startTime, input.startTime),
        endTime: pickText(details.endTime, input.endTime),
        venueName: pickText(details.venueName, input.venueName),
        venueAddress: pickText(details.venueAddress, input.address, input.venueAddress),
        venueCity: pickText(details.venueCity, input.venueCity),
        venueState: pickText(details.venueState, input.venueState),
        deliveryDate: pickText(details.deliveryDate, input.deliveryDate),
        deliveryDescription: pickText(details.deliveryDescription, input.deliveryDescription, eventDeliveries.join("\n")),
        format: pickText(details.format, input.format),
        attendance: pickText(details.attendance, input.attendance),
        scope: projectScope,
        inclusions: eventDeliveries,
        exclusions: sourceList(details.exclusions, input.contractExclusions),
        team,
        revisions: asInteger(pick(details.revisions, input.revisions, 0)),
      },
      commercial: {
        total: pick(details.total, totals.total, input.total, input.serviceValue, 0),
        serviceValue: pick(details.serviceValue, totals.services, input.serviceValue, 0),
        additionalExpenses: pick(details.additionalExpenses, totals.travel, input.travel, 0),
        paymentMethod: pickText(details.paymentMethod, input.paymentMethod),
        paymentDescription,
        paymentTerms,
        entryValue: pick(details.entryValue, input.entryValue, 0),
        entryDate: pickText(details.entryDate, input.entryDate),
        installments: pick(details.installments, input.installments, 0),
        installmentFirstDate: pickText(details.installmentFirstDate, input.installmentFirstDate),
        billingType: pickText(details.billingType, input.billingType),
        validityStart: pickText(details.validityStart, input.validityStart),
        validityEnd: pickText(details.validityEnd, input.validityEnd),
      },
      terms: {
        rightsUse: pickText(details.rightsUse, input.rightsUse),
        cancellation: pickText(details.cancellation, input.cancellation),
        forum: pickText(details.forum, input.forum),
      },
      signatures: {
        city: pickText(details.signatureCity, details.city, input.signatureCity),
        signingDate: pickText(details.signingDate, input.signingDate),
        contractorName: pickText(details.clientRepresentative, input.clientRepresentative, details.contractorName),
        contractorRole: pickText(details.clientRepresentativeRole, details.contractorRole),
        contractedName: pickText(details.contractedName),
        contractedRole: pickText(details.contractedRole),
        witnesses: details.witnesses,
      },
      clauses: record(details.clauses),
      additionalClauses: details.additionalClauses,
      notes: pickText(details.notes, input.notes),
    };

    const normalized = normalizeContract(mapped);
    if (!normalized.clauses.scope) normalized.clauses.scope = templateFor(templateId).scope;
    if (!normalized.project.deliveries.length) {
      normalized.project.deliveries = [{
        description: normalized.project.title || normalized.project.category || templateFor(templateId).serviceType,
        quantity: "",
        deadline: normalized.project.deliveryDate || ""
      }];
    }
    return normalized;
  };

  const isValidDate = (value) => {
    const text = cleanText(value);
    if (!ISO_DATE.test(text)) return false;
    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  };

  const formatDate = (value, options = {}) => {
    if (!isValidDate(value)) return options.fallback || "A definir";
    const [year, month, day] = String(value).split("-").map(Number);
    const long = options === true || options === "long" || (isRecord(options) && options.long);
    if (!long) return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    const months = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    return `${day} de ${months[month - 1]} de ${year}`;
  };

  const formatMoney = (value) => {
    const numeric = roundMoney(value);
    try {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numeric);
    } catch (_) {
      return `R$ ${numeric.toFixed(2).replace(".", ",")}`;
    }
  };

  const units = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  const groupToWords = (value) => {
    const number = asInteger(value);
    if (number === 0) return "";
    if (number === 100) return "cem";
    const parts = [];
    const hundred = Math.floor(number / 100);
    const rest = number % 100;
    if (hundred) parts.push(hundreds[hundred]);
    if (rest >= 20) {
      parts.push(tens[Math.floor(rest / 10)]);
      if (rest % 10) parts.push(units[rest % 10]);
    } else if (rest >= 10) {
      parts.push(teens[rest - 10]);
    } else if (rest) {
      parts.push(units[rest]);
    }
    return parts.join(" e ");
  };

  const integerToWords = (value) => {
    const number = Math.floor(Math.abs(asNumber(value)));
    if (number === 0) return "zero";
    const scales = [
      ["", ""],
      ["mil", "mil"],
      ["milhão", "milhões"],
      ["bilhão", "bilhões"],
      ["trilhão", "trilhões"],
      ["quadrilhão", "quadrilhões"],
    ];
    let remaining = number;
    const pieces = [];
    let index = 0;
    while (remaining && index < scales.length) {
      const group = remaining % 1000;
      if (group) {
        if (index === 1) pieces.unshift(group === 1 ? "mil" : `${groupToWords(group)} mil`);
        else if (index === 0) pieces.unshift(groupToWords(group));
        else pieces.unshift(`${groupToWords(group)} ${group === 1 ? scales[index][0] : scales[index][1]}`);
      }
      remaining = Math.floor(remaining / 1000);
      index += 1;
    }
    if (remaining) return `${number}`;
    if (pieces.length === 1) return pieces[0];
    const lastGroup = number % 1000;
    const lastJoin = lastGroup > 0 && (lastGroup < 100 || lastGroup % 100 === 0) ? " e " : ", ";
    return `${pieces.slice(0, -1).join(", ")}${lastJoin}${pieces[pieces.length - 1]}`;
  };

  const moneyToWords = (value) => {
    const centsTotal = Math.round(Math.abs(asNumber(value)) * 100);
    const reais = Math.floor(centsTotal / 100);
    const cents = centsTotal % 100;
    const parts = [`${integerToWords(reais)} ${reais === 1 ? "real" : "reais"}`];
    if (cents) parts.push(`${integerToWords(cents)} ${cents === 1 ? "centavo" : "centavos"}`);
    return `${asNumber(value) < 0 ? "menos " : ""}${parts.join(" e ")}`;
  };

  const numberToWords = (value) => {
    const number = asNumber(value);
    return Number.isInteger(number) ? integerToWords(number) : String(number).replace(".", ",");
  };

  const validateContract = (candidate = {}, options = {}) => {
    const contract = normalizeContract(candidate);
    const errors = [];
    if (!contract.template || !own(TEMPLATE_DEFINITIONS, contract.template)) errors.push("Selecione um modelo de contrato válido.");
    if (!contract.title) errors.push("Informe o título do contrato.");
    if (!contract.project.category) errors.push("Informe o tipo de serviço.");
    if (!contract.clauses.scope) errors.push("Informe o escopo dos serviços.");
    if (!Number.isFinite(contract.commercial.total) || contract.commercial.total < 0) errors.push("Informe um valor total válido.");
    if (options.forPrint) return validateForPrint(contract).errors;
    return errors;
  };

  const validateForPrint = (candidate = {}) => {
    const contract = normalizeContract(candidate);
    const errors = [];
    const warnings = [];
    if (!contract.client.name) errors.push("Informe o nome ou razão social da CONTRATANTE.");
    if (!contract.contractor.legalName) errors.push("Informe o nome ou razão social da CONTRATADA.");
    if (!contract.project.title) errors.push("Informe o título do projeto ou serviço.");
    if (!contract.clauses.scope) errors.push("Informe o escopo dos serviços.");
    if (!(contract.commercial.total > 0)) errors.push("Informe um valor total maior que zero.");
    if (!contract.commercial.notes && !contract.commercial.payments.length) {
      errors.push("Informe as condições de pagamento.");
    }
    if (contract.commercial.payments.length) {
      const paymentTotal = roundMoney(contract.commercial.payments.reduce((total, payment) => total + moneyValue(payment.amount), 0));
      if (contract.commercial.payments.some((payment) => !(moneyValue(payment.amount) > 0))) {
        errors.push("Informe o valor de cada parcela cadastrada.");
      } else if (Math.abs(paymentTotal - contract.commercial.total) > 0.01) {
        errors.push("A soma das parcelas deve ser igual ao valor total do contrato.");
      }
    }
    if (!contract.signatures.city) errors.push("Informe a cidade de assinatura.");
    if (!isValidDate(contract.signatures.date)) errors.push("Informe uma data válida de assinatura.");
    if (!contract.client.representative && !contract.client.name) errors.push("Informe quem assinará pela CONTRATANTE.");
    if (!contract.contractor.representative) errors.push("Informe quem assinará pela CONTRATADA.");

    if (!contract.client.document) warnings.push("Documento da CONTRATANTE não informado.");
    if (!contract.contractor.document) warnings.push("Documento da CONTRATADA não informado.");
    if (!contract.client.address.street) warnings.push("Endereço da CONTRATANTE não informado.");
    if (!contract.contractor.address.street) warnings.push("Endereço da CONTRATADA não informado.");
    if (!isValidDate(contract.project.deliveryDate)) warnings.push("Prazo de entrega não informado.");
    if (!contract.signatures.forum) warnings.push("Foro aplicável não informado.");
    if (!contract.project.rights && !contract.project.rightsNotes) warnings.push("Condições específicas de direitos de uso não informadas.");
    if (contract.witnesses.filter((witness) => witness.name).length < 2) {
      warnings.push("Preencha duas testemunhas antes da assinatura, se aplicável.");
    }
    return { valid: errors.length === 0, errors, warnings, contract };
  };

  const validateImport = (source) => {
    let parsed = source;
    const errors = [];
    if (typeof source === "string") {
      try {
        parsed = JSON.parse(source);
      } catch (_) {
        return { valid: false, errors: ["O arquivo não contém um JSON de contrato válido."], contract: null };
      }
    }
    if (!isRecord(parsed)) return { valid: false, errors: ["O arquivo importado deve conter um objeto de contrato."], contract: null };
    if (own(parsed, "type") && parsed.type !== EXPORT_TYPE) errors.push("Este arquivo não foi exportado pela ferramenta de contratos da Spark Filmes.");
    const envelope = parsed.type === EXPORT_TYPE ? parsed : null;
    const rawContract = envelope ? envelope.contract : parsed.contract && isRecord(parsed.contract) ? parsed.contract : parsed;
    if (!isRecord(rawContract)) errors.push("Não foi encontrado um contrato válido no arquivo importado.");
    const importedVersion = asInteger(envelope ? envelope.schemaVersion : rawContract.schemaVersion, SCHEMA_VERSION);
    if (importedVersion > SCHEMA_VERSION) errors.push("Este contrato foi criado por uma versão mais recente da ferramenta.");
    const requestedTemplate = cleanText(rawContract && (rawContract.template || rawContract.templateId));
    if (requestedTemplate && !own(TEMPLATE_DEFINITIONS, requestedTemplate)) errors.push("O modelo informado no contrato não é reconhecido.");
    if (errors.length) return { valid: false, errors, contract: null };
    return { valid: true, errors: [], contract: normalizeContract(rawContract) };
  };

  const serializeContract = (contract, options = {}) => {
    const normalized = normalizeContract(contract);
    const payload = {
      type: EXPORT_TYPE,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: cleanText(options.exportedAt) || new Date().toISOString(),
      contract: normalized,
    };
    return JSON.stringify(payload, null, 2);
  };

  const escapeHtml = (value) =>
    String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const display = (value, fallback = "Não informado") => {
    const text = cleanText(value);
    return text ? escapeHtml(text) : `<span class="contract-empty">${escapeHtml(fallback)}</span>`;
  };

  const paragraphize = (value, fallback = "Não informado.") => {
    const text = cleanText(value);
    if (!text) return `<p class="contract-empty">${escapeHtml(fallback)}</p>`;
    return text
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  };

  const partyAddress = (party) => {
    const parts = [party.address, party.addressNumber, party.complement, party.neighborhood, party.city || party.cityState, party.state, party.zip]
      .map((item) => cleanText(item))
      .filter(Boolean);
    return parts.join(", ");
  };

  const partyDescription = (party) => {
    const values = [
      personTypeLabel(party.personType),
      party.document ? `Documento: ${party.document}` : "",
      party.stateRegistration ? `Inscrição: ${party.stateRegistration}` : "",
      party.representative ? `Representante: ${party.representative}` : "",
      party.representativeDocument ? `Documento do representante: ${party.representativeDocument}` : "",
      party.email,
      party.phone,
      partyAddress(party),
    ].filter(Boolean);
    return values.join(" · ");
  };

  const renderRows = (rows) =>
    rows
      .map(
        ([label, value]) => {
          const rendered = isRecord(value) && own(value, "html")
            ? value.html
            : typeof value === "string" && value.includes("<span class=\"contract-empty\"")
            ? value
            : display(value);
          return `<tr><th scope="row">${escapeHtml(label)}</th><td>${rendered}</td></tr>`;
        }
      )
      .join("");

  const buildContractMarkup = (candidate = {}, options = {}) => {
    const shell = normalizeContract(candidate);
    const contract = normalizeLegacyContract(shellToLegacy(shell));
    const financialTerms = contract.commercial.paymentDescription || contract.commercial.paymentTerms;
    const projectDate = contract.project.eventDate || contract.commercial.validityStart;
    const projectDateLabel = contract.project.eventDate ? "Data de execução" : "Início de vigência";
    const venue = [contract.project.venueName, contract.project.venueAddress, contract.project.venueCity, contract.project.venueState]
      .map((item) => cleanText(item))
      .filter(Boolean)
      .join(" · ");
    const clauses = CLAUSE_ORDER.map(([key, label], index) => {
      let body = contract.clauses[key];
      if (key === "termination" && contract.terms.cancellation) body = `${body}\n\nCondições específicas de cancelamento: ${contract.terms.cancellation}`;
      if (key === "rights" && contract.terms.rightsUse) body = `${body}\n\nCondições específicas de direitos de uso: ${contract.terms.rightsUse}`;
      return `<section class="contract-clause"><h2>CLÁUSULA ${index + 1} — ${escapeHtml(label)}</h2>${paragraphize(body)}</section>`;
    }).join("");
    const additionalClauses = contract.additionalClauses
      .map(
        (item, index) =>
          `<section class="contract-clause"><h2>CLÁUSULA ADICIONAL ${index + 1} — ${display(item.title, "DISPOSIÇÃO ADICIONAL")}</h2>${paragraphize(item.text)}</section>`
      )
      .join("");
    const inclusions = contract.project.inclusions.length
      ? `<section class="contract-list"><h2>ENTREGAS E ITENS INCLUÍDOS</h2><ul>${contract.project.inclusions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`
      : "";
    const exclusions = contract.project.exclusions.length
      ? `<section class="contract-list"><h2>ITENS NÃO INCLUÍDOS</h2><ul>${contract.project.exclusions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`
      : "";
    const team = contract.project.team.length
      ? `<section class="contract-team"><h2>EQUIPE PREVISTA</h2><table><thead><tr><th>Função</th><th>Profissional / composição</th><th>Detalhes</th></tr></thead><tbody>${contract.project.team
          .map((item) => `<tr><td>${display(item.role, "—")}</td><td>${display(item.name, "—")}</td><td>${display(item.details, "—")}</td></tr>`)
          .join("")}</tbody></table></section>`
      : "";
    const paymentRows = [
      ["Valor total", `${formatMoney(contract.commercial.total)} (${moneyToWords(contract.commercial.total)})`],
      ["Forma de pagamento", contract.commercial.paymentMethod],
      ["Condições de pagamento", financialTerms],
      ["Sinal / entrada", contract.commercial.entryValue > 0 ? `${formatMoney(contract.commercial.entryValue)}${contract.commercial.entryDate ? ` em ${formatDate(contract.commercial.entryDate)}` : ""}` : ""],
      ["Parcelas", contract.commercial.installments ? `${contract.commercial.installments}${contract.commercial.installmentFirstDate ? `, a partir de ${formatDate(contract.commercial.installmentFirstDate)}` : ""}` : ""],
      ["Vigência", [formatDate(contract.commercial.validityStart, { fallback: "" }), formatDate(contract.commercial.validityEnd, { fallback: "" })].filter(Boolean).join(" a ")],
    ].filter(([, value]) => cleanText(value));
    const paymentSchedule = shell.commercial.payments.length
      ? `<section class="contract-payment-plan"><h2>PARCELAS E VENCIMENTOS</h2><table><thead><tr><th>Descrição</th><th>Vencimento</th><th>Valor</th><th>Condição</th></tr></thead><tbody>${shell.commercial.payments
          .map((payment) => `<tr><td>${display(payment.description, "Pagamento")}</td><td>${display(formatDate(payment.dueDate, { fallback: "" }), "A definir")}</td><td>${display(payment.amount > 0 ? formatMoney(payment.amount) : "", "A definir")}</td><td>${display(payment.condition, "—")}</td></tr>`)
          .join("")}</tbody></table></section>`
      : "";
    const witnessMarkup = contract.signatures.witnesses
      .map(
        (witness, index) =>
          `<div class="signature"><div class="signature-line"></div><strong>Testemunha ${index + 1}</strong><span>${display(witness.name, "Nome")}</span><span>Documento: ${display(witness.document, "Documento")}</span></div>`
      )
      .join("");
    const notes = contract.notes ? `<section class="contract-list"><h2>OBSERVAÇÕES</h2>${paragraphize(contract.notes)}</section>` : "";
    const forum = contract.terms.forum
      ? `<section class="contract-clause"><h2>DO FORO</h2>${paragraphize(contract.terms.forum)}</section>`
      : "";
    const draftNote = options.includeDraftNotice
      ? '<p class="contract-draft-note">Rascunho operacional: revise o conteúdo e os dados antes da assinatura.</p>'
      : "";

    return `<article class="spark-contract" data-template="${escapeHtml(contract.template)}">
      ${draftNote}
      <header class="contract-header"><h1>${display(contract.title, "CONTRATO DE PRESTAÇÃO DE SERVIÇOS")}</h1><p>${escapeHtml(templateFor(contract.template).label)}</p></header>
      <section class="contract-intro"><p>Pelo presente instrumento particular, as partes abaixo identificadas celebram o presente contrato, que será regido pelas condições deste documento.</p></section>
      <section class="contract-parties"><h2>DAS PARTES</h2><table><tbody>${renderRows([
        ["CONTRATANTE", { html: `${display(contract.contractor.legalName)}<br><small>${display(partyDescription(contract.contractor), "Dados cadastrais não informados")}</small>` }],
        ["CONTRATADA", { html: `${display(contract.contracted.legalName)}<br><small>${display(partyDescription(contract.contracted), "Dados cadastrais não informados")}</small>` }],
      ])}</tbody></table></section>
      <section class="contract-summary"><h2>QUADRO-RESUMO DO PROJETO</h2><table><tbody>${renderRows([
        ["Projeto / serviço", contract.project.title],
        ["Tipo de serviço", contract.project.serviceType],
        [projectDateLabel, formatDate(projectDate)],
        ["Horário", contract.project.startTime || contract.project.endTime ? `${display(contract.project.startTime, "A definir")} às ${display(contract.project.endTime, "A definir")}` : ""],
        ["Local", venue],
        ["Formato", contract.project.format],
        ["Atendimento", contract.project.attendance],
        ["Prazo de entrega", formatDate(contract.project.deliveryDate, { fallback: "" })],
        ["Revisões incluídas", contract.project.revisions ? String(contract.project.revisions) : ""],
      ].filter(([, value]) => cleanText(value) || (typeof value === "string" && value.includes("contract-empty"))))}</tbody></table></section>
      <section class="contract-scope"><h2>ESCOPO ESPECÍFICO</h2>${paragraphize(contract.project.scope)}</section>
      ${contract.project.description ? `<section class="contract-list"><h2>DESCRIÇÃO COMPLEMENTAR</h2>${paragraphize(contract.project.description)}</section>` : ""}
      ${inclusions}${exclusions}${team}
       <section class="contract-commercial"><h2>QUADRO COMERCIAL</h2><table><tbody>${renderRows(paymentRows)}</tbody></table></section>${paymentSchedule}
      ${clauses}${additionalClauses}${forum}${notes}
      <section class="contract-signatures"><p>${display(contract.signatures.city, "Cidade")}, ${formatDate(contract.signatures.signingDate, { long: true })}.</p><div class="signature-grid"><div class="signature"><div class="signature-line"></div><strong>${display(contract.signatures.contractorName, "Representante da CONTRATANTE")}</strong><span>${display(contract.signatures.contractorRole, "Cargo / qualificação")}</span><span>CONTRATANTE</span></div><div class="signature"><div class="signature-line"></div><strong>${display(contract.signatures.contractedName, "Representante da CONTRATADA")}</strong><span>${display(contract.signatures.contractedRole, "Cargo / qualificação")}</span><span>CONTRATADA</span></div></div><h2>TESTEMUNHAS</h2><div class="signature-grid">${witnessMarkup}</div></section>
    </article>`;
  };

  const buildPrintableHtml = (candidate = {}, options = {}) => {
    const contract = normalizeContract(candidate);
    const title = escapeHtml(contract.title || "Contrato Spark Filmes");
    const markup = buildContractMarkup(contract, { includeDraftNotice: Boolean(options.includeDraftNotice) });
    return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { color: #151515; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.48; margin: 0; }
  .spark-contract { max-width: 182mm; margin: 0 auto; }
  .contract-header { border-bottom: 2px solid #171717; margin-bottom: 18px; padding-bottom: 11px; text-align: center; }
  .contract-header h1 { font-size: 15pt; line-height: 1.28; margin: 0; text-transform: uppercase; }
  .contract-header p { color: #555; font-size: 9pt; margin: 6px 0 0; }
  h2 { font-size: 10.5pt; margin: 18px 0 7px; page-break-after: avoid; text-transform: uppercase; }
  p { margin: 0 0 8px; text-align: justify; }
  table { border-collapse: collapse; margin: 8px 0 13px; page-break-inside: avoid; width: 100%; }
  th, td { border: 1px solid #9b9b9b; padding: 6px 7px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-size: 8.5pt; min-width: 32%; text-transform: uppercase; }
  .contract-team th { min-width: 0; }
  .contract-clause { page-break-inside: avoid; }
  .contract-list ul { margin: 6px 0 10px 19px; padding: 0; }
  .contract-list li { margin: 3px 0; }
  .contract-empty { color: #737373; font-style: italic; }
  .contract-draft-note { background: #fff4d4; border: 1px solid #d5b564; font-size: 8.5pt; padding: 7px 9px; text-align: left; }
  .contract-signatures { margin-top: 28px; page-break-inside: avoid; }
  .signature-grid { display: grid; gap: 24px 32px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 32px; }
  .signature { display: flex; flex-direction: column; font-size: 8.5pt; gap: 2px; min-height: 61px; }
  .signature-line { border-top: 1px solid #222; margin-bottom: 4px; }
  .signature strong { font-size: 9pt; }
  small { font-size: 8.5pt; line-height: 1.35; }
  @media print { .contract-draft-note { display: none; } }
  @media (max-width: 620px) { .signature-grid { grid-template-columns: 1fr; } body { font-size: 10pt; } }
</style></head><body>${markup}</body></html>`;
  };

  return {
    SCHEMA_VERSION,
    EXPORT_TYPE,
    CLAUSE_ORDER: CLAUSE_ORDER.map(([key, label]) => ({ key, label })),
    listTemplates,
    templateFor,
    createDefaultContract,
    normalizeContract,
    createContractFromBudget,
    validateContract,
    validateForPrint,
    validateImport,
    parseImport: validateImport,
    serializeContract,
    formatMoney,
    money: formatMoney,
    formatDate,
    moneyToWords,
    escapeHtml,
    buildContractMarkup,
    buildPrintableHtml,
    isValidDate,
    roundMoney,
  };
});
