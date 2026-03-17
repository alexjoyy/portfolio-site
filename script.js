const yearNode = document.querySelector("#year");
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}
const progressBar = document.querySelector(".scroll-progress span");

const revealNodes = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const customCursorEnabled = false;
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

if (customCursorEnabled && hasFinePointer && !prefersReducedMotion) {
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

const healthCards = document.querySelectorAll(".health-card");

if (healthCards.length > 0) {
  const withTimeout = async (promiseFactory, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await promiseFactory(controller.signal);
    } finally {
      window.clearTimeout(timer);
    }
  };

  const parseStatus = (payload) => {
    if (!payload) {
      return null;
    }
    if (payload.includes('"status":"UP"') || payload.includes('"status": "UP"')) {
      return "up";
    }
    if (payload.includes('"status":"DOWN"') || payload.includes('"status": "DOWN"')) {
      return "down";
    }
    return null;
  };

  const checkServiceHealth = async (url) => {
    // Primary strategy for static hosting: connectivity probe using no-cors.
    // If the request resolves, the service is reachable even if response body is opaque.
    try {
      await withTimeout((signal) =>
        fetch(url, {
          method: "GET",
          mode: "no-cors",
          cache: "no-store",
          signal,
        })
      );
      return "up";
    } catch {
      // Continue to proxy-based content checks before final DOWN.
    }

    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`,
    ];

    for (const target of proxyUrls) {
      try {
        const response = await withTimeout((signal) =>
          fetch(target, { cache: "no-store", signal })
        );
        if (!response.ok) {
          continue;
        }
        const text = await response.text();
        const state = parseStatus(text);
        if (state) {
          return state;
        }
        return "up";
      } catch {
        continue;
      }
    }
    return "down";
  };

  const updateHealthPill = (card, state) => {
    const pill = card.querySelector(".health-pill");
    if (!pill) {
      return;
    }
    const textByState = {
      up: "UP",
      down: "DOWN",
      unknown: "Unknown",
      checking: "Checking...",
    };
    pill.dataset.state = state;
    pill.textContent = textByState[state] ?? "Unknown";
  };

  const refreshHealth = async () => {
    const checks = Array.from(healthCards).map(async (card) => {
      updateHealthPill(card, "checking");
      const url = card.dataset.healthUrl;
      if (!url) {
        updateHealthPill(card, "unknown");
        return;
      }
      const state = await checkServiceHealth(url);
      updateHealthPill(card, state);
    });
    await Promise.all(checks);
  };

  refreshHealth();
  window.setInterval(refreshHealth, 60000);
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

if (progressBar) {
  const updateScrollProgress = () => {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const value = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, value))}%`;
  };

  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
}
