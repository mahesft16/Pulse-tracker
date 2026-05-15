/**
 * PulseTrack - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const shareBtn = document.getElementById('share-location-btn');
    const shareStatus = document.getElementById('share-status');
    const startBtn = document.getElementById('start-tracking-btn');
    const statusText = document.getElementById('current-status-text');
    
    // Stats Elements
    const stepCountEl = document.getElementById('step-count');
    const calorieCountEl = document.getElementById('calorie-count');
    const jumpCountEl = document.getElementById('jump-count');
    
    // New Goal Element
    const goalPercentEl = document.querySelector('.goal-percent');
    const ringGreen = document.querySelector('.ring-green');
    
    // Permission Overlay Elements
    const permissionOverlay = document.getElementById('permissions-overlay');
    const grantPermissionBtn = document.getElementById('btn-grant-permissions');
    
    // Metrics UI
    const timerEl = document.getElementById('workout-timer');
    const distanceEl = document.getElementById('workout-distance');
    const activeCalEl = document.getElementById('workout-calories');

    // State & LocalStorage
    let isTracking = false;
    let currentMode = 'running';
    let workoutActive = false;
    let workoutSeconds = 0;
    let workoutTimerInterval = null;
    let activeCalories = 0;
    
    const GOALS = {
        steps: 10000,
        calories: 500
    };
    
    // Load persisted stats
    const savedStats = JSON.parse(localStorage.getItem('pulseTrackStats')) || { steps: 0, jumps: 0, workoutCalories: 0 };
    if (stepCountEl) stepCountEl.textContent = savedStats.steps;
    if (jumpCountEl) jumpCountEl.textContent = savedStats.jumps;
    if (calorieCountEl) calorieCountEl.textContent = Math.floor(savedStats.steps * 0.04) + savedStats.workoutCalories;

    // --- Initialization ---
    
    // Initialize Map
    const navigatorMap = new window.MapNavigator('map-container');
    navigatorMap.init();
    
    // Handle distance updates from Map
    navigatorMap.onDistanceUpdate = (km) => {
        if (workoutActive && distanceEl) {
            distanceEl.textContent = km.toFixed(2);
        }
    };

    // Initialize Game
    const neonRunner = new window.NeonRunner('gameCanvas');

    // Initialize Sensor Tracker
    const motionTracker = new window.MotionTracker();
    
    // Handle Sensor Updates
    motionTracker.onUpdate = (data) => {
        // Update DOM
        if (stepCountEl) {
            savedStats.steps = data.steps;
            stepCountEl.textContent = data.steps;
            
            // Sync with Leaderboard
            const leaderboardSteps = document.getElementById('leaderboard-steps');
            if (leaderboardSteps) {
                leaderboardSteps.textContent = data.steps.toLocaleString();
            }
        }
        if (jumpCountEl) {
            savedStats.jumps = data.jumps;
            jumpCountEl.textContent = data.jumps;
        }
        if (calorieCountEl && !workoutActive) {
            // Step-based calories + accumulated workout calories
            const stepCalories = Math.floor(data.steps * 0.04);
            calorieCountEl.textContent = stepCalories + savedStats.workoutCalories;
        }

        // Persist to local storage
        localStorage.setItem('pulseTrackStats', JSON.stringify(savedStats));

        // Update Central Goal Ring
        const stepPct = Math.min((data.steps / GOALS.steps) * 100, 100);
        
        if (goalPercentEl) {
            goalPercentEl.textContent = `${Math.floor(stepPct)}%`;
        }
        if (ringGreen) {
            ringGreen.style.background = `conic-gradient(var(--accent-green) 0% ${stepPct}%, transparent ${stepPct}% 100%)`;
        }
        
        // Update Status
        if (!workoutActive) {
            statusText.textContent = data.activity === 'idle' ? "Ready to move?" : `Currently ${data.activity}...`;
        }
    };

    // --- Helper Functions ---
    function formatTime(sec) {
        const h = Math.floor(sec / 3600).toString().padStart(2, '0');
        const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    // --- Event Listeners ---
    startBtn.addEventListener('click', async () => {
        if (!isTracking) {
            // Need permission on first run
            const hasPermission = await motionTracker.requestPermission();
            
            if (hasPermission) {
                isTracking = true;
                startBtn.textContent = 'Stop';
                startBtn.style.background = '#ef4444'; // Red for stop
                statusText.textContent = `Workout: ${currentMode}`;
                
                motionTracker.start();
                navigatorMap.startTracking();
                
                // Start Workout Session
                workoutActive = true;
                workoutSeconds = 0;
                activeCalories = 0;
                if (distanceEl) distanceEl.textContent = "0.00";
                if (activeCalEl) activeCalEl.textContent = "0";
                
                workoutTimerInterval = setInterval(() => {
                    workoutSeconds++;
                    if (timerEl) timerEl.textContent = formatTime(workoutSeconds);
                    
                    // Add calories based on mode
                    let calPerSec = 0.1;
                    if (currentMode === 'running') calPerSec = 0.2;
                    if (currentMode === 'cycling') calPerSec = 0.15;
                    if (currentMode === 'swimming') calPerSec = 0.25;
                    if (currentMode === 'lifting') calPerSec = 0.12;
                    
                    activeCalories += calPerSec;
                    if (activeCalEl) activeCalEl.textContent = Math.floor(activeCalories);
                }, 1000);
            } else {
                permissionOverlay.classList.remove('hidden');
            }
        } else {
            isTracking = false;
            startBtn.textContent = 'Start';
            startBtn.style.background = 'var(--accent-green)';
            statusText.textContent = "Workout completed.";
            
            motionTracker.stop();
            navigatorMap.stopTracking();
            
            // Stop Workout Session
            workoutActive = false;
            clearInterval(workoutTimerInterval);
            
            // Add workout calories to saved workout total
            savedStats.workoutCalories += Math.floor(activeCalories);
            const stepCalories = Math.floor(savedStats.steps * 0.04);
            if (calorieCountEl) calorieCountEl.textContent = stepCalories + savedStats.workoutCalories;
            localStorage.setItem('pulseTrackStats', JSON.stringify(savedStats));
        }
    });

    grantPermissionBtn.addEventListener('click', async () => {
        const hasPermission = await motionTracker.requestPermission();
        if (hasPermission) {
            permissionOverlay.classList.add('hidden');
        } else {
            alert("Permission denied. We cannot track your movement without sensor access.");
            permissionOverlay.classList.add('hidden');
        }
    });

    shareBtn.addEventListener('click', async () => {
        const isSharing = await navigatorMap.toggleLiveShare(shareStatus);
        if (isSharing) {
            shareBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            shareBtn.classList.add('active');
        } else {
            shareBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
            shareBtn.classList.remove('active');
        }
    });

    // --- Navigation & View Switching ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view-section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update buttons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update views
            const targetId = btn.getAttribute('data-target');
            views.forEach(view => {
                if (view.id === targetId) {
                    view.classList.remove('hidden');
                    view.classList.add('active');
                } else {
                    view.classList.remove('active');
                    view.classList.add('hidden');
                }
            });

            // Fix for Leaflet Map when unhidden
            if (targetId === 'view-workout' && navigatorMap && navigatorMap.map) {
                setTimeout(() => {
                    navigatorMap.map.invalidateSize();
                    if (navigatorMap.pathCoordinates.length > 0) {
                        navigatorMap.map.setView(navigatorMap.pathCoordinates[navigatorMap.pathCoordinates.length - 1]);
                    }
                }, 100);
            }
        });
    });

    // --- Workout Modes ---
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (workoutActive) {
                alert("Please stop your current workout before changing modes.");
                return;
            }
            
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentMode = btn.getAttribute('data-mode');
            
            // Update UI
            if (distanceEl) {
                if (currentMode === 'lifting' || currentMode === 'swimming') {
                    distanceEl.textContent = "--";
                    distanceEl.parentElement.querySelector('.text-muted').textContent = "Not Tracked";
                } else {
                    distanceEl.textContent = "0.00";
                    distanceEl.parentElement.querySelector('.text-muted').textContent = "Distance (km)";
                }
            }
        });
    });
});
