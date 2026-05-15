/**
 * PulseTrack - User Authentication & Identity
 */

class AuthManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('pulseTrackCurrentUser')) || null;
        this.users = JSON.parse(localStorage.getItem('pulseTrackUsers')) || {};
        
        // UI Elements
        this.loginOverlay = document.getElementById('login-overlay');
        this.emailInput = document.getElementById('user-email-input');
        this.pinInput = document.getElementById('user-pin-input');
        this.nameInput = document.getElementById('user-name-input');
        this.submitBtn = document.getElementById('login-submit-btn');
        
        // Display Elements
        this.headerName = document.getElementById('user-name-header');
        this.profileName = document.getElementById('user-name-profile');
        this.leaderboardName = document.getElementById('leaderboard-user-name');
        this.initials = document.querySelectorAll('.user-initial');
        
        // Image Upload
        this.uploadBtn = document.getElementById('btn-upload-profile');
        this.imgInput = document.getElementById('input-profile-img');
        
        this.resetBtn = document.getElementById('btn-reset-app');
        this.resetPermissionsBtn = document.getElementById('btn-reset-permissions');
        this.logoutBtn = document.getElementById('btn-logout');
        this.headerProfileBtn = document.getElementById('header-profile-btn');
        
        // Edit Profile
        this.editNameInput = document.getElementById('edit-profile-name');
        this.editEmailInput = document.getElementById('edit-profile-email');
        this.saveProfileBtn = document.getElementById('btn-save-profile');
        this.profileEmail = document.getElementById('user-email-profile');
        this.toggleEditBtn = document.getElementById('btn-toggle-edit');
        this.cancelEditBtn = document.getElementById('btn-cancel-edit');
        this.editSection = document.getElementById('edit-profile-section');
        
        // Tabs
        this.tabLogin = document.getElementById('tab-login');
        this.tabRegister = document.getElementById('tab-register');
        this.authMode = 'login'; // 'login' or 'register'
    }

    init() {
        if (!this.currentUser) {
            this.showLogin();
        } else {
            this.applyUserIdentity();
        }

        // Tab Listeners
        if (this.tabLogin) {
            this.tabLogin.addEventListener('click', () => this.toggleAuthMode('login'));
        }
        if (this.tabRegister) {
            this.tabRegister.addEventListener('click', () => this.toggleAuthMode('register'));
        }

        // Header Profile Shortcut
        if (this.headerProfileBtn) {
            this.headerProfileBtn.addEventListener('click', () => {
                const profileNavBtn = document.querySelector('.nav-btn[data-target="view-profile"]');
                if (profileNavBtn) profileNavBtn.click();
            });
        }

        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', () => this.handleAuth());
        }

        // Enter key listeners
        [this.emailInput, this.pinInput, this.nameInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.handleAuth();
                });
            }
        });

        // Image Listeners
        if (this.uploadBtn && this.imgInput) {
            this.uploadBtn.addEventListener('click', () => this.imgInput.click());
            this.imgInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                if (confirm("This will permanently delete ALL data for ALL users. Proceed?")) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }

        if (this.resetPermissionsBtn) {
            this.resetPermissionsBtn.addEventListener('click', () => {
                localStorage.removeItem('pulseTrackPermissions');
                location.reload();
            });
        }

        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }

        // Edit Profile
        if (this.saveProfileBtn) {
            this.saveProfileBtn.addEventListener('click', () => this.saveProfile());
        }
        if (this.toggleEditBtn) {
            this.toggleEditBtn.addEventListener('click', () => {
                this.editSection.classList.remove('hidden');
                this.toggleEditBtn.classList.add('hidden');
            });
        }
        if (this.cancelEditBtn) {
            this.cancelEditBtn.addEventListener('click', () => {
                this.editSection.classList.add('hidden');
                this.toggleEditBtn.classList.remove('hidden');
            });
        }
    }

    toggleAuthMode(mode) {
        this.authMode = mode;
        const title = document.getElementById('login-title');
        const subtitle = document.getElementById('login-subtitle');
        const helper = document.getElementById('login-helper');
        
        if (mode === 'login') {
            this.tabLogin.classList.add('active');
            this.tabRegister.classList.remove('active');
            this.tabLogin.style.color = 'white';
            this.tabRegister.style.color = 'var(--text-muted)';
            this.nameInput.style.display = 'none';
            title.textContent = "Welcome Back";
            subtitle.textContent = "Login to access your fitness data.";
            this.submitBtn.textContent = "Login";
            if (helper) helper.innerHTML = 'New user? Click the <strong>Register</strong> tab above.';
        } else {
            this.tabLogin.classList.remove('active');
            this.tabRegister.classList.add('active');
            this.tabLogin.style.color = 'var(--text-muted)';
            this.tabRegister.style.color = 'white';
            this.nameInput.style.display = 'block';
            title.textContent = "Join PulseTrack";
            subtitle.textContent = "Create an account to start tracking.";
            this.submitBtn.textContent = "Create Account";
            if (helper) helper.innerHTML = 'Already have an account? Click the <strong>Login</strong> tab.';
        }
    }

    showLogin() {
        if (this.loginOverlay) {
            this.loginOverlay.classList.remove('hidden');
            this.toggleAuthMode('login'); // Default to login
        }
    }

    handleAuth() {
        const email = this.emailInput.value.trim().toLowerCase();
        const pin = this.pinInput.value.trim();
        const name = this.nameInput.value.trim();

        if (!email || !pin) {
            alert("Email and PIN are required.");
            return;
        }

        if (this.authMode === 'login') {
            // Login Mode
            if (this.users[email]) {
                if (this.users[email].pin === pin) {
                    this.login(email);
                } else {
                    alert("Incorrect PIN for this email address.");
                }
            } else {
                alert("Account not found. Please switch to 'Register' tab to create an account.");
            }
        } else {
            // Register Mode
            if (this.users[email]) {
                alert("An account already exists with this email. Please Login instead.");
                this.toggleAuthMode('login');
            } else {
                if (!name) {
                    alert("Please provide your name to register.");
                    return;
                }
                this.register(email, pin, name);
            }
        }
    }

    register(email, pin, name) {
        this.users[email] = {
            email: email,
            pin: pin,
            name: name,
            image: null,
            joinedAt: new Date().toISOString()
        };
        this.saveUsers();
        this.login(email);
        alert(`Welcome, ${name}! Your account has been created.`);
    }

    login(email) {
        this.currentUser = this.users[email];
        localStorage.setItem('pulseTrackCurrentUser', JSON.stringify(this.currentUser));
        
        this.initWelcomeMessage(this.currentUser.name);
        this.applyUserIdentity();
        this.loginOverlay.classList.add('hidden');

        // Trigger permissions check after login
        if (window.weatherManager) {
            window.weatherManager.init();
        }
        if (window.socialManager) {
            window.socialManager.init();
        }
        
        // Clear inputs
        this.emailInput.value = '';
        this.pinInput.value = '';
        this.nameInput.value = '';
    }

    logout() {
        if (confirm("Logout and return to login screen?")) {
            localStorage.removeItem('pulseTrackCurrentUser');
            this.currentUser = null;
            location.reload();
        }
    }

    saveUsers() {
        localStorage.setItem('pulseTrackUsers', JSON.stringify(this.users));
    }

    applyUserIdentity() {
        if (!this.currentUser) return;

        const firstName = this.currentUser.name.split(' ')[0];
        const initial = firstName.charAt(0).toUpperCase();

        if (this.headerName) this.headerName.textContent = firstName;
        if (this.profileName) this.profileName.textContent = this.currentUser.name;
        if (this.profileEmail) this.profileEmail.textContent = this.currentUser.email;
        if (this.leaderboardName) this.leaderboardName.textContent = `${this.currentUser.name} (You)`;

        // Populate edit fields
        if (this.editNameInput) this.editNameInput.value = this.currentUser.name;
        if (this.editEmailInput) this.editEmailInput.value = this.currentUser.email;

        this.initials.forEach(el => {
            if (this.currentUser.image) {
                el.innerHTML = `<img src="${this.currentUser.image}" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                el.textContent = initial;
                el.innerHTML = initial; // Ensure text is set
            }
        });
    }

    saveProfile() {
        if (!this.currentUser) return;

        const newName = this.editNameInput.value.trim();
        const newEmail = this.editEmailInput.value.trim().toLowerCase();
        const oldEmail = this.currentUser.email;

        if (!newName || !newEmail) {
            alert("Name and Email cannot be empty.");
            return;
        }

        if (!newEmail.includes('@')) {
            alert("Please enter a valid email address.");
            return;
        }

        // Check if new email is taken by someone else
        if (newEmail !== oldEmail && this.users[newEmail]) {
            alert("This email is already registered by another user.");
            return;
        }

        // Update name
        this.currentUser.name = newName;

        // Handle email change (migration)
        if (newEmail !== oldEmail) {
            // Move user data to new email key
            this.users[newEmail] = { ...this.users[oldEmail], email: newEmail, name: newName };
            delete this.users[oldEmail];

            // Migrate localStorage data keys
            const dataKeys = ['pulseTrackFriends', 'pulseTrackChats'];
            dataKeys.forEach(key => {
                const oldData = localStorage.getItem(`${key}_${oldEmail}`);
                if (oldData) {
                    localStorage.setItem(`${key}_${newEmail}`, oldData);
                    localStorage.removeItem(`${key}_${oldEmail}`);
                }
            });

            // Migrate global requests
            const globalReqs = JSON.parse(localStorage.getItem('pulseTrackGlobalRequests')) || {};
            if (globalReqs[oldEmail]) {
                globalReqs[newEmail] = globalReqs[oldEmail];
                delete globalReqs[oldEmail];
                localStorage.setItem('pulseTrackGlobalRequests', JSON.stringify(globalReqs));
            }

            this.currentUser.email = newEmail;
        } else {
            // Just update name in users registry
            this.users[oldEmail].name = newName;
        }

        // Save everything
        localStorage.setItem('pulseTrackCurrentUser', JSON.stringify(this.currentUser));
        this.saveUsers();
        this.applyUserIdentity();

        // Re-init social manager if email changed
        if (newEmail !== oldEmail && window.socialManager) {
            window.socialManager.init();
        }

        // Hide edit section after save
        if (this.editSection) {
            this.editSection.classList.add('hidden');
            this.toggleEditBtn.classList.remove('hidden');
        }

        alert("✅ Profile updated successfully!");
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file || !this.currentUser) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            this.currentUser.image = base64;
            this.users[this.currentUser.email].image = base64;
            
            localStorage.setItem('pulseTrackCurrentUser', JSON.stringify(this.currentUser));
            this.saveUsers();
            this.applyUserIdentity();
        };
        reader.readAsDataURL(file);
    }

    initWelcomeMessage(name) {
        const chats = JSON.parse(localStorage.getItem('pulseTrackChats')) || {};
        const communityBot = "PulseTrack Community";
        
        if (!chats[communityBot]) {
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            
            chats[communityBot] = [
                {
                    sender: 'friend',
                    text: `Welcome, ${name}. I am your PulseTrack AI Assistant. This platform helps to track your daily activities and improve yourself. Ask me anything about your progress!`,
                    time: timeStr,
                    timestamp: Date.now()
                }
            ];
            localStorage.setItem('pulseTrackChats', JSON.stringify(chats));
            
            // Set as last chat so it shows up in FAB
            localStorage.setItem('pulseTrackLastChat', communityBot);
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    window.authManager.init();
});
