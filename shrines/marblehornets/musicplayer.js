const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

if (!isMobile) {

// Song list
const songs = [
    { title: "The Operator", artist: "Robert Panico", file: "https://july.lol/shrines/marblehornets/songs/theoperator.mp3" },
    { title: "Song Title", artist: "Artist", file: "song2.mp3"}
  ];
  
let currentIndex = 0;
let isPlaying = false; // Tracks play/pause state
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

// Collapse the music player on load
let isCollapsed = false;
musicPlayerContainer.style.transform = "translateX(0)";
toggleButton.textContent = "❰"; // Show expand symbol
// If you want it to show on load, switch isCollapse to "true" and set the translateX to 0

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
  currentIndex = (currentIndex - 1 + songs.length) % songs.length; // Wrap to last song if at the start
  loadAndPlaySong();
});

// Next song
nextButton.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % songs.length; // Wrap to first song if at the end
  loadAndPlaySong();
});

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
  currentIndex = (currentIndex + 1) % songs.length; // Wrap to the first song if at the end
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
}