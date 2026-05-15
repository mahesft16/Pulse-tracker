/**
 * PulseTrack - Web Bluetooth Heart Rate Monitor integration
 */

class HeartRateMonitor {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.isConnecting = false;
        
        // UI Elements
        this.btnConnect = document.getElementById('btn-connect-hr');
        this.hrValueEl = document.getElementById('hr-value');
        this.hrStatusEl = document.getElementById('hr-status');
    }

    init() {
        if (!this.btnConnect) return;

        // Check if Web Bluetooth is supported
        if (!navigator.bluetooth) {
            this.hrStatusEl.textContent = "Web Bluetooth not supported on this browser/device.";
            this.btnConnect.style.opacity = "0.5";
            this.btnConnect.style.cursor = "not-allowed";
            return;
        }

        this.btnConnect.addEventListener('click', () => {
            if (this.device && this.device.gatt.connected) {
                this.disconnect();
            } else {
                this.connect();
            }
        });
    }

    async connect() {
        if (this.isConnecting) return;
        this.isConnecting = true;
        this.updateStatus("Scanning for heart rate monitors...");

        try {
            // Broaden search: Some devices don't advertise the HR service directly
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['heart_rate']
            });

            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

            this.updateStatus("Connecting to " + this.device.name + "...");
            
            this.server = await this.device.gatt.connect();
            const service = await this.server.getPrimaryService('heart_rate');
            
            // Heart Rate Measurement Characteristic (0x2A37)
            this.characteristic = await service.getCharacteristic('heart_rate_measurement');
            
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', this.handleHeartRateData.bind(this));
            
            this.updateStatus("Connected to " + this.device.name);
            this.btnConnect.innerHTML = '<i class="fa-solid fa-stop"></i>'; // Change icon to stop
            this.btnConnect.classList.add('active');
            
        } catch (error) {
            console.error("Bluetooth Error:", error);
            // Provide specific feedback
            if (error.name === 'NotFoundError') {
                this.updateStatus("No device selected. Please try again.");
            } else if (error.name === 'SecurityError') {
                this.updateStatus("Error: Must use a secure connection (HTTPS) or localhost.");
            } else if (error.message.includes('User cancelled')) {
                this.updateStatus("Pairing cancelled by user.");
            } else {
                this.updateStatus("Error: " + error.message);
            }
        } finally {
            this.isConnecting = false;
        }
    }

    disconnect() {
        if (!this.device) return;
        
        this.updateStatus("Disconnecting...");
        if (this.device.gatt.connected) {
            this.device.gatt.disconnect();
        } else {
            this.onDisconnected();
        }
    }

    onDisconnected() {
        this.updateStatus("Disconnected. Click the heart to reconnect.");
        this.hrValueEl.textContent = "-- bpm";
        this.btnConnect.innerHTML = '<i class="fa-solid fa-heart-pulse"></i>';
        this.btnConnect.classList.remove('active');
        this.device = null;
        this.server = null;
        this.characteristic = null;
    }

    handleHeartRateData(event) {
        const value = event.target.value;
        // Parse Heart Rate Measurement value
        // The first byte contains flags
        const flags = value.getUint8(0);
        
        // 0th bit of flags tells us if the HR value is 8-bit or 16-bit format
        const rate16Bits = flags & 0x1;
        
        let heartRate;
        if (rate16Bits) {
            heartRate = value.getUint16(1, true);
        } else {
            heartRate = value.getUint8(1);
        }
        
        // Update UI
        this.hrValueEl.textContent = heartRate + " bpm";
        
        // Optional: Make the heart icon pulse faster based on HR
        const pulseDuration = 60 / heartRate;
        this.btnConnect.style.animation = `pulse-height ${pulseDuration}s infinite alternate`;
    }

    updateStatus(message) {
        if (this.hrStatusEl) {
            this.hrStatusEl.textContent = message;
        }
        console.log("HR Monitor:", message);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    const hrMonitor = new HeartRateMonitor();
    hrMonitor.init();
});
