/* =========================================
   PAWFECT HOME
   ADOPTION APPLICATION
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", initializeAdoptionPage);

const ADOPTION_KEYS = {
  pets: "pawfectHome.pets.v1",
  applications: "pawfectHome.applications.v1",
};

const ADOPTION_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80";

let selectedPet = null;
let submissionInProgress = false;

/* =========================================
   INITIALIZATION
========================================= */

function initializeAdoptionPage() {
  setText("adoption-footer-year", new Date().getFullYear());
  initializeAdoptionNavigation();

  const form = document.getElementById("adoption-form");

  if (form) {
    form.addEventListener("submit", handleApplicationSubmit);

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("input", () => clearFieldError(field.id));
      field.addEventListener("change", () => clearFieldError(field.id));
    });
  }

  const petId = new URLSearchParams(window.location.search).get("petId");

  if (!petId || !petId.trim()) {
    showPetSelectionError(
      "No pet was selected. Open a pet's details page and choose Start Adoption Application.",
    );
    return;
  }

  selectedPet = findPetById(petId.trim());

  if (!selectedPet) {
    showPetSelectionError(
      "This pet could not be found. It may have been removed from the directory.",
    );
    return;
  }

  if (!isAvailableForAdoption(selectedPet)) {
    showPetSelectionError(
      "This pet is not currently available for adoption. Please choose another pet.",
    );
    return;
  }

  renderSelectedPet(selectedPet);
}

/* =========================================
   LOCAL STORAGE HELPERS
========================================= */

function readStoredArray(key) {
  try {
    const raw = localStorage.getItem(key);

    if (raw === null) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Unable to read ${key}.`, error);
    return null;
  }
}

function findPetById(petId) {
  const pets = readStoredArray(ADOPTION_KEYS.pets);

  if (!pets) {
    showPetSelectionError(
      "Pet data could not be read from browser storage. Please reload the directory and try again.",
    );
    return null;
  }

  return (
    pets.find((pet) => {
      return (
        pet &&
        pet.id !== undefined &&
        pet.id !== null &&
        String(pet.id) === String(petId)
      );
    }) || null
  );
}

function getApplications() {
  return readStoredArray(ADOPTION_KEYS.applications);
}

function saveApplication(application) {
  const applications = getApplications();

  if (!applications) {
    return {
      success: false,
      message:
        "Saved applications could not be read. Your application was not saved.",
    };
  }

  /*
   * Recheck duplicates immediately before saving.
   * This reduces accidental duplicate submissions in this browser.
   */
  const duplicate = applications.some((existing) => {
    if (!existing || typeof existing !== "object") {
      return false;
    }

    const samePet = String(existing.petId) === String(application.petId);

    const sameEmail =
      normalizeEmail(existing.email) === normalizeEmail(application.email);

    const status = String(existing.status || "").toLowerCase();

    return (
      samePet &&
      sameEmail &&
      ["pending", "under review", "under_review", "approved"].includes(status)
    );
  });

  if (duplicate) {
    return {
      success: false,
      duplicate: true,
      message:
        "You already have an active application for this pet using this email address.",
    };
  }

  try {
    /*
     * Confirm the current pet record still exists and is available.
     */
    const currentPet = findPetById(application.petId);

    if (!currentPet || !isAvailableForAdoption(currentPet)) {
      return {
        success: false,
        message:
          "This pet is no longer available. Please return to the directory and choose another pet.",
      };
    }

    /*
     * Write one complete updated array.
     * Existing applications are preserved.
     */
    const updatedApplications = [application, ...applications];

    localStorage.setItem(
      ADOPTION_KEYS.applications,
      JSON.stringify(updatedApplications),
    );

    /*
     * Verify that the browser accepted the write.
     */
    const savedApplications = getApplications();

    const verified =
      savedApplications &&
      savedApplications.some((item) => item.id === application.id);

    if (!verified) {
      return {
        success: false,
        message:
          "The application could not be verified after saving. Please try again.",
      };
    }

    return {
      success: true,
      application,
    };
  } catch (error) {
    console.error("Application could not be saved.", error);

    return {
      success: false,
      message:
        error && error.name === "QuotaExceededError"
          ? "Browser storage is full. Free up storage space and try again."
          : "Your application could not be saved. Check browser storage permissions and try again.",
    };
  }
}

/* =========================================
   PET HELPERS
========================================= */

function getPetName(pet) {
  return safeText(pet.name, "Selected pet");
}

function safeText(value, fallback = "Not specified") {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  return String(value).trim();
}

function getPetImageUrl(pet) {
  const candidates = [
    pet.image,
    pet.imageUrl,
    pet.photo,
    pet.photoUrl,
    pet.photoURL,
    pet.img,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim()) {
      continue;
    }

    try {
      const url = new URL(candidate, window.location.href);

      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.href;
      }
    } catch (error) {
      // Continue to the next image field.
    }
  }

  return ADOPTION_FALLBACK_IMAGE;
}

function getPetAgeText(pet) {
  const age = pet.age;

  if (age === undefined || age === null || age === "") {
    return "Age not specified";
  }

  if (typeof age === "number" || /^\d+(\.\d+)?$/.test(String(age).trim())) {
    const numericAge = Number(age);

    if (!Number.isFinite(numericAge) || numericAge < 0) {
      return "Age not specified";
    }

    if (numericAge === 0) {
      return "Under 1 year";
    }

    return numericAge === 1 ? "1 year old" : `${numericAge} years old`;
  }

  return String(age);
}

function isAvailableForAdoption(pet) {
  const status = String(pet.status || "available")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return ["available", "active", "open"].includes(status);
}

/* =========================================
   SELECTED PET DISPLAY
========================================= */

function renderSelectedPet(pet) {
  const petIdInput = document.getElementById("application-pet-id");

  if (petIdInput) {
    petIdInput.value = String(pet.id);
  }

  const imageUrl = getPetImageUrl(pet);
  const name = getPetName(pet);

  const selectedCard = document.getElementById("selected-pet-card");

  if (selectedCard) {
    selectedCard.replaceChildren();

    const imageWrap = document.createElement("div");
    imageWrap.className = "selected-pet-image-wrap";

    const image = document.createElement("img");
    image.className = "selected-pet-image";
    image.src = imageUrl;
    image.alt = `Photo of ${name}`;
    image.loading = "lazy";
    image.onerror = () => {
      image.onerror = null;
      image.src = ADOPTION_FALLBACK_IMAGE;
    };

    imageWrap.appendChild(image);

    const info = document.createElement("div");
    info.className = "selected-pet-info";

    const title = document.createElement("h3");
    title.textContent = name;

    const meta = document.createElement("p");
    meta.textContent = [
      safeText(pet.breed, safeText(pet.species, "Pet")),
      getPetAgeText(pet),
      safeText(pet.location || pet.city, "Location not specified"),
    ].join(" · ");

    const status = document.createElement("span");
    status.className = "selected-pet-status";
    status.textContent = "Available for adoption";

    info.append(title, meta, status);
    selectedCard.append(imageWrap, info);
  }

  setText("sidebar-pet-name", name);

  setText(
    "sidebar-pet-meta",
    [
      safeText(pet.breed, safeText(pet.species, "Pet")),
      getPetAgeText(pet),
      safeText(pet.gender, "Gender not specified"),
    ].join(" · "),
  );

  const sidebarImage = document.getElementById("sidebar-pet-image");
  const sidebarPlaceholder = document.getElementById("sidebar-pet-placeholder");

  if (sidebarImage) {
    sidebarImage.src = imageUrl;
    sidebarImage.alt = `Photo of ${name}`;
    sidebarImage.hidden = false;

    sidebarImage.onerror = () => {
      sidebarImage.onerror = null;
      sidebarImage.src = ADOPTION_FALLBACK_IMAGE;
    };
  }

  if (sidebarPlaceholder) {
    sidebarPlaceholder.hidden = true;
  }

  setText("sidebar-pet-status", "Available for adoption");

  document.title = `Adopt ${name} | Pawfect Home`;

  const selectionError = document.getElementById("pet-selection-error");

  if (selectionError) {
    selectionError.hidden = true;
  }
}

/* =========================================
   PET SELECTION ERRORS
========================================= */

function showPetSelectionError(message) {
  const error = document.getElementById("pet-selection-error");

  if (error) {
    error.textContent = message;
    error.hidden = false;
  }

  const card = document.getElementById("selected-pet-card");

  if (card) {
    card.replaceChildren();

    const messageElement = document.createElement("p");
    messageElement.className = "selected-pet-loading";
    messageElement.textContent = message;

    card.appendChild(messageElement);
  }

  const submitButton = document.getElementById("submit-application");

  if (submitButton) {
    submitButton.disabled = true;
  }

  const sidebarStatus = document.getElementById("sidebar-pet-status");

  if (sidebarStatus) {
    sidebarStatus.textContent = "Pet unavailable";
    sidebarStatus.classList.add("unavailable");
  }

  setText("sidebar-pet-name", "No available pet selected");
  setText("sidebar-pet-meta", "Choose an available pet to continue.");

  const sidebarImage = document.getElementById("sidebar-pet-image");
  const sidebarPlaceholder = document.getElementById("sidebar-pet-placeholder");

  if (sidebarImage) {
    sidebarImage.hidden = true;
  }

  if (sidebarPlaceholder) {
    sidebarPlaceholder.hidden = false;
  }
}

/* =========================================
   FORM VALIDATION
========================================= */

function getFieldValue(id) {
  const field = document.getElementById(id);

  return field ? field.value.trim() : "";
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  /*
   * Allows an optional leading + and common separators.
   * Requires 8–15 digits, which supports Indian mobile numbers
   * and international numbers.
   */
  const digits = phone.replace(/\D/g, "");

  return (
    /^\+?[\d\s().-]+$/.test(phone) && digits.length >= 8 && digits.length <= 15
  );
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.querySelector(`[data-error-for="${fieldId}"]`);

  if (field) {
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", error ? error.id || "" : "");
  }

  if (error) {
    if (!error.id) {
      error.id = `${fieldId}-error`;
    }

    error.textContent = message;
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const error = document.querySelector(`[data-error-for="${fieldId}"]`);

  if (field) {
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
  }

  if (error) {
    error.textContent = "";
  }

  const summary = document.getElementById("form-error-summary");

  if (summary) {
    summary.hidden = true;
  }
}

function validateApplicationForm() {
  const errors = [];

  const requiredFields = [
    {
      id: "applicant-name",
      label: "Full name",
      min: 2,
    },
    {
      id: "applicant-email",
      label: "Email address",
      min: 0,
    },
    {
      id: "applicant-phone",
      label: "Phone number",
      min: 0,
    },
    {
      id: "applicant-address",
      label: "Residential address",
      min: 10,
    },
    {
      id: "home-type",
      label: "Type of home",
      min: 0,
    },
    {
      id: "ownership",
      label: "Home ownership",
      min: 0,
    },
    {
      id: "household-members",
      label: "People in household",
      min: 0,
    },
    {
      id: "children-at-home",
      label: "Children at home",
      min: 0,
    },
    {
      id: "existing-pets",
      label: "Existing pets",
      min: 0,
    },
    {
      id: "pet-experience",
      label: "Pet experience",
      min: 0,
    },
    {
      id: "daily-availability",
      label: "Daily availability",
      min: 0,
    },
    {
      id: "adoption-reason",
      label: "Reason for adopting",
      min: 20,
    },
    {
      id: "care-plan",
      label: "Pet care plan",
      min: 20,
    },
  ];

  requiredFields.forEach((item) => {
    const value = getFieldValue(item.id);

    if (!value) {
      errors.push({
        id: item.id,
        message: `${item.label} is required.`,
      });
    } else if (item.min && value.length < item.min) {
      errors.push({
        id: item.id,
        message: `${item.label} must contain at least ${item.min} characters.`,
      });
    }
  });

  const email = getFieldValue("applicant-email");

  if (email && !validateEmail(email)) {
    errors.push({
      id: "applicant-email",
      message: "Enter a valid email address.",
    });
  }

  const phone = getFieldValue("applicant-phone");

  if (phone && !validatePhone(phone)) {
    errors.push({
      id: "applicant-phone",
      message: "Enter a valid phone number containing 8–15 digits.",
    });
  }

  const rentalPermission = getFieldValue("rental-permission");
  const ownership = getFieldValue("ownership");

  if (ownership === "Rented" && rentalPermission === "No") {
    errors.push({
      id: "rental-permission",
      message: "Please confirm that pets are permitted before applying.",
    });
  }

  const consent = document.getElementById("adoption-consent");

  if (!consent || !consent.checked) {
    errors.push({
      id: "adoption-consent",
      message: "Please confirm the adoption declaration.",
    });
  }

  const petId = getFieldValue("application-pet-id");

  if (!selectedPet || !petId || String(selectedPet.id) !== petId) {
    errors.push({
      id: "application-pet-id",
      message: "Please select a valid pet.",
    });
  } else if (!isAvailableForAdoption(selectedPet)) {
    errors.push({
      id: "application-pet-id",
      message: "This pet is no longer available.",
    });
  }

  /*
   * Remove previous errors before displaying the current ones.
   */
  document.querySelectorAll("[data-error-for]").forEach((element) => {
    element.textContent = "";
  });

  document
    .querySelectorAll("#adoption-form [aria-invalid='true']")
    .forEach((field) => {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    });

  errors.forEach((error) => {
    setFieldError(error.id, error.message);
  });

  const summary = document.getElementById("form-error-summary");
  const summaryText = document.getElementById("form-error-summary-text");

  if (summary && summaryText) {
    summary.hidden = errors.length === 0;

    if (errors.length > 0) {
      summaryText.textContent = `${errors.length} issue${errors.length === 1 ? "" : "s"} need attention. Correct the highlighted fields and submit again.`;
    }
  }

  if (errors.length > 0) {
    const firstErrorField = document.getElementById(errors[0].id);

    if (firstErrorField) {
      firstErrorField.focus({ preventScroll: false });
      firstErrorField.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    return false;
  }

  return true;
}

/* =========================================
   APPLICATION ID
========================================= */

function generateApplicationId() {
  const timestamp = Date.now().toString(36).toUpperCase();

  let randomPart;

  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    randomPart = window.crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();
  } else {
    randomPart = Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()
      .padEnd(8, "0");
  }

  return `PAW-${timestamp}-${randomPart}`;
}

/* =========================================
   FORM SUBMISSION
========================================= */

function handleApplicationSubmit(event) {
  event.preventDefault();

  if (submissionInProgress) {
    return;
  }

  if (!validateApplicationForm()) {
    return;
  }

  const currentPet = findPetById(String(selectedPet.id));

  if (!currentPet || !isAvailableForAdoption(currentPet)) {
    showPetSelectionError(
      "This pet is no longer available. Please choose another pet.",
    );
    return;
  }

  selectedPet = currentPet;

  let currentSession = null;

  try {
    currentSession = JSON.parse(
      localStorage.getItem("pawfectHome.session.v1") || "null",
    );
  } catch {
    currentSession = null;
  }

  if (!currentSession || !currentSession.userId) {
    sessionStorage.setItem(
      "pawfectHome.returnAfterLogin.v1",
      window.location.pathname + window.location.search,
    );

    window.location.href = "login.html";
    return;
  }

  const application = {
    id: generateApplicationId(),
    userId: currentSession.userId,

    petId: String(selectedPet.id),
    petName: getPetName(selectedPet),
    petImage: getPetImageUrl(selectedPet),

    applicantName: getFieldValue("applicant-name"),
    email: normalizeEmail(getFieldValue("applicant-email")),
    phone: getFieldValue("applicant-phone"),
    address: getFieldValue("applicant-address"),

    homeType: getFieldValue("home-type"),
    ownership: getFieldValue("ownership"),
    householdMembers: getFieldValue("household-members"),
    childrenAtHome: getFieldValue("children-at-home"),
    existingPets: getFieldValue("existing-pets"),
    rentalPermission: getFieldValue("rental-permission"),

    petExperience: getFieldValue("pet-experience"),
    dailyAvailability: getFieldValue("daily-availability"),
    adoptionReason: getFieldValue("adoption-reason"),
    carePlan: getFieldValue("care-plan"),

    status: "Pending",
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  submissionInProgress = true;

  const submitButton = document.getElementById("submit-application");

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Saving Application...";
  }

  const result = saveApplication(application);

  if (!result.success) {
    submissionInProgress = false;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML =
        'Submit Adoption Application <span aria-hidden="true">→</span>';
    }

    showApplicationError(result.message);
    return;
  }

  showApplicationSuccess(result.application);
}

/* =========================================
   SUCCESS STATE
========================================= */

function showApplicationSuccess(application) {
  const form = document.getElementById("adoption-form");
  const layout = document.querySelector(".adoption-layout");
  const intro = document.querySelector(".adoption-page-intro");
  const success = document.getElementById("application-success");

  if (form) {
    form.hidden = true;
  }

  if (layout) {
    layout.hidden = true;
  }

  if (intro) {
    intro.hidden = true;
  }

  setText(
    "success-message",
    `Your application to adopt ${application.petName} has been saved in this browser.`,
  );

  setText("success-application-id", application.id);

  if (success) {
    success.hidden = false;

    success.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  document.title = "Application Saved | Pawfect Home";
}

/* =========================================
   ERRORS AND MESSAGES
========================================= */

function showApplicationError(message) {
  const summary = document.getElementById("form-error-summary");
  const summaryText = document.getElementById("form-error-summary-text");

  if (summary && summaryText) {
    summaryText.textContent = message;
    summary.hidden = false;

    summary.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  } else {
    window.alert(message);
  }
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

/* =========================================
   MOBILE NAVIGATION
========================================= */

function initializeAdoptionNavigation() {
  const toggle = document.getElementById("adoption-menu-toggle");
  const navigation = document.getElementById("adoption-nav");

  if (!toggle || !navigation) {
    return;
  }

  function closeNavigation() {
    navigation.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
  }

  toggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
  });

  document.addEventListener("click", (event) => {
    if (!navigation.contains(event.target) && !toggle.contains(event.target)) {
      closeNavigation();
    }
  });
}
