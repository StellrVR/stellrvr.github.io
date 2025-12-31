document.addEventListener("DOMContentLoaded", function () {
    const tabToggle = document.querySelector('.tab-toggle');
    const tabSet1 = document.getElementById('tab-set-1');
    const tabSet2 = document.getElementById('tab-set-2');
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Tab switching logic
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Deactivate all tabs and hide content
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.style.display = 'none';
            });

            // Activate the clicked tab
            tab.classList.add('active');
            const activeTab = document.querySelector(`#${tab.getAttribute('data-tab')}`);
            activeTab.classList.remove('hidden');
            activeTab.style.display = 'block';
        });
    });

    // Toggle between tab sets
    tabToggle.addEventListener('click', function () {
        if (tabSet1.classList.contains('hidden')) {
            tabSet1.classList.remove('hidden');
            tabSet2.classList.add('hidden');
        } else {
            tabSet1.classList.add('hidden');
            tabSet2.classList.remove('hidden');
        }
    });

    // Initially activate the first tab of the first set
    tabs[0].classList.add('active');
    tabContents[0].style.display = 'block';
});
document.getElementById('toggle-tab-set').addEventListener('click', () => {
    const tabSet1 = document.querySelector('.tab-container');
    const tabSet2 = document.getElementById('tab-set-2');

    if (tabSet2.hidden) {
        tabSet1.style.transform = 'translateX(-100%)';
        tabSet2.style.transform = 'translateX(0)';
        tabSet2.hidden = false;
    } else {
        tabSet1.style.transform = 'translateX(0)';
        tabSet2.style.transform = 'translateX(100%)';
        setTimeout(() => {
            tabSet2.hidden = true;
        }, 500); // Matches CSS transition duration
    }
});

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