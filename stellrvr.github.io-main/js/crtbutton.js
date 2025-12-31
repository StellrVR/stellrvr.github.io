document.addEventListener('DOMContentLoaded', function() {
    const crtToggle = document.getElementById('crt-toggle');
    const body = document.body;
    
    // Check if CRT was previously disabled
    const crtDisabled = localStorage.getItem('crtDisabled') === 'true';
    
    // Set initial state
    if (crtDisabled) {
        body.classList.remove('crt');
        crtToggle.textContent = 'CRT: OFF';
    } else {
        body.classList.add('crt');
        crtToggle.textContent = 'CRT: ON';
    }
    
    // Toggle CRT effect
    crtToggle.addEventListener('click', function() {
        body.classList.toggle('crt');
        const isCrtEnabled = body.classList.contains('crt');
        
        // Update button text
        crtToggle.textContent = isCrtEnabled ? 'CRT: ON' : 'CRT: OFF';
        
        // Save preference
        localStorage.setItem('crtDisabled', !isCrtEnabled);
    });
});