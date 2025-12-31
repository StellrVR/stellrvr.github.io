document.addEventListener("DOMContentLoaded", function() {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  document.body.appendChild(tooltip);

  document.querySelectorAll("[data-tooltip]").forEach(elem => {
    elem.addEventListener("mouseenter", function() {
      tooltip.textContent = this.dataset.tooltip;
      const rect = this.getBoundingClientRect();
      tooltip.style.left = rect.left + window.scrollX + "px";
      tooltip.style.top = rect.bottom + window.scrollY + "px";
      tooltip.style.display = "block";
    });

    elem.addEventListener("mouseleave", function() {
      tooltip.style.display = "none";
    });
  });
}); 