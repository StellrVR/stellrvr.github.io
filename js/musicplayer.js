const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

// Only initialize music player on desktop devices
if (!isMobile) {
  // Song list
  const songs = [
    { title: "Blossom (8-Bit Remix)", artist: "Porter Robinson", file: "music/blossom.mp3" },
    { title: "Cheerleader (8-Bit Remix)", artist: "Porter Robinson", file: "music/cheerleader.mp3" },
    { title: "Funknitium-99", artist: "Fearofdark", file: "music/Funknitium-99.mp3" },
    { title: "Perfect Pinterest Garden (8-Bit Remix)", artist: "Porter Robinson", file: "music/perfectpinterestgarden.mp3" },
    { title: "Unfold (8-Bit Remix)", artist: "Porter Robinson", file: "music/Unfold.mp3" }
  ];
  
  let currentIndex = Math.floor(Math.random() * songs.length); // Random starting song
  let isPlaying = false; // Tracks play/pause state
  let isShuffleOn = false; // Tracks shuffle state NEW!!
  let shuffledPlaylist = [...songs]; // Copy of original playlist for shuffling
  const audio = new Audio(songs[currentIndex].file);
  audio.volume = 0.2; // Default volume

  const songTitle = document.getElementById("song-title");
  const songArtist = document.getElementById("song-artist");
  const playPauseButton = document.getElementById("play-pause");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const volumeSlider = document.getElementById("volume");
  const volumeLabel = document.getElementById("volume-label");
  const progressBar = document.getElementById("progress");
  const toggleButton = document.getElementById("toggle-button");
  const musicPlayerContainer = document.getElementById("music-player-container");
  const shuffleButton = document.getElementById("shuffle");

  // Make sure music player is visible on desktop
  musicPlayerContainer.style.display = "flex";

  // Shuffle button
  shuffleButton.textContent = "⤭"; // Shuffle symbol
  shuffleButton.style.opacity = "0.5"; // Indicates shuffle is off initially

  // Collapse the music player on load
  let isCollapsed = true; // Change to 'true' if you want the music player to be collapsed on page load
  musicPlayerContainer.style.transform = "translateX(-95%)"; // Change to 'translateX(-95%)' for collpased
  toggleButton.textContent = "❱"; // Show expand symbol

  // Autoplay on page load
  window.addEventListener("load", () => {
    updateSongInfo();
    audio.play().then(() => {
      isPlaying = true;
      playPauseButton.textContent = "||"; // Pause symbol
    }).catch((error) => {
      console.warn("Autoplay blocked by browser. User interaction required.");
    });
  });

  // Update the song title and artist display
  function updateSongInfo() {
    songTitle.textContent = songs[currentIndex].title;
    songArtist.textContent = songs[currentIndex].artist;
  }

  // Handle play/pause toggle
  playPauseButton.addEventListener("click", () => {
    if (isPlaying) {
      audio.pause();
      playPauseButton.textContent = "▶"; // Play symbol
      isPlaying = false;
    } else {
      audio.play();
      playPauseButton.textContent = "||"; // Pause symbol
      isPlaying = true;
    }
  });

  // Previous song
  prevButton.addEventListener("click", () => {
    if (isShuffleOn) {
      // In shuffle mode, go to a random previous song
      currentIndex = Math.floor(Math.random() * songs.length);
    } else {
      currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    }
    loadAndPlaySong();
  });

  // Next song
  nextButton.addEventListener("click", () => {
    if (isShuffleOn) {
      // In shuffle mode, go to a random next song
      currentIndex = Math.floor(Math.random() * songs.length);
    } else {
      currentIndex = (currentIndex + 1) % songs.length;
    }
    loadAndPlaySong();
  });

  // Toggle shuffle
  shuffleButton.addEventListener("click", () => {
    isShuffleOn = !isShuffleOn;
    if (isShuffleOn) {
      shuffleButton.style.opacity = "1"; // Bright indicates shuffle is on
      // Create a shuffled playlist (excluding current song)
      shuffledPlaylist = [...songs];
      const currentSong = shuffledPlaylist.splice(currentIndex, 1)[0];
      shuffleArray(shuffledPlaylist);
      shuffledPlaylist.unshift(currentSong); // Put current song first
    } else {
      shuffleButton.style.opacity = "0.5"; // Dim indicates shuffle is off
    }
  });

  // Helper function to shuffle array (Fisher-Yates algorithm)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Volume control
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
    volumeLabel.textContent = `${Math.round(volumeSlider.value * 100)}%`;
  });

  // Song progress control
  progressBar.addEventListener("input", () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  });

  // Update the progress bar with the song's progress
  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      progressBar.value = (audio.currentTime / audio.duration) * 100;
    }
  });

  // Automatically move to the next song when the current song ends
  audio.addEventListener("ended", () => {
    if (isShuffleOn) {
      currentIndex = Math.floor(Math.random() * songs.length);
    } else {
      currentIndex = (currentIndex + 1) % songs.length;
    }
    loadAndPlaySong();
  });

  // Load a new song and play it
  function loadAndPlaySong() {
    audio.src = songs[currentIndex].file;
    updateSongInfo();
    audio.play();
    isPlaying = true;
    playPauseButton.textContent = "||"; // Pause symbol
  }

  // Collapse/Expand the music player
  toggleButton.addEventListener("click", () => {
    if (isCollapsed) {
      musicPlayerContainer.style.transform = "translateX(0)";
      toggleButton.textContent = "❰"; // Show collapse symbol
    } else {
      musicPlayerContainer.style.transform = "translateX(-95%)";
      toggleButton.textContent = "❱"; // Show expand symbol
    }
    isCollapsed = !isCollapsed;
  });
} else {
  // Hide music player container on mobile
  document.getElementById("music-player-container").style.display = "none";
}