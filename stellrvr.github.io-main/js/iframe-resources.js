// /js/iframe-resources.js
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('resource-search');
    const tagFilterButtons = document.querySelectorAll('.tag-filters .tag-filter');
    // Important: Update this selector if your item class name is different
    const resourceItems = document.querySelectorAll('.resource-button-grid .resource-button-item'); 
    let currentActiveTag = 'all'; 

    function performFiltering() {
        const searchTerm = searchInput.value.toLowerCase().trim();

        resourceItems.forEach(item => {
            const title = (item.dataset.title || '').toLowerCase();
            // You might want to search in description too if available
            // const description = (item.querySelector('.resource-item-desc')?.textContent || '').toLowerCase();
            const itemTextContent = item.textContent.toLowerCase(); // Fallback search in all text
            const tags = (item.dataset.tags || '').toLowerCase().split(',');

            const matchesSearchTerm = title.includes(searchTerm) || itemTextContent.includes(searchTerm);
            const matchesTag = currentActiveTag === 'all' || tags.includes(currentActiveTag);

            if (matchesSearchTerm && matchesTag) {
                item.classList.remove('hidden');
                item.style.display = ''; // Reset to default display (CSS grid will handle it)
            } else {
                item.classList.add('hidden');
                item.style.display = 'none';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', performFiltering);
    }

    tagFilterButtons.forEach(button => {
        button.addEventListener('click', function () {
            tagFilterButtons.forEach(btn => btn.classList.remove('active-tag'));
            this.classList.add('active-tag');
            currentActiveTag = this.dataset.tag;
            performFiltering();
        });
    });

    const initialActiveButton = document.querySelector('.tag-filter[data-tag="all"]');
    if (initialActiveButton) {
        initialActiveButton.classList.add('active-tag');
    }
    performFiltering(); 
});