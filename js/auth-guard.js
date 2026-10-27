/* =========================================
   PAWFECT HOME — ADOPTION LOGIN GUARD
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const adoptionForm = document.getElementById("adoption-form");

  if (!adoptionForm) return;

  const SESSION_KEY = "pawfectHome.session.v1";
  const RETURN_KEY = "pawfectHome.returnAfterLogin.v1";

  let session = null;

  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    session = null;
  }

  if (session && session.userId && session.email) {
    return;
  }

  const currentPath =
    window.location.pathname + window.location.search + window.location.hash;

  sessionStorage.setItem(RETURN_KEY, currentPath);

  const loginUrl = new URL("login.html", window.location.href);
  window.location.replace(loginUrl.href);
});
