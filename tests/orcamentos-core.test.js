import assert from "node:assert/strict";
import "../assets/js/orcamentos-core.js";

const core = globalThis.SparkBudgetCore;
const catalogUrl = new URL("../data/servicos.json", import.meta.url);
const catalog = JSON.parse(await Deno.readTextFile(catalogUrl));
const rate = (id) => catalog.profissionais.find((item) => item.id === id).valorHora;

assert.equal(core.formatHours(1), "1 hora");
assert.equal(core.formatHours(1.5), "1 hora e 30 minutos");
assert.equal(core.formatHours(1.92), "1 hora e 55 minutos");

assert.deepEqual(
  catalog.pacotesEventos.map((item) => item.nome),
  ["Plano Essencial", "Plano Spark", "Plano Flame"]
);
assert.deepEqual(
  catalog.pacotesEventos.map((item) => item.etapas.reduce((total, stage) => total + stage.minutos, 0)),
  [240, 480, 720]
);
assert.equal(
  catalog.templates.flatMap((template) => template.etapas).filter((stage) => stage.tipoCobranca === "hora").length,
  0
);

const packageBudget = core.calculateBudget({
  model: "pacote",
  packageQuantity: 2,
  minutesPerPackage: 960,
  hourlyRate: rate("videomaker"),
  attendance: "remoto"
});
assert.equal(packageBudget.reference, 3539.69);
assert.equal(packageBudget.estimatedHours, 32);
assert.equal(packageBudget.estimatedMinutes, 1920);
assert.equal(packageBudget.total, 3539.69);

const sparkPackage = catalog.pacotesEventos.find((item) => item.id === "spark");
const sparkStageLines = sparkPackage.etapas.map((stage) => ({
  minutes: stage.minutos,
  hourlyRate: rate(stage.profissionalId)
}));
const eventBudget = core.calculateBudget({
  model: "pacote",
  projectType: "evento",
  eventPackageId: sparkPackage.id,
  eventPackagePrice: sparkPackage.preco,
  eventPackageQuantity: 1,
  eventStageLines: sparkStageLines,
  attendance: "presencial"
});
const expectedEventCost = sparkStageLines.reduce((total, line) => total + (line.minutes / 60) * line.hourlyRate, 0);
assert.equal(eventBudget.reference, core.roundMoney(expectedEventCost));
assert.equal(eventBudget.services, core.roundMoney(expectedEventCost));
assert.equal(eventBudget.estimatedHours, 8);
assert.equal(eventBudget.estimatedMinutes, 480);
assert.equal(eventBudget.technicalCost, core.roundMoney(expectedEventCost));

const partnerEventBudget = core.calculateBudget({
  model: "pacote",
  projectType: "evento",
  eventPackageId: sparkPackage.id,
  eventPackageQuantity: 1,
  eventStageLines: sparkStageLines,
  partnershipDiscount: 0.2
});
assert.equal(partnerEventBudget.reference, core.roundMoney(expectedEventCost * 0.8));
assert.equal(partnerEventBudget.discountAmount, core.roundMoney(expectedEventCost * 0.2));

const technicalBudget = core.calculateBudget({
  model: "tecnico",
  technicalMinutes: 960,
  hourlyRate: rate("fotografo"),
  attendance: "remoto"
});
assert.equal(technicalBudget.reference, 1757.07);
assert.equal(technicalBudget.estimatedHours, 16);
assert.equal(technicalBudget.estimatedMinutes, 960);
assert.equal(technicalBudget.unitLabel, "minutos");
assert.equal(technicalBudget.unitValue, core.roundMoney(rate("fotografo")));

const customBudget = core.calculateBudget({
  model: "sob-medida",
  lines: [
    { billingType: "minuto", quantity: 120, unitValue: rate("videomaker") },
    { billingType: "fixo", quantity: 1, unitValue: 150 }
  ],
  attendance: "presencial",
  travelFee: 100,
  travelExtras: 25
});
assert.equal(customBudget.reference, 371.23);
assert.equal(customBudget.estimatedHours, 2);
assert.equal(customBudget.estimatedMinutes, 120);
assert.equal(customBudget.travel, 125);
assert.equal(customBudget.total, 496.23);

const minuteBudget = core.calculateBudget({
  model: "sob-medida",
  lines: [{ billingType: "minuto", quantity: 90, unitValue: rate("editor") }],
  attendance: "remoto"
});
assert.equal(minuteBudget.reference, 77.93);
assert.equal(minuteBudget.estimatedHours, 1.5);

const insalubridadeBudget = core.calculateBudget({
  model: "sob-medida",
  lines: [
    { billingType: "minuto", quantity: 60, unitValue: rate("editor") },
    { billingType: "insalubridade", quantity: 0.2, unitValue: 0, internalOnly: true }
  ],
  attendance: "remoto"
});
assert.equal(insalubridadeBudget.reference, 62.34);
assert.equal(insalubridadeBudget.estimatedHours, 1);
assert.equal(insalubridadeBudget.estimatedMinutes, 60);

const validInput = {
  clientName: "Cliente Teste",
  projectTypeName: "Conteúdo para redes sociais",
  model: "tecnico",
  modelName: "Tempo técnico",
  format: "Vertical 9:16",
  serviceTitle: "Captação de conteúdo",
  desiredDate: "2099-08-30",
  technicalMinutes: 480,
  hourlyRate: rate("fotografo"),
  attendance: "remoto"
};
assert.deepEqual(core.validateBudget(validInput), []);
assert.deepEqual(core.validateBudget({ ...validInput, attendance: "presencial", address: "" }), []);

const internalRateMessage = core.buildWhatsAppMessage({
  ...validInput,
  model: "sob-medida",
  lines: [{ name: "Taxa de insalubridade", billingType: "insalubridade", quantity: 0.2, unitValue: 0, insalubridadeNivel: "m2", internalOnly: true }]
}, insalubridadeBudget, catalog.empresa);
assert.doesNotMatch(internalRateMessage, /insalubridade|M[0-3]/i);

const messageTotals = core.calculateBudget(validInput);
const message = core.buildWhatsAppMessage(validInput, messageTotals, catalog.empresa);
assert.match(message, /Orçamento SparkFilmes/);
assert.match(message, /Cliente Teste/);
assert.match(message, /R\$\s878,53/);
assert.match(message, /aproximadamente 8 horas/);
assert.doesNotMatch(message, /minutos/);

const eventInput = {
  ...validInput,
  projectType: "evento",
  projectTypeName: "Cobertura de evento",
  model: "pacote",
  modelName: "Pacote fechado",
  serviceTitle: sparkPackage.nome,
  eventPackageId: sparkPackage.id,
  eventPackageName: sparkPackage.nome,
  eventPackageTeam: sparkPackage.subtitulo,
  eventPackagePrice: sparkPackage.preco,
  eventPackageQuantity: 1,
  eventCoverageHours: sparkPackage.horasCoberturaIncluidas,
  eventPackageDeliveries: sparkPackage.entregas,
  eventStageLines: sparkStageLines,
  attendance: "presencial",
  address: "Casa Palma"
};
assert.deepEqual(core.validateBudget(eventInput), []);
const eventMessage = core.buildWhatsAppMessage(eventInput, eventBudget, catalog.empresa);
assert.match(eventMessage, /Plano Spark/);
assert.match(eventMessage, /até 4 horas/);
assert.match(eventMessage, /Horas extras.*cobradas à parte/);
assert.match(eventMessage, new RegExp(core.money(eventBudget.reference).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

const allPackagesInput = {
  ...eventInput,
  serviceTitle: "Opções de cobertura de evento",
  eventQuoteMode: "todos",
  eventStageLines: [],
  allEventPackages: catalog.pacotesEventos.map((item) => ({
    name: item.nome,
    price: item.preco,
    team: item.subtitulo,
    deliveries: item.entregas
  }))
};
assert.deepEqual(core.validateBudget(allPackagesInput), []);
const allPackagesMessage = core.buildWhatsAppMessage(allPackagesInput, eventBudget, catalog.empresa);
assert.match(allPackagesMessage, /Plano Essencial/);
assert.match(allPackagesMessage, /Plano Spark/);
assert.match(allPackagesMessage, /Plano Flame/);
assert.doesNotMatch(allPackagesMessage, /\*Total:\*/);

console.log("Todos os testes do calculador passaram.");
