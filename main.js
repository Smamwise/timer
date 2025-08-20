let countdown;
let timeLeft = 0;
let isPaused = false;
let isRunning = false;
let initialTime = 0;
let wakeLockEnabled = true;
let autoRestartEnabled = true;
const resetButton = document.getElementById("resetButton");
const settingsModal = document.getElementById("settingsModal");
let currentSound = "/timer/files/mixkit-sci-fi-bleep-alarm-909.wav";

// Setup sound menu functionality
document.querySelectorAll('.sound-option').forEach(option => {
    option.addEventListener('click', function() {
        // Update the selected sound
        document.querySelectorAll('.sound-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        // Update the alarm sound source
        document.getElementById('alarm').src = this.getAttribute('data-sound');
    });
});

// Create an AudioContext once (e.g. on page load or first user interaction)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioContext.createGain(); 
gainNode.connect(audioContext.destination);

// Update volume when slider moves
const volumeSlider = document.getElementById("volumeSlider");
volumeSlider.addEventListener("input", () => {
    gainNode.gain.value = parseFloat(volumeSlider.value);
});

async function playAlarm() {
  const alarmElement = document.getElementById("alarm");

  // Fetch the audio data
  const response = await fetch(alarmElement.src);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Play through Web Audio API
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(gainNode);
  source.start(0);
}

async function previewSound(soundPath) {
    // Fetch the file
    const response = await fetch(soundPath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create a source and play it
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function toggleTimer() {
    if (!isRunning) {
        startTimer();
    } else if (isPaused) {
        resumeTimer();
    } else {
        pauseTimer();
    }
}

function startTimer() {
    // Prevent starting the timer if time is zero
    if (timeLeft <= 0) {        
        // Visual feedback - briefly highlight the timer in red
        const timerElement = document.getElementById("timer");
        timerElement.style.color = "#ff6666"; // Change to red
        timerElement.style.fontSize  = "60px";
        timerElement.innerHTML = 'INVALID<br>TIME';
        
        setTimeout(() => {
            timerElement.style.color = "white"; // Revert back to original color
            timerElement.style.fontSize  = "120px";
            updateDisplay(timeLeft);
        }, 400);
        
        return; // Exit the function early
    }
    clearInterval(countdown);
    updateDisplay(timeLeft);
    isPaused = false;
    isRunning = true;
    runTimer();
    countdown = setInterval(runTimer, 1000);
    document.getElementById("controlButton").textContent = "Pause";
}

function pauseTimer() {
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
}

function runTimer() {
    isRunning = true;
    if (!isPaused && isRunning) {
        updateDisplay(timeLeft);
        if (timeLeft === 0) {
            playAlarm();
            clearInterval(countdown);
            // Check if auto-restart is enabled
            if (autoRestartEnabled) {
                setTimeout(() => {
                    timeLeft = initialTime;
                    runTimer();
                    countdown = setInterval(runTimer, 1000);
                }, 1000);
            } else {
                // Reset to initial time but don't restart
                resetTimer()
            }
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

// Settings modal functions
function openSettings() {   
    document.querySelectorAll('.sound-option').forEach(option => {
        if (option.getAttribute('data-sound') === currentSound) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    // Set wake lock checkbox state
    document.getElementById('wakeLockCheckbox').checked = wakeLockEnabled;
    // Set auto-restart checkbox state
    document.getElementById('autoRestartCheckbox').checked = autoRestartEnabled;
    // Show the modal
    settingsModal.style.display = "block";
/*
    // Load saved volume setting (add this in openSettings() function)
    const savedVolume = localStorage.getItem('timerVolume') || '50';
    document.getElementById('volumeSlider').value = savedVolume;
    if (display) {
        display.textContent = savedVolume;
    }
    // Apply the volume to audio elements
    const volume = savedVolume / 100;
    document.getElementById('alarm').volume = volume;
    document.getElementById('preview').volume = volume;
*/
}

function closeSettings() {
    settingsModal.style.display = "none";
}

function saveSettings() {
    const minutes = parseInt(document.getElementById("minutesInput").value) || 0;
/*
    // Volume
    const volumeValue = document.getElementById('volumeSlider').value;
    localStorage.setItem('timerVolume', volumeValue);
 */   
    // Ensure values are within valid ranges
    const validMinutes = Math.max(0, Math.min(99, minutes));
    
    // Calculate total time in seconds
    const newTime = (validMinutes * 60);

    timeLeft = newTime;
    initialTime = newTime;
    updateDisplay(timeLeft);
    
    // Reset timer state if it was running
    if (isRunning) {
        clearInterval(countdown);
        isRunning = false;
        isPaused = false;
        document.getElementById("controlButton").textContent = "Start";
    }
    
    const selectedOption = document.querySelector('.sound-option.selected');
    if (selectedOption) {
        currentSound = selectedOption.getAttribute('data-sound');
        document.getElementById('alarm').src = currentSound;
    }

    // Handle wake lock setting
    wakeLockEnabled = document.getElementById('wakeLockCheckbox').checked;
    if (wakeLockEnabled) {
        requestWakeLock();
    } else {
        releaseWakeLock();
    }

    // Handle auto-restart setting
    autoRestartEnabled = document.getElementById('autoRestartCheckbox').checked;
    
    // Close the modal
    closeSettings();
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target === settingsModal) {
        closeSettings();
    }
};

// The wake lock sentinel.
let wakeLock = null;

// Function that attempts to request a screen wake lock.
const requestWakeLock = async () => {
    if (!wakeLockEnabled) return;
    try {
      wakeLock = await navigator.wakeLock.request();
      wakeLock.addEventListener('release', () => {
        console.log('Screen Wake Lock released:', wakeLock.released);
      });
      console.log('Screen Wake Lock acquired');
    } catch (err) {
      console.error('Screen Wake Lock Error:', `${err.name}, ${err.message}`);
    }
  };

const releaseWakeLock = async () => {
if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
    console.log('Wake Lock released');
}
};

// Request a screen wake lock…
requestWakeLock();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("serviceworker.js")
        .then((registration) => console.log("Service Worker registered:", registration))
        .catch((error) => console.log("Service Worker registration failed:", error));
}

// Add event listener for fullscreen checkbox
document.getElementById('fullscreenCheckbox').addEventListener('change', function() {
    if (this.checked) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
            document.documentElement.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
});

// Update checkbox state when fullscreen state changes by other means (like Esc key)
document.addEventListener('fullscreenchange', function() {
    document.getElementById('fullscreenCheckbox').checked = !!document.fullscreenElement;
});


const timerText = document.querySelector("#timer");

// Initialize default volume
gainNode.gain.value = parseFloat(volumeSlider.value);

timerText.addEventListener("click", function() {
    // Visual feedback - briefly highlight the timer in red
    timerText.style.color = "#ff6666"; // Change to red
    timerText.style.fontSize  = "40px";
    timerText.innerHTML = 'Change time <br>in settings<br>&#8203;';
    
    setTimeout(() => {
        timerText.style.color = "white"; // Revert back to original color
        timerText.style.fontSize  = "120px";
        updateDisplay(timeLeft);
    }, 400); // After 200ms
});



