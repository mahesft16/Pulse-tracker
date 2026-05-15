/**
 * PulseTrack - Reminder & Notification Manager
 */

class ReminderManager {
    constructor() {
        this.noteInput = document.getElementById('reminder-note');
        this.timeInput = document.getElementById('reminder-time');
        this.addBtn = document.getElementById('btn-add-reminder');
        this.listContainer = document.getElementById('reminder-list');
        
        this.remindersKey = 'pulseTrackReminders';
        this.reminders = JSON.parse(localStorage.getItem(this.remindersKey)) || [];
    }

    init() {
        this.renderReminders();

        if (this.addBtn) {
            this.addBtn.addEventListener('click', () => this.addReminder());
        }

        // Check for notifications every 30 seconds
        setInterval(() => this.checkReminders(), 30000);
        
        // Initial permission request
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    addReminder() {
        const note = this.noteInput.value.trim();
        const time = this.timeInput.value;

        if (!note || !time) {
            alert("Please provide both a note and a time.");
            return;
        }

        const reminder = {
            id: Date.now(),
            note: note,
            time: time,
            notified: false
        };

        this.reminders.push(reminder);
        this.saveReminders();
        this.renderReminders();
        
        this.noteInput.value = '';
        this.timeInput.value = '';

        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }

    saveReminders() {
        localStorage.setItem(this.remindersKey, JSON.stringify(this.reminders));
    }

    renderReminders() {
        if (!this.listContainer) return;
        
        if (this.reminders.length === 0) {
            this.listContainer.innerHTML = '<p class="text-muted" style="font-size: 12px; text-align: center; padding: 10px;">No reminders set for today.</p>';
            return;
        }

        this.listContainer.innerHTML = '';
        this.reminders.sort((a, b) => a.time.localeCompare(b.time)).forEach(rem => {
            const item = document.createElement('div');
            item.className = 'schedule-item';
            item.style.padding = '12px';
            item.style.marginBottom = '0';
            
            item.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:14px; font-weight:600; color:white;">${rem.note}</span>
                        <span style="font-size:12px; color:var(--accent-blue);">${rem.time}</span>
                    </div>
                </div>
                <button onclick="window.reminderManager.deleteReminder(${rem.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            this.listContainer.appendChild(item);
        });
    }

    deleteReminder(id) {
        this.reminders = this.reminders.filter(r => r.id !== id);
        this.saveReminders();
        this.renderReminders();
    }

    checkReminders() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        this.reminders.forEach(rem => {
            if (rem.time === currentTime && !rem.notified) {
                this.triggerNotification(rem);
                rem.notified = true;
                this.saveReminders();
            }
        });
    }

    triggerNotification(rem) {
        if (Notification.permission === 'granted') {
            new Notification("PulseTrack Reminder", {
                body: rem.note,
                icon: "img/logo.png"
            });
        } else {
            // Fallback to alert if notifications are denied
            alert(`PULSETRACK REMINDER: ${rem.note}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reminderManager = new ReminderManager();
    window.reminderManager.init();
});
