document.addEventListener('DOMContentLoaded', function () {
    const audio = document.getElementById('background-music');
    
    audio.volume = 0.1;

    function playAudio() {
        audio.play().catch(() => {
            console.log("Autoplay was blocked. Please interact with the page to play music.");
        });
    }

    document.addEventListener('click', () => {
        playAudio();
    });

    playAudio();

});