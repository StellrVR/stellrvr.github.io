document.addEventListener('DOMContentLoaded', function () {
    const planets = document.querySelectorAll('.planet');
    const moons = document.querySelectorAll('.moon');
    const sun = document.querySelector('.sun');
    const tooltip = document.querySelector('.info-tooltip');

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
    
    function createStars() {
        const numStars = 200; // Number of stars
        const starsContainer = document.querySelector('.stars');

        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            star.style.top = `${Math.random() * 100}vh`;
            star.style.left = `${Math.random() * 100}vw`;
            star.style.animationDelay = `${Math.random() * 2}s`; // Randomize twinkle animation
            starsContainer.appendChild(star);
        }
    }

    createStars();

    function getRandomAngle() {
        return Math.floor(Math.random() * 360);
    }

    planets.forEach(planet => {
        const randomAngle = getRandomAngle();
        planet.style.transform = `translate(-50%, -50%) rotate(${randomAngle}deg) translateX(var(--orbit-radius)) rotate(${randomAngle}deg)`;
    });

    sun.addEventListener('mouseover', function () {
        const info = this.getAttribute('data-info');
        tooltip.textContent = info;
        tooltip.style.display = 'block';

        const sunRect = this.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        let tooltipLeft = sunRect.left + sunRect.width / 2 - tooltipWidth / 2;
        let tooltipTop = sunRect.top - tooltipHeight - 10;

        if (tooltipLeft < 10) {
            tooltipLeft = 10;
        } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
            tooltipLeft = window.innerWidth - tooltipWidth - 10;
        }

        if (tooltipTop < 10) {
            tooltipTop = sunRect.bottom + 10;
        }

        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.style.top = `${tooltipTop}px`;
    });

    sun.addEventListener('mouseout', function () {
        tooltip.style.display = 'none';
    });

    planets.forEach(planet => {
        planet.addEventListener('mouseover', function () {
            const info = this.getAttribute('data-info');
            tooltip.textContent = info;
            tooltip.style.display = 'block';

            const planetRect = this.getBoundingClientRect();
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;

            let tooltipLeft = planetRect.left + planetRect.width / 2 - tooltipWidth / 2;
            let tooltipTop = planetRect.top - tooltipHeight - 10;

            if (tooltipLeft < 10) {
                tooltipLeft = 10;
            } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
                tooltipLeft = window.innerWidth - tooltipWidth - 10;
            }

            if (tooltipTop < 10) {
                tooltipTop = planetRect.bottom + 10;
            }

            tooltip.style.left = `${tooltipLeft}px`;
            tooltip.style.top = `${tooltipTop}px`;
        });

        planet.addEventListener('mouseout', function () {
            tooltip.style.display = 'none';
        });
    });

    moons.forEach(moon => {
        moon.addEventListener('mouseover', function () {
            const info = this.getAttribute('data-info');
            tooltip.textContent = info;
            tooltip.style.display = 'block';

            const moonRect = this.getBoundingClientRect();
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;

            let tooltipLeft = moonRect.left + moonRect.width / 2 - tooltipWidth / 2;
            let tooltipTop = moonRect.top - tooltipHeight - 10;

            if (tooltipLeft < 10) {
                tooltipLeft = 10;
            } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
                tooltipLeft = window.innerWidth - tooltipWidth - 10;
            }

            if (tooltipTop < 10) {
                tooltipTop = moonRect.bottom + 10;
            }

            tooltip.style.left = `${tooltipLeft}px`;
            tooltip.style.top = `${tooltipTop}px`;
        });

        moon.addEventListener('mouseout', function () {
            tooltip.style.display = 'none';
        });
    });

    // Adjust tooltip width on window resize
    window.addEventListener('resize', function () {
        const sunRect = sun.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        if (sun.matches(':hover')) {
            let tooltipLeft = sunRect.left + sunRect.width / 2 - tooltipWidth / 2;
            let tooltipTop = sunRect.top - tooltipHeight - 10;

            if (tooltipLeft < 10) {
                tooltipLeft = 10;
            } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
                tooltipLeft = window.innerWidth - tooltipWidth - 10;
            }

            if (tooltipTop < 10) {
                tooltipTop = sunRect.bottom + 10;
            }

            tooltip.style.left = `${tooltipLeft}px`;
            tooltip.style.top = `${tooltipTop}px`;
        }

        planets.forEach(planet => {
            if (planet.matches(':hover')) {
                const planetRect = planet.getBoundingClientRect();
                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;

                let tooltipLeft = planetRect.left + planetRect.width / 2 - tooltipWidth / 2;
                let tooltipTop = planetRect.top - tooltipHeight - 10;

                if (tooltipLeft < 10) {
                    tooltipLeft = 10;
                } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
                    tooltipLeft = window.innerWidth - tooltipWidth - 10;
                }

                if (tooltipTop < 10) {
                    tooltipTop = planetRect.bottom + 10;
                }

                tooltip.style.left = `${tooltipLeft}px`;
                tooltip.style.top = `${tooltipTop}px`;
            }
        });

        moons.forEach(moon => {
            if (moon.matches(':hover')) {
                const moonRect = moon.getBoundingClientRect();
                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;

                let tooltipLeft = moonRect.left + moonRect.width / 2 - tooltipWidth / 2;
                let tooltipTop = moonRect.top - tooltipHeight - 10;

                if (tooltipLeft < 10) {
                    tooltipLeft = 10;
                } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
                    tooltipLeft = window.innerWidth - tooltipWidth - 10;
                }

                if (tooltipTop < 10) {
                    tooltipTop = moonRect.bottom + 10;
                }

                tooltip.style.left = `${tooltipLeft}px`;
                tooltip.style.top = `${tooltipTop}px`;
            }
        });
    });
});