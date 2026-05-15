/**
 * PulseTrack - Neon Runner Mini-Game
 * A 2D endless runner.
 */

class NeonRunner {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        // Enhance Smoothness: Setup High DPI canvas scaling
        // Use the HTML attributes rather than getBoundingClientRect() because 
        // the canvas is initially hidden (display:none) which returns 0 width/height.
        const dpr = window.devicePixelRatio || 1;
        const width = parseInt(this.canvas.getAttribute('width')) || 300;
        const height = parseInt(this.canvas.getAttribute('height')) || 400;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.width = width;
        this.height = height;
        
        // UI Elements
        this.overlay = document.getElementById('game-overlay');
        this.msgEl = document.getElementById('game-msg');
        this.playBtn = document.getElementById('btn-play-game');
        this.scoreEl = document.getElementById('game-score');
        
        // Game State
        this.isPlaying = false;
        this.score = 0;
        this.animationFrame = null;
        this.gameSpeed = 4;
        
        // Entities
        this.player = {
            x: 50,
            y: this.height - 30,
            w: 30,
            h: 30,
            dy: 0,
            jumpForce: -11,
            grounded: true
        };
        
        this.gravity = 0.5;
        this.obstacles = [];
        this.spawnTimer = 0;
        
        this.init();
    }

    init() {
        // Draw initial state
        this.draw();

        // Event Listeners
        const playAction = () => {
            this.startGame();
        };

        this.playBtn.addEventListener('click', playAction);
        this.overlay.addEventListener('click', playAction);

        // Jump mechanics
        const jumpHandler = (e) => {
            e.preventDefault(); // Prevent scrolling on mobile
            if (this.isPlaying) {
                this.jump();
            }
        };

        this.canvas.addEventListener('touchstart', jumpHandler, { passive: false });
        this.canvas.addEventListener('mousedown', jumpHandler);
        
        // Keyboard support for desktop testing
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (this.isPlaying) this.jump();
            }
        });
    }

    startGame() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.isPlaying = true;
        this.score = 0;
        this.gameSpeed = 4;
        this.obstacles = [];
        this.player.y = this.height - this.player.h;
        this.player.dy = 0;
        
        this.overlay.classList.add('hidden');
        this.scoreEl.textContent = this.score;
        
        this.loop();
    }

    gameOver() {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationFrame);
        
        this.msgEl.textContent = `Game Over! Score: ${Math.floor(this.score)}`;
        this.overlay.classList.remove('hidden');
        this.playBtn.style.display = 'block';
        this.playBtn.textContent = 'Play Again';
    }

    jump() {
        if (this.player.grounded) {
            this.player.dy = this.player.jumpForce;
            this.player.grounded = false;
        }
    }

    update() {
        // Physics
        this.player.y += this.player.dy;
        if (this.player.y + this.player.h < this.height) {
            this.player.dy += this.gravity;
            this.player.grounded = false;
        } else {
            this.player.dy = 0;
            this.player.y = this.height - this.player.h;
            this.player.grounded = true;
        }

        // Spawn Obstacles
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            const size = 30; // Size of the tree emoji
            this.obstacles.push({
                x: this.width,
                y: this.height - size,
                w: size,
                h: size
            });
            this.spawnTimer = 50 + Math.random() * 50; // Random interval
        }

        // Move Obstacles and check collisions
        for (let i = 0; i < this.obstacles.length; i++) {
            let obs = this.obstacles[i];
            obs.x -= this.gameSpeed;

            // Collision Detection (AABB)
            if (
                this.player.x < obs.x + obs.w &&
                this.player.x + this.player.w > obs.x &&
                this.player.y < obs.y + obs.h &&
                this.player.y + this.player.h > obs.y
            ) {
                this.gameOver();
                return;
            }
        }

        // Remove offscreen obstacles
        this.obstacles = this.obstacles.filter(obs => obs.x + obs.w > 0);

        // Increase Score & Difficulty
        this.score += 0.1;
        this.scoreEl.textContent = Math.floor(this.score);
        if (this.score % 50 === 0) {
            this.gameSpeed += 0.5; // Speed up
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw Grid Lines (Neon aesthetic background)
        this.ctx.strokeStyle = '#27272a';
        this.ctx.lineWidth = 1;
        for(let i = 0; i < this.width; i+= 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.height);
            this.ctx.stroke();
        }

        // Set up Emoji Drawing
        this.ctx.font = "30px Arial";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";

        // Draw Player (Frog)
        this.ctx.fillText("🐸", this.player.x, this.player.y);
        
        // Draw Obstacles (Trees)
        for (let obs of this.obstacles) {
            this.ctx.fillText("🌲", obs.x, obs.y);
        }
        
        // Draw Ground Line
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#3b82f6';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    loop() {
        if (!this.isPlaying) return;
        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.loop());
    }
}

// Export
window.NeonRunner = NeonRunner;
