"use strict";

/* =========================================
   PAWFECT HOME — HOMEPAGE INTERACTIONS
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeMobileNavigation();
  initializeFavorites();
  initializeFooterYear();
});

/* ---------- Mobile navigation ---------- */

function initializeMobileNavigation() {
  const menuToggle = document.getElementById("menu-toggle");
  const navigation = document.getElementById("primary-navigation");

  if (!menuToggle || !navigation) return;

  function closeMenu() {
    navigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }

  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";

    navigation.classList.toggle("is-open", !isExpanded);
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute(
      "aria-label",
      isExpanded ? "Open navigation menu" : "Close navigation menu",
    );
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      menuToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !navigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      closeMenu();
    }
  });
}

/* ---------- Favorites stored locally ---------- */

const FAVORITES_STORAGE_KEY = "pawfectHome.favorites.v1";

function readFavorites() {
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return [
      ...new Set(
        parsed.filter((id) => typeof id === "string" && id.trim().length > 0),
      ),
    ];
  } catch (error) {
    console.warn("Favorites could not be read from Local Storage.", error);
    return [];
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));

    return true;
  } catch (error) {
    console.warn("Favorites could not be saved.", error);
    return false;
  }
}

function initializeFavorites() {
  const favoriteButtons = document.querySelectorAll("[data-favorite-id]");

  if (!favoriteButtons.length) return;

  let favorites = readFavorites();

  function updateButton(button, isFavorite) {
    const petId = button.dataset.favoriteId;
    const petName = getPetName(petId);

    button.classList.toggle("is-favorite", isFavorite);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute(
      "aria-label",
      isFavorite
        ? `Remove ${petName} from favorites`
        : `Add ${petName} to favorites`,
    );
    button.textContent = isFavorite ? "♥" : "♡";
  }

  favoriteButtons.forEach((button) => {
    const petId = button.dataset.favoriteId;

    if (!petId) return;

    updateButton(button, favorites.includes(petId));

    button.addEventListener("click", () => {
      const alreadyFavorite = favorites.includes(petId);

      if (alreadyFavorite) {
        favorites = favorites.filter((id) => id !== petId);
      } else {
        favorites = [...favorites, petId];
      }

      const saved = saveFavorites(favorites);

      if (!saved) {
        showToast(
          "Your browser could not save this change. Check your browser storage settings.",
        );

        favorites = readFavorites();
        updateButton(button, favorites.includes(petId));
        return;
      }

      updateButton(button, !alreadyFavorite);

      showToast(
        alreadyFavorite
          ? `${getPetName(petId)} removed from your favorites.`
          : `${getPetName(petId)} added to your favorites.`,
      );
    });
  });
}

function getPetName(petId) {
  const petNames = {
    max: "Max",
    luna: "Luna",
    charlie: "Charlie",
  };

  return petNames[petId] || "This pet";
}

/* ---------- Toast notification ---------- */

let toastTimeout;

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  window.clearTimeout(toastTimeout);

  toast.textContent = message;
  toast.classList.add("is-visible");

  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2800);
}

/* ---------- Footer year ---------- */

function initializeFooterYear() {
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}
