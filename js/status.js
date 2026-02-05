const DISCORD_ID = "257252196926750720"; 

const statusElement = document.getElementById("user-status");
const activityElement = document.getElementById("user-activity");

console.log("July-OS: Status element found:", statusElement);
console.log("July-OS: Activity element found:", activityElement);

const COLORS = {
    online: "var(--mint)",
    idle: "var(--orange)",
    dnd: "var(--coral)",
    offline: "var(--text-dim)"
};

const STATUS_TEXT = {
    online: "ONLINE",
    idle: "IDLE",
    dnd: "BUSY",
    offline: "OFFLINE"
};

connectToLanyard();

function connectToLanyard() {
    if (DISCORD_ID === "257252196926750720") {
        console.warn("July-OS: Discord ID is still set to placeholder. Please edit js/status.js");
    }

    const ws = new WebSocket("wss://api.lanyard.rest/socket");

    ws.onopen = () => {
        console.log("July-OS: Connected to Lanyard API");
        ws.send(JSON.stringify({
            op: 2,
            d: { subscribe_to_id: DISCORD_ID }
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("July-OS: Raw message received:", data);
        const { t, d } = data;

        if (t === "INIT_STATE" || t === "PRESENCE_UPDATE") {
            console.log("July-OS: Presence data:", d);
            updateStatus(d);
        }
    };

    ws.onclose = () => {
        console.log("July-OS: Lanyard connection closed. Retrying in 5s...");
        setTimeout(connectToLanyard, 5000);
    };
    
    ws.onerror = (error) => {
        console.error("July-OS: Lanyard WebSocket Error:", error);
    };
}

function updateStatus(data) {
    let status = data.discord_status || "offline";
    
    console.log("July-OS: Status update received ->", status);
    console.log("July-OS: Activities data ->", data.activities);

    if (statusElement) {
        statusElement.textContent = STATUS_TEXT[status] || "UNKNOWN";
        statusElement.style.color = COLORS[status] || COLORS.offline;
        
        if (status === "online" || status === "dnd") {
            statusElement.classList.add("blink");
        } else {
            statusElement.classList.remove("blink");
        }
    }

    if (activityElement) {
        console.log("July-OS: Updating activity element");
        updateActivity(data.activities);
    } else {
        console.warn("July-OS: Activity element not found! Make sure #user-activity exists in HTML");
    }
}

function updateActivity(activities) {
    console.log("July-OS: updateActivity called with:", activities);
    
    if (!activityElement) {
        console.error("July-OS: activityElement is null!");
        return;
    }

    if (!activities || activities.length === 0) {
        console.log("July-OS: No activities found, hiding display");
        activityElement.textContent = "";
        activityElement.style.display = "none";
        return;
    }

    console.log("July-OS: Processing", activities.length, "activities");

    const game = activities.find(activity => {
        console.log("July-OS: Checking activity type:", activity.type, "name:", activity.name);
        return activity.type === 0;
    });

    const customStatus = activities.find(activity => 
        activity.type === 4
    );

    const spotify = activities.find(activity => 
        activity.name === "Spotify" || activity.type === 2
    );

    console.log("July-OS: Found - Game:", game, "Spotify:", spotify, "Custom:", customStatus);

    let displayText = "";

    if (game) {
        displayText = `PLAYING: ${game.name.toUpperCase()}`;
        console.log("July-OS: Setting game display:", displayText);

        if (game.details) {
            displayText += ` - ${game.details.toUpperCase()}`;
        }
    } else if (spotify) {
        const songName = spotify.details || "Unknown Track";
        const artistName = spotify.state || "Unknown Artist";
        displayText = `♪ ${songName.toUpperCase()} - ${artistName.toUpperCase()}`;
        console.log("July-OS: Setting Spotify display:", displayText);
    } else if (customStatus && customStatus.state) {
        displayText = customStatus.state.toUpperCase();
        console.log("July-OS: Setting custom status display:", displayText);
    }

    if (displayText) {
        activityElement.textContent = displayText;
        activityElement.style.display = "block";
        console.log("July-OS: Activity display updated ->", displayText);
    } else {
        activityElement.textContent = "";
        activityElement.style.display = "none";
        console.log("July-OS: No displayable activity found");
    }
}
