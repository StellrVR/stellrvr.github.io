const DISCORD_ID = "257252196926750720"; 

let statusElement;
let activityElement;

document.addEventListener('DOMContentLoaded', function() {
    statusElement = document.getElementById("user-status");
    activityElement = document.getElementById("user-activity");
    
    if (!statusElement) {
        console.error("July-OS: #user-status element not found!");
    }
    if (!activityElement) {
        console.error("July-OS: #user-activity element not found! Add it to your HTML.");
    }
    
    connectToLanyard();
});

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

function connectToLanyard() {
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
        const { t, d } = data;

        if (t === "INIT_STATE" || t === "PRESENCE_UPDATE") {
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
    
    console.log("July-OS: Status update ->", status);

    if (statusElement) {
        statusElement.textContent = STATUS_TEXT[status] || "UNKNOWN";
        statusElement.style.color = COLORS[status] || COLORS.offline;
        
        if (status === "online" || status === "dnd") {
            statusElement.classList.add("blink");
        } else {
            statusElement.classList.remove("blink");
        }
    }

    updateActivity(data.activities);
}

function updateActivity(activities) {
    if (!activityElement) {
        return;
    }

    if (!activities || activities.length === 0) {
        activityElement.textContent = "";
        activityElement.style.display = "none";
        return;
    }

    const game = activities.find(activity => activity.type === 0);

    const spotify = activities.find(activity => 
        activity.type === 2 || activity.name === "Spotify"
    );

    const customStatus = activities.find(activity => activity.type === 4);

    let displayText = "";

    if (game) {
        displayText = `PLAYING: ${game.name.toUpperCase()}`;
        if (game.details) {
            displayText += ` - ${game.details.toUpperCase()}`;
        }
        console.log("July-OS: Game activity ->", displayText);
    } else if (spotify) {
        const songName = spotify.details || "Unknown Track";
        const artistName = spotify.state || "Unknown Artist";
        displayText = `♪ ${songName.toUpperCase()} - ${artistName.toUpperCase()}`;
        console.log("July-OS: Spotify activity ->", displayText);
    } else if (customStatus && customStatus.state) {
        displayText = customStatus.state.toUpperCase();
        console.log("July-OS: Custom status ->", displayText);
    }

    if (displayText) {
        activityElement.textContent = displayText;
        activityElement.style.display = "block";
    } else {
        activityElement.textContent = "";
        activityElement.style.display = "none";
    }
}
