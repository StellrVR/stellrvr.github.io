// Shared functionality across all pages
document.addEventListener('DOMContentLoaded', function() {
    // Set current date in footer
    const currentDateElements = document.querySelectorAll('#current-date');
    if (currentDateElements.length > 0) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString(undefined, options);
        currentDateElements.forEach(el => {
            el.textContent = today;
        });
    }

    // Static audio effect
    const staticAudio = document.getElementById('static-audio');
    
    function playStaticEffect() {
        if (staticAudio) {
            staticAudio.currentTime = 0;
            staticAudio.play();
        }
    }


    // Video archive page functionality
    if (document.getElementById('entry-index')) {
        const entries = [
            { id: 'Wmhfn3mgWUI', title: 'INTRODUCTION', desc: 'The introduction is Jay\'s video in which he introduces, with text, the events surrounding the tapes which he is looking over and uploading. He introduces Alex Kralie and mentions that he has never seen Alex since taking custody of the tapes.', date: 'June 20, 2009' },
            { id: 'Bn59FJ4HrmU', title: 'ENTRY #1', desc: 'The audio from this entry has been removed for unknown reasons. It shows Alex sneaking around his house at night, looking out and spotting a figure now known as The Operator.', date: 'June 20, 2009' },
            { id: 'JVECb0bYq8w', title: 'ENTRY #2', desc: 'Alex is driving out to the street, trying to find the lamp post where he saw a figure previously—almost certainly The Operator.', date: 'June 21, 2009' },
            { id: 'b52bwPam7O8', title: 'ENTRY #3', desc: 'A medley of clips, this entry is about Alex filming himself and acting strangely.', date: 'June 23, 2009' }
        ];

        const entryList = document.getElementById('entry-index');
        const videoPlayer = document.getElementById('archive-video-player');
        const videoTitle = document.getElementById('current-video-title');
        const videoDesc = document.getElementById('current-video-desc');
        const videoDate = document.getElementById('current-video-date');
        const searchInput = document.getElementById('search-entries');
        const randomButton = document.getElementById('random-entry');

        // Populate entry list
        function populateEntries(filter = '') {
            entryList.innerHTML = '';
            const filteredEntries = entries.filter(entry => 
                entry.title.toLowerCase().includes(filter.toLowerCase()) || 
                entry.desc.toLowerCase().includes(filter.toLowerCase())
            );

            filteredEntries.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = entry.title;
                li.addEventListener('click', () => {
                    playStaticEffect();
                    setTimeout(() => {
                        loadVideo(entry);
                    }, 500);
                });
                entryList.appendChild(li);
            });
        }

        // Load a video
        function loadVideo(entry) {
            videoPlayer.src = `https://www.youtube.com/embed/${entry.id}`;
            videoTitle.textContent = entry.title;
            videoDesc.textContent = entry.desc;
            videoDate.textContent = `Uploaded: ${entry.date}`;
        }

        // Random video
        randomButton.addEventListener('click', () => {
            playStaticEffect();
            setTimeout(() => {
                const randomEntry = entries[Math.floor(Math.random() * entries.length)];
                loadVideo(randomEntry);
            }, 500);
        });

        // Search functionality
        searchInput.addEventListener('input', () => {
            populateEntries(searchInput.value);
        });

        // Initialize
        populateEntries();
        if (entries.length > 0) {
            loadVideo(entries[0]);
        }
    }
});