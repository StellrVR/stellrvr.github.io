const DISCORD_ID = "257252196926750720"; 

const statusElement = document.getElementById("user-status");

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
    
    console.log("July-OS: Status update received ->", status);

    if (statusElement) {
        statusElement.textContent = STATUS_TEXT[status] || "UNKNOWN";
        
        statusElement.style.color = COLORS[status] || COLORS.offline;
        
        if (status === "online" || status === "dnd") {
            statusElement.classList.add("blink");
        } else {
            statusElement.classList.remove("blink");
        }
    }
}