// Flag Catcher - Enhanced 2D Platformer Game
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Initialize audio context for sound effects
        this.audioContext = null;
        this.initAudio();
        
        // Game state - Enhanced state system
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver', 'levelComplete', 'loading', 'victory', 'settings'
        this.previousState = 'menu';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.maxLevel = 5;
        this.flagsCollected = 0;
        this.flagsNeeded = 3;
        this.loadingTimer = 0;
        this.loadingDuration = 120; // 2 seconds at 60fps
        
        // Settings
        this.settings = {
            soundEnabled: true,
            difficulty: 'normal', // 'easy', 'normal', 'hard'
            playerColor: '#ff6b6b'
        };
        
        // Menu system
        this.menuSelection = 0;
        this.settingsSelection = 0;
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Game objects (initialized when starting game)
        this.player = null;
        this.platforms = [];
        this.flags = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        
        // Camera
        this.camera = { x: 0, y: 0 };
        
        // Start game loop
        this.gameLoop();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.audioContext = null;
        }
    }
    
    playSound(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.settings.soundEnabled || !this.audioContext) return;
        
        // Resume audio context if it's suspended (required by modern browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playJumpSound() {
        // Quick ascending tone for jump
        this.playSound(200, 0.1, 'square', 0.05);
    }
    
    playKillSound() {
        // Descending tone for enemy kill
        if (!this.settings.soundEnabled || !this.audioContext) return;
        
        // Resume audio context if it's suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    playFlagSound() {
        // Pleasant chime for flag collection
        this.playSound(523, 0.2, 'sine', 0.08); // C note
        setTimeout(() => this.playSound(659, 0.2, 'sine', 0.08), 100); // E note
    }
    
    initializeLevel() {
        this.player = new Player(50, 300, this.settings.playerColor, this);
        this.platforms = this.createPlatforms();
        this.flags = this.createFlags();
        this.enemies = this.createEnemies();
        this.powerUps = this.createPowerUps();
        this.particles = [];
        this.camera = { x: 0, y: 0 };
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            
            // Handle menu navigation
            if (this.gameState === 'menu') {
                this.handleMenuInput(e.code);
            } else if (this.gameState === 'settings') {
                this.handleSettingsInput(e.code);
            } else if (this.gameState === 'instructions') {
                this.handleInstructionsInput(e.code);
            } else if (this.gameState === 'playing') {
                // Pause toggle
                if (e.code === 'KeyP') {
                    this.togglePause();
                }
            } else if (this.gameState === 'paused') {
                if (e.code === 'KeyP') {
                    this.togglePause();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    handleMenuInput(keyCode) {
        const menuOptions = ['Start Game', 'Settings', 'Instructions'];
        
        if (keyCode === 'ArrowUp') {
            this.menuSelection = (this.menuSelection - 1 + menuOptions.length) % menuOptions.length;
        } else if (keyCode === 'ArrowDown') {
            this.menuSelection = (this.menuSelection + 1) % menuOptions.length;
        } else if (keyCode === 'Enter' || keyCode === 'Space') {
            switch (this.menuSelection) {
                case 0: // Start Game
                    this.startNewGame();
                    break;
                case 1: // Settings
                    this.gameState = 'settings';
                    this.settingsSelection = 0;
                    break;
                case 2: // Instructions
                    this.showInstructions();
                    break;
            }
        }
    }
    
    handleSettingsInput(keyCode) {
        const settingsOptions = ['Sound', 'Difficulty', 'Player Color', 'Back'];
        
        if (keyCode === 'ArrowUp') {
            this.settingsSelection = (this.settingsSelection - 1 + settingsOptions.length) % settingsOptions.length;
        } else if (keyCode === 'ArrowDown') {
            this.settingsSelection = (this.settingsSelection + 1) % settingsOptions.length;
        } else if (keyCode === 'ArrowLeft' || keyCode === 'ArrowRight') {
            this.changeSettingValue(keyCode === 'ArrowRight');
        } else if (keyCode === 'Enter' || keyCode === 'Space') {
            if (this.settingsSelection === 3) { // Back
                this.gameState = 'menu';
            } else {
                this.changeSettingValue(true);
            }
        } else if (keyCode === 'Escape') {
            this.gameState = 'menu';
        }
    }
    
    changeSettingValue(increase) {
        switch (this.settingsSelection) {
            case 0: // Sound
                this.settings.soundEnabled = !this.settings.soundEnabled;
                break;
            case 1: // Difficulty
                const difficulties = ['easy', 'normal', 'hard'];
                let currentIndex = difficulties.indexOf(this.settings.difficulty);
                if (increase) {
                    currentIndex = (currentIndex + 1) % difficulties.length;
                } else {
                    currentIndex = (currentIndex - 1 + difficulties.length) % difficulties.length;
                }
                this.settings.difficulty = difficulties[currentIndex];
                break;
            case 2: // Player Color
                const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
                let colorIndex = colors.indexOf(this.settings.playerColor);
                if (increase) {
                    colorIndex = (colorIndex + 1) % colors.length;
                } else {
                    colorIndex = (colorIndex - 1 + colors.length) % colors.length;
                }
                this.settings.playerColor = colors[colorIndex];
                break;
        }
    }
    
    handleInstructionsInput(keyCode) {
        if (keyCode === 'Escape' || keyCode === 'Enter') {
            this.gameState = 'menu';
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.previousState = 'playing';
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = this.previousState;
        }
    }
    
    startNewGame() {
        this.gameState = 'loading';
        this.loadingTimer = 0;
        this.score = 0;
        this.lives = this.settings.difficulty === 'easy' ? 5 : this.settings.difficulty === 'hard' ? 2 : 3;
        this.level = 1;
        this.flagsCollected = 0;
        this.flagsNeeded = 3;
        this.initializeLevel();
    }
    
    showInstructions() {
        this.gameState = 'instructions';
    }
    
    createPlatforms() {
        const platforms = [
            // Ground platforms - always present
            new Platform(0, 350, 200, 50, '#4a4a4a'),
            new Platform(250, 350, 150, 50, '#4a4a4a'),
            new Platform(450, 350, 200, 50, '#4a4a4a'),
            new Platform(700, 350, 100, 50, '#4a4a4a'),
        ];
        
        // Level-specific platforms
        if (this.level >= 1) {
            // Basic floating platforms
            platforms.push(new Platform(150, 280, 100, 20, '#6a6a6a'));
            platforms.push(new Platform(300, 220, 100, 20, '#6a6a6a'));
            platforms.push(new Platform(500, 180, 100, 20, '#6a6a6a'));
        }
        
        if (this.level >= 2) {
            // More challenging jumps
            platforms.push(new Platform(650, 250, 80, 20, '#6a6a6a'));
            platforms.push(new MovingPlatform(400, 120, 80, 20, '#8a8a8a', 300, 500));
        }
        
        if (this.level >= 3) {
            // Smaller platforms, bigger gaps
            platforms.push(new Platform(100, 200, 60, 20, '#6a6a6a'));
            platforms.push(new Platform(600, 150, 60, 20, '#6a6a6a'));
            platforms.push(new MovingPlatform(200, 100, 60, 20, '#8a8a8a', 150, 350));
        }
        
        if (this.level >= 4) {
            // Very challenging layout
            platforms.push(new Platform(350, 100, 50, 20, '#6a6a6a'));
            platforms.push(new Platform(750, 200, 50, 20, '#6a6a6a'));
            platforms.push(new MovingPlatform(500, 80, 50, 20, '#8a8a8a', 450, 650));
        }
        
        if (this.level >= 5) {
            // Expert level - tiny platforms and moving obstacles
            platforms.push(new Platform(50, 150, 40, 20, '#6a6a6a'));
            platforms.push(new Platform(720, 100, 40, 20, '#6a6a6a'));
            platforms.push(new MovingPlatform(300, 50, 40, 20, '#8a8a8a', 250, 450));
            platforms.push(new MovingPlatform(600, 300, 40, 20, '#8a8a8a', 550, 750));
        }
        
        return platforms;
    }
    
    createFlags() {
        const flags = [];
        
        // Level-specific flag placement
        switch (this.level) {
            case 1:
                flags.push(new Flag(180, 240, 1));
                flags.push(new Flag(530, 140, 2));
                flags.push(new Flag(680, 210, 3));
                break;
            case 2:
                flags.push(new Flag(130, 240, 1));
                flags.push(new Flag(430, 80, 2));
                flags.push(new Flag(680, 210, 3));
                break;
            case 3:
                flags.push(new Flag(130, 160, 1));
                flags.push(new Flag(230, 60, 2));
                flags.push(new Flag(630, 110, 3));
                break;
            case 4:
                flags.push(new Flag(380, 60, 1));
                flags.push(new Flag(530, 40, 2));
                flags.push(new Flag(780, 160, 3));
                break;
            case 5:
                flags.push(new Flag(80, 110, 1));
                flags.push(new Flag(330, 10, 2));
                flags.push(new Flag(750, 60, 3));
                break;
            default:
                // Fallback for any additional levels
                flags.push(new Flag(180, 240, 1));
                flags.push(new Flag(530, 140, 2));
                flags.push(new Flag(680, 210, 3));
        }
        
        return flags;
    }
    
    createEnemies() {
        const enemies = [];
        const baseSpeed = 1;
        const levelMultiplier = this.level;
        
        // Base enemies for all levels
        enemies.push(new Enemy(280, 320, 'patrol', 250, 380));
        enemies.push(new Enemy(520, 320, 'patrol', 450, 620));
        
        // Add more enemies based on level
        if (this.level >= 2) {
            enemies.push(new Enemy(330, 180, 'jump'));
            enemies.push(new Enemy(650, 250, 'patrol', 600, 750));
        }
        
        if (this.level >= 3) {
            enemies.push(new Enemy(150, 250, 'patrol', 100, 200));
            enemies.push(new Enemy(400, 100, 'jump'));
        }
        
        if (this.level >= 4) {
            enemies.push(new Enemy(500, 180, 'jump'));
            enemies.push(new Enemy(700, 320, 'patrol', 650, 780));
            enemies.push(new Enemy(200, 100, 'patrol', 150, 300));
        }
        
        if (this.level >= 5) {
            enemies.push(new Enemy(100, 320, 'patrol', 50, 150));
            enemies.push(new Enemy(600, 100, 'jump'));
            enemies.push(new Enemy(450, 250, 'patrol', 400, 550));
        }
        
        // Increase enemy speed based on level and difficulty setting
        const difficultyMultiplier = {
            'easy': 0.8,
            'normal': 1.0,
            'hard': 1.3
        }[this.settings.difficulty];
        
        enemies.forEach(enemy => {
            enemy.speed = baseSpeed * (1 + (this.level - 1) * 0.3) * difficultyMultiplier;
        });
        
        return enemies;
    }
    
    createPowerUps() {
        return [
            new PowerUp(350, 180, 'speed'),
            new PowerUp(750, 310, 'jump')
        ];
    }
    
    update() {
        // Handle different game states
        switch (this.gameState) {
            case 'menu':
            case 'settings':
            case 'instructions':
                // No game updates needed for menu states
                break;
                
            case 'loading':
                this.updateLoading();
                break;
                
            case 'playing':
                this.updateGameplay();
                break;
                
            case 'paused':
                // Game is paused, no updates
                break;
                
            case 'gameOver':
            case 'levelComplete':
            case 'victory':
                // Update particles for visual effects
                this.particles = this.particles.filter(particle => {
                    particle.update();
                    return particle.life > 0;
                });
                break;
        }
    }
    
    updateLoading() {
        this.loadingTimer++;
        if (this.loadingTimer >= this.loadingDuration) {
            this.gameState = 'playing';
        }
    }
    
    updateGameplay() {
        if (!this.player) return;
        
        // Update player
        this.player.update(this.keys, this.platforms);
        
        // Update enemies
        this.enemies.forEach(enemy => enemy.update(this.platforms));
        
        // Update moving platforms
        this.platforms.forEach(platform => {
            if (platform.update) platform.update();
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Update camera
        this.updateCamera();
        
        // Check win/lose conditions
        this.checkGameState();
    }
    
    checkCollisions() {
        // Flag collection
        this.flags = this.flags.filter(flag => {
            if (this.player.collidesWith(flag)) {
                this.collectFlag(flag);
                return false;
            }
            return true;
        });
        
        // Power-up collection
        this.powerUps = this.powerUps.filter(powerUp => {
            if (this.player.collidesWith(powerUp)) {
                this.collectPowerUp(powerUp);
                return false;
            }
            return true;
        });
        
        // Enemy collision
        this.enemies.forEach((enemy, index) => {
            if (this.player.collidesWith(enemy) && !this.player.invulnerable) {
                // Check if player is jumping on enemy (player is above and falling down)
                if (this.player.vy > 0 && this.player.y < enemy.y - 5) {
                    // Kill enemy
                    this.killEnemy(index);
                    // Bounce player up
                    this.player.vy = -10;
                    this.score += 200;
                    this.showScorePopup(enemy.x, enemy.y, '+200');
                } else {
                    // Player gets hit
                    this.playerHit();
                }
            }
        });
        
        // Fall off screen
        if (this.player.y > this.canvas.height + 100) {
            this.playerHit();
        }
    }
    
    collectFlag(flag) {
        this.flagsCollected++;
        this.score += flag.value * 100;
        this.createParticles(flag.x, flag.y, '#ffff00', 8);
        
        // Visual feedback
        this.showScorePopup(flag.x, flag.y, `+${flag.value * 100}`);
        
        // Play flag collection sound
        this.playFlagSound();
    }
    
    collectPowerUp(powerUp) {
        this.score += 50;
        this.player.applyPowerUp(powerUp.type);
        this.createParticles(powerUp.x, powerUp.y, '#00ff00', 6);
    }
    
    playerHit() {
        this.lives--;
        this.player.respawn();
        this.createParticles(this.player.x, this.player.y, '#ff0000', 10);
        
        if (this.lives <= 0) {
            this.gameState = 'gameOver';
        }
    }
    
    killEnemy(index) {
        const enemy = this.enemies[index];
        // Create death particles
        this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff4444', 12);
        // Add some yellow particles for extra effect
        this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ffff00', 8);
        // Remove enemy from array
        this.enemies.splice(index, 1);
        
        // Play kill sound
        this.playKillSound();
    }
    
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    showScorePopup(x, y, text) {
        // Simple score popup effect
        this.particles.push(new ScorePopup(x, y, text));
    }
    
    updateCamera() {
        // Follow player with smooth camera
        const targetX = this.player.x - this.canvas.width / 2;
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        // Keep camera in bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, 800 - this.canvas.width));
    }
    
    checkGameState() {
        if (this.flagsCollected >= this.flagsNeeded) {
            if (this.level >= this.maxLevel) {
                this.gameState = 'victory';
            } else {
                this.gameState = 'levelComplete';
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB'; // Sky blue background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render based on game state
        switch (this.gameState) {
            case 'menu':
                this.renderMenu();
                break;
                
            case 'settings':
                this.renderSettings();
                break;
                
            case 'instructions':
                this.renderInstructions();
                break;
                
            case 'loading':
                this.renderLoading();
                break;
                
            case 'playing':
            case 'paused':
                this.renderGameplay();
                if (this.gameState === 'paused') {
                    this.renderPauseOverlay();
                }
                break;
                
            case 'gameOver':
                this.renderGameplay();
                this.renderGameOver();
                break;
                
            case 'levelComplete':
                this.renderGameplay();
                this.renderLevelComplete();
                break;
                
            case 'victory':
                this.renderGameplay();
                this.renderVictory();
                break;
        }
    }
    
    renderGameplay() {
        if (!this.player) return;
        
        // Save context for camera
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Render platforms
        this.platforms.forEach(platform => platform.render(this.ctx));
        
        // Render flags
        this.flags.forEach(flag => flag.render(this.ctx));
        
        // Render power-ups
        this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
        
        // Render enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Render player
        this.player.render(this.ctx);
        
        // Render particles
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // Restore context
        this.ctx.restore();
        
        // Render UI (not affected by camera)
        this.renderGameUI();
    }
    
    renderMenu() {
        // Background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏁 FLAG CATCHER', this.canvas.width / 2, 100);
        
        // Subtitle
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillText('Enhanced 2D Platformer Adventure', this.canvas.width / 2, 140);
        
        // Menu options
        const menuOptions = ['Start Game', 'Settings', 'Instructions'];
        this.ctx.font = '28px Arial';
        
        menuOptions.forEach((option, index) => {
            const y = 220 + index * 60;
            const isSelected = index === this.menuSelection;
            
            // Highlight selected option
            if (isSelected) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(this.canvas.width / 2 - 150, y - 35, 300, 50);
                this.ctx.fillStyle = '#ffff00';
            } else {
                this.ctx.fillStyle = '#fff';
            }
            
            this.ctx.fillText(option, this.canvas.width / 2, y);
        });
        
        // Controls hint
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#bbb';
        this.ctx.fillText('Use ↑↓ to navigate, Enter to select', this.canvas.width / 2, this.canvas.height - 30);
        this.ctx.textAlign = 'left';
    }
    
    renderSettings() {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SETTINGS', this.canvas.width / 2, 80);
        
        // Settings options
        const settings = [
            { name: 'Sound', value: this.settings.soundEnabled ? 'ON' : 'OFF' },
            { name: 'Difficulty', value: this.settings.difficulty.toUpperCase() },
            { name: 'Player Color', value: '●', color: this.settings.playerColor },
            { name: 'Back', value: '' }
        ];
        
        this.ctx.font = '24px Arial';
        
        settings.forEach((setting, index) => {
            const y = 150 + index * 50;
            const isSelected = index === this.settingsSelection;
            
            // Highlight selected option
            if (isSelected) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(50, y - 30, this.canvas.width - 100, 40);
            }
            
            // Setting name
            this.ctx.fillStyle = isSelected ? '#ffff00' : '#fff';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(setting.name, 100, y);
            
            // Setting value
            if (setting.color) {
                this.ctx.fillStyle = setting.color;
                this.ctx.font = '32px Arial';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(setting.value, this.canvas.width - 100, y + 5);
                this.ctx.font = '24px Arial';
            } else if (setting.value) {
                this.ctx.fillStyle = isSelected ? '#ffff00' : '#ccc';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(setting.value, this.canvas.width - 100, y);
            }
        });
        
        // Controls hint
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#bbb';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use ↑↓ to navigate, ←→ to change values, Enter to select, Esc to go back', this.canvas.width / 2, this.canvas.height - 30);
        this.ctx.textAlign = 'left';
    }
    
    renderInstructions() {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HOW TO PLAY', this.canvas.width / 2, 60);
        
        // Instructions
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        
        const instructions = [
            '🎯 OBJECTIVE: Collect all flags to complete each level!',
            '',
            '🎮 CONTROLS:',
            '   ← → Arrow Keys: Move left and right',
            '   Space: Jump',
            '   P: Pause game',
            '',
            '⚔️ COMBAT:',
            '   Jump on enemies to defeat them (+200 points)',
            '   Avoid touching enemies from the side',
            '',
            '🏁 FLAGS:',
            '   Collect all flags in each level to advance',
            '   Higher value flags give more points',
            '',
            '📈 DIFFICULTY:',
            '   Each level has more enemies and harder layouts',
            '   Enemy speed increases with each level',
            '   Use difficulty settings to adjust challenge'
        ];
        
        let y = 120;
        instructions.forEach(line => {
            if (line === '') {
                y += 15;
            } else {
                this.ctx.fillText(line, 50, y);
                y += 30;
            }
        });
        
        // Back instruction
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press ESC or ENTER to return to menu', this.canvas.width / 2, this.canvas.height - 30);
        this.ctx.textAlign = 'left';
    }
    
    renderLoading() {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Loading text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Level ' + this.level, this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Loading bar
        const barWidth = 300;
        const barHeight = 20;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = this.canvas.height / 2;
        const progress = this.loadingTimer / this.loadingDuration;
        
        // Loading bar background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Loading bar fill
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Loading bar border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Loading percentage
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText(Math.floor(progress * 100) + '%', this.canvas.width / 2, barY + 50);
        this.ctx.textAlign = 'left';
    }
    renderGameUI() {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 60);
        this.ctx.fillText(`Flags: ${this.flagsCollected}/${this.flagsNeeded}`, 10, 90);
        this.ctx.fillText(`Level: ${this.level}`, 10, 120);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 150);
        this.ctx.fillText(`Level: ${this.level}/${this.maxLevel}`, 10, 120);
        
        // Difficulty indicator
        this.ctx.fillStyle = '#666';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Difficulty: ${this.settings.difficulty}`, 10, 150);
        
        // Controls help
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Arrow Keys: Move | Space: Jump | P: Pause', this.canvas.width - 250, this.canvas.height - 10);
    }
    
    renderPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press P to Resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.textAlign = 'left';
    }
    
    renderGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Level Reached: ${this.level}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText('Press R to Restart or M for Menu', this.canvas.width / 2, this.canvas.height / 2 + 80);
        this.ctx.textAlign = 'left';
    }
    
    renderLevelComplete() {
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Next: Level ${this.level + 1}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText('Press N for Next Level or M for Menu', this.canvas.width / 2, this.canvas.height / 2 + 80);
        this.ctx.textAlign = 'left';
    }
    
    renderVictory() {
        // Animated victory background
        const time = Date.now() * 0.005;
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, 300
        );
        gradient.addColorStop(0, `hsl(${(time * 50) % 360}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${(time * 30) % 360}, 50%, 30%)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Victory text with animation
        const bounce = Math.sin(time * 3) * 10;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 56px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎉 VICTORY! 🎉', this.canvas.width / 2, this.canvas.height / 2 - 80 + bounce);
        
        this.ctx.font = '32px Arial';
        this.ctx.fillText('You completed all levels!', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText(`Difficulty: ${this.settings.difficulty.toUpperCase()}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillText('Press R to Play Again or M for Menu', this.canvas.width / 2, this.canvas.height / 2 + 100);
        this.ctx.textAlign = 'left';
    }
    
    gameLoop() {
        this.update();
        this.render();
        
        // Handle state-specific input
        if (this.keys['KeyR'] && (this.gameState === 'gameOver' || this.gameState === 'victory')) {
            this.restart();
        }
        if (this.keys['KeyN'] && this.gameState === 'levelComplete') {
            this.nextLevel();
        }
        if (this.keys['KeyM'] && (this.gameState === 'gameOver' || this.gameState === 'levelComplete' || this.gameState === 'victory')) {
            this.returnToMenu();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    returnToMenu() {
        this.gameState = 'menu';
        this.menuSelection = 0;
        // Reset camera
        this.camera = { x: 0, y: 0 };
    }
    
    restart() {
        this.startNewGame();
    }
    
    nextLevel() {
        this.level++;
        this.gameState = 'loading';
        this.loadingTimer = 0;
        this.flagsCollected = 0;
        
        // Keep flags needed at 3 for all levels since each level has exactly 3 flags
        this.flagsNeeded = 3;
        
        // Adjust enemy count and speed based on level
        this.initializeLevel();
    }
}

// Player class
class Player {
    constructor(x, y, color = '#ff6b6b', game = null) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpPower = 12;
        this.onGround = false;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.color = color;
        this.game = game;
        
        // Power-up effects
        this.speedBoost = 1;
        this.jumpBoost = 1;
        this.powerUpTime = 0;
    }
    
    update(keys, platforms) {
        // Handle input
        this.vx = 0;
        if (keys['ArrowLeft']) this.vx = -this.speed * this.speedBoost;
        if (keys['ArrowRight']) this.vx = this.speed * this.speedBoost;
        if (keys['Space'] && this.onGround) {
            this.vy = -this.jumpPower * this.jumpBoost;
            this.onGround = false;
            if (this.game) {
                this.game.playJumpSound();
            }
        }
        
        // Apply gravity
        this.vy += 0.5;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Platform collision
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.collidesWith(platform)) {
                // Landing on top
                if (this.vy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                }
                // Hitting from below
                else if (this.vy < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.vy = 0;
                }
                // Side collision
                else if (this.vx > 0) {
                    this.x = platform.x - this.width;
                } else if (this.vx < 0) {
                    this.x = platform.x + platform.width;
                }
            }
        });
        
        // Update power-up effects
        if (this.powerUpTime > 0) {
            this.powerUpTime--;
            if (this.powerUpTime <= 0) {
                this.speedBoost = 1;
                this.jumpBoost = 1;
            }
        }
        
        // Update invulnerability
        if (this.invulnerabilityTime > 0) {
            this.invulnerabilityTime--;
            this.invulnerable = this.invulnerabilityTime > 0;
        }
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
    
    applyPowerUp(type) {
        this.powerUpTime = 300; // 5 seconds at 60fps
        
        switch (type) {
            case 'speed':
                this.speedBoost = 1.5;
                break;
            case 'jump':
                this.jumpBoost = 1.3;
                break;
        }
    }
    
    respawn() {
        this.x = 50;
        this.y = 300;
        this.vx = 0;
        this.vy = 0;
        this.invulnerabilityTime = 120; // 2 seconds
    }
    
    render(ctx) {
        // Flash when invulnerable
        if (this.invulnerable && Math.floor(this.invulnerabilityTime / 10) % 2) {
            return;
        }
        
        // Player body
        ctx.fillStyle = this.powerUpTime > 0 ? '#00ff00' : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Simple face
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 8, 4, 4); // Left eye
        ctx.fillRect(this.x + 18, this.y + 8, 4, 4); // Right eye
        ctx.fillRect(this.x + 10, this.y + 18, 10, 2); // Mouth
    }
}

// Platform class
class Platform {
    constructor(x, y, width, height, color = '#4a4a4a') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add some texture
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(this.x, this.y, this.width, 2);
    }
}

// Moving Platform class
class MovingPlatform extends Platform {
    constructor(x, y, width, height, color, minX, maxX) {
        super(x, y, width, height, color);
        this.minX = minX;
        this.maxX = maxX;
        this.speed = 1;
        this.direction = 1;
    }
    
    update() {
        this.x += this.speed * this.direction;
        
        if (this.x <= this.minX || this.x + this.width >= this.maxX) {
            this.direction *= -1;
        }
    }
}

// Flag class
class Flag {
    constructor(x, y, value = 1) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        this.value = value;
        this.animation = 0;
    }
    
    render(ctx) {
        this.animation += 0.1;
        
        // Flag pole
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 15, this.y, 3, this.height);
        
        // Flag
        const wave = Math.sin(this.animation) * 2;
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x + wave, this.y, 15, 15);
        
        // Flag pattern
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 2 + wave, this.y + 2, 6, 6);
        ctx.fillRect(this.x + 9 + wave, this.y + 9, 6, 6);
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'patrol', minX = 0, maxX = 800) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.type = type;
        this.speed = 1;
        this.direction = 1;
        this.minX = minX;
        this.maxX = maxX;
        this.jumpTimer = 0;
        this.vy = 0;
        this.onGround = false;
    }
    
    update(platforms) {
        if (this.type === 'patrol') {
            this.x += this.speed * this.direction;
            
            if (this.x <= this.minX || this.x + this.width >= this.maxX) {
                this.direction *= -1;
            }
        } else if (this.type === 'jump') {
            this.jumpTimer++;
            if (this.jumpTimer > 120 && this.onGround) { // Jump every 2 seconds
                this.vy = -8;
                this.jumpTimer = 0;
                this.onGround = false;
            }
        }
        
        // Apply gravity
        this.vy += 0.5;
        this.y += this.vy;
        
        // Platform collision
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.collidesWith(platform) && this.vy > 0 && this.y < platform.y) {
                this.y = platform.y - this.height;
                this.vy = 0;
                this.onGround = true;
            }
        });
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
    
    render(ctx) {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Simple enemy face
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y + 5, 3, 3);
        ctx.fillRect(this.x + 17, this.y + 5, 3, 3);
        ctx.fillRect(this.x + 8, this.y + 15, 9, 2);
    }
}

// PowerUp class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.animation = 0;
    }
    
    render(ctx) {
        this.animation += 0.1;
        const bounce = Math.sin(this.animation) * 3;
        
        ctx.fillStyle = this.type === 'speed' ? '#00ffff' : '#ff00ff';
        ctx.fillRect(this.x, this.y + bounce, this.width, this.height);
        
        // Power-up symbol
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const symbol = this.type === 'speed' ? 'S' : 'J';
        ctx.fillText(symbol, this.x + 10, this.y + 14 + bounce);
        ctx.textAlign = 'left';
    }
}

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2;
        this.color = color;
        this.life = 60;
        this.maxLife = 60;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life--;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(this.x, this.y, 3, 3);
    }
}

// Score Popup class
class ScorePopup extends Particle {
    constructor(x, y, text) {
        super(x, y, '#ffff00');
        this.text = text;
        this.vy = -2;
        this.vx = 0;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.font = '16px Arial';
        ctx.fillText(this.text, this.x, this.y);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new Game();
});
