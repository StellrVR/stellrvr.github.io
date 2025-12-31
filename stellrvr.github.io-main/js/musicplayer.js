/*
  JULY'S MUSIC PLAYER
  -----------------------------------------------------------------------
  HOW TO USE:
  1. Add your music files to a folder (e.g., "music/")
  2. Edit the 'songs' list below with your own titles, artists, and file paths.
  3. Adjust 'defaultVolume' if you want it louder/quieter by default.
  -----------------------------------------------------------------------
*/

// --- CONFIGURATION START ---

const defaultVolume = 0.2; // 0.0 to 1.0 (0.2 = 20%)

const songs = [
    { 
        title: "Blossom (8-Bit Remix)", 
        artist: "Porter Robinson", 
        file: "music/blossom.mp3" 
    },
    { 
        title: "Cheerleader (8-Bit Remix)", 
        artist: "Porter Robinson", 
        file: "music/cheerleader.mp3" 
    },
    { 
        title: "Funknitium-99", 
        artist: "Fearofdark", 
        file: "music/Funknitium-99.mp3" 
    },
    { 
        title: "Perfect Pinterest Garden (8-Bit Remix)", 
        artist: "Porter Robinson", 
        file: "music/perfectpinterestgarden.mp3" 
    },
    { 
        title: "Unfold (8-Bit Remix)", 
        artist: "Porter Robinson", 
        file: "music/Unfold.mp3" 
    }
];

// --- CONFIGURATION END ---
// Don't mess with stuff below unless you need to!

// Check is user is on mobile
const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

// Only initialize music player on desktop devices
if (!isMobile) {
  
  // Player state variables
  let isPlaying = false;
  let isShuffleOn = false;
  let isDragging = false; // Prevents progress bar from jumping around while dragging
  let isCollapsed = false;

  // 'playQueue' holds the actual order of the songs and changes when shuffle is toggled
  let playQueue = [...songs]; 
  let currentSongIndex = Math.floor(Math.random() * songs.length);
  
  // Audio setup
  const audio = new Audio();
  audio.volume = defaultVolume;
  
  // DOM stuff
  const songTitle = document.getElementById("song-title");
  const songArtist = document.getElementById("song-artist");
  const songScroller = document.getElementById("song-info-scroller");
  const songMask = document.querySelector(".song-info-mask");

  const playPauseButton = document.getElementById("play-pause");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const volumeSlider = document.getElementById("volume");
  const volumeLabel = document.getElementById("volume-label");
  const progressBar = document.getElementById("progress");
  const toggleButton = document.getElementById("toggle-button");
  const musicPlayerContainer = document.getElementById("music-player-container");
  const shuffleButton = document.getElementById("shuffle");

  // Initial state
  if (musicPlayerContainer) {
      progressBar.max = 100;
      progressBar.value = 0;
      volumeSlider.value = audio.volume;
      volumeLabel.textContent = Math.round(audio.volume * 100);
      musicPlayerContainer.style.display = "flex";

      // Preload first song
      loadSong(currentSongIndex);

      // Make sure everything displays correctly after page load
      window.addEventListener("load", () => {
        updateSongInfo();
      });
  }

  // --- MAIN FUNCTIONS ---

  // Load song into audio player
  function loadSong(index) {
    // Handle wrapping at playlist boundaries
    if (index < 0) index = playQueue.length - 1;
    if (index >= playQueue.length) index = 0;
    
    currentSongIndex = index;
    audio.src = playQueue[currentSongIndex].file;
    updateSongInfo();
  }

  // Start playing current song
  function playSong() {
    const playPromise = audio.play();
    
    // Browsers nowadays require the user to interact before playing any audio
    // This catches errors if the page hasn't been clicked on yet
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            playPauseButton.innerHTML = "<span>||</span>"; // pause icon
        }).catch(error => {
            console.log("Playback prevented:", error);
            isPlaying = false;
            playPauseButton.innerHTML = "<span>▶</span>"; // play icon
        });
    }
  }

  // Pause playback
  function pauseSong() {
    audio.pause();
    isPlaying = false;
    playPauseButton.innerHTML = "<span>▶</span>";
  }

  // Update the song title/artist with scrolling animation (if too long for display)
  function updateSongInfo() {
    if (!songScroller) return;

    // Reset animation
    songScroller.classList.remove("scrolling");
    songScroller.style.transform = "translateX(0)";

    // Update Text
    songTitle.textContent = playQueue[currentSongIndex].title;
    songArtist.textContent = playQueue[currentSongIndex].artist;

    // Figure out if we need to scroll the text at all
    setTimeout(() => {
        const textWidth = songScroller.scrollWidth;
        const containerWidth = songMask.clientWidth;

        // Only scroll if text is wider than container
        if (textWidth > containerWidth) {
            const distanceToScroll = textWidth - containerWidth + 10; // +10 extra padding
            const speed = 30; // pixels per second
            const scrollTime = distanceToScroll / speed;
            const totalDuration = scrollTime + 4; // pause in animation at start/end

            songScroller.style.setProperty('--scroll-distance', `-${distanceToScroll}px`);
            songScroller.style.setProperty('--scroll-duration', `${totalDuration}s`);
            songScroller.classList.add("scrolling");
        }
    }, 50); // delay to ensure DOM is updated
  }

  // --- EVENT LISTENERS ---

  // Play/pause button
  if (playPauseButton) {
      playPauseButton.addEventListener("click", () => {
        if (isPlaying) {
          pauseSong();
        } else {
          playSong();
        }
      });
  }

  // Previous song button
  if (prevButton) {
      prevButton.addEventListener("click", () => {
        loadSong(currentSongIndex - 1);
        if (isPlaying) playSong();
      });
  }

  // Next song button
  if (nextButton) {
      nextButton.addEventListener("click", () => {
        loadSong(currentSongIndex + 1);
        if (isPlaying) playSong();
      });
  }

  // Shuffle button
  if (shuffleButton) {
      shuffleButton.addEventListener("click", () => {
        isShuffleOn = !isShuffleOn;
        
        // Get the song currently playing
        const currentSongObj = playQueue[currentSongIndex];

        if (isShuffleOn) {
          shuffleButton.classList.add("active");
          
          // Build shuffled queue with current song at front
          let remainingSongs = songs.filter(s => s !== currentSongObj);
          shuffleArray(remainingSongs);
          
          playQueue = [currentSongObj, ...remainingSongs];
          currentSongIndex = 0;
          
        } else {
          shuffleButton.classList.remove("active");
          
          playQueue = [...songs];
          // Find where our current song is in the original list
          currentSongIndex = songs.findIndex(s => s.title === currentSongObj.title);
        }
      });
  }

  // Volume slider
  if (volumeSlider) {
      volumeSlider.addEventListener("input", () => {
        audio.volume = volumeSlider.value;
        volumeLabel.textContent = Math.round(volumeSlider.value * 100);
      });
  }

  // Progress bar interaction
  if (progressBar) {
      // Tracks when user starts dragging
      progressBar.addEventListener("mousedown", () => {
        isDragging = true;
      });

      // Handle seek when user releases or clicks
      progressBar.addEventListener("change", () => {
        const seekTime = (progressBar.value / 100) * audio.duration;
        if (isFinite(seekTime)) {
            audio.currentTime = seekTime;
        }
        isDragging = false;
      });
  }

  // Update progress bar as song plays
  audio.addEventListener("timeupdate", () => {
    if (!isDragging && audio.duration && !isNaN(audio.duration) && progressBar) {
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      progressBar.value = progressPercent;
    }
  });

  // Auto-advance to next song when current one ends
  audio.addEventListener("ended", () => {
    loadSong(currentSongIndex + 1);
    playSong();
  });

  // Show/hide music player with sliding animation
  function togglePlayer() {
    if (isCollapsed) {
      // Show
        musicPlayerContainer.style.transform = "translateY(0)";
        toggleButton.textContent = "▼"; 
    } else {
      // Hide
        const casing = document.querySelector('.music-player-casing');
        const slideDistance = casing.offsetHeight; 
        musicPlayerContainer.style.transform = `translateY(${slideDistance}px)`;
        toggleButton.textContent = "▲"; 
    }
    isCollapsed = !isCollapsed;
  }
  
  if (toggleButton) {
      toggleButton.addEventListener("click", togglePlayer);
  }

  // Looked up shuffling algorithm and put it here lol
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

} else {
  // Hide on mobile
  const container = document.getElementById("music-player-container");
  if(container) container.style.display = "none";
}