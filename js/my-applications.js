/* =========================================
   PAWFECT HOME
   MY APPLICATIONS
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", initializeApplicationsPage);

const APPLICATIONS_STORAGE_KEY = "pawfectHome.applications.v1";

const APPLICATION_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80";

let allApplications = [];
let storageAvailable = true;

function getApplicationsForCurrentUser() {
  let session = null;
  let applications = [];

  try {
    session = JSON.parse(
      localStorage.getItem("pawfectHome.session.v1") || "null",
    );

    const stored = JSON.parse(
      localStorage.getItem("pawfectHome.applications.v1") || "[]",
    );

    applications = Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error("Unable to load user applications:", error);
    return [];
  }

  if (!session || !session.userId) {
    return [];
  }

  return applications.filter(
    (application) => application.userId === session.userId,
  );
}

/* =========================================
   INITIALIZATION
========================================= */

function initializeApplicationsPage() {
  setText("applications-footer-year", new Date().getFullYear());

  initializeApplicationsNavigation();
  initializeApplicationFilters();
  loadApplications();
}

/* =========================================
   LOCAL STORAGE
========================================= */


function loadApplications() {
  const list = document.getElementById("applications-list");
  const error = document.getElementById("applications-error");

  if (list) {
    list.setAttribute("aria-busy", "true");
  }

  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);

    if (raw === null) {
      allApplications = [];
    } else {
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        throw new Error("Stored application data is not an array.");
      }

      const validApplications = parsed.filter((application) => {
        return (
          application &&
          typeof application === "object" &&
          !Array.isArray(application)
        );
      });

      // Show only applications belonging to the logged-in user.
      allApplications = getApplicationsForCurrentUser().filter(
        (application) => {
          return (
            application &&
            typeof application === "object" &&
            !Array.isArray(application)
          );
        },
      );

      // If there are no applications, the page will display its empty state.
      // validApplications is intentionally retained only for validation.
      void validApplications;
    }

    storageAvailable = true;

    if (error) {
      error.hidden = true;
    }

    updateApplicationStatistics();
    renderApplications();
  } catch (exception) {
    console.error("Unable to load adoption applications.", exception);

    storageAvailable = false;
    allApplications = [];

    if (error) {
      error.hidden = false;
    }

    updateApplicationStatistics();
    renderApplications();
  } finally {
    if (list) {
      list.setAttribute("aria-busy", "false");
    }
  }
}


/* =========================================
   DATA HELPERS
========================================= */

function getValue(value, fallback = "Not provided") {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return String(value).trim();
}

function normalizeStatus(status) {
  const normalized = getValue(status, "Pending")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  const aliases = {
    pending: "pending",
    submitted: "pending",
    under_review: "under_review",
    in_review: "under_review",
    approved: "approved",
    accepted: "approved",
    rejected: "rejected",
    declined: "rejected",
    withdrawn: "withdrawn",
    cancelled: "withdrawn",
    canceled: "withdrawn",
    completed: "completed",
    adopted: "completed",
  };

  return aliases[normalized] || "unknown";
}

function getStatusLabel(status) {
  const labels = {
    pending: "Pending",
    under_review: "Under review",
    approved: "Approved",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    completed: "Completed",
    unknown: "Status unavailable",
  };

  return labels[normalizeStatus(status)];
}

function getStatusClass(status) {
  const normalized = normalizeStatus(status);

  const classes = {
    pending: "status-pending",
    under_review: "status-under-review",
    approved: "status-approved",
    rejected: "status-rejected",
    withdrawn: "status-withdrawn",
    completed: "status-completed",
    unknown: "status-unknown",
  };

  return classes[normalized] || classes.unknown;
}

function formatApplicationDate(dateValue) {
  if (!dateValue) {
    return "Date not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getApplicationDate(application) {
  return (
    application.submittedAt ||
    application.createdAt ||
    application.applicationDate ||
    ""
  );
}

function getApplicationReference(application) {
  return getValue(
    application.id || application.applicationId || application.referenceNumber,
    "Reference unavailable",
  );
}

function getApplicationPetName(application) {
  return getValue(application.petName || application.pet?.name, "Selected pet");
}

function getApplicationPetImage(application) {
  const imageCandidates = [
    application.petImage,
    application.pet?.image,
    application.pet?.imageUrl,
    application.pet?.photo,
    application.pet?.photoUrl,
  ];

  for (const candidate of imageCandidates) {
    if (typeof candidate !== "string" || !candidate.trim()) {
      continue;
    }

    try {
      const url = new URL(candidate, window.location.href);

      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.href;
      }
    } catch (error) {
      // Try the next image field.
    }
  }

  return APPLICATION_IMAGE_FALLBACK;
}

function getPetMeta(application) {
  const pet = application.pet || {};

  const parts = [
    application.breed || pet.breed || pet.species,
    application.age || pet.age,
    application.gender || pet.gender,
  ]
    .filter(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== "",
    )
    .map((value) => String(value).trim());

  return parts.length ? parts.join(" · ") : "Pet adoption application";
}

/* =========================================
   STATISTICS
========================================= */

function updateApplicationStatistics() {
  const total = allApplications.length;

  const pending = allApplications.filter((application) => {
    const status = normalizeStatus(application.status);

    return status === "pending" || status === "under_review";
  }).length;

  const approved = allApplications.filter((application) => {
    return normalizeStatus(application.status) === "approved";
  }).length;

  setText("total-applications", total);
  setText("pending-applications", pending);
  setText("approved-applications", approved);
}

/* =========================================
   FILTERS AND SEARCH
========================================= */

function initializeApplicationFilters() {
  const searchInput = document.getElementById("application-search");
  const statusFilter = document.getElementById("application-status-filter");

  if (searchInput) {
    searchInput.addEventListener("input", renderApplications);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", renderApplications);
  }
}

function getFilteredApplications() {
  const searchInput = document.getElementById("application-search");
  const statusFilter = document.getElementById("application-status-filter");

  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const selectedStatus = statusFilter ? statusFilter.value : "all";

  return allApplications
    .filter((application) => {
      const status = normalizeStatus(application.status);

      const searchableText = [
        getApplicationPetName(application),
        getApplicationReference(application),
        application.applicantName,
        application.email,
        application.status,
      ]
        .map((value) => getValue(value, ""))
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

      const matchesStatus =
        selectedStatus === "all" || status === selectedStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((first, second) => {
      const firstDate = new Date(getApplicationDate(first)).getTime() || 0;
      const secondDate = new Date(getApplicationDate(second)).getTime() || 0;

      return secondDate - firstDate;
    });
}

/* =========================================
   RENDER APPLICATIONS
========================================= */

function renderApplications() {
  const list = document.getElementById("applications-list");
  const emptyState = document.getElementById("applications-empty");
  const emptyTitle = document.getElementById("applications-empty-title");
  const emptyDescription = document.getElementById(
    "applications-empty-description",
  );
  const resultsCount = document.getElementById("applications-results-count");

  if (!list || !emptyState) {
    return;
  }

  list.replaceChildren();

  const filteredApplications = getFilteredApplications();

  if (resultsCount) {
    resultsCount.textContent = `${filteredApplications.length} application${filteredApplications.length === 1 ? "" : "s"} found`;
  }

  if (filteredApplications.length === 0) {
    emptyState.hidden = false;

    if (allApplications.length === 0) {
      if (emptyTitle) {
        emptyTitle.textContent = "Your journey starts here.";
      }

      if (emptyDescription) {
        emptyDescription.textContent = storageAvailable
          ? "You haven't submitted any adoption applications yet. Meet the pets waiting for a loving home."
          : "Applications could not be loaded. Check browser storage and reload the page.";
      }
    } else {
      if (emptyTitle) {
        emptyTitle.textContent = "No matching applications.";
      }

      if (emptyDescription) {
        emptyDescription.textContent =
          "Try another search term or change the status filter to see your applications.";
      }
    }

    return;
  }

  emptyState.hidden = true;

  const fragment = document.createDocumentFragment();

  filteredApplications.forEach((application, index) => {
    fragment.appendChild(createApplicationCard(application, index));
  });

  list.appendChild(fragment);
}

/* =========================================
   DOM ELEMENT HELPERS
========================================= */

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined && text !== null) {
    element.textContent = String(text);
  }

  return element;
}

function createDetail(label, value, fullWidth = false) {
  const wrapper = createElement(
    "div",
    `application-detail${fullWidth ? " full-width" : ""}`,
  );

  const term = createElement("dt", "", label);
  const description = createElement("dd", "", getValue(value));

  wrapper.append(term, description);

  return wrapper;
}

/* =========================================
   APPLICATION CARD
========================================= */

function createApplicationCard(application, index) {
  const card = createElement("article", "application-card");

  const main = createElement("div", "application-card-main");

  /* Pet image */
  const imageWrap = createElement("div", "application-pet-image-wrap");
  const image = createElement("img", "application-pet-image");

  image.src = getApplicationPetImage(application);
  image.alt = `Photo of ${getApplicationPetName(application)}`;
  image.loading = "lazy";

  image.onerror = () => {
    image.onerror = null;
    image.src = APPLICATION_IMAGE_FALLBACK;
  };

  imageWrap.appendChild(image);

  /* Pet and reference information */
  const petInfo = createElement("div", "application-pet-info");

  const petName = createElement("h3", "", getApplicationPetName(application));

  const petMeta = createElement(
    "p",
    "application-pet-meta",
    getPetMeta(application),
  );

  const reference = createElement("div", "application-reference");

  reference.append(
    createElement("span", "", "Reference:"),
    createElement("strong", "", getApplicationReference(application)),
  );

  petInfo.append(petName, petMeta, reference);

  /* Status and details toggle */
  const actions = createElement("div", "application-card-actions");

  const status = createElement(
    "span",
    `application-status ${getStatusClass(application.status)}`,
    getStatusLabel(application.status),
  );

  const detailsId = `application-details-${index}`;

  const toggle = createElement("button", "application-details-toggle");

  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", detailsId);

  const toggleLabel = createElement("span", "", "View details");
  const toggleArrow = createElement("span", "", "⌄");

  toggle.append(toggleLabel, toggleArrow);

  actions.append(status, toggle);

  main.append(imageWrap, petInfo, actions);

  /* Footer */
  const footer = createElement("div", "application-card-footer");

  const date = createElement("span", "application-submitted-date");

  const dateLabel = createElement("strong", "", "Submitted: ");
  date.append(
    dateLabel,
    document.createTextNode(
      formatApplicationDate(getApplicationDate(application)),
    ),
  );

  footer.appendChild(date);

  /* Expandable details */
  const details = createElement("section", "application-details");
  details.id = detailsId;
  details.hidden = true;

  const detailsTitle = createElement("h4", "", "Application details");
  const detailGrid = createElement("dl", "application-detail-grid");

  const fields = [
    ["Applicant name", application.applicantName],
    ["Email address", application.email],
    ["Phone number", application.phone],
    ["Residential address", application.address],
    ["Home type", application.homeType],
    ["Home ownership", application.ownership],
    ["Household members", application.householdMembers],
    ["Children at home", application.childrenAtHome],
    ["Existing pets", application.existingPets],
    ["Rental permission", application.rentalPermission],
    ["Pet experience", application.petExperience],
    ["Daily availability", application.dailyAvailability],
    ["Reason for adoption", application.adoptionReason],
    ["Pet care plan", application.carePlan],
  ];

  fields.forEach(([label, value]) => {
    detailGrid.appendChild(
      createDetail(
        label,
        value,
        [
          "Residential address",
          "Reason for adoption",
          "Pet care plan",
        ].includes(label),
      ),
    );
  });

  const submittedAt = getApplicationDate(application);

  detailGrid.appendChild(
    createDetail("Submitted on", formatApplicationDate(submittedAt)),
  );

  detailGrid.appendChild(
    createDetail("Current status", getStatusLabel(application.status)),
  );

  details.append(detailsTitle, detailGrid);

  const note = createElement(
    "p",
    "application-detail-note",
    "For updates to your application status, contact the adoption team. Status changes are not automatically generated by this prototype.",
  );

  details.appendChild(note);

  /* Toggle details */
  toggle.addEventListener("click", () => {
    const willOpen = details.hidden;

    details.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
    toggleLabel.textContent = willOpen ? "Hide details" : "View details";
  });

  card.append(main, footer, details);

  return card;
}

/* =========================================
   MOBILE NAVIGATION
========================================= */

function initializeApplicationsNavigation() {
  const toggle = document.getElementById("applications-menu-toggle");
  const navigation = document.getElementById("applications-nav");

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

/* =========================================
   GENERAL HELPERS
========================================= */

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = String(value);
  }
}
