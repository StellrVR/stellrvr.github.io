function openTab(event, tabName) {
    console.log("Attempting to open tab:", tabName);

    const tabContents = document.querySelectorAll(".tabs-wrapper .tab-content");
    const tabLinks = document.querySelectorAll(".tabs-wrapper .tab-navigation .tab-link");

    tabContents.forEach(tc => {
        tc.classList.remove('active-content');
        tc.style.display = 'none';
        console.log("Hiding content:", tc.id);
    });

    tabLinks.forEach(tl => {
        tl.classList.remove('active');
    });

    const selectedTabContent = document.getElementById(tabName);
    if (selectedTabContent) {
        selectedTabContent.style.display = 'block';
        
        setTimeout(() => {
            selectedTabContent.classList.add('active-content');
            console.log("Showing content:", selectedTabContent.id);
        }, 10);
    } else {
        console.error("Could not find tab content for ID:", tabName);
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("Tab script loaded. Initializing tabs.");

    const allTabContents = document.querySelectorAll(".tabs-wrapper .tab-content");
    const defaultActiveTabLink = document.querySelector('.tabs-wrapper .tab-navigation .tab-link.active');

    if (defaultActiveTabLink) {
        const onclickAttribute = defaultActiveTabLink.getAttribute('onclick');
        if (onclickAttribute) {
            const match = onclickAttribute.match(/'([^']+)'/);
            if (match && match[1]) {
                const defaultTabName = match[1];
                
                allTabContents.forEach(tc => {
                    if (tc.id !== defaultTabName) {
                        tc.style.display = 'none';
                        tc.classList.remove('active-content');
                    }
                });

                const defaultSelectedTabContent = document.getElementById(defaultTabName);
                if (defaultSelectedTabContent) {
                    defaultSelectedTabContent.style.display = 'block';
                    defaultSelectedTabContent.classList.add('active-content');
                    console.log("Default tab set to:", defaultTabName);
                } else {
                     console.error("Default active tab content not found:", defaultTabName);
                }
            } else {
                 console.error("Could not parse tab name from default active link's onclick attribute.");
            }
        } else {
            console.error("Default active tab link has no onclick attribute to parse.");
        }
    } else {
        console.log("No tab link marked as 'active' in HTML. Clicking the first tab if available.");
        const firstTabLink = document.querySelector('.tabs-wrapper .tab-navigation .tab-link');
        if (firstTabLink) {
            firstTabLink.click();
        } else {
            console.error("No tab links found on the page.");
        }
    }
});