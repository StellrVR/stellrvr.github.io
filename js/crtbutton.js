document.addEventListener('DOMContentLoaded', function() {
    const crtToggle = document.getElementById('crt-toggle');
    const body = document.body;
    
    const crtDisabled = localStorage.getItem('crtDisabled') === 'true';
    
    if (crtDisabled) {
        body.classList.remove('crt');
        crtToggle.textContent = 'CRT: OFF';
    } else {
        body.classList.add('crt');
        crtToggle.textContent = 'CRT: ON';
    }
    
    crtToggle.addEventListener('click', function() {
        body.classList.toggle('crt');
        const isCrtEnabled = body.classList.contains('crt');
        
        crtToggle.textContent = isCrtEnabled ? 'CRT: ON' : 'CRT: OFF';
        
        localStorage.setItem('crtDisabled', !isCrtEnabled);
    });
});