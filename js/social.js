/**
 * PulseTrack - Social, Chat & Communication
 */

class SocialManager {
    constructor() {
        this.refreshUserState();
        
        // UI Elements - Chat
        this.chatOverlay = document.getElementById('chat-overlay');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendMsgBtn = document.getElementById('btn-send-msg');
        this.closeChatBtn = document.getElementById('btn-close-chat');
        this.chatFriendName = document.getElementById('chat-friend-name');
        this.chatFriendAvatar = document.getElementById('chat-friend-avatar');

        // UI Elements - Invites & Lists
        this.inviteInput = document.getElementById('invite-email');
        this.sendInviteBtn = document.getElementById('btn-send-invite');
        this.friendListContainer = document.getElementById('friend-list');
        this.requestListContainer = document.getElementById('friend-requests-list');
        
        this.aiHeaderBtn = document.getElementById('btn-open-ai');
    }

    refreshUserState() {
        this.currentUser = JSON.parse(localStorage.getItem('pulseTrackCurrentUser'));
        const emailSuffix = this.currentUser ? `_${this.currentUser.email}` : '';
        
        this.friendsKey = `pulseTrackFriends${emailSuffix}`;
        this.chatsKey = `pulseTrackChats${emailSuffix}`;

        this.activeChatFriend = null;
        this.chatHistory = JSON.parse(localStorage.getItem(this.chatsKey)) || {};
        
        this.friends = JSON.parse(localStorage.getItem(this.friendsKey)) || [
            { id: 'bot-1', name: 'PulseTrack Community', initial: 'P', status: 'Official Bot', type: 'bot' },
            { id: 'user-2', name: 'Sarah Chen', initial: 'S', status: 'Active 5m ago', type: 'user' }
        ];

        // Load incoming friend requests from the global queue for this user
        if (this.currentUser) {
            const globalRequests = JSON.parse(localStorage.getItem('pulseTrackGlobalRequests')) || {};
            this.friendRequests = globalRequests[this.currentUser.email] || [];
        } else {
            this.friendRequests = [];
        }
    }

    init() {
        this.refreshUserState();
        if (!this.currentUser) return; // Wait for login

        // Initial Render
        this.renderFriends();
        this.renderRequests();

        // AI Header Button
        if (this.aiHeaderBtn) {
            this.aiHeaderBtn.addEventListener('click', () => {
                this.openChat('PulseTrack Community', 'P');
            });
        }

        // Chat Listeners
        if (this.sendMsgBtn) {
            this.sendMsgBtn.addEventListener('click', () => this.sendMessage());
        }
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
            this.chatInput.addEventListener('input', () => {
                if (this.chatInput.value.trim().length > 0) {
                    this.sendMsgBtn.style.display = 'block';
                    this.chatInput.parentElement.querySelector('div').style.display = 'none';
                } else {
                    this.sendMsgBtn.style.display = 'none';
                    this.chatInput.parentElement.querySelector('div').style.display = 'flex';
                }
            });
        }
        if (this.closeChatBtn) {
            this.closeChatBtn.addEventListener('click', () => this.closeChat());
        }

        // Invite Listeners
        if (this.sendInviteBtn) {
            this.sendInviteBtn.addEventListener('click', () => {
                const target = this.inviteInput.value.trim();
                if (target) {
                    this.sendFriendRequest(target);
                    this.inviteInput.value = '';
                }
            });
        }
    }

    // --- Friend Request Logic ---
    sendFriendRequest(targetEmail) {
        const email = targetEmail.trim().toLowerCase();
        
        if (!email) return;

        // 1. Validate email format
        if (!email.includes('@')) {
            alert("Please enter a valid email address.");
            return;
        }

        // 2. Check if inviting self
        if (this.currentUser && email === this.currentUser.email.toLowerCase()) {
            alert("You cannot send a friend request to yourself!");
            return;
        }

        // 3. Check if the target is a REGISTERED user
        const allUsers = JSON.parse(localStorage.getItem('pulseTrackUsers')) || {};
        if (!allUsers[email]) {
            alert(`No registered user found with email "${email}". They need to register on PulseTrack first!`);
            return;
        }

        // 4. Check if already a friend
        const isFriend = this.friends.some(f => (f.email && f.email.toLowerCase() === email) || (f.name === allUsers[email].name));
        if (isFriend) {
            alert(`${allUsers[email].name} is already your friend!`);
            return;
        }

        // 5. Check if request already sent (in recipient's queue)
        const globalRequests = JSON.parse(localStorage.getItem('pulseTrackGlobalRequests')) || {};
        const recipientQueue = globalRequests[email] || [];
        const alreadySent = recipientQueue.some(r => r.fromEmail === this.currentUser.email);
        if (alreadySent) {
            alert(`You already sent a request to ${allUsers[email].name}. Waiting for their response.`);
            return;
        }

        // 6. Send the request — store it in the RECIPIENT's global queue
        const newReq = {
            id: 'req-' + Date.now(),
            name: this.currentUser.name,
            email: this.currentUser.email,
            fromEmail: this.currentUser.email,
            initial: this.currentUser.name.charAt(0).toUpperCase()
        };

        if (!globalRequests[email]) {
            globalRequests[email] = [];
        }
        globalRequests[email].push(newReq);
        localStorage.setItem('pulseTrackGlobalRequests', JSON.stringify(globalRequests));

        alert(`✅ Friend request sent to ${allUsers[email].name}! They will see it when they log in.`);
    }

    acceptFriendRequest(id) {
        const reqIndex = this.friendRequests.findIndex(r => r.id === id);
        if (reqIndex === -1) return;

        const req = this.friendRequests[reqIndex];
        
        // Add the sender as MY friend
        const newFriend = {
            id: 'user-' + Date.now(),
            name: req.name,
            email: req.fromEmail,
            initial: req.initial,
            status: 'Just added',
            type: 'user'
        };
        this.friends.push(newFriend);
        this.saveFriends();

        // Also add ME as a friend in the SENDER's friend list
        const senderFriendsKey = `pulseTrackFriends_${req.fromEmail}`;
        const senderFriends = JSON.parse(localStorage.getItem(senderFriendsKey)) || [
            { id: 'bot-1', name: 'PulseTrack Community', initial: 'P', status: 'Official Bot', type: 'bot' },
            { id: 'user-2', name: 'Sarah Chen', initial: 'S', status: 'Active 5m ago', type: 'user' }
        ];
        const alreadyAdded = senderFriends.some(f => f.email === this.currentUser.email);
        if (!alreadyAdded) {
            senderFriends.push({
                id: 'user-' + Date.now(),
                name: this.currentUser.name,
                email: this.currentUser.email,
                initial: this.currentUser.name.charAt(0).toUpperCase(),
                status: 'Just added',
                type: 'user'
            });
            localStorage.setItem(senderFriendsKey, JSON.stringify(senderFriends));
        }

        // Remove request from global queue
        this.friendRequests.splice(reqIndex, 1);
        this.saveRequests();
        this.renderFriends();
        this.renderRequests();
        
        alert(`${req.name} is now your friend! You can now message each other.`);
    }

    rejectFriendRequest(id) {
        const reqIndex = this.friendRequests.findIndex(r => r.id === id);
        if (reqIndex === -1) return;

        const name = this.friendRequests[reqIndex].name;
        this.friendRequests.splice(reqIndex, 1);
        
        this.saveRequests();
        this.renderRequests();
        
        alert(`Request from ${name} declined.`);
    }

    // --- Rendering ---
    renderFriends() {
        if (!this.friendListContainer) return;
        this.friendListContainer.innerHTML = '';

        if (this.friends.length === 0) {
            this.friendListContainer.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px;">No friends yet. Invite someone!</p>';
            return;
        }

        this.friends.forEach(friend => {
            const friendEl = document.createElement('div');
            friendEl.className = 'friend-item';
            
            const isBot = friend.type === 'bot';
            const statusColor = isBot ? 'text-green' : 'text-muted';
            const pulseDot = isBot ? '<span class="pulse-dot" style="width:6px; height:6px; display:inline-block; margin-right:4px;"></span> ' : '';

            friendEl.innerHTML = `
                <div class="friend-info">
                    <div class="avatar" style="width:40px; height:40px; font-size:14px; background:${isBot ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #f97316, #c2410c)'};">${friend.initial}</div>
                    <div>
                        <h4 style="font-size: 15px;">${friend.name}</h4>
                        <p class="${statusColor}" style="font-size: 11px;">${pulseDot}${friend.status}</p>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="action-btn btn-msg" onclick="window.socialManager.openChat('${friend.name}', '${friend.initial}')"><i class="fa-solid fa-comment"></i></button>
                    <button class="action-btn btn-loc" onclick="window.socialManager.viewFriendLocation('${friend.name}')"><i class="fa-solid fa-location-dot"></i></button>
                </div>
            `;
            this.friendListContainer.appendChild(friendEl);
        });
    }

    renderRequests() {
        if (!this.requestListContainer) return;
        this.requestListContainer.innerHTML = '';

        if (this.friendRequests.length === 0) {
            this.requestListContainer.innerHTML = '<p class="text-muted" style="font-size: 13px; text-align: center; padding: 10px;">No pending requests</p>';
            return;
        }

        this.friendRequests.forEach(req => {
            const reqEl = document.createElement('div');
            reqEl.className = 'request-item';
            reqEl.innerHTML = `
                <div class="friend-info">
                    <div class="avatar" style="width:36px; height:36px; font-size:13px; background: rgba(255,255,255,0.1); color: white;">${req.initial}</div>
                    <div>
                        <h4 style="font-size: 14px;">${req.name}</h4>
                        <p class="text-muted" style="font-size: 10px;">Sent you a request</p>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn-agree" onclick="window.socialManager.acceptFriendRequest('${req.id}')">Agree</button>
                    <button class="btn-disagree" onclick="window.socialManager.rejectFriendRequest('${req.id}')">No</button>
                </div>
            `;
            this.requestListContainer.appendChild(reqEl);
        });
    }

    // --- Persistence ---
    saveFriends() {
        localStorage.setItem(this.friendsKey, JSON.stringify(this.friends));
    }

    saveRequests() {
        if (!this.currentUser) return;
        const globalRequests = JSON.parse(localStorage.getItem('pulseTrackGlobalRequests')) || {};
        globalRequests[this.currentUser.email] = this.friendRequests;
        localStorage.setItem('pulseTrackGlobalRequests', JSON.stringify(globalRequests));
    }

    saveChats() {
        localStorage.setItem(this.chatsKey, JSON.stringify(this.chatHistory));
    }

    // --- Chat Logic ---
    openChat(friendName, initial) {
        this.chatHistory = JSON.parse(localStorage.getItem(this.chatsKey)) || {};
        this.activeChatFriend = friendName;
        localStorage.setItem('pulseTrackLastChat', friendName);
        
        if (this.chatOverlay) {
            this.chatOverlay.classList.add('active');
            this.chatFriendName.textContent = friendName;
            this.chatFriendAvatar.textContent = initial;
            this.chatFriendAvatar.style.background = friendName === "PulseTrack Community" ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'linear-gradient(135deg, #f97316, #c2410c)';
            this.renderMessages();

            // Auto-Welcome for AI
            if (friendName === "PulseTrack Community" && (!this.chatHistory[friendName] || this.chatHistory[friendName].length === 0)) {
                setTimeout(() => {
                    this.triggerBotReply("AUTO_WELCOME");
                }, 800);
            }
        }
    }

    closeChat() {
        this.chatOverlay.classList.remove('active');
        this.activeChatFriend = null;
    }

    sendMessage() {
        if (!this.chatInput || !this.activeChatFriend) return;
        const text = this.chatInput.value.trim();
        if (!text) return;

        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        const msg = { sender: 'me', text: text, time: timeStr, timestamp: Date.now() };
        
        if (!this.chatHistory[this.activeChatFriend]) {
            this.chatHistory[this.activeChatFriend] = [];
        }
        
        this.chatHistory[this.activeChatFriend].push(msg);
        this.saveChats();
        this.chatInput.value = '';
        this.renderMessages();

        // Trigger Bot Reply
        this.triggerBotReply(text);
    }

    triggerBotReply(userText) {
        const friend = this.activeChatFriend;
        const input = userText.toLowerCase();
        let replyText = "I'm your PulseTrack Pro AI. I can help with bodybuilding, advanced workout techniques, and personalized nutrition. What's your fitness goal today?";
        let delay = 1000 + Math.random() * 1000;

        if (friend === "PulseTrack Community") {
            // Advanced Conversational Knowledge Base
            if (userText === "AUTO_WELCOME") {
                replyText = `### Welcome to PulseTrack Pro AI! 🤖\n\nI am your advanced fitness companion. I can help you with:\n\n*   **Bodybuilding Techniques** (Progressive Overload, Hypertrophy)\n*   **Diet Planning** (Macros, Caloric Surpluses/Deficits)\n*   **Workout Splits** (PPL, Upper/Lower, Bro Splits)\n*   **Recovery Tips** (Active recovery, sleep optimization)\n\nHow can I help you crush your goals today?`;
            } else if (input.includes('hello') || input.includes('hi')) {
                replyText = `Hello ${this.currentUser.name}! I am your PulseTrack Pro AI. I'm ready to help you optimize your training and nutrition. What are we working on today?`;
            } else if (input.includes('muscle') || input.includes('build') || input.includes('bodybuilding')) {
                replyText = "### 🏋️‍♂️ Building Maximum Muscle\n\nTo maximize **Hypertrophy**, you should focus on:\n\n1.  **Volume**: 10-20 sets per muscle group per week.\n2.  **Intensity**: Training within 1-3 reps of failure.\n3.  **Frequency**: Hitting each muscle at least 2 times per week.\n4.  **Mechanical Tension**: Controlled eccentrics and a full range of motion.";
            } else if (input.includes('diet') || input.includes('eat') || input.includes('protein') || input.includes('nutrition')) {
                replyText = "### 🥗 Nutrition Strategy\n\nFor optimal body composition:\n\n*   **Protein**: Aim for 1.8g to 2.2g per kg of body weight.\n*   **Carbs**: 4-7g per kg depending on activity level.\n*   **Fats**: 0.5-1g per kg for hormonal health.\n*   **Surplus**: +200-300 kcal for lean bulking.\n*   **Deficit**: -500 kcal for sustainable fat loss.";
            } else if (input.includes('technique') || input.includes('form') || input.includes('progressive overload')) {
                replyText = "### 📈 Advanced Techniques\n\n**Progressive Overload** is the most important law of lifting. You can achieve it by:\n\n*   Adding weight to the bar.\n*   Doing more reps with the same weight.\n*   Improving your form and control.\n*   Decreasing rest intervals.\n\nAlways prioritize **Form** over weight to avoid injury and maximize muscle engagement!";
            } else if (input.includes('plan') || input.includes('routine') || input.includes('split')) {
                replyText = "### 🗓 Recommended Splits\n\n*   **Push/Pull/Legs (6 Days)**: The gold standard for frequency and recovery.\n*   **Upper/Lower (4 Days)**: Great for busy professionals.\n*   **Full Body (3 Days)**: Best for beginners to build a strong foundation.\n\nWhich one fits your schedule best?";
            } else if (input.includes('who are you')) {
                replyText = "I am the **PulseTrack Pro AI**, an advanced Large Language Model specialized in sports science, kinesiology, and nutritional therapy. I'm here to ensure you get the best results from every single rep.";
            } else if (input.includes('help') || input.includes('question')) {
                replyText = "I'm here to solve any questions you have! You can ask things like:\n\n*   'How do I calculate my maintenance calories?'\n*   'What are the best exercises for lats?'\n*   'How much sleep do I need for recovery?'";
            } else {
                replyText = "That's an interesting topic! From a sports science perspective, consistency and tracking are your biggest allies. Would you like me to explain how that relates to your specific goal?";
            }
        }

        setTimeout(() => {
            const replyTime = new Date();
            const replyTimeStr = replyTime.getHours().toString().padStart(2, '0') + ':' + replyTime.getMinutes().toString().padStart(2, '0');
            const reply = { 
                sender: 'friend', 
                text: replyText, 
                time: replyTimeStr, 
                timestamp: Date.now(),
                isAI: (friend === "PulseTrack Community")
            };
            if (!this.chatHistory[friend]) this.chatHistory[friend] = [];
            this.chatHistory[friend].push(reply);
            this.saveChats();
            if (this.activeChatFriend === friend) this.renderMessages();
        }, delay);
    }

    renderMessages() {
        if (!this.activeChatFriend) return;
        this.chatMessages.innerHTML = '';
        const messages = this.chatHistory[this.activeChatFriend] || [];
        messages.forEach(msg => {
            const msgEl = document.createElement('div');
            msgEl.className = `message ${msg.sender === 'me' ? 'msg-sent' : 'msg-received'}`;
            
            if (msg.isAI) {
                msgEl.classList.add('ai-message');
            }

            let content = msg.text || '';
            if (msg.isAI) {
                // Enhanced "Markdown" Rendering
                content = content.replace(/### (.*?)\n/g, '<h4 style="color:var(--accent-green-light); margin-bottom:8px;">$1</h4>');
                content = content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--accent-green-light);">$1</strong>');
                content = content.replace(/\* (.*?)\n/g, '<div style="margin-bottom:4px;">• $1</div>');
                content = content.replace(/\n/g, '<br>');
            }
            msgEl.innerHTML = content;
            
            const timeEl = document.createElement('span');
            timeEl.className = 'msg-time';
            timeEl.textContent = msg.time || '';
            msgEl.appendChild(timeEl);
            this.chatMessages.appendChild(msgEl);
        });
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // --- Location Logic ---
    viewFriendLocation(friendName) {
        const workoutBtn = document.querySelector('.nav-btn[data-target="view-workout"]');
        if (workoutBtn) workoutBtn.click();
        alert(`Showing ${friendName}'s live location on the map.`);
        if (window.mapNavigator && window.mapNavigator.map) {
            const center = window.mapNavigator.map.getCenter();
            const friendPos = [center.lat + 0.002, center.lng + 0.002];
            if (this.friendMarker) window.mapNavigator.map.removeLayer(this.friendMarker);
            this.friendMarker = L.marker(friendPos).addTo(window.mapNavigator.map).bindPopup(`${friendName} is here!`).openPopup();
            window.mapNavigator.map.panTo(friendPos);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.socialManager = new SocialManager();
    window.socialManager.init();
});
