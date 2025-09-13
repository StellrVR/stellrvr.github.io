function openTab(event, tabName) {
    console.log("Attempting to open tab:", tabName); // For debugging

    const tabContents = document.querySelectorAll(".tabs-wrapper .tab-content");
    const tabLinks = document.querySelectorAll(".tabs-wrapper .tab-navigation .tab-link");

    // First, hide all tab content and deactivate all tab links
    tabContents.forEach(tc => {
        tc.classList.remove('active-content'); // This will make opacity go to 0 via CSS
        tc.style.display = 'none';         // Explicitly ensure it's hidden
        console.log("Hiding content:", tc.id); // For debugging
    });

    tabLinks.forEach(tl => {
        tl.classList.remove('active');
    });

    // Now, find and show the selected tab's content
    const selectedTabContent = document.getElementById(tabName);
    if (selectedTabContent) {
        selectedTabContent.style.display = 'block'; // Make it part of the layout
        
        // A tiny delay ensures 'display: block' is processed before opacity transition starts
        setTimeout(() => {
            selectedTabContent.classList.add('active-content'); // This class sets opacity: 1 in CSS
            console.log("Showing content:", selectedTabContent.id); // For debugging
        }, 10); // 10 milliseconds delay
    } else {
        console.error("Could not find tab content for ID:", tabName); // For debugging
    }

    // Activate the clicked tab link
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("Tab script loaded. Initializing tabs."); // For debugging

    const allTabContents = document.querySelectorAll(".tabs-wrapper .tab-content");
    const defaultActiveTabLink = document.querySelector('.tabs-wrapper .tab-navigation .tab-link.active');

    if (defaultActiveTabLink) {
        const onclickAttribute = defaultActiveTabLink.getAttribute('onclick');
        if (onclickAttribute) {
            const match = onclickAttribute.match(/'([^']+)'/); // Extracts 'tabName' from "openTab(event, 'tabName')"
            if (match && match[1]) {
                const defaultTabName = match[1];
                
                // Ensure all other tabs are hidden first
                allTabContents.forEach(tc => {
                    if (tc.id !== defaultTabName) {
                        tc.style.display = 'none';
                        tc.classList.remove('active-content');
                    }
                });

                // Now display and activate the default one
                const defaultSelectedTabContent = document.getElementById(defaultTabName);
                if (defaultSelectedTabContent) {
                    defaultSelectedTabContent.style.display = 'block';
                    defaultSelectedTabContent.classList.add('active-content'); // CSS handles opacity: 1
                    console.log("Default tab set to:", defaultTabName); // For debugging
                } else {
                     console.error("Default active tab content not found:", defaultTabName); // For debugging
                }
            } else {
                 console.error("Could not parse tab name from default active link's onclick attribute."); // For debugging
            }
        } else {
            console.error("Default active tab link has no onclick attribute to parse."); // For debugging
        }
    } else {
        console.log("No tab link marked as 'active' in HTML. Clicking the first tab if available."); // For debugging
        const firstTabLink = document.querySelector('.tabs-wrapper .tab-navigation .tab-link');
        if (firstTabLink) {
            firstTabLink.click(); // Simulate a click to properly initialize via openTab
        } else {
            console.error("No tab links found on the page."); // For debugging
        }
    }
});