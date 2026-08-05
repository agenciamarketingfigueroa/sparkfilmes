import assert from "node:assert/strict";
import "../assets/js/contratos-core.js";

const core = globalThis.SparkContractCore;

assert.ok(core, "O núcleo de contratos deve estar disponível no navegador.");

const blank = core.createDefaultContract({ template: "eventos" });
assert.equal(blank.template, "eventos");
assert.equal(blank.client.type, "pj");
assert.equal(blank.contractor.legalName, "Spark Filmes");
assert.equal(blank.clauses.lateFeePercent, 5);
assert.equal(blank.clauses.lateInterestPercent, 1);
assert.equal(blank.clauses.defaultDays, 45);
assert.equal(blank.clauses.terminationFeePercent, 20);
assert.equal(blank.clauses.adjustmentIndex, "IGP-M/FGV");

const contract = core.normalizeContract({
  template: "conteudos",
  meta: { number: "CTR-TESTE-001", status: "rascunho" },
  client: {
    type: "pj",
    name: "Cliente Exemplo Ltda.",
    document: "00.000.000/0000-00",
    email: "contato@exemplo.test",
    representative: "Responsável Exemplo",
    representativeDocument: "000.000.000-00",
    address: { street: "Rua de Exemplo", number: "100", city: "São Paulo", state: "SP", zip: "00000-000" },
  },
  contractor: {
    legalName: "Fornecedor Exemplo Ltda.",
    document: "11.111.111/0001-11",
    representative: "Representante Exemplo",
    email: "producao@fornecedor.test",
    address: { street: "Avenida Modelo", number: "200", city: "São Paulo", state: "SP" },
  },
  project: {
    title: "Conteúdos de demonstração",
    category: "Produção de conteúdos audiovisuais",
    summary: "Captação e edição de conteúdos curtos.",
    date: "2099-08-30",
    startTime: "09:00",
    endTime: "17:00",
    deliveryDate: "2099-09-15",
    rights: "Uso em canais digitais da CONTRATANTE.",
    location: { type: "presencial", name: "Estúdio Exemplo", city: "São Paulo", address: "Rua de Exemplo, 100" },
    team: [{ role: "Captação", name: "Equipe de demonstração", quantity: "1" }],
    deliveries: [{ description: "Vídeo vertical", quantity: "3", deadline: "2099-09-15" }],
  },
  commercial: {
    type: "Pix",
    total: "1.234,56",
    notes: "50% na aprovação e 50% na entrega.",
    payments: [
      { description: "Sinal", dueDate: "2099-08-20", amount: "617,28", condition: "Na aprovação" },
      { description: "Saldo", dueDate: "2099-09-15", amount: 617.28, condition: "Na entrega" },
    ],
  },
  clauses: { scope: "Produção de três conteúdos verticais conforme o briefing aprovado." },
  signatures: { city: "São Paulo", date: "2099-08-05", forum: "Foro da comarca de São Paulo/SP." },
  witnesses: [
    { name: "Testemunha Exemplo 1", document: "000.000.000-01", email: "w1@exemplo.test" },
    { name: "Testemunha Exemplo 2", document: "000.000.000-02", email: "w2@exemplo.test" },
  ],
});

assert.equal(contract.client.name, "Cliente Exemplo Ltda.");
assert.equal(contract.client.address.street, "Rua de Exemplo");
assert.equal(contract.contractor.legalName, "Fornecedor Exemplo Ltda.");
assert.equal(contract.project.deliveries[0].description, "Vídeo vertical");
assert.equal(contract.commercial.total, 1234.56);
assert.equal(contract.commercial.payments.length, 2);
assert.equal(contract.clauses.lateFeePercent, 5);
assert.equal(contract.signatures.date, "2099-08-05");
assert.deepEqual(core.validateForPrint(contract).errors, []);

const fromBudget = core.createContractFromBudget({
  version: 1,
  sourceBudget: {
    input: {
      quoteId: "ORC-TESTE-001",
      clientName: "Empresa do Orçamento",
      clientContact: "contato@orcamento.test",
      projectType: "evento",
      projectTypeName: "Cobertura de evento",
      serviceTitle: "Cobertura de evento de demonstração",
      desiredDate: "2099-10-12",
      startTime: "14:00",
      endTime: "20:00",
      venueName: "Local de demonstração",
      address: "Rua do Evento, 50",
      eventPackageTeam: "Equipe audiovisual",
      eventPackageDeliveries: ["Filme-resumo", "Galeria de fotos"],
      format: "Horizontal 16:9",
      attendance: "presencial",
    },
    totals: { total: 4500, services: 4200, travel: 300 },
  },
  contract: {
    templateId: "eventos",
    clientType: "pj",
    clientLegalName: "Empresa do Orçamento Ltda.",
    clientDocument: "22.222.222/0001-22",
    clientRepresentative: "Responsável pelo orçamento",
    clientAddress: "Rua do Cliente",
    clientAddressNumber: "50",
    clientCityState: "São Paulo - SP",
    deliveryDate: "2099-10-20",
    paymentMethod: "Pix",
    paymentDescription: "50% na reserva da data e 50% na entrega.",
    entryValue: 2250,
    entryDate: "2099-09-20",
    installments: 1,
    installmentFirstDate: "2099-10-20",
    rightsUse: "Uso digital pela CONTRATANTE.",
    signatureCity: "São Paulo",
    forum: "Foro da comarca de São Paulo/SP.",
  },
});

assert.equal(fromBudget.template, "eventos");
assert.equal(fromBudget.meta.origin, "orcamento");
assert.equal(fromBudget.client.name, "Empresa do Orçamento Ltda.");
assert.equal(fromBudget.project.title, "Cobertura de evento de demonstração");
assert.equal(fromBudget.project.date, "2099-10-12");
assert.equal(fromBudget.project.deliveries.length, 2);
assert.equal(fromBudget.commercial.total, 4500);
assert.equal(fromBudget.commercial.payments[0].amount, 2250);
assert.equal(fromBudget.commercial.payments.reduce((total, payment) => total + payment.amount, 0), 4500);
assert.equal(fromBudget.signatures.city, "São Paulo");

assert.equal(core.formatDate("2099-08-05"), "05/08/2099");
assert.equal(core.formatDate("2099-08-05", { long: true }), "5 de agosto de 2099");
assert.match(core.formatMoney(1234.56), /R\$\s?1\.234,56/);
assert.equal(core.moneyToWords(12.34), "doze reais e trinta e quatro centavos");

const exported = core.serializeContract(contract, { exportedAt: "2099-08-05T12:00:00.000Z" });
const imported = core.validateImport(exported);
assert.equal(imported.valid, true);
assert.equal(imported.contract.client.name, "Cliente Exemplo Ltda.");
assert.equal(core.validateImport('{"type":"outro-arquivo"}').valid, false);

const unsafeMarkup = core.buildContractMarkup({
  ...contract,
  client: { ...contract.client, name: '<script>alert("x")</script>' },
});
assert.doesNotMatch(unsafeMarkup, /<script>alert/);
assert.match(unsafeMarkup, /&lt;script&gt;alert/);
assert.match(core.buildContractMarkup(contract), /PARCELAS E VENCIMENTOS/);
const printable = core.buildPrintableHtml(contract);
assert.match(printable, /<!doctype html>/i);
assert.match(printable, /@page/);
assert.doesNotMatch(printable, /https?:\/\//);

console.log("Todos os testes do núcleo de contratos passaram.");
