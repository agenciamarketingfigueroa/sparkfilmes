(function () {
  "use strict";

  const AUTH_KEY = "sparkfilmes-internal-auth";
  const PASSWORD = "1508";
  const body = document.body;
  const isAuthenticated = () => sessionStorage.getItem(AUTH_KEY) === "authenticated";

  if (body?.dataset.requiresAuth === "true" && !isAuthenticated()) {
    window.location.replace("../area-interna/");
    return;
  }

  const loginView = document.querySelector("[data-login-view]");
  const panelView = document.querySelector("[data-panel-view]");
  const loginForm = document.querySelector("[data-login-form]");
  const feedback = document.querySelector("[data-login-feedback]");

  const showPanel = () => {
    loginView?.setAttribute("hidden", "");
    panelView?.removeAttribute("hidden");
  };

  const showLogin = () => {
    panelView?.setAttribute("hidden", "");
    loginView?.removeAttribute("hidden");
  };

  if (loginView && panelView) {
    if (isAuthenticated()) showPanel();
    else showLogin();
  }

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = String(new FormData(loginForm).get("senha") || "");

    if (password !== PASSWORD) {
      if (feedback) feedback.textContent = "Senha incorreta. Tente novamente.";
      loginForm.querySelector("input")?.focus();
      return;
    }

    sessionStorage.setItem(AUTH_KEY, "authenticated");
    if (feedback) feedback.textContent = "";
    showPanel();
  });

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      sessionStorage.removeItem(AUTH_KEY);
      if (body?.dataset.requiresAuth === "true") window.location.replace("../area-interna/");
      else showLogin();
    });
  });
})();
