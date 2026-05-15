/**
 * PulseTrack - Sleep Analysis Logic
 */

class SleepTracker {
    constructor() {
        this.data = JSON.parse(localStorage.getItem('pulseTrackSleep')) || {
            duration: "7h 24m",
            segments: { deep: 25, light: 55, rem: 20 },
            lastUpdate: Date.now()
        };

        // UI Elements
        this.durationEl = document.getElementById('sleep-duration');
        this.deepBar = document.getElementById('sleep-deep-bar');
        this.lightBar = document.getElementById('sleep-light-bar');
        this.remBar = document.getElementById('sleep-rem-bar');
        
        this.deepText = document.getElementById('sleep-deep-text');
        this.lightText = document.getElementById('sleep-light-text');
        this.remText = document.getElementById('sleep-rem-text');
        
        this.syncBtn = document.getElementById('btn-sync-sleep');
    }

    init() {
        this.updateUI();

        if (this.syncBtn) {
            this.syncBtn.addEventListener('click', () => {
                this.syncBtn.classList.add('fa-spin'); // fa-spin doesn't work on button, needs icon
                const icon = this.syncBtn.querySelector('i');
                if (icon) icon.classList.add('fa-spin');
                
                setTimeout(() => {
                    this.generateMockData();
                    this.updateUI();
                    if (icon) icon.classList.remove('fa-spin');
                }, 800);
            });
        }
    }

    generateMockData() {
        // Generate a random sleep duration between 6 and 9 hours
        const totalMinutes = Math.floor(Math.random() * (540 - 360 + 1) + 360);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        // Random segments that sum to 100%
        let deep = Math.floor(Math.random() * 15) + 15; // 15-30%
        let rem = Math.floor(Math.random() * 10) + 15;  // 15-25%
        let light = 100 - deep - rem;

        this.data = {
            duration: `${hours}h ${minutes}m`,
            segments: { deep, light, rem },
            lastUpdate: Date.now()
        };

        localStorage.setItem('pulseTrackSleep', JSON.stringify(this.data));
    }

    updateUI() {
        if (!this.durationEl) return;

        this.durationEl.textContent = this.data.duration;
        
        // Update bars
        if (this.deepBar) this.deepBar.style.width = `${this.data.segments.deep}%`;
        if (this.lightBar) this.lightBar.style.width = `${this.data.segments.light}%`;
        if (this.remBar) this.remBar.style.width = `${this.data.segments.rem}%`;

        // Update text labels
        if (this.deepText) this.deepText.textContent = `Deep: ${this.data.segments.deep}%`;
        if (this.lightText) this.lightText.textContent = `Light: ${this.data.segments.light}%`;
        if (this.remText) this.remText.textContent = `REM: ${this.data.segments.rem}%`;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.sleepTracker = new SleepTracker();
    window.sleepTracker.init();
});
