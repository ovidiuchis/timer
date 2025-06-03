// Timer application for taking breaks
// === STATE ===
let timer;
let totalSeconds = 0;
let remainingSeconds = 0;
let isRunning = false;
let audio = new Audio();
let chimeSound = new Audio("./assets/bell.mp3");

// === DOM ELEMENTS ===
const timeDisplay = document.getElementById("time-display");
const progressCircle = document.getElementById("progress");
const resetBtn = document.getElementById("reset");
const startPauseBtn = document.getElementById("start-pause");
const customTimeBtn = document.getElementById("custom-time-btn");
const customTimeInput = document.getElementById("custom-time-input");
const customTimeWrapper = document.getElementById("custom-time-wrapper");
const customTimeOk = document.getElementById("custom-time-ok");
const chimeToggle = document.getElementById("chime-toggle");
const fullscreenCountdown = document.getElementById("fullscreen-countdown");
const fullscreenTime = document.getElementById("fullscreen-time");
const exitFullscreenBtn = document.getElementById("exit-fullscreen");
const untilTimeBtn = document.getElementById("until-time-btn");
const untilTimeWrapper = document.getElementById("until-time-wrapper");
const untilTimeInput = document.getElementById("until-time-input");
const untilTimeOk = document.getElementById("until-time-ok");

// === INITIALIZATION ===
startPauseBtn.disabled = true;
chimeSound.load();

// Chime preference
const savedChimePref = localStorage.getItem("chimeEnabled");
if (savedChimePref !== null) chimeToggle.checked = savedChimePref === "true";
chimeToggle.addEventListener("change", () => {
  localStorage.setItem("chimeEnabled", chimeToggle.checked);
});

// === TIME BUTTONS ===
fetch("./assets/times.json")
  .then(res => res.json())
  .then(times => {
    const timeButtons = document.getElementById("time-buttons");
    times.forEach(t => {
      const btn = document.createElement("button");
      btn.textContent = t.label;
      btn.addEventListener("click", () => {
        document.querySelectorAll("#time-buttons button").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        setTimer(t.minutes * 60);
        startPauseBtn.disabled = false;
        customTimeInput.style.display = "none";
        customTimeWrapper.style.display = "none";
        customTimeInput.value = "";
        resetTimer();
        document.querySelector(".timer-circle").classList.remove("completed");
      });
      timeButtons.appendChild(btn);
    });
  });

// === MUSIC OPTIONS ===
fetch("./assets/music.json")
  .then(res => res.json())
  .then(musicList => {
    const musicSelect = document.getElementById("music");
    const silentOption = document.createElement("option");
    silentOption.value = "";
    silentOption.textContent = "🔇 No music";
    musicSelect.appendChild(silentOption);
    musicList.forEach(m => {
      const option = document.createElement("option");
      option.value = m.url;
      option.textContent = m.name;
      musicSelect.appendChild(option);
    });
    const savedMusic = localStorage.getItem("selectedMusic");
    if (savedMusic !== null) musicSelect.value = savedMusic;
    musicSelect.addEventListener("change", () => {
      localStorage.setItem("selectedMusic", musicSelect.value);
    });
  });

// === TIMER LOGIC ===
function setTimer(seconds) {
  clearInterval(timer);
  totalSeconds = remainingSeconds = seconds;
  updateDisplay();
  updateProgress();
  document.querySelector(".timer-circle").classList.remove("completed", "negative");
}

function startTimer() {
  const errorBox = document.getElementById("music-error");
  if (!remainingSeconds || isRunning) return;
  document.querySelector(".timer-circle").classList.add("running");
  const musicUrl = document.getElementById("music").value;
  if (musicUrl) {
    audio.src = musicUrl;
    audio.onerror = () => {
      errorBox.textContent = "⚠️ Unable to load selected music. Timer is silent 🤫";
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
  timer = setInterval(timerTick, 1000);
}

function timerTick() {
  if (remainingSeconds > 0) {
    remainingSeconds--;
    updateDisplay();
    updateProgress();
  } else {
    if (!document.querySelector(".timer-circle").classList.contains("negative")) {
      document.querySelector(".timer-circle").classList.add("completed", "negative");
    }
    remainingSeconds--;
    updateDisplay();
    updateProgress();
    if (remainingSeconds === -1) {
      clearInterval(timer);
      isRunning = false;
      audio.pause();
      playChimeSound();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      document.getElementById("start-icon").innerHTML = '<path d="M8 5v14l11-7z" />';
      timer = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
      }, 1000);
    }
  }
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
  document.querySelector(".timer-circle").classList.remove("running", "completed", "negative");
  document.getElementById("start-icon").innerHTML = '<path d="M8 5v14l11-7z" />';
  chimeSound.pause();
  chimeSound.currentTime = 0;
}

function updateDisplay() {
  let absSeconds = Math.abs(remainingSeconds);
  const mins = String(Math.floor(absSeconds / 60)).padStart(2, "0");
  const secs = String(absSeconds % 60).padStart(2, "0");
  timeDisplay.textContent = remainingSeconds < 0 ? `-${mins}:${secs}` : `${mins}:${secs}`;
  updateFullscreenTime();
}

function updateProgress() {
  const circumference = 2 * Math.PI * 90;
  const offset = circumference * (1 - remainingSeconds / totalSeconds);
  progressCircle.style.strokeDashoffset = offset;
}

function playChimeSound() {
  if (chimeToggle.checked) {
    if (audio.src) audio.pause();
    chimeSound.currentTime = 0;
    chimeSound.play().catch(error => {
      console.error("Failed to play chime sound:", error);
    });
  }
}

// === CUSTOM TIME ===
customTimeBtn.addEventListener("click", () => {
  customTimeWrapper.style.display = "flex";
  customTimeInput.focus();
  customTimeInput.style.display = "block";
  customTimeInput.value = "1";
});

function applyCustomTime() {
  const minutes = parseInt(customTimeInput.value, 10);
  if (!isNaN(minutes) && minutes > 0) {
    document.querySelectorAll("#time-buttons button").forEach(b => b.classList.remove("selected"));
    customTimeBtn.classList.add("selected");
    setTimer(minutes * 60);
    startPauseBtn.disabled = false;
    customTimeWrapper.style.display = "none";
    customTimeInput.value = "";
  }
}
customTimeInput.addEventListener("keydown", e => {
  if (e.key === "Enter") applyCustomTime();
});
customTimeOk.addEventListener("click", applyCustomTime);

// === UNTIL TIME ===
untilTimeBtn.addEventListener("click", () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  untilTimeInput.value = `${h}:${m}`;
  untilTimeWrapper.style.display = "flex";
  untilTimeInput.focus();
});

function applyUntilTime() {
  const now = new Date();
  const [h, m] = untilTimeInput.value.split(":").map(Number);
  if (!isNaN(h) && !isNaN(m)) {
    const until = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    let diff = Math.round((until - now) / 60000);
    if (diff < 0) diff += 24 * 60;
    if (diff > 0) {
      document.querySelectorAll("#time-buttons button").forEach(b => b.classList.remove("selected"));
      untilTimeBtn.classList.add("selected");
      setTimer(diff * 60);
      startPauseBtn.disabled = false;
      untilTimeWrapper.style.display = "none";
      untilTimeInput.value = "";
      resetTimer();
      document.querySelector(".timer-circle").classList.remove("completed");
    }
  }
}
untilTimeInput.addEventListener("keydown", e => {
  if (e.key === "Enter") applyUntilTime();
});
untilTimeOk.addEventListener("click", applyUntilTime);

// === EVENT LISTENERS ===
startPauseBtn.addEventListener("click", toggleStartPause);
resetBtn.addEventListener("click", resetTimer);

// Fullscreen countdown
if (timeDisplay) {
  timeDisplay.style.cursor = "pointer";
  timeDisplay.addEventListener("click", () => {
    updateFullscreenTime();
    fullscreenCountdown.style.display = "flex";
    document.body.style.overflow = "hidden";
  });
}
if (exitFullscreenBtn) {
  exitFullscreenBtn.addEventListener("click", () => {
    fullscreenCountdown.style.display = "none";
    document.body.style.overflow = "auto";
  });
}

// === UI UPDATES ===
function updateFullscreenTime() {
  if (fullscreenCountdown.style.display !== "none") {
    fullscreenTime.textContent = timeDisplay.textContent;
    // Set color: green if time >= 0, red if negative
    if (remainingSeconds < 0) {
      fullscreenTime.classList.add("negative");
    } else {
      fullscreenTime.classList.remove("negative");
    }
  }
}

function toggleStartPause() {
  const icon = document.getElementById("start-icon");
  if (isRunning) {
    pauseTimer();
    if (icon) icon.innerHTML = '<path d="M8 5v14l11-7z" />';
  } else {
    startTimer();
    if (icon) icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />';
  }
}
