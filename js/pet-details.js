/* =========================================
   PAWFECT HOME
   PET DETAILS PAGE
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", initializePetDetails);

/* =========================================
   CONFIGURATION
========================================= */

const DETAILS_STORAGE_KEYS = {
  pets: "pawfectHome.pets.v1",
  favorites: "pawfectHome.favorites.v1",
};

const DETAILS_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=85";

/* =========================================
   INITIALIZATION
========================================= */

function initializePetDetails() {
  initializeFooterYear();
  initializeMobileNavigation();

  const petId = new URLSearchParams(window.location.search).get("id");

  if (!petId || !petId.trim()) {
    showPetState("not-found");
    return;
  }

  const pet = getStoredPets().find((item) => String(item.id) === petId.trim());

  if (!pet) {
    showPetState("not-found");
    return;
  }

  renderPetDetails(pet);
}

/* =========================================
   LOCAL STORAGE
========================================= */

function readLocalStorage(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);

    if (storedValue === null) {
      return fallback;
    }

    return JSON.parse(storedValue);
  } catch (error) {
    console.warn(`Could not read Local Storage key: ${key}`, error);
    return fallback;
  }
}

function getStoredPets() {
  const pets = readLocalStorage(DETAILS_STORAGE_KEYS.pets, []);

  if (!Array.isArray(pets)) {
    return [];
  }

  return pets.filter((pet) => {
    return (
      pet && typeof pet === "object" && pet.id !== undefined && pet.id !== null
    );
  });
}

function getFavorites() {
  const favorites = readLocalStorage(DETAILS_STORAGE_KEYS.favorites, []);

  if (!Array.isArray(favorites)) {
    return [];
  }

  return favorites.map(String);
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem(
      DETAILS_STORAGE_KEYS.favorites,
      JSON.stringify(favorites),
    );

    return true;
  } catch (error) {
    console.error("Could not save favorites.", error);
    showToast("Your favorite could not be saved. Check browser storage.");
    return false;
  }
}

/* =========================================
   SAFE DATA FORMATTING
========================================= */

function getPetText(value, fallback = "Not specified") {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" && !value.trim()) {
    return fallback;
  }

  return String(value);
}

function capitalizeWords(value) {
  return getPetText(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPetImage(pet) {
  const possibleImages = [
    pet.image,
    pet.imageUrl,
    pet.photo,
    pet.photoUrl,
    pet.photoURL,
    pet.img,
  ];

  for (const image of possibleImages) {
    if (typeof image !== "string" || !image.trim()) {
      continue;
    }

    try {
      const parsedUrl = new URL(image, window.location.href);

      if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") {
        return parsedUrl.href;
      }
    } catch (error) {
      // Try the next available image field.
    }
  }

  return DETAILS_PLACEHOLDER_IMAGE;
}

function getPetAge(pet) {
  const age = pet.age;

  if (age === undefined || age === null || age === "") {
    return "Not specified";
  }

  if (typeof age === "number" || /^\d+(\.\d+)?$/.test(String(age).trim())) {
    const numericAge = Number(age);

    if (!Number.isFinite(numericAge) || numericAge < 0) {
      return "Not specified";
    }

    if (numericAge === 0) {
      return "Under 1 year";
    }

    if (numericAge === 1) {
      return "1 year";
    }

    return `${numericAge} years`;
  }

  return String(age);
}

function getPetPersonality(pet) {
  const rawPersonality = pet.personality ?? pet.traits ?? pet.tags ?? [];

  let personalityItems = [];

  if (Array.isArray(rawPersonality)) {
    personalityItems = rawPersonality;
  } else if (typeof rawPersonality === "string") {
    personalityItems = rawPersonality.split(/[,;|]/);
  }

  return [
    ...new Set(
      personalityItems.map((item) => String(item).trim()).filter(Boolean),
    ),
  ].slice(0, 12);
}

function getPetDescription(pet) {
  return getPetText(
    pet.description || pet.about || pet.bio,
    "Every pet has a unique personality. Contact the adoption team to learn more about this companion and find out whether they are right for your home.",
  );
}

function getPetStatus(pet) {
  return String(pet.status || "available")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isPetAvailable(pet) {
  const status = getPetStatus(pet);

  return ["available", "active", "open"].includes(status);
}

/* =========================================
   RENDER PET DETAILS
========================================= */

function renderPetDetails(pet) {
  const isAvailable = isPetAvailable(pet);

  setText("breadcrumb-pet-name", getPetText(pet.name, "Pet Details"));
  setText(
    "pet-species-label",
    `MEET YOUR ${getPetText(pet.species, "PET").toUpperCase()}`,
  );
  setText("pet-name", getPetText(pet.name, "Your New Friend"));
  setText("pet-short-description", getShortDescription(pet));
  setText("pet-location", getPetText(pet.location || pet.city));
  setText("pet-age", getPetAge(pet));
  setText("pet-breed", getPetText(pet.breed));
  setText("pet-gender", capitalizeWords(pet.gender));
  setText("pet-size", capitalizeWords(pet.size));
  setText("pet-about-name", getPetText(pet.name, "this pet"));
  setText("pet-description", getPetDescription(pet));

  document.title = `${getPetText(pet.name, "Pet Details")} | Pawfect Home`;

  renderPetImage(pet);
  renderPetStatus(pet, isAvailable);
  renderPersonality(pet);
  configureFavoriteButton(pet);
  configureAdoptionButton(pet, isAvailable);

  const detailsContent = document.getElementById("pet-details-content");

  if (detailsContent) {
    detailsContent.hidden = false;
  }

  if (!isAvailable) {
    showPetState("unavailable");
  }
}

function getShortDescription(pet) {
  if (pet.shortDescription || pet.tagline) {
    return getPetText(pet.shortDescription || pet.tagline);
  }

  const description = getPetDescription(pet);
  const firstSentence = description.match(/^.*?[.!?](?:\s|$)/);

  if (firstSentence && firstSentence[0].trim().length <= 180) {
    return firstSentence[0].trim();
  }

  if (description.length > 145) {
    return `${description.slice(0, 142).trimEnd()}...`;
  }

  return description;
}

function setText(elementId, value) {
  const element = document.getElementById(elementId);

  if (element) {
    element.textContent = value;
  }
}

function renderPetImage(pet) {
  const image = document.getElementById("pet-main-image");

  if (!image) {
    return;
  }

  image.src = getPetImage(pet);
  image.alt = `Photo of ${getPetText(pet.name, "this pet")}`;

  image.onerror = function () {
    if (image.src !== DETAILS_PLACEHOLDER_IMAGE) {
      image.onerror = null;
      image.src = DETAILS_PLACEHOLDER_IMAGE;
      image.alt = "Pet photo unavailable";
    }
  };

  setText(
    "pet-image-caption-text",
    `A closer look at ${getPetText(pet.name, "your companion")}`,
  );
}

function renderPetStatus(pet, isAvailable) {
  const badge = document.getElementById("pet-status-badge");
  const notice = document.getElementById("pet-adoption-notice");

  if (badge) {
    badge.textContent = isAvailable
      ? "Available for adoption"
      : `Status: ${capitalizeWords(getPetStatus(pet))}`;

    badge.classList.toggle("status-unavailable", !isAvailable);
  }

  if (notice) {
    notice.classList.toggle("notice-unavailable", !isAvailable);
  }

  setText(
    "notice-title",
    isAvailable ? "Ready to meet?" : "Currently unavailable",
  );

  setText(
    "notice-description",
    isAvailable
      ? "Start an adoption application to take the next step."
      : "This pet is not currently accepting new adoption applications.",
  );
}

function renderPersonality(pet) {
  const container = document.getElementById("pet-personality-tags");
  const section = document.getElementById("personality-section");

  if (!container || !section) {
    return;
  }

  container.replaceChildren();

  const traits = getPetPersonality(pet);

  if (traits.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  traits.forEach((trait) => {
    const tag = document.createElement("span");

    tag.className = "personality-tag";
    tag.textContent = capitalizeWords(trait);

    container.appendChild(tag);
  });
}

/* =========================================
   FAVORITES
========================================= */

function configureFavoriteButton(pet) {
  const button = document.getElementById("pet-favorite-button");

  if (!button) {
    return;
  }

  const petId = String(pet.id);

  function updateFavoriteAppearance() {
    const favorites = getFavorites();
    const isFavorite = favorites.includes(petId);

    button.classList.toggle("is-favorite", isFavorite);
    button.setAttribute("aria-pressed", String(isFavorite));

    button.setAttribute(
      "aria-label",
      isFavorite
        ? `Remove ${getPetText(pet.name, "pet")} from favorites`
        : `Add ${getPetText(pet.name, "pet")} to favorites`,
    );

    const heart = button.querySelector(".favorite-heart");

    if (heart) {
      heart.textContent = isFavorite ? "♥" : "♡";
    }
  }

  button.addEventListener("click", function () {
    const favorites = getFavorites();
    const isFavorite = favorites.includes(petId);

    const updatedFavorites = isFavorite
      ? favorites.filter((id) => id !== petId)
      : [...favorites, petId];

    if (saveFavorites(updatedFavorites)) {
      updateFavoriteAppearance();

      showToast(
        isFavorite
          ? `${getPetText(pet.name, "Pet")} removed from favorites.`
          : `${getPetText(pet.name, "Pet")} added to favorites.`,
      );
    }
  });

  updateFavoriteAppearance();
}

/* =========================================
   ADOPTION NAVIGATION
========================================= */

function configureAdoptionButton(pet, isAvailable) {
  const button = document.getElementById("adopt-pet-button");

  if (!button) {
    return;
  }

  if (!isAvailable) {
    button.href = "pets.html";
    button.classList.add("is-disabled");
    button.setAttribute("aria-disabled", "true");
    button.textContent = "Browse Other Pets";
    return;
  }

  button.href = `adoption.html?petId=${encodeURIComponent(String(pet.id))}`;
  button.classList.remove("is-disabled");
  button.removeAttribute("aria-disabled");
}

/* =========================================
   PAGE STATES
========================================= */

function showPetState(state) {
  const detailsContent = document.getElementById("pet-details-content");
  const notFound = document.getElementById("pet-not-found");
  const unavailable = document.getElementById("pet-unavailable");

  if (detailsContent) {
    detailsContent.hidden = true;
  }

  if (notFound) {
    notFound.hidden = state !== "not-found";
  }

  if (unavailable) {
    unavailable.hidden = state !== "unavailable";
  }
}

/* =========================================
   MOBILE NAVIGATION
========================================= */

function initializeMobileNavigation() {
  const toggle = document.getElementById("details-menu-toggle");
  const navigation = document.getElementById("details-nav");

  if (!toggle || !navigation) {
    return;
  }

  toggle.addEventListener("click", function () {
    const isOpen = navigation.classList.toggle("is-open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", function () {
      navigation.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    });
  });

  document.addEventListener("click", function (event) {
    if (!navigation.contains(event.target) && !toggle.contains(event.target)) {
      navigation.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    }
  });
}

/* =========================================
   TOAST
========================================= */

let detailsToastTimeout;

function showToast(message) {
  const toast = document.getElementById("details-toast");

  if (!toast) {
    return;
  }

  window.clearTimeout(detailsToastTimeout);

  toast.textContent = message;
  toast.classList.add("show");

  detailsToastTimeout = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* =========================================
   FOOTER
========================================= */

function initializeFooterYear() {
  setText("details-footer-year", new Date().getFullYear());
}
