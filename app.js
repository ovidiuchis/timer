// Timer application for taking breaks

let timer;
let totalSeconds = 0;
let remainingSeconds = 0;
let audio = new Audio();
let isRunning = false;
let chimeSound = new Audio("./assets/bell.mp3"); // Use local bell.mp3 file

const timeDisplay = document.getElementById("time-display");
const progressCircle = document.getElementById("progress");
const resetBtn = document.getElementById("reset");
const startPauseBtn = document.getElementById("start-pause");
const customTimeBtn = document.getElementById("custom-time-btn");
const customTimeInput = document.getElementById("custom-time-input");
const customTimeWrapper = document.getElementById("custom-time-wrapper");
const customTimeOk = document.getElementById("custom-time-ok");
const chimeToggle = document.getElementById("chime-toggle");

startPauseBtn.disabled = true;

// Preload the chime sound
chimeSound.load();

// Load chime preference from localStorage
const savedChimePref = localStorage.getItem("chimeEnabled");
if (savedChimePref !== null) {
  chimeToggle.checked = savedChimePref === "true";
}

// Save chime preference when changed
chimeToggle.addEventListener("change", () => {
  localStorage.setItem("chimeEnabled", chimeToggle.checked);
});

// Fetch and populate time button
fetch("./assets/times.json")
  .then((res) => res.json())
  .then((times) => {
    const timeButtons = document.getElementById("time-buttons");
    times.forEach((t) => {
      const btn = document.createElement("button");
      btn.textContent = t.label;
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("#time-buttons button")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        setTimer(t.minutes * 60);
        startPauseBtn.disabled = false;
        customTimeInput.style.display = "none";
        customTimeWrapper.style.display = "none";
        customTimeInput.value = "";
        resetTimer();

        // Remove completed class when selecting a new time
        document.querySelector(".timer-circle").classList.remove("completed");
      });
      timeButtons.appendChild(btn);
    });
  });

// Fetch and populate music options
fetch("./assets/music.json")
  .then((res) => res.json())
  .then((musicList) => {
    const musicSelect = document.getElementById("music");

    const silentOption = document.createElement("option");
    silentOption.value = "";
    silentOption.textContent = "🔇 No music";
    musicSelect.appendChild(silentOption);

    musicList.forEach((m) => {
      const option = document.createElement("option");
      option.value = m.url;
      option.textContent = m.name;
      musicSelect.appendChild(option);
    });

    const savedMusic = localStorage.getItem("selectedMusic");
    if (savedMusic !== null) {
      musicSelect.value = savedMusic;
    }

    musicSelect.addEventListener("change", () => {
      localStorage.setItem("selectedMusic", musicSelect.value);
    });
  });

// Timer-related functions
function setTimer(seconds) {
  clearInterval(timer);
  totalSeconds = remainingSeconds = seconds;
  updateDisplay();
  updateProgress();

  // Remove completed class when setting a new timer
  document.querySelector(".timer-circle").classList.remove("completed");
}

function startTimer() {
  const errorBox = document.getElementById("music-error");
  if (!remainingSeconds || isRunning) return;
  document.querySelector(".timer-circle").classList.add("running");
  const musicUrl = document.getElementById("music").value;

  if (musicUrl) {
    audio.src = musicUrl;
    audio.onerror = () => {
      errorBox.textContent =
        "⚠️ Unable to load selected music. Timer is silent 🤫";
      errorBox.style.display = "block";
    };
    audio.oncanplay = () => {
      errorBox.style.display = "none";
    };
    audio.loop = true;
    audio.play();
  } else {
    audio.pause();
    audio.src = "";
    errorBox.style.display = "none";
  }

  isRunning = true;

  timer = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateDisplay();
      updateProgress();
    } else {
      clearInterval(timer);
      isRunning = false;
      audio.pause();

      // Play chime sound when timer ends
      playChimeSound();

      // Update UI to show timer completed - make sure the circle is fully visible
      document.querySelector(".timer-circle").classList.remove("running");
      progressCircle.style.strokeDashoffset = 0; // Force the circle to be fully drawn
      document.querySelector(".timer-circle").classList.add("completed");
      document.getElementById("start-icon").innerHTML =
        '<path d="M8 5v14l11-7z" />';
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  audio.pause();
  document.querySelector(".timer-circle").classList.remove("running");
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  remainingSeconds = totalSeconds;
  updateDisplay();
  updateProgress();
  audio.pause();
  audio.currentTime = 0;
  audio.src = document.getElementById("music").value;

  // Remove both running and completed classes
  document.querySelector(".timer-circle").classList.remove("running");
  document.querySelector(".timer-circle").classList.remove("completed");

  document.getElementById("start-icon").innerHTML =
    '<path d="M8 5v14l11-7z" />';

  // Reset chime sound
  chimeSound.pause();
  chimeSound.currentTime = 0;
}

function updateDisplay() {
  const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const secs = String(remainingSeconds % 60).padStart(2, "0");
  timeDisplay.textContent = `${mins}:${secs}`;
}

function updateProgress() {
  const circumference = 2 * Math.PI * 90;
  const offset = circumference * (1 - remainingSeconds / totalSeconds);
  progressCircle.style.strokeDashoffset = offset;
}

function toggleStartPause() {
  const icon = document.getElementById("start-icon");
  if (isRunning) {
    pauseTimer();
    icon.innerHTML = '<path d="M8 5v14l11-7z" />';
  } else {
    startTimer();
    icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />';
  }
}

// Play chime sound when timer ends
function playChimeSound() {
  // Only play if the toggle is checked
  if (chimeToggle.checked) {
    // Stop background music if it's playing
    if (audio.src) {
      audio.pause();
    }

    // Play chime sound
    chimeSound.currentTime = 0;
    chimeSound.play().catch((error) => {
      console.error("Failed to play chime sound:", error);
    });
  }
}

// Custom time input handling
customTimeBtn.addEventListener("click", () => {
  customTimeWrapper.style.display = "flex";
  customTimeInput.focus();
  customTimeInput.style.display = "block";
  customTimeInput.value = "1";
});

function applyCustomTime() {
  const minutes = parseInt(customTimeInput.value, 10);
  if (!isNaN(minutes) && minutes > 0) {
    document
      .querySelectorAll("#time-buttons button")
      .forEach((b) => b.classList.remove("selected"));
    customTimeBtn.classList.add("selected");

    setTimer(minutes * 60);
    startPauseBtn.disabled = false;
    customTimeWrapper.style.display = "none";
    customTimeInput.value = "";
  }
}

customTimeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") applyCustomTime();
});

customTimeOk.addEventListener("click", applyCustomTime);

// Event listeners for buttons
startPauseBtn.addEventListener("click", toggleStartPause);
resetBtn.addEventListener("click", resetTimer);
