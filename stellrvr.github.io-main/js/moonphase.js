// Created by July.lol

const moonPhases = [
    { name: "New Moon", symbol: "🌑" },
    { name: "Waxing Crescent", symbol: "🌒" },
    { name: "First Quarter", symbol: "🌓" },
    { name: "Waxing Gibbous", symbol: "🌔" },
    { name: "Full Moon", symbol: "🌕" },
    { name: "Waning Gibbous", symbol: "🌖" },
    { name: "Last Quarter", symbol: "🌗" },
    { name: "Waning Crescent", symbol: "🌘" }
  ];
  
  
  function calculateMoonPhase(date) {
    const lunarCycleDays = 29.53; 
    const startDate = new Date("2000-01-06"); 
    const diffInDays = (date - startDate) / (1000 * 60 * 60 * 24);
    const currentLunarDay = (diffInDays % lunarCycleDays).toFixed(1);
  
    if (currentLunarDay < 1) return moonPhases[0];
    if (currentLunarDay < 7.4) return moonPhases[1];
    if (currentLunarDay < 8.4) return moonPhases[2];
    if (currentLunarDay < 14.8) return moonPhases[3];
    if (currentLunarDay < 15.8) return moonPhases[4];
    if (currentLunarDay < 22.1) return moonPhases[5];
    if (currentLunarDay < 23.1) return moonPhases[6];
    return moonPhases[7];
  }
  
  function updateLunarPhase() {
    const currentDate = new Date();
    const phase = calculateMoonPhase(currentDate);
  
    document.getElementById('lunar-phase').textContent = phase.symbol;
    document.getElementById('moon-description').textContent = `The current moon phase is ${phase.name}.`;
  }
  
  updateLunarPhase();
  