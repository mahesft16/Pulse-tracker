/**
 * PulseTrack - Sensor Management
 * Handles DeviceMotion and DeviceOrientation for activity tracking.
 */

class MotionTracker {
    constructor() {
        this.isTracking = false;
        
        // State
        this.steps = 0;
        this.jumps = 0;
        this.runTimeSeconds = 0;
        this.currentActivity = 'idle'; // idle, walking, running, jumping
        
        // Accelerometer Data history for analysis
        this.accelData = [];
        this.lastStepTime = 0;
        this.lastJumpTime = 0;
        
        // Thresholds
        this.STEP_THRESHOLD = 12.0; // Adjust based on testing
        this.RUN_THRESHOLD = 18.0;
        this.JUMP_THRESHOLD = 25.0; 
        
        this.runInterval = null;
        
        // Callbacks
        this.onUpdate = null;
    }

    async requestPermission() {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceMotionEvent.requestPermission();
                if (permissionState === 'granted') {
                    return true;
                }
            } catch (error) {
                console.error("Error requesting motion permission:", error);
            }
            return false;
        }
        // Non-iOS 13+ devices don't need explicit permission
        return true;
    }

    start() {
        if (this.isTracking) return;
        
        this.motionHandler = this.handleMotion.bind(this);
        window.addEventListener('devicemotion', this.motionHandler, true);
        this.isTracking = true;
        
        // Timer for running duration
        this.runInterval = setInterval(() => {
            if (this.currentActivity === 'running') {
                this.runTimeSeconds++;
                this.notifyUpdate();
            }
        }, 1000);
        
        console.log("Motion tracking started");
    }

    stop() {
        if (!this.isTracking) return;
        
        window.removeEventListener('devicemotion', this.motionHandler, true);
        clearInterval(this.runInterval);
        this.isTracking = false;
        this.setActivity('idle');
    }

    handleMotion(event) {
        if (!event.accelerationIncludingGravity) return;

        const { x, y, z } = event.accelerationIncludingGravity;
        
        // Calculate the magnitude of the 3D acceleration vector
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        const now = Date.now();
        
        this.processMagnitude(magnitude, now);
    }

    processMagnitude(magnitude, now) {
        // Jumping detection (high spike)
        if (magnitude > this.JUMP_THRESHOLD && now - this.lastJumpTime > 1000) {
            this.jumps++;
            this.lastJumpTime = now;
            this.setActivity('jumping');
            this.notifyUpdate();
            return;
        }
        
        // Running detection (sustained higher magnitude)
        if (magnitude > this.RUN_THRESHOLD) {
            if (now - this.lastStepTime > 300) { // faster step rate
                this.steps++;
                this.lastStepTime = now;
            }
            this.setActivity('running');
            this.notifyUpdate();
            return;
        }
        
        // Walking/Step detection (moderate magnitude crossing threshold)
        if (magnitude > this.STEP_THRESHOLD && now - this.lastStepTime > 500) {
            this.steps++;
            this.lastStepTime = now;
            this.setActivity('walking');
            this.notifyUpdate();
            return;
        }
        
        // Revert to idle if no significant movement for 2 seconds
        if (now - Math.max(this.lastStepTime, this.lastJumpTime) > 2000) {
            this.setActivity('idle');
        }
    }

    setActivity(activity) {
        if (this.currentActivity !== activity) {
            this.currentActivity = activity;
            this.notifyUpdate();
        }
    }

    notifyUpdate() {
        if (this.onUpdate) {
            this.onUpdate({
                steps: this.steps,
                jumps: this.jumps,
                runTimeMinutes: Math.floor(this.runTimeSeconds / 60),
                activity: this.currentActivity,
                calories: this.calculateCalories()
            });
        }
    }
    
    calculateCalories() {
        // Rough estimation: ~0.04 kcal per step, + extra for jumps/running
        return Math.floor((this.steps * 0.04) + (this.jumps * 0.5) + (this.runTimeSeconds * 0.15));
    }
}

// Export to global scope
window.MotionTracker = MotionTracker;
