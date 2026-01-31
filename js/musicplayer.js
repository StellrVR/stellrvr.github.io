// Set default volume level (0.0 = muted, 1.0 = max volume)
const defaultVolume = 0.2;

// Your music library - add or remove songs as needed
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

// Detect mobile devices to hide player (music players work poorly on mobile)
const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

// Only initialize music player on desktop devices
if (!isMobile) {
  
  let isPlaying = false;           // Track if music is currently playing
  let isShuffleOn = false;          // Track if shuffle mode is enabled
  let isDragging = false;           // Prevent progress bar updates while user drags
  let isCollapsed = false;          // Track player show/hide state
  
  // Play queue holds the current order of songs (changes when shuffle is toggled)
  let playQueue = [...songs]; 
  
  // Start with a random song
  let currentSongIndex = Math.floor(Math.random() * songs.length);
  
  const audio = new Audio();
  audio.volume = defaultVolume;
  
  // Song info display elements
  const songTitle = document.getElementById("song-title");
  const songArtist = document.getElementById("song-artist");
  const songScroller = document.getElementById("song-info-scroller");
  const songMask = document.querySelector(".song-info-mask");
  
  // Control buttons
  const playPauseButton = document.getElementById("play-pause");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const shuffleButton = document.getElementById("shuffle");
  const toggleButton = document.getElementById("toggle-button");
  
  // Slider controls
  const volumeSlider = document.getElementById("volume");
  const volumeLabel = document.getElementById("volume-label");
  const progressBar = document.getElementById("progress");
  
  // Container
  const musicPlayerContainer = document.getElementById("music-player-container");
  
  if (musicPlayerContainer) {
      // Set up progress bar
      progressBar.max = 100;
      progressBar.value = 0;
      
      // Set up volume display
      volumeSlider.value = audio.volume;
      volumeLabel.textContent = Math.round(audio.volume * 100);
      
      // Show the player
      musicPlayerContainer.style.display = "flex";
      
      // Load the first song
      loadSong(currentSongIndex);
      
      // Ensure everything displays correctly after page loads
      window.addEventListener("load", () => {
        updateSongInfo();
      });
  }

  function loadSong(index) {
    // Wrap index if out of bounds
    if (index < 0) {
      index = playQueue.length - 1;
    }
    if (index >= playQueue.length) {
      index = 0;
    }
    
    currentSongIndex = index;
    audio.src = playQueue[currentSongIndex].file;
    updateSongInfo();
  }

  function playSong() {
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            playPauseButton.innerHTML = "<span>||</span>"; // Pause icon
        }).catch(error => {
            console.log("Playback prevented (user interaction required):", error);
            isPlaying = false;
            playPauseButton.innerHTML = "<span>▶</span>"; // Play icon
        });
    }
  }
  

  function pauseSong() {
    audio.pause();
    isPlaying = false;
    playPauseButton.innerHTML = "<span>▶</span>";
  }

  function updateSongInfo() {
    if (!songScroller) return;
    
    // Reset any existing animation
    songScroller.classList.remove("scrolling");
    songScroller.style.transform = "translateX(0)";
    
    // Update the text content
    songTitle.textContent = playQueue[currentSongIndex].title;
    songArtist.textContent = playQueue[currentSongIndex].artist;
    
    // Check if text needs to scroll (is it wider than container?)
    setTimeout(() => {
        const textWidth = songScroller.scrollWidth;
        const containerWidth = songMask.clientWidth;
        
        // Only scroll if text overflows the container
        if (textWidth > containerWidth) {
            const distanceToScroll = textWidth - containerWidth + 10; // +10 for padding
            const speed = 30; // pixels per second
            const scrollTime = distanceToScroll / speed;
            const totalDuration = scrollTime + 4; // Add pause time at start/end
            
            // Set CSS custom properties for animation
            songScroller.style.setProperty('--scroll-distance', `-${distanceToScroll}px`);
            songScroller.style.setProperty('--scroll-duration', `${totalDuration}s`);
            songScroller.classList.add("scrolling");
        }
    }, 50); // Small delay to ensure DOM is updated
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function togglePlayer() {
    if (isCollapsed) {
      // Show the player
      musicPlayerContainer.style.transform = "translateY(0)";
      toggleButton.textContent = "▼"; 
    } else {
      // Hide the player (slide down)
      const casing = document.querySelector('.music-player-casing');
      const slideDistance = casing.offsetHeight; 
      musicPlayerContainer.style.transform = `translateY(${slideDistance}px)`;
      toggleButton.textContent = "▲"; 
    }
    isCollapsed = !isCollapsed;
  }

  // Play/Pause button
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
        
        // Remember which song is currently playing
        const currentSongObj = playQueue[currentSongIndex];
        
        if (isShuffleOn) {
          // Enable shuffle mode
          shuffleButton.classList.add("active");
          
          // Create shuffled queue with current song at the front
          let remainingSongs = songs.filter(s => s !== currentSongObj);
          shuffleArray(remainingSongs);
          
          playQueue = [currentSongObj, ...remainingSongs];
          currentSongIndex = 0;
          
        } else {
          // Disable shuffle mode
          shuffleButton.classList.remove("active");
          
          // Restore original order
          playQueue = [...songs];
          
          // Find where current song is in original list
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
  
  // Progress bar - track when user starts dragging
  if (progressBar) {
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
  
  // Update progress bar as song plays (unless user is dragging)
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
  
  // Show/Hide toggle button
  if (toggleButton) {
      toggleButton.addEventListener("click", togglePlayer);
  }
  
} else {
  // Hide player on mobile devices
  const container = document.getElementById("music-player-container");
  if (container) {
    container.style.display = "none";
  }
}