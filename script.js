const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1200;
canvas.height = 800;

// Game State Management
let gameState = 'menu'; // 'menu', 'selection', 'playing', 'paused', 'gameOver'
let gameMode = null;
let currentStage = null;
let selectionScreen = null;
let gameModeScreen = null;

// Stocks system (lives)
let player1Stocks = 3;
let player2Stocks = 3;
let battleTime = 7200; // 2 minutes in frames (120 seconds * 60fps)

// Constants
const GRAVITY = 0.8;
const PLAYER_SPEED = 6;
const JUMP_POWER = -15;
const FRICTION = 0.8;
const AIR_RESISTANCE = 0.95;
const KNOCKBACK_DECAY = 0.9;

// AI Configuration
const AI_CONFIG = {
    EASY: {
        reactionTime: 30,
        accuracy: 0.6,
        aggressiveness: 0.4,
        powerUpPriority: 0.3,
        name: 'Facile'
    },
    MEDIUM: {
        reactionTime: 20,
        accuracy: 0.75,
        aggressiveness: 0.6,
        powerUpPriority: 0.6,
        name: 'Moyen'
    },
    HARD: {
        reactionTime: 10,
        accuracy: 0.9,
        aggressiveness: 0.8,
        powerUpPriority: 0.8,
        name: 'Difficile'
    },
    EXPERT: {
        reactionTime: 5,
        accuracy: 0.95,
        aggressiveness: 0.9,
        powerUpPriority: 0.9,
        name: 'Expert'
    }
};

let currentAIDifficulty = 'MEDIUM';

// Power-up types
const POWERUP_TYPES = {
    SPEED: { color: '#FFD700', effect: 'speed', duration: 300, symbol: '⚡' },
    STRENGTH: { color: '#FF4500', effect: 'strength', duration: 300, symbol: '💪' },
    SHIELD: { color: '#00CED1', effect: 'shield', duration: 200, symbol: '🛡️' },
    JUMP: { color: '#9370DB', effect: 'jump', duration: 250, symbol: '🦘' },
    HEALTH: { color: '#32CD32', effect: 'health', duration: 0, symbol: '❤️' }
};

// Attack types
const ATTACK_TYPES = {
    NORMAL: { damage: 15, knockbackX: 8, knockbackY: -5, range: 30, color: 'yellow' },
    STRONG: { damage: 25, knockbackX: 12, knockbackY: -8, range: 35, color: 'orange' },
    UP: { damage: 18, knockbackX: 3, knockbackY: -15, range: 25, color: 'cyan' },
    DOWN: { damage: 20, knockbackX: 5, knockbackY: 2, range: 40, color: 'purple' }
};

// Platforms
const platforms = [
    { x: 0, y: canvas.height - 20, width: canvas.width, height: 20 }, // Ground
    { x: 200, y: 600, width: 200, height: 20 },
    { x: 500, y: 450, width: 200, height: 20 },
    { x: 800, y: 600, width: 200, height: 20 },
    { x: 350, y: 300, width: 150, height: 20 },
    { x: 700, y: 300, width: 150, height: 20 }
];

// Power-ups array
let powerUps = [];

// Particle effects
let particles = [];

// AI Controller
class AIController {
    constructor(player, opponent) {
        this.player = player;
        this.opponent = opponent;
        this.decisionTimer = 0;
        this.currentDecision = null;
        this.targetPowerUp = null;
        this.lastPlayerPosition = { x: opponent.x, y: opponent.y };
        this.config = AI_CONFIG[currentAIDifficulty];
        
        // AI state
        this.isChasing = false;
        this.isRetreating = false;
        this.isGoingForPowerUp = false;
        this.lastAttackTime = 0;
    }
    
    update() {
        this.decisionTimer++;
        
        // Update AI configuration if difficulty changed
        this.config = AI_CONFIG[currentAIDifficulty];
        
        // Make decisions based on reaction time
        if (this.decisionTimer >= this.config.reactionTime) {
            this.makeDecision();
            this.decisionTimer = 0;
        }
        
        // Execute current decision
        this.executeDecision();
        
        // Update last known player position
        this.lastPlayerPosition = { x: this.opponent.x, y: this.opponent.y };
    }
    
    makeDecision() {
        const distanceToOpponent = this.getDistance(this.player, this.opponent);
        const nearestPowerUp = this.findNearestPowerUp();
        
        // Decision priority system
        let decisions = [];
        
        // Aggressive behavior
        if (distanceToOpponent < 200 && Math.random() < this.config.aggressiveness) {
            if (distanceToOpponent < 80) {
                decisions.push({ type: 'attack', priority: 0.8 });
            } else {
                decisions.push({ type: 'chase', priority: 0.6 });
            }
        }
        
        // Power-up seeking
        if (nearestPowerUp && Math.random() < this.config.powerUpPriority) {
            const powerUpDistance = this.getDistance(this.player, nearestPowerUp);
            if (powerUpDistance < 300) {
                decisions.push({ type: 'powerup', priority: 0.5, target: nearestPowerUp });
            }
        }
        
        // Defensive behavior
        if (this.player.damage > this.opponent.damage + 50) {
            decisions.push({ type: 'retreat', priority: 0.7 });
        }
        
        // Recovery behavior
        if (!this.player.isGrounded && this.player.y > canvas.height - 200) {
            decisions.push({ type: 'recover', priority: 0.9 });
        }
        
        // Positioning behavior
        if (decisions.length === 0) {
            decisions.push({ type: 'position', priority: 0.3 });
        }
        
        // Select highest priority decision
        decisions.sort((a, b) => b.priority - a.priority);
        this.currentDecision = decisions[0];
        
        // Set AI state flags
        this.isChasing = this.currentDecision.type === 'chase';
        this.isRetreating = this.currentDecision.type === 'retreat';
        this.isGoingForPowerUp = this.currentDecision.type === 'powerup';
    }
    
    executeDecision() {
        if (!this.currentDecision) return;
        
        switch (this.currentDecision.type) {
            case 'attack':
                this.executeAttack();
                break;
            case 'chase':
                this.executeChase();
                break;
            case 'retreat':
                this.executeRetreat();
                break;
            case 'powerup':
                this.executePowerUpSeek();
                break;
            case 'recover':
                this.executeRecover();
                break;
            case 'position':
                this.executePosition();
                break;
        }
    }
    
    executeAttack() {
        const distanceToOpponent = this.getDistance(this.player, this.opponent);
        const opponentDirection = this.opponent.x > this.player.x ? 1 : -1;
        
        // Move towards opponent if not in range
        if (distanceToOpponent > 60) {
            this.moveTowards(this.opponent);
        } else {
            // Choose attack type based on situation
            let attackType = 'NORMAL';
            
            if (this.opponent.damage > 100 && Math.random() < 0.4) {
                attackType = 'STRONG'; // Finish with strong attack
            } else if (this.opponent.y < this.player.y && Math.random() < 0.3) {
                attackType = 'UP'; // Aerial combo
            } else if (this.player.isGrounded && !this.opponent.isGrounded && Math.random() < 0.3) {
                attackType = 'UP'; // Anti-air
            }
            
            // Attack with accuracy check
            if (Math.random() < this.config.accuracy) {
                this.player.attack(attackType);
            }
        }
    }
    
    executeChase() {
        this.moveTowards(this.opponent);
        
        // Jump over obstacles or to reach higher platforms
        if (this.shouldJump()) {
            this.player.jump();
        }
    }
    
    executeRetreat() {
        const retreatDirection = this.opponent.x > this.player.x ? -1 : 1;
        this.player.move(retreatDirection);
        
        // Jump to escape if needed
        if (this.getDistance(this.player, this.opponent) < 100 && this.player.isGrounded) {
            this.player.jump();
        }
    }
    
    executePowerUpSeek() {
        if (this.currentDecision.target) {
            this.moveTowards(this.currentDecision.target);
            
            if (this.shouldJump()) {
                this.player.jump();
            }
        }
    }
    
    executeRecover() {
        // Try to get back to a platform
        const nearestPlatform = this.findNearestPlatform();
        if (nearestPlatform) {
            this.moveTowards({ x: nearestPlatform.x + nearestPlatform.width/2, y: nearestPlatform.y });
        }
        
        // Always try to jump when falling
        if (this.player.velocityY > 0) {
            this.player.jump();
        }
    }
    
    executePosition() {
        // Stay at medium distance from opponent
        const distanceToOpponent = this.getDistance(this.player, this.opponent);
        const idealDistance = 150;
        
        if (distanceToOpponent < idealDistance - 50) {
            // Too close, back away
            const direction = this.opponent.x > this.player.x ? -1 : 1;
            this.player.move(direction);
        } else if (distanceToOpponent > idealDistance + 50) {
            // Too far, get closer
            this.moveTowards(this.opponent);
        }
        
        // Maintain good platform position
        if (this.shouldJump()) {
            this.player.jump();
        }
    }
    
    moveTowards(target) {
        const direction = target.x > this.player.x ? 1 : -1;
        this.player.move(direction);
    }
    
    shouldJump() {
        if (!this.player.isGrounded) return false;
        
        // Jump if opponent is above
        if (this.opponent.y < this.player.y - 50) return true;
        
        // Jump if there's a platform above to reach
        const platformAbove = this.findPlatformAbove();
        if (platformAbove && this.opponent.y < this.player.y) return true;
        
        // Jump if stuck (same x position for too long)
        if (Math.abs(this.player.x - this.lastPlayerPosition.x) < 10 && Math.random() < 0.1) return true;
        
        return false;
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    findNearestPowerUp() {
        let nearest = null;
        let minDistance = Infinity;
        
        powerUps.forEach(powerUp => {
            const distance = this.getDistance(this.player, powerUp);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = powerUp;
            }
        });
        
        return nearest;
    }
    
    findNearestPlatform() {
        let nearest = null;
        let minDistance = Infinity;
        
        platforms.forEach(platform => {
            const platformCenter = { x: platform.x + platform.width/2, y: platform.y };
            const distance = this.getDistance(this.player, platformCenter);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = platform;
            }
        });
        
        return nearest;
    }
    
    findPlatformAbove() {
        return platforms.find(platform => 
            platform.y < this.player.y - 100 &&
            platform.x < this.player.x + this.player.width &&
            platform.x + platform.width > this.player.x
        );
    }
}

// Sound effects (Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sound generation functions
function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Power-up class
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = Object.keys(POWERUP_TYPES)[Math.floor(Math.random() * Object.keys(POWERUP_TYPES).length)];
        this.config = POWERUP_TYPES[this.type];
        this.bobOffset = Math.random() * Math.PI * 2;
        this.lifetime = 600; // 10 seconds at 60fps
    }
    
    update() {
        this.bobOffset += 0.1;
        this.y += Math.sin(this.bobOffset) * 0.5;
        this.lifetime--;
        return this.lifetime > 0;
    }
    
    draw() {
        // Glowing effect
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = this.config.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Symbol
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.config.symbol, this.x + this.width/2, this.y + this.height/2 + 7);
        
        ctx.shadowBlur = 0;
    }
    
    checkCollision(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
}

// Particle class for effects
class Particle {
    constructor(x, y, color, velocityX, velocityY, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.2; // Gravity for particles
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class Player {
    constructor(x, y, color, name, controls) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.color = color;
        this.originalColor = color;
        this.name = name;
        this.controls = controls;
        
        // Movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.facing = 1; // 1 = right, -1 = left
        
        // Combat
        this.health = 100;
        this.damage = 0; // Percentage damage (like in Smash Bros)
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.currentAttack = 'NORMAL';
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.invulnerable = 0; // Invulnerability frames
        
        // Power-ups
        this.powerUps = {
            speed: 0,
            strength: 0, 
            shield: 0,
            jump: 0
        };
        
        // Stats
        this.baseSpeed = PLAYER_SPEED;
        this.baseJump = JUMP_POWER;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        // Effects
        this.flashTimer = 0;
    }

    draw() {
        // Flash effect when taking damage
        if (this.flashTimer > 0) {
            this.flashTimer--;
            ctx.fillStyle = this.flashTimer % 8 < 4 ? 'white' : this.color;
        } else {
            ctx.fillStyle = this.color;
        }
        
        // Shield effect
        if (this.powerUps.shield > 0) {
            ctx.shadowColor = '#00CED1';
            ctx.shadowBlur = 15;
        }
        
        // Draw player body
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
        
        // Draw face direction indicator
        ctx.fillStyle = 'white';
        const eyeX = this.facing > 0 ? this.x + this.width - 10 : this.x + 5;
        ctx.fillRect(eyeX, this.y + 10, 5, 5);
        
        // Draw attack indicator
        if (this.isAttacking) {
            const attack = ATTACK_TYPES[this.currentAttack];
            ctx.fillStyle = attack.color;
            const attackX = this.facing > 0 ? this.x + this.width : this.x - attack.range;
            const attackY = this.currentAttack === 'UP' ? this.y - attack.range : 
                           this.currentAttack === 'DOWN' ? this.y + this.height : this.y + 15;
            const attackW = this.currentAttack === 'UP' || this.currentAttack === 'DOWN' ? this.width : attack.range;
            const attackH = this.currentAttack === 'UP' || this.currentAttack === 'DOWN' ? attack.range : 30;
            
            ctx.fillRect(attackX, attackY, attackW, attackH);
        }
        
        // Draw damage percentage
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(this.damage)}%`, this.x + this.width/2, this.y - 10);
        
        // Draw name
        ctx.fillStyle = this.color;
        ctx.font = '12px Arial';
        ctx.fillText(this.name, this.x + this.width/2, this.y - 25);
        
        // Draw active power-ups
        let powerUpY = this.y - 45;
        Object.keys(this.powerUps).forEach(powerUp => {
            if (this.powerUps[powerUp] > 0) {
                ctx.fillStyle = POWERUP_TYPES[powerUp.toUpperCase()].color;
                ctx.font = '10px Arial';
                ctx.fillText(POWERUP_TYPES[powerUp.toUpperCase()].symbol, this.x - 15, powerUpY);
                powerUpY -= 15;
            }
        });
    }

    update() {
        // Update power-ups
        Object.keys(this.powerUps).forEach(powerUp => {
            if (this.powerUps[powerUp] > 0) {
                this.powerUps[powerUp]--;
            }
        });
        
        // Update invulnerability
        if (this.invulnerable > 0) this.invulnerable--;
        
        // Apply gravity
        this.velocityY += GRAVITY;
        
        // Apply knockback decay
        this.knockbackX *= KNOCKBACK_DECAY;
        this.knockbackY *= KNOCKBACK_DECAY;
        
        // Update position with velocity and knockback
        this.x += this.velocityX + this.knockbackX;
        this.y += this.velocityY + this.knockbackY;
        
        // Apply friction when grounded
        if (this.isGrounded) {
            this.velocityX *= FRICTION;
        } else {
            this.velocityX *= AIR_RESISTANCE;
        }
        
        // Platform collision
        this.isGrounded = false;
        for (let platform of platforms) {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height > platform.y &&
                this.y + this.height < platform.y + platform.height + 10 &&
                this.velocityY + this.knockbackY >= 0) {
                
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.knockbackY = 0;
                this.isGrounded = true;
                break;
            }
        }
        
        // Screen boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        
        // Death zone (fall off screen)
        if (this.y > canvas.height + 100) {
            this.respawn();
        }
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        if (this.isAttacking && this.attackCooldown <= 0) {
            this.isAttacking = false;
        }
    }

    jump() {
        if (this.isGrounded) {
            const jumpPower = this.powerUps.jump > 0 ? this.baseJump * 1.5 : this.baseJump;
            this.velocityY = jumpPower;
            this.isGrounded = false;
            playSound(220, 0.1, 'sine'); // Jump sound
        }
    }

    move(direction) {
        const speed = this.powerUps.speed > 0 ? this.baseSpeed * 1.8 : this.baseSpeed;
        this.velocityX += direction * speed * 0.3;
        this.facing = direction > 0 ? 1 : -1;
        
        // Limit max speed
        if (this.velocityX > speed) this.velocityX = speed;
        if (this.velocityX < -speed) this.velocityX = -speed;
    }

    attack(type = 'NORMAL') {
        if (this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.currentAttack = type;
            this.attackCooldown = 20; // 20 frames cooldown
            
            // Attack sound
            const frequencies = { NORMAL: 150, STRONG: 100, UP: 200, DOWN: 120 };
            playSound(frequencies[type], 0.2, 'square');
            
            return true;
        }
        return false;
    }

    takeDamage(damage, knockbackX, knockbackY) {
        if (this.invulnerable > 0) return;
        
        // Shield reduces damage
        if (this.powerUps.shield > 0) {
            damage *= 0.5;
            knockbackX *= 0.5;
            knockbackY *= 0.5;
        }
        
        this.damage += damage;
        
        // Knockback increases with damage percentage
        const knockbackMultiplier = 1 + (this.damage / 100);
        this.knockbackX += knockbackX * knockbackMultiplier;
        this.knockbackY += knockbackY * knockbackMultiplier;
        
        // Flash effect and invulnerability
        this.flashTimer = 20;
        this.invulnerable = 30;
        
        // Hit sound
        playSound(80, 0.3, 'sawtooth');
        
        // Create hit particles
        for (let i = 0; i < 10; i++) {
            particles.push(new Particle(
                this.x + this.width/2,
                this.y + this.height/2,
                '#FF4444',
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                30
            ));
        }
    }

    applyPowerUp(type) {
        const config = POWERUP_TYPES[type];
        
        switch(config.effect) {
            case 'speed':
                this.powerUps.speed = config.duration;
                break;
            case 'strength':
                this.powerUps.strength = config.duration;
                break;
            case 'shield':
                this.powerUps.shield = config.duration;
                break;
            case 'jump':
                this.powerUps.jump = config.duration;
                break;
            case 'health':
                this.damage = Math.max(0, this.damage - 30);
                break;
        }
        
        // Power-up sound
        playSound(440, 0.3, 'sine');
        
        // Power-up particles
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(
                this.x + this.width/2,
                this.y + this.height/2,
                config.color,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                40
            ));
        }
    }

    respawn() {
        this.damage += 50; // Penalty for falling off
        this.x = Math.random() * (canvas.width - this.width);
        this.y = 100;
        this.velocityX = 0;
        this.velocityY = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.invulnerable = 60; // 1 second of invulnerability
        
        // Reset power-ups
        Object.keys(this.powerUps).forEach(key => {
            this.powerUps[key] = 0;
        });
        
        playSound(60, 0.5, 'triangle'); // Death sound
    }

    checkCollision(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    getAttackBox() {
        if (!this.isAttacking) return null;
        
        const attack = ATTACK_TYPES[this.currentAttack];
        const attackX = this.facing > 0 ? this.x + this.width : this.x - attack.range;
        const attackY = this.currentAttack === 'UP' ? this.y - attack.range : 
                       this.currentAttack === 'DOWN' ? this.y + this.height : this.y + 15;
        const attackW = this.currentAttack === 'UP' || this.currentAttack === 'DOWN' ? this.width : attack.range;
        const attackH = this.currentAttack === 'UP' || this.currentAttack === 'DOWN' ? attack.range : 30;
        
        return { x: attackX, y: attackY, width: attackW, height: attackH };
    }
}

// Create players with different controls
const player1 = new Player(200, 100, '#4A90E2', 'Joueur', {
    left: 'a',
    right: 'd', 
    jump: 'w',
    attack: 's',
    strongAttack: 'q',
    upAttack: 'e',
    downAttack: 'x'
});

const player2 = new Player(canvas.width - 250, 100, '#E24A4A', `IA (${AI_CONFIG[currentAIDifficulty].name})`, {
    // AI doesn't need controls, but we keep them for compatibility
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp', 
    attack: 'ArrowDown',
    strongAttack: 'Numpad1',
    upAttack: 'Numpad2',
    downAttack: 'Numpad3'
});

// Create AI controller for player 2
const aiController = new AIController(player2, player1);

// Game state
gameTime = 0;
powerUpSpawnTimer = 0;

function spawnPowerUp() {
    if (powerUps.length < 3) { // Max 3 power-ups on screen
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const x = platform.x + Math.random() * (platform.width - 30);
        const y = platform.y - 35;
        powerUps.push(new PowerUp(x, y));
    }
}

function updatePowerUps() {
    powerUps = powerUps.filter(powerUp => {
        powerUp.update();
        
        // Check collision with players
        if (powerUp.checkCollision(player1)) {
            player1.applyPowerUp(powerUp.type);
            return false;
        }
        if (powerUp.checkCollision(player2)) {
            player2.applyPowerUp(powerUp.type);
            return false;
        }
        
        return powerUp.lifetime > 0;
    });
}

function updateParticles() {
    particles = particles.filter(particle => {
        particle.update();
        return particle.life > 0;
    });
}

function drawPlatforms() {
    ctx.fillStyle = '#8B4513';
    for (let platform of platforms) {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add platform borders
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    }
}

function drawPowerUps() {
    powerUps.forEach(powerUp => powerUp.draw());
}

function drawParticles() {
    particles.forEach(particle => particle.draw());
}

function drawUI() {
    // Draw background for UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 100);
    
    // Player 1 damage and health bar
    ctx.fillStyle = player1.color;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${player1.name}: ${Math.floor(player1.damage)}%`, 20, 25);
    
    // Player 1 health bar
    const p1HealthWidth = Math.max(0, 200 - (player1.damage * 2));
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(20, 35, 200, 10);
    ctx.fillStyle = player1.damage > 150 ? '#FF0000' : player1.damage > 100 ? '#FF8800' : '#00FF00';
    ctx.fillRect(20, 35, p1HealthWidth, 10);
    
    // AI player damage and health bar
    ctx.textAlign = 'right';
    ctx.fillStyle = player2.color;
    ctx.fillText(`${player2.name}: ${Math.floor(player2.damage)}%`, canvas.width - 20, 25);
    
    // Player 2 health bar
    const p2HealthWidth = Math.max(0, 200 - (player2.damage * 2));
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(canvas.width - 220, 35, 200, 10);
    ctx.fillStyle = player2.damage > 150 ? '#FF0000' : player2.damage > 100 ? '#FF8800' : '#00FF00';
    ctx.fillRect(canvas.width - 220, 35, p2HealthWidth, 10);
    
    // Game timer
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '16px Arial';
    const minutes = Math.floor(gameTime / 3600);
    const seconds = Math.floor((gameTime % 3600) / 60);
    ctx.fillText(`⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width / 2, 25);
    
    // AI difficulty and status
    ctx.font = '12px Arial';
    ctx.fillText(`🤖 IA: ${AI_CONFIG[currentAIDifficulty].name}`, canvas.width / 2, 45);
    
    // AI behavior indicator
    if (aiController.isChasing) ctx.fillText('🏃 Poursuite', canvas.width / 2, 60);
    else if (aiController.isRetreating) ctx.fillText('🛡️ Retraite', canvas.width / 2, 60);
    else if (aiController.isGoingForPowerUp) ctx.fillText('💎 Power-up', canvas.width / 2, 60);
    else ctx.fillText('🎯 Positionnement', canvas.width / 2, 60);
    
    // Power-up count
    ctx.fillText(`💎 Power-ups: ${powerUps.length}`, canvas.width / 2, 75);
    
    // Controls help
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Contrôles: WASD+QEX | ESC: Pause | R: Reset | 1-4: Difficulté IA', 20, canvas.height - 10);
}

function checkCombat() {
    // Player 1 attacking Player 2
    if (player1.isAttacking) {
        const attackBox = player1.getAttackBox();
        if (attackBox && player2.x < attackBox.x + attackBox.width &&
            player2.x + player2.width > attackBox.x &&
            player2.y < attackBox.y + attackBox.height &&
            player2.y + player2.height > attackBox.y) {
            
            const attack = ATTACK_TYPES[player1.currentAttack];
            let damage = attack.damage;
            let knockbackX = player1.facing * attack.knockbackX;
            let knockbackY = attack.knockbackY;
            
            // Strength power-up increases damage
            if (player1.powerUps.strength > 0) {
                damage *= 1.5;
                knockbackX *= 1.3;
                knockbackY *= 1.3;
            }
            
            player2.takeDamage(damage, knockbackX, knockbackY);
            player1.isAttacking = false; // Prevent multi-hit
        }
    }
    
    // Player 2 attacking Player 1
    if (player2.isAttacking) {
        const attackBox = player2.getAttackBox();
        if (attackBox && player1.x < attackBox.x + attackBox.width &&
            player1.x + player1.width > attackBox.x &&
            player1.y < attackBox.y + attackBox.height &&
            player1.y + player1.height > attackBox.y) {
            
            const attack = ATTACK_TYPES[player2.currentAttack];
            let damage = attack.damage;
            let knockbackX = player2.facing * attack.knockbackX;
            let knockbackY = attack.knockbackY;
            
            // Strength power-up increases damage
            if (player2.powerUps.strength > 0) {
                damage *= 1.5;
                knockbackX *= 1.3;
                knockbackY *= 1.3;
            }
            
            player1.takeDamage(damage, knockbackX, knockbackY);
            player2.isAttacking = false; // Prevent multi-hit
        }
    }
}

function gameLoop() {
    if (gameState !== 'playing') {
        // Draw pause screen
        if (gameState === 'paused') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⏸️ PAUSE', canvas.width / 2, canvas.height / 2);
            ctx.font = '24px Arial';
            ctx.fillText('Appuyez sur ESC pour reprendre', canvas.width / 2, canvas.height / 2 + 50);
            ctx.fillText('Appuyez sur R pour redémarrer', canvas.width / 2, canvas.height / 2 + 80);
        }
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update game time
    gameTime++;
    
    // Spawn power-ups
    powerUpSpawnTimer++;
    if (powerUpSpawnTimer >= 300) { // Every 5 seconds
        spawnPowerUp();
        powerUpSpawnTimer = 0;
    }
    
    // Handle input
    handleInput();
    
    // Update game objects
    player1.update();
    player2.update();
    
    // Update AI
    aiController.update();
    
    updatePowerUps();
    updateParticles();
    
    // Check combat
    checkCombat();
    
    // Draw everything
    drawPlatforms();
    drawPowerUps();
    drawParticles();
    player1.draw();
    player2.draw();
    drawUI();
    
    // Check game over conditions
    if (player1.damage >= 300 || player2.damage >= 300) {
        gameState = 'gameOver';
        const winner = player1.damage >= 300 ? player2.name : player1.name;
        
        // Draw game over screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'gold';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 VICTOIRE! 🏆', canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`${winner} a gagné!`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.font = '24px Arial';
        ctx.fillText('Appuyez sur R pour rejouer', canvas.width / 2, canvas.height / 2 + 70);
        
        playSound(523, 0.5, 'sine'); // Victory sound
    }
    
    requestAnimationFrame(gameLoop);
}

// Input handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Prevent default browser behavior for game keys
    if (['w', 'a', 's', 'd', 'q', 'e', 'x', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
    
    // Initialize audio context on first user interaction
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function handleInput() {
    // Player 1 controls only (Human player)
    if (keys[player1.controls.left]) {
        player1.move(-1);
    }
    if (keys[player1.controls.right]) {
        player1.move(1);
    }
    if (keys[player1.controls.jump]) {
        player1.jump();
    }
    if (keys[player1.controls.attack]) {
        player1.attack('NORMAL');
    }
    if (keys[player1.controls.strongAttack]) {
        player1.attack('STRONG');
    }
    if (keys[player1.controls.upAttack]) {
        player1.attack('UP');
    }
    if (keys[player1.controls.downAttack]) {
        player1.attack('DOWN');
    }

    // AI Difficulty controls
    if (keys['1']) {
        currentAIDifficulty = 'EASY';
        player2.name = `IA (${AI_CONFIG[currentAIDifficulty].name})`;
        keys['1'] = false;
    }
    if (keys['2']) {
        currentAIDifficulty = 'MEDIUM';
        player2.name = `IA (${AI_CONFIG[currentAIDifficulty].name})`;
        keys['2'] = false;
    }
    if (keys['3']) {
        currentAIDifficulty = 'HARD';
        player2.name = `IA (${AI_CONFIG[currentAIDifficulty].name})`;
        keys['3'] = false;
    }
    if (keys['4']) {
        currentAIDifficulty = 'EXPERT';
        player2.name = `IA (${AI_CONFIG[currentAIDifficulty].name})`;
        keys['4'] = false;
    }
    
    // Game controls
    if (keys['Escape']) {
        gameState = gameState === 'playing' ? 'paused' : 'playing';
        keys['Escape'] = false; // Prevent rapid toggling
    }
    
    if (keys['r'] || keys['R']) {
        // Reset game
        player1.damage = 0;
        player2.damage = 0;
        player1.x = 200;
        player1.y = 100;
        player2.x = canvas.width - 250;
        player2.y = 100;
        player1.velocityX = 0;
        player1.velocityY = 0;
        player2.velocityX = 0;
        player2.velocityY = 0;
        player1.powerUps = { speed: 0, strength: 0, shield: 0, jump: 0 };
        player2.powerUps = { speed: 0, strength: 0, shield: 0, jump: 0 };
        powerUps.length = 0;
        particles.length = 0;
        gameTime = 0;
        powerUpSpawnTimer = 0;
        gameState = 'playing';
        keys['r'] = false;
        keys['R'] = false;
    }
}

// Start the game
gameLoop();
