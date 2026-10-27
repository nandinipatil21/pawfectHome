"use strict";

/* =========================================
   PAWFECT HOME — PET DIRECTORY
   ========================================= */

const PETS_STORAGE_KEY = "pawfectHome.pets.v1";
const FAVORITES_STORAGE_KEY = "pawfectHome.favorites.v1";

/*
 * Sample data for the frontend prototype.
 * Later, these records can be replaced with records from a backend.
 */
const SAMPLE_PETS = [
  {
    id: "max",
    name: "Max",
    species: "dog",
    breed: "Golden Retriever",
    age: 2,
    gender: "Male",
    size: "Large",
    location: "Mumbai",
    personality: ["Friendly", "Playful"],
    description:
      "A cheerful companion who loves walks, games, and spending time with people.",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80",
    featured: true,
    status: "available",
  },
  {
    id: "luna",
    name: "Luna",
    species: "cat",
    breed: "Domestic Shorthair",
    age: 1,
    gender: "Female",
    size: "Small",
    location: "Mumbai",
    personality: ["Gentle", "Calm"],
    description:
      "A quiet, affectionate cat who enjoys sunny windowsills and peaceful company.",
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80",
    featured: true,
    status: "available",
  },
  {
    id: "charlie",
    name: "Charlie",
    species: "dog",
    breed: "Beagle Mix",
    age: 3,
    gender: "Male",
    size: "Medium",
    location: "Pune",
    personality: ["Curious", "Affectionate"],
    description:
      "A curious, loving dog who would enjoy exploring new places with his family.",
    image:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80",
    featured: true,
    status: "available",
  },
  {
    id: "daisy",
    name: "Daisy",
    species: "dog",
    breed: "Indie",
    age: 0.5,
    gender: "Female",
    size: "Small",
    location: "Mumbai",
    personality: ["Energetic", "Sweet"],
    description:
      "A young Indie puppy full of curiosity, ready to learn and grow with a caring family.",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80",
    featured: false,
    status: "available",
  },
  {
    id: "oliver",
    name: "Oliver",
    species: "cat",
    breed: "Domestic Longhair",
    age: 5,
    gender: "Male",
    size: "Medium",
    location: "Navi Mumbai",
    personality: ["Relaxed", "Affectionate"],
    description:
      "A relaxed cat who appreciates gentle attention and a comfortable place to nap.",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
    featured: false,
    status: "available",
  },
  {
    id: "coco",
    name: "Coco",
    species: "rabbit",
    breed: "Domestic Rabbit",
    age: 1,
    gender: "Female",
    size: "Small",
    location: "Thane",
    personality: ["Quiet", "Curious"],
    description:
      "A curious little rabbit who needs a safe, spacious environment and patient care.",
    image:
      "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=800&q=80",
    featured: false,
    status: "available",
  },
  {
    id: "rocky",
    name: "Rocky",
    species: "dog",
    breed: "Indian Pariah",
    age: 7,
    gender: "Male",
    size: "Medium",
    location: "Pune",
    personality: ["Loyal", "Calm"],
    description:
      "A mature, loyal companion who would appreciate a steady routine and a loving home.",
    image:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80",
    featured: false,
    status: "available",
  },
  {
    id: "milo",
    name: "Milo",
    species: "cat",
    breed: "Domestic Shorthair",
    age: 0.4,
    gender: "Male",
    size: "Small",
    location: "Mumbai",
    personality: ["Playful", "Curious"],
    description:
      "A playful kitten who needs a safe indoor space, enrichment, and regular care.",
    image:
      "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=800&q=80",
    featured: false,
    status: "available",
  },
  {
    id: "bella",
    name: "Bella",
    species: "dog",
    breed: "Indie Mix",
    age: 4,
    gender: "Female",
    size: "Medium",
    location: "Navi Mumbai",
    personality: ["Gentle", "Loyal"],
    description:
      "A gentle dog who enjoys companionship and would suit a patient, caring home.",
    image:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80",
    featured: false,
    status: "available",
  },
];

const directoryState = {
  search: "",
  species: "all",
  age: "all",
  sort: "featured",
};

document.addEventListener("DOMContentLoaded", initializePetDirectory);

/* ---------- Initialization ---------- */

function initializePetDirectory() {
  initializeMobileNavigation();
  initializeFooterYear();

  const grid = document.getElementById("pets-grid");

  if (!grid) return;

  try {
    ensurePetData();
    bindDirectoryControls();
    renderPets();
  } catch (error) {
    console.error("The pet directory could not be initialized.", error);

    grid.setAttribute("aria-busy", "false");
    grid.innerHTML = `
            <p class="directory-error">
                The pet directory could not be loaded. Refresh the page to try again.
            </p>
        `;
  }
}

/* ---------- Pet data ---------- */

function ensurePetData() {
  try {
    const stored = localStorage.getItem(PETS_STORAGE_KEY);

    if (stored !== null) {
      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        throw new Error("Stored pet data is not a valid array.");
      }

      return parsed;
    }

    localStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(SAMPLE_PETS));

    return SAMPLE_PETS;
  } catch (error) {
    /*
     * If storage is unavailable or malformed, use the sample records
     * in memory so the directory can still display.
     */
    console.warn("Using in-memory sample pet data.", error);
    return SAMPLE_PETS;
  }
}

function getPets() {
  try {
    const stored = localStorage.getItem(PETS_STORAGE_KEY);

    if (stored === null) {
      return SAMPLE_PETS;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SAMPLE_PETS;
    }

    return parsed.filter(isValidPet);
  } catch (error) {
    console.warn("Pet records could not be read.", error);
    return SAMPLE_PETS;
  }
}

function isValidPet(pet) {
  return Boolean(
    pet &&
    typeof pet.id === "string" &&
    typeof pet.name === "string" &&
    typeof pet.species === "string" &&
    Number.isFinite(Number(pet.age)) &&
    Number(pet.age) >= 0 &&
    typeof pet.description === "string",
  );
}

/* ---------- Controls ---------- */

function bindDirectoryControls() {
  const searchInput = document.getElementById("pet-search");
  const clearSearchButton = document.getElementById("clear-search");
  const speciesFilter = document.getElementById("species-filter");
  const ageFilter = document.getElementById("age-filter");
  const sortFilter = document.getElementById("sort-filter");
  const resetButton = document.getElementById("reset-filters");
  const emptyResetButton = document.getElementById("empty-reset");
  const activeFilters = document.getElementById("active-filters");

  searchInput.addEventListener("input", () => {
    directoryState.search = searchInput.value.trim();
    clearSearchButton.hidden = !searchInput.value;
    renderPets();
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    directoryState.search = "";
    clearSearchButton.hidden = true;
    searchInput.focus();
    renderPets();
  });

  speciesFilter.addEventListener("change", () => {
    directoryState.species = speciesFilter.value;
    renderPets();
  });

  ageFilter.addEventListener("change", () => {
    directoryState.age = ageFilter.value;
    renderPets();
  });

  sortFilter.addEventListener("change", () => {
    directoryState.sort = sortFilter.value;
    renderPets();
  });

  resetButton.addEventListener("click", resetFilters);
  emptyResetButton.addEventListener("click", resetFilters);

  activeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-filter]");

    if (!button) return;

    const filter = button.dataset.removeFilter;

    if (filter === "search") {
      directoryState.search = "";
      searchInput.value = "";
      clearSearchButton.hidden = true;
    } else if (filter === "species") {
      directoryState.species = "all";
      speciesFilter.value = "all";
    } else if (filter === "age") {
      directoryState.age = "all";
      ageFilter.value = "all";
    }

    renderPets();
  });

  document.getElementById("pets-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-favorite-id]");

    if (!button) return;

    toggleFavorite(button.dataset.favoriteId);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === FAVORITES_STORAGE_KEY || event.key === PETS_STORAGE_KEY) {
      renderPets();
    }
  });
}

function resetFilters() {
  directoryState.search = "";
  directoryState.species = "all";
  directoryState.age = "all";
  directoryState.sort = "featured";

  document.getElementById("pet-search").value = "";
  document.getElementById("clear-search").hidden = true;
  document.getElementById("species-filter").value = "all";
  document.getElementById("age-filter").value = "all";
  document.getElementById("sort-filter").value = "featured";

  renderPets();
}

/* ---------- Filtering and sorting ---------- */

function getFilteredPets() {
  let pets = getPets().filter((pet) => {
    return (pet.status || "available") === "available";
  });

  const searchTerm = directoryState.search.trim().toLowerCase();

  if (searchTerm) {
    pets = pets.filter((pet) => {
      const searchableFields = [
        pet.name,
        pet.species,
        pet.breed,
        pet.location,
        pet.gender,
        ...(Array.isArray(pet.personality) ? pet.personality : []),
      ];

      return searchableFields.some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(searchTerm),
      );
    });
  }

  if (directoryState.species !== "all") {
    pets = pets.filter(
      (pet) => pet.species.toLowerCase() === directoryState.species,
    );
  }

  if (directoryState.age === "young") {
    pets = pets.filter((pet) => Number(pet.age) < 1);
  } else if (directoryState.age === "adult") {
    pets = pets.filter((pet) => Number(pet.age) >= 1 && Number(pet.age) <= 6);
  } else if (directoryState.age === "senior") {
    pets = pets.filter((pet) => Number(pet.age) > 6);
  }

  switch (directoryState.sort) {
    case "name-asc":
      pets.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "age-asc":
      pets.sort((a, b) => Number(a.age) - Number(b.age));
      break;

    case "age-desc":
      pets.sort((a, b) => Number(b.age) - Number(a.age));
      break;

    case "featured":
    default:
      pets.sort((a, b) => {
        if (Boolean(a.featured) !== Boolean(b.featured)) {
          return a.featured ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });
      break;
  }

  return pets;
}

/* ---------- Rendering ---------- */

function renderPets() {
  const grid = document.getElementById("pets-grid");
  const emptyState = document.getElementById("empty-state");
  const resultsCount = document.getElementById("results-count");

  if (!grid || !emptyState || !resultsCount) return;

  grid.setAttribute("aria-busy", "true");

  const pets = getFilteredPets();

  grid.replaceChildren();

  if (pets.length === 0) {
    emptyState.hidden = false;
    grid.hidden = true;
    resultsCount.textContent = "No pets match your filters.";
  } else {
    emptyState.hidden = true;
    grid.hidden = false;

    const fragment = document.createDocumentFragment();

    pets.forEach((pet) => {
      fragment.appendChild(createPetCard(pet));
    });

    grid.appendChild(fragment);

    resultsCount.textContent = `${pets.length} ${pets.length === 1 ? "pet" : "pets"} available`;
  }

  renderActiveFilters();
  grid.setAttribute("aria-busy", "false");
}

function createPetCard(pet) {
  const article = document.createElement("article");
  article.className = "directory-pet-card";

  const detailsUrl = `pet-details.html?id=${encodeURIComponent(pet.id)}`;
  const favorite = getFavorites().includes(pet.id);
  const speciesLabel = capitalize(pet.species);
  const ageLabel = formatAge(pet.age);
  const imageUrl = getSafeImageUrl(pet.image);

  const imageLink = document.createElement("a");
  imageLink.className = "directory-pet-image";
  imageLink.href = detailsUrl;
  imageLink.setAttribute("aria-label", `View ${pet.name}'s profile`);

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = `${pet.name}, ${pet.breed || speciesLabel}`;
  image.loading = "lazy";
  image.decoding = "async";

  image.addEventListener(
    "error",
    () => {
      image.src = createFallbackImage(pet.name);
    },
    { once: true },
  );

  const badge = document.createElement("span");
  badge.className = "directory-pet-badge";
  badge.textContent = speciesLabel;

  imageLink.append(image, badge);

  const favoriteButton = document.createElement("button");
  favoriteButton.type = "button";
  favoriteButton.className = "directory-favorite";
  favoriteButton.dataset.favoriteId = pet.id;
  favoriteButton.classList.toggle("is-favorite", favorite);
  favoriteButton.setAttribute("aria-pressed", String(favorite));
  favoriteButton.setAttribute(
    "aria-label",
    favorite
      ? `Remove ${pet.name} from favorites`
      : `Add ${pet.name} to favorites`,
  );
  favoriteButton.textContent = favorite ? "♥" : "♡";

  const content = document.createElement("div");
  content.className = "directory-pet-content";

  const titleRow = document.createElement("div");
  titleRow.className = "directory-pet-title";

  const title = document.createElement("h3");
  title.textContent = pet.name;

  const age = document.createElement("span");
  age.textContent = ageLabel;

  titleRow.append(title, age);

  const meta = document.createElement("div");
  meta.className = "directory-pet-meta";

  [
    pet.breed || speciesLabel,
    pet.gender || "Gender not listed",
    pet.location || "Location not listed",
  ].forEach((value) => {
    const chip = document.createElement("span");
    chip.textContent = value;
    meta.appendChild(chip);
  });

  const description = document.createElement("p");
  description.className = "directory-pet-description";
  description.textContent = pet.description || "More information coming soon.";

  const footer = document.createElement("div");
  footer.className = "directory-pet-footer";

  const status = document.createElement("span");
  status.className = "directory-pet-status";
  status.textContent = "Available";

  const detailsLink = document.createElement("a");
  detailsLink.className = "directory-pet-link";
  detailsLink.href = detailsUrl;
  detailsLink.append(document.createTextNode("View profile "), createArrow());

  footer.append(status, detailsLink);
  content.append(titleRow, meta, description, footer);
  article.append(imageLink, favoriteButton, content);

  return article;
}

function createArrow() {
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  return arrow;
}

function renderActiveFilters() {
  const container = document.getElementById("active-filters");

  if (!container) return;

  container.replaceChildren();

  const activeFilters = [];

  if (directoryState.search) {
    activeFilters.push({
      key: "search",
      label: `Search: ${directoryState.search}`,
    });
  }

  if (directoryState.species !== "all") {
    activeFilters.push({
      key: "species",
      label: `Species: ${capitalize(directoryState.species)}`,
    });
  }

  if (directoryState.age !== "all") {
    const labels = {
      young: "Young",
      adult: "Adult",
      senior: "Senior",
    };

    activeFilters.push({
      key: "age",
      label: `Age: ${labels[directoryState.age]}`,
    });
  }

  activeFilters.forEach((filter) => {
    const chip = document.createElement("span");
    chip.className = "active-filter-chip";

    const label = document.createElement("span");
    label.textContent = filter.label;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.dataset.removeFilter = filter.key;
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove ${filter.label} filter`);

    chip.append(label, removeButton);
    container.appendChild(chip);
  });
}

/* ---------- Favorites ---------- */

function getFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!stored) return [];

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return [...new Set(parsed.filter((id) => typeof id === "string"))];
  } catch (error) {
    console.warn("Favorite records could not be read.", error);
    return [];
  }
}

function toggleFavorite(petId) {
  if (!petId) return;

  const favorites = getFavorites();
  const alreadyFavorite = favorites.includes(petId);

  const updatedFavorites = alreadyFavorite
    ? favorites.filter((id) => id !== petId)
    : [...favorites, petId];

  try {
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(updatedFavorites),
    );

    renderPets();

    showToast(
      alreadyFavorite
        ? `${getPetName(petId)} removed from favorites.`
        : `${getPetName(petId)} added to favorites.`,
    );
  } catch (error) {
    console.error("Favorite could not be saved.", error);
    showToast("Your browser could not save this favorite.");
  }
}

function getPetName(petId) {
  const pet = getPets().find((item) => item.id === petId);
  return pet ? pet.name : "Pet";
}

/* ---------- Helpers ---------- */

function formatAge(age) {
  const value = Number(age);

  if (!Number.isFinite(value) || value < 0) {
    return "Age unknown";
  }

  if (value < 1) {
    const months = Math.max(1, Math.round(value * 12));
    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  return `${value} ${value === 1 ? "year" : "years"}`;
}

function capitalize(value) {
  if (!value) return "";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getSafeImageUrl(url) {
  if (typeof url !== "string") {
    return createFallbackImage("Pet");
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    // Use the fallback image for invalid URLs.
  }

  return createFallbackImage("Pet");
}

function createFallbackImage(name) {
  const safeName = String(name || "Pet").replace(/[<>&"']/g, "");

  const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="700" height="500">
            <rect width="100%" height="100%" fill="#e7eade"/>
            <circle cx="350" cy="190" r="70" fill="#d2dccb"/>
            <text x="350" y="210" font-size="60" text-anchor="middle"
                fill="#526b53">♡</text>
            <text x="350" y="330" font-size="30" text-anchor="middle"
                font-family="Arial,sans-serif" fill="#263d30">${safeName}</text>
        </svg>
    `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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
    if (event.key === "Escape") closeMenu();
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
    if (window.innerWidth > 820) closeMenu();
  });
}

function initializeFooterYear() {
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

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
