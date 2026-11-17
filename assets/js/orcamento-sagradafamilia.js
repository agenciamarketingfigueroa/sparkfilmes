const printProposalButton = document.querySelector("[data-print-proposal]");
if (printProposalButton) {
  printProposalButton.hidden = false;
  printProposalButton.addEventListener("click", () => window.print());
}

const copyPixButton = document.querySelector("[data-copy-pix]");
if (copyPixButton && navigator.clipboard && window.isSecureContext) {
  copyPixButton.hidden = false;
  copyPixButton.addEventListener("click", async () => {
    const status = document.querySelector(".sf-copy-status");
    try {
      await navigator.clipboard.writeText(document.querySelector("#chave-pix").textContent.trim());
      status.textContent = "Chave Pix copiada.";
    } catch {
      status.textContent = "Não foi possível copiar automaticamente. Selecione a chave Pix acima para copiá-la.";
    }
  });
}
