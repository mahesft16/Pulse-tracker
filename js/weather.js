/**
 * PulseTrack - Weather & Permissions Manager
 */

class WeatherManager {
    constructor() {
        this.tempDisplay = document.getElementById('temp-display');
        this.healthTempDisplay = document.getElementById('health-temp-value');
        this.permissionsOverlay = document.getElementById('permissions-overlay');
        this.grantBtn = document.getElementById('btn-grant-permissions');
        this.permissionsBanner = document.getElementById('permissions-banner');
        this.bannerFixBtn = document.getElementById('btn-banner-fix');
        
        this.hasPermissions = localStorage.getItem('pulseTrackPermissions') === 'granted';
    }

    init() {
        // Show/Hide warning banner based on permission status
        if (!this.hasPermissions) {
            if (this.permissionsBanner) this.permissionsBanner.classList.remove('hidden');
            
            // Check if user is logged in before showing the big overlay
            const currentUser = localStorage.getItem('pulseTrackCurrentUser');
            if (currentUser) {
                this.showPermissions();
            }
        } else {
            if (this.permissionsBanner) this.permissionsBanner.classList.add('hidden');
            this.fetchWeather();
        }

        if (this.grantBtn) {
            this.grantBtn.addEventListener('click', () => this.handleGrantPermissions());
        }

        if (this.bannerFixBtn) {
            this.bannerFixBtn.addEventListener('click', () => this.showPermissions());
        }
    }

    showPermissions() {
        if (this.permissionsOverlay) {
            this.permissionsOverlay.classList.remove('hidden');
        }
    }

    handleGrantPermissions() {
        // In a real app, this would trigger navigator.geolocation.getCurrentPosition etc.
        // For this demo, we'll simulate the system permission prompts
        alert("System: PulseTrack is requesting access to your Location, Bluetooth, and Weather data. [Allow]");
        
        this.hasPermissions = true;
        localStorage.setItem('pulseTrackPermissions', 'granted');
        
        if (this.permissionsOverlay) {
            this.permissionsOverlay.classList.add('hidden');
        }

        if (this.permissionsBanner) {
            this.permissionsBanner.classList.add('hidden');
        }
        
        this.fetchWeather();
    }

    fetchWeather() {
        if (!this.tempDisplay) return;

        // Simulate fetching from a weather app/API
        this.tempDisplay.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing...`;

        setTimeout(() => {
            // Mock data representing the "default weather app" data
            const mockTemp = Math.floor(Math.random() * 10) + 22; // 22-32 range
            const icons = ['fa-sun', 'fa-cloud-sun', 'fa-cloud'];
            const icon = icons[Math.floor(Math.random() * icons.length)];
            
            const tempString = `${mockTemp}°C`;
            this.tempDisplay.innerHTML = `<i class="fa-solid ${icon}"></i> ${tempString}`;
            this.tempDisplay.style.animation = "fadeIn 0.5s ease-in";

            // Sync with Health View Temperature Box
            if (this.healthTempDisplay) {
                this.healthTempDisplay.innerHTML = `${mockTemp}<span class="stat-unit">°C</span>`;
            }
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.weatherManager = new WeatherManager();
    window.weatherManager.init();
});
