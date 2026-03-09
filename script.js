const yearNode = document.querySelector("#year");
if (yearNode) yearNode.textContent = String(new Date().getFullYear());

const revealNodes = document.querySelectorAll(".reveal");

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

revealNodes.forEach((node) => observer.observe(node));
