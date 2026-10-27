/* =========================================
   PAWFECT HOME — AUTHENTICATION
   Login + Registration
========================================= */

"use strict";

const PAWFECT_AUTH = {
  USERS_KEY: "pawfectHome.users.v1",
  SESSION_KEY: "pawfectHome.session.v1",
  APPLICATIONS_KEY: "pawfectHome.applications.v1",
};

document.addEventListener("DOMContentLoaded", () => {
  const footerYear = document.getElementById("auth-footer-year");

  if (footerYear) {
    footerYear.textContent = String(new Date().getFullYear());
  }

  setupPasswordToggles();
  setupLoginForm();
  setupRegistrationForm();
});

/* =========================================
   STORAGE HELPERS
========================================= */

function getStoredUsers() {
  try {
    const stored = localStorage.getItem(PAWFECT_AUTH.USERS_KEY);

    if (!stored) {
      return [];
    }

    const users = JSON.parse(stored);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error("Unable to read registered accounts:", error);
    return [];
  }
}

function saveStoredUsers(users) {
  localStorage.setItem(PAWFECT_AUTH.USERS_KEY, JSON.stringify(users));
}

function getStoredApplications() {
  try {
    const stored = localStorage.getItem(PAWFECT_AUTH.APPLICATIONS_KEY);

    if (!stored) {
      return [];
    }

    const applications = JSON.parse(stored);
    return Array.isArray(applications) ? applications : [];
  } catch (error) {
    console.error("Unable to read applications:", error);
    return [];
  }
}

function saveLoginSession(user) {
  const session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    loggedInAt: new Date().toISOString(),
  };

  localStorage.setItem(PAWFECT_AUTH.SESSION_KEY, JSON.stringify(session));

  return session;
}

function getLoginSession() {
  try {
    const stored = localStorage.getItem(PAWFECT_AUTH.SESSION_KEY);

    if (!stored) {
      return null;
    }

    const session = JSON.parse(stored);

    if (!session || !session.userId || !session.email) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("Unable to read login session:", error);
    return null;
  }
}

function logoutUser() {
  localStorage.removeItem(PAWFECT_AUTH.SESSION_KEY);
  window.location.href = "login.html";
}

/* =========================================
   MESSAGE AND VALIDATION HELPERS
========================================= */

function showAuthMessage(message, type = "error") {
  const messageBox = document.getElementById("auth-message");

  if (!messageBox) {
    return;
  }

  messageBox.textContent = message;
  messageBox.className = `auth-message is-${type}`;
  messageBox.hidden = false;
}

function clearAuthMessage() {
  const messageBox = document.getElementById("auth-message");

  if (!messageBox) {
    return;
  }

  messageBox.textContent = "";
  messageBox.className = "auth-message";
  messageBox.hidden = true;
}

function setFieldError(fieldId, message = "") {
  const field = document.getElementById(fieldId);
  const errorElement = document.querySelector(`[data-error-for="${fieldId}"]`);

  if (field) {
    field.setAttribute("aria-invalid", message ? "true" : "false");
  }

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearFieldErrors(form) {
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.removeAttribute("aria-invalid");
  });

  form.querySelectorAll("[data-error-for]").forEach((element) => {
    element.textContent = "";
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

/* =========================================
   PASSWORD VISIBILITY
========================================= */

function setupPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const fieldId = button.dataset.togglePassword;
      const passwordField = document.getElementById(fieldId);

      if (!passwordField) {
        return;
      }

      const shouldShow = passwordField.type === "password";

      passwordField.type = shouldShow ? "text" : "password";
      button.textContent = shouldShow ? "Hide" : "Show";
      button.setAttribute(
        "aria-label",
        shouldShow ? "Hide password" : "Show password",
      );
    });
  });
}

/* =========================================
   PASSWORD HASHING
========================================= */

async function hashAuthPassword(password) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error(
      "Password hashing is unavailable. Open the project through localhost or HTTPS.",
    );
  }

  const encodedPassword = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest(
    "SHA-256",
    encodedPassword,
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/* =========================================
   PASSWORD STRENGTH
========================================= */

function isAcceptablePassword(password) {
  return (
    password.length >= 8 && password.length <= 128 && !/^\s+$/.test(password)
  );
}

/* =========================================
   LOGIN FORM
========================================= */

function setupLoginForm() {
  const form = document.getElementById("login-form");

  if (!form) {
    return;
  }

  const emailField = document.getElementById("login-email");
  const passwordField = document.getElementById("login-password");
  const submitButton = document.getElementById("login-submit");

  emailField.addEventListener("input", () => {
    setFieldError("login-email");
    clearAuthMessage();
  });

  passwordField.addEventListener("input", () => {
    setFieldError("login-password");
    clearAuthMessage();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearAuthMessage();
    clearFieldErrors(form);

    const email = emailField.value.trim().toLowerCase();
    const password = passwordField.value;
    let hasError = false;

    if (!email) {
      setFieldError("login-email", "Please enter your email address.");
      hasError = true;
    } else if (!isValidEmail(email)) {
      setFieldError("login-email", "Enter a valid email address.");
      hasError = true;
    }

    if (!password) {
      setFieldError("login-password", "Please enter your password.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    submitButton.disabled = true;

    const submitText = submitButton.querySelector(".auth-submit-text");
    const originalText = submitText ? submitText.textContent : "Log in";

    if (submitText) {
      submitText.textContent = "Checking...";
    }

    try {
      const users = getStoredUsers();
      const user = users.find(
        (item) =>
          typeof item.email === "string" && item.email.toLowerCase() === email,
      );

      if (!user) {
        showAuthMessage(
          "No account was found with this email. Please register first.",
          "error",
        );
        return;
      }

      const passwordHash = await hashAuthPassword(password);

      if (
        typeof user.passwordHash !== "string" ||
        user.passwordHash !== passwordHash
      ) {
        showAuthMessage(
          "The email or password is incorrect. Please try again.",
          "error",
        );
        return;
      }

      saveLoginSession(user);

      showAuthMessage("Login successful. Redirecting...", "success");

      window.setTimeout(() => {
        window.location.href = getPostAuthRedirect();
      }, 600);
    } catch (error) {
      console.error("Login failed:", error);

      showAuthMessage(
        error.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      submitButton.disabled = false;

      if (submitText) {
        submitText.textContent = originalText;
      }
    }
  });
}

/* =========================================
   REGISTRATION FORM
========================================= */

function setupRegistrationForm() {
  const form = document.getElementById("register-form");

  if (!form) {
    return;
  }

  const nameField = document.getElementById("register-name");
  const emailField = document.getElementById("register-email");
  const phoneField = document.getElementById("register-phone");
  const passwordField = document.getElementById("register-password");
  const confirmPasswordField = document.getElementById(
    "register-confirm-password",
  );
  const consentField = document.getElementById("register-consent");
  const submitButton = document.getElementById("register-submit");

  form.querySelectorAll("input").forEach((field) => {
    field.addEventListener("input", () => {
      setFieldError(field.id);
      clearAuthMessage();
    });

    field.addEventListener("change", () => {
      setFieldError(field.id);
      clearAuthMessage();
    });
  });

  confirmPasswordField.addEventListener("input", () => {
    if (
      confirmPasswordField.value &&
      confirmPasswordField.value !== passwordField.value
    ) {
      setFieldError("register-confirm-password", "Passwords do not match.");
    } else {
      setFieldError("register-confirm-password");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearAuthMessage();
    clearFieldErrors(form);

    const name = nameField.value.trim().replace(/\s+/g, " ");
    const email = emailField.value.trim().toLowerCase();
    const phone = phoneField.value.trim();
    const password = passwordField.value;
    const confirmPassword = confirmPasswordField.value;

    let hasError = false;

    if (name.length < 2 || name.length > 80) {
      setFieldError(
        "register-name",
        "Enter a name between 2 and 80 characters.",
      );
      hasError = true;
    } else if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(name)) {
      setFieldError(
        "register-name",
        "Enter a valid name using letters and common punctuation.",
      );
      hasError = true;
    }

    if (!email) {
      setFieldError("register-email", "Please enter your email address.");
      hasError = true;
    } else if (email.length > 254 || !isValidEmail(email)) {
      setFieldError("register-email", "Enter a valid email address.");
      hasError = true;
    }

    if (!isValidPhone(phone)) {
      setFieldError(
        "register-phone",
        "Enter a valid phone number with at least 10 digits.",
      );
      hasError = true;
    }

    if (!isAcceptablePassword(password)) {
      setFieldError(
        "register-password",
        "Use a password between 8 and 128 characters.",
      );
      hasError = true;
    }

    if (!confirmPassword) {
      setFieldError(
        "register-confirm-password",
        "Please confirm your password.",
      );
      hasError = true;
    } else if (password !== confirmPassword) {
      setFieldError("register-confirm-password", "Passwords do not match.");
      hasError = true;
    }

    if (!consentField.checked) {
      setFieldError(
        "register-consent",
        "Please accept the statement to continue.",
      );
      hasError = true;
    }

    if (hasError) {
      return;
    }

    submitButton.disabled = true;

    const submitText = submitButton.querySelector(".auth-submit-text");
    const originalText = submitText ? submitText.textContent : "Create account";

    if (submitText) {
      submitText.textContent = "Creating account...";
    }

    try {
      const users = getStoredUsers();

      const existingUser = users.some(
        (user) =>
          typeof user.email === "string" && user.email.toLowerCase() === email,
      );

      if (existingUser) {
        setFieldError(
          "register-email",
          "An account with this email already exists.",
        );

        showAuthMessage(
          "This email is already registered. Please log in instead.",
          "error",
        );
        return;
      }

      const passwordHash = await hashAuthPassword(password);

      const newUser = {
        id: `USER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        email,
        phone,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveStoredUsers(users);

      saveLoginSession(newUser);

      showAuthMessage(
        "Your account has been created. Redirecting to the homepage...",
        "success",
      );

      form.reset();

      window.setTimeout(() => {
        window.location.href = getPostAuthRedirect();
      }, 900);
    } catch (error) {
      console.error("Registration failed:", error);

      showAuthMessage(
        error.message || "Unable to create your account. Please try again.",
        "error",
      );
    } finally {
      submitButton.disabled = false;

      if (submitText) {
        submitText.textContent = originalText;
      }
    }
  });
}

function getPostAuthRedirect() {
  const RETURN_KEY = "pawfectHome.returnAfterLogin.v1";
  const savedPath = sessionStorage.getItem(RETURN_KEY);

  sessionStorage.removeItem(RETURN_KEY);

  if (!savedPath) {
    return "../index.html";
  }

  try {
    const candidate = new URL(savedPath, window.location.origin);

    const isInternalPage =
      candidate.origin === window.location.origin &&
      /\/pages\/[^/]+\.html$/i.test(candidate.pathname) &&
      !/\/(login|register)\.html$/i.test(candidate.pathname);

    if (isInternalPage) {
      return candidate.pathname + candidate.search + candidate.hash;
    }
  } catch {
    // Use the homepage if the saved path is invalid.
  }

  return "../index.html";
}

/* =========================================
   SHARED AUTH UTILITIES
========================================= */

window.PawfectHomeAuth = {
  USERS_KEY: PAWFECT_AUTH.USERS_KEY,
  SESSION_KEY: PAWFECT_AUTH.SESSION_KEY,
  APPLICATIONS_KEY: PAWFECT_AUTH.APPLICATIONS_KEY,

  getStoredUsers,
  getStoredApplications,
  getLoginSession,
  saveLoginSession,
  logoutUser,
  showAuthMessage,
  clearAuthMessage,
  setFieldError,
  clearFieldErrors,
  hashAuthPassword,
};
