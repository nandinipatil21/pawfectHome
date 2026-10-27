/* =========================================
   PAWFECT HOME — AUTH NAVIGATION
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const SESSION_KEY = "pawfectHome.session.v1";
  const isPagesDirectory = /\/pages\/[^/]*$/i.test(window.location.pathname);

  const pagePrefix = isPagesDirectory ? "" : "pages/";
  const homeUrl = isPagesDirectory ? "../index.html" : "index.html";
  const applicationsUrl = `${pagePrefix}my-applications.html`;
  const loginUrl = `${pagePrefix}login.html`;
  const registerUrl = `${pagePrefix}register.html`;

  function getSession() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

      if (!session || !session.userId || !session.email) {
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  const header = document.querySelector("header");
  if (!header) return;

  const nav =
    header.querySelector("nav") ||
    header.querySelector(".nav-links, .main-nav, .navbar-nav, .site-nav") ||
    header;

  const existingLogin = Array.from(nav.querySelectorAll("a[href]")).find(
    (link) => /login\.html(?:[?#].*)?$/i.test(link.getAttribute("href")),
  );

  const existingRegister = Array.from(nav.querySelectorAll("a[href]")).find(
    (link) => /register\.html(?:[?#].*)?$/i.test(link.getAttribute("href")),
  );

  function createNavLink(text, href, referenceLink) {
    const link = document.createElement("a");

    if (referenceLink) {
      link.className = referenceLink.className;
    } else {
      link.className = "auth-nav-link";
    }

    link.textContent = text;
    link.href = href;

    return link;
  }

  function removeDynamicLinks() {
    nav.querySelectorAll("[data-auth-nav-item]").forEach((item) => {
      item.remove();
    });
  }

  function addDynamicLink(text, href, referenceLink, action) {
    const link = createNavLink(text, href, referenceLink);
    link.dataset.authNavItem = "true";

    if (action) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        action();
      });
    }

    nav.appendChild(link);
    return link;
  }

  function updateNavigation() {
    removeDynamicLinks();

    const session = getSession();

    if (existingLogin) {
      existingLogin.hidden = Boolean(session);
    }

    if (existingRegister) {
      existingRegister.hidden = Boolean(session);
    }

    if (!existingLogin) {
      const loginLink = addDynamicLink("Login", loginUrl, existingRegister);

      loginLink.hidden = Boolean(session);
    }

    if (!existingRegister) {
      const registerLink = addDynamicLink(
        "Register",
        registerUrl,
        existingLogin,
      );

      registerLink.hidden = Boolean(session);
    }

    if (session) {
      addDynamicLink(
        "My Applications",
        applicationsUrl,
        existingLogin || existingRegister,
      );

      addDynamicLink(
        "Logout",
        homeUrl,
        existingLogin || existingRegister,
        () => {
          localStorage.removeItem(SESSION_KEY);
          window.location.href = homeUrl;
        },
      );
    }
  }

  updateNavigation();
});
