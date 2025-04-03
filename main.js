
let countdown;
let timeLeft = 10;
let isPaused = false;
let isRunning = false;
let initialTime = 10;
const resetButton = document.getElementById("resetButton");
const soundMenu = document.getElementById("soundMenu");
let soundMenuOpen = false;

// Setup sound menu functionality
document.querySelectorAll('.sound-option').forEach(option => {
    option.addEventListener('click', function() {
        // Update the selected sound
        document.querySelectorAll('.sound-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        
        // Update the alarm sound source
        document.getElementById('alarm').src = this.getAttribute('data-sound');
        
        // Close the menu
        toggleSoundMenu();
    });
});

// Close sound menu when clicking elsewhere
document.addEventListener('click', function(event) {
    if (!event.target.closest('#soundButton') && !event.target.closest('#soundMenu') && soundMenuOpen) {
        toggleSoundMenu();
    }
});

function toggleSoundMenu() {
    soundMenuOpen = !soundMenuOpen;
    soundMenu.style.display = soundMenuOpen ? 'block' : 'none';
}

function toggleTimer() {
    if (!isRunning) {
        startTimer();
    } else if (isPaused) {
        resumeTimer();
    } else {
        stopTimer();
    }
}

function startTimer() {
    clearInterval(countdown);
    initialTime = timeLeft;
    updateDisplay(timeLeft);
    isPaused = false;
    isRunning = true;
    runTimer();
    countdown = setInterval(runTimer, 1000);
    document.getElementById("controlButton").textContent = "Pause";
}

function stopTimer() {
    clearInterval(countdown);
    isPaused = true;
    document.getElementById("controlButton").textContent = "Resume";
}

function resumeTimer() {
    if (isPaused && timeLeft > 0) {
        isPaused = false;
        countdown = setInterval(runTimer, 1000);
        document.getElementById("controlButton").textContent = "Pause";
    }
}

function resetTimer() {
    clearInterval(countdown);
    timeLeft = initialTime;
    updateDisplay(timeLeft);
    isPaused = false;
    isRunning = false;
    document.getElementById("controlButton").textContent = "Start";
    
    // Add rotation animation
    resetButton.classList.add("rotating");
    setTimeout(() => {
        resetButton.classList.remove("rotating");
    }, 500);
}

function runTimer() {
    if (!isPaused) {
        updateDisplay(timeLeft);
        if (timeLeft === 0) {
            document.getElementById("alarm").play();
            clearInterval(countdown);
            isRunning = false;
            setTimeout(() => {
                timeLeft = initialTime;
                runTimer();
                countdown = setInterval(runTimer, 1000);
            }, 1000);
        } else {
            timeLeft--;
        }
    }
}

function updateDisplay(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    document.getElementById("timer").textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function adjustTime(amount) {
    timeLeft = Math.max(0, timeLeft + amount);
    updateDisplay(timeLeft);
}


// The wake lock sentinel.
let wakeLock = null;

// Function that attempts to request a screen wake lock.
const requestWakeLock = async () => {
console.log('requesting Screen Wake Lock.');
  try {
    console.log('requesting Screen Wake Lock.');
    wakeLock = await navigator.wakeLock.request();
    wakeLock.addEventListener('release', () => {
      console.log('Screen Wake Lock released:', wakeLock.released);
    });
    console.log('Screen Wake Lock released:', wakeLock.released);
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
};

// Request a screen wake lock…
await requestWakeLock();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/timer/serviceworker.js")
        .then((registration) => console.log("Service Worker registered:", registration))
        .catch((error) => console.log("Service Worker registration failed:", error));
    }
