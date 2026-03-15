const yearNode = document.querySelector("#year");
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const revealNodes = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const atmosphere = document.querySelector(".atmosphere");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealNodes.forEach((node, index) => {
  const explicitDelay = Number(node.dataset.delay);
  const staggerDelay = Number.isFinite(explicitDelay) ? explicitDelay : index * 45;
  node.style.setProperty("--reveal-delay", `${Math.min(staggerDelay, 360)}ms`);
  observer.observe(node);
});

const tiltCards = document.querySelectorAll(".tilt-card");

for (const card of tiltCards) {
  if (prefersReducedMotion) {
    continue;
  }

  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;

    const rx = (0.5 - py) * 4;
    const ry = (px - 0.5) * 5;

    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  });
}

if (hasFinePointer && !prefersReducedMotion) {
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");
  const interactiveSelector = "a, button, .magnetic, .tilt-card";
  let ringX = window.innerWidth / 2;
  let ringY = window.innerHeight / 2;
  let dotX = ringX;
  let dotY = ringY;

  if (cursorDot && cursorRing) {
    const animateCursor = () => {
      ringX += (dotX - ringX) * 0.16;
      ringY += (dotY - ringY) * 0.16;

      cursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(animateCursor);
    };

    requestAnimationFrame(animateCursor);

    window.addEventListener("mousemove", (event) => {
      dotX = event.clientX;
      dotY = event.clientY;
      cursorDot.style.opacity = "1";
      cursorRing.style.opacity = "1";
    });

    document.querySelectorAll(interactiveSelector).forEach((node) => {
      node.addEventListener("mouseenter", () => cursorRing.classList.add("is-active"));
      node.addEventListener("mouseleave", () => cursorRing.classList.remove("is-active"));
    });
  }

  if (atmosphere) {
    window.addEventListener("mousemove", (event) => {
      const px = event.clientX / window.innerWidth - 0.5;
      const py = event.clientY / window.innerHeight - 0.5;
      atmosphere.style.transform = `translate3d(${px * -16}px, ${py * -16}px, 0)`;
    });
  }
}

const magneticNodes = document.querySelectorAll(".magnetic");

for (const node of magneticNodes) {
  if (prefersReducedMotion || !hasFinePointer) {
    continue;
  }

  node.addEventListener("mousemove", (event) => {
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    node.style.transform = `translate(${x * 0.14}px, ${y * 0.14}px)`;
  });

  node.addEventListener("mouseleave", () => {
    node.style.transform = "translate(0, 0)";
  });
}

const modal = document.querySelector("#case-modal");
const modalKicker = document.querySelector("#case-modal-kicker");
const modalTitle = document.querySelector("#case-modal-title");
const modalSummary = document.querySelector("#case-modal-summary");
const modalPoints = document.querySelector("#case-modal-points");
const detailButtons = document.querySelectorAll(".detail-btn");

const caseStudyData = {
  order: {
    kicker: "System Design Snapshot",
    title: "Order Processing Platform",
    summary:
      "A three-service architecture that simulates production-grade order flow with explicit service boundaries and recoverable failures.",
    points: [
      "Built JWT propagation across internal service calls for secure downstream requests.",
      "Implemented deterministic order state transitions (CREATED -> RESERVED -> PAID / FAILED).",
      "Added consistent API response envelopes to simplify monitoring and client integration.",
    ],
  },
  recon: {
    kicker: "System Design Snapshot",
    title: "Payments Reconciliation Service",
    summary:
      "A reconciliation engine designed for finance operations where daily mismatch visibility matters more than optimistic assumptions.",
    points: [
      "Compares gateway transactions and internal ledger entries with mismatch classification.",
      "Supports on-demand and scheduled runs, with run-level summary metadata.",
      "Generates unmatched reports for quick operational follow-up.",
    ],
  },
  ai: {
    kicker: "System Design Snapshot",
    title: "AI Support Assistant API",
    summary:
      "A practical AI workflow that drafts replies from retrieval context while enforcing privacy and reliability guardrails.",
    points: [
      "Retrieves domain knowledge snippets before generation for grounded outputs.",
      "Applies PII masking and confidence scoring to control unsafe response patterns.",
      "Falls back gracefully so support teams retain continuity during LLM instability.",
    ],
  },
};

if (modal && modalKicker && modalTitle && modalSummary && modalPoints) {
  const fillModal = (data) => {
    modalKicker.textContent = data.kicker;
    modalTitle.textContent = data.title;
    modalSummary.textContent = data.summary;
    modalPoints.innerHTML = "";
    data.points.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      modalPoints.appendChild(li);
    });
  };

  detailButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.project;
      if (!key || !caseStudyData[key]) {
        return;
      }
      fillModal(caseStudyData[key]);
      modal.showModal();
    });
  });

  modal.addEventListener("click", (event) => {
    const rect = modal.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) {
      modal.close();
    }
  });
}

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".frame-nav a");

if (sections.length > 0 && navLinks.length > 0) {
  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.style.color = isActive ? "var(--text)" : "var(--muted)";
    });
  };

  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) {
        setActiveLink(visible.target.id);
      }
    },
    { threshold: [0.28, 0.5, 0.75] }
  );

  sections.forEach((section) => navObserver.observe(section));
}
