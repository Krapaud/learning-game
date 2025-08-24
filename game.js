// Main Game Script - Super Smash Bros Ultimate Clone
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1200;
canvas.height = 800;

// Game State Management
let gameState = 'menu'; // 'menu', 'selection', 'playing', 'paused', 'gameOver'
let gameMode = null;
let currentStage = null;
let selectionScreen = null;
let gameModeScreen = new GameModeScreen();

// Player characters
let player1Character = null;
let player2Character = null;

// Stocks system (lives)
let player1Stocks = 3;
let player2Stocks = 3;
let battleTime = 7200; // 2 minutes in frames (120 seconds * 60fps)

// Game timers
let gameTime = 0;
let powerUpSpawnTimer = 0;
let itemSpawnTimer = 0;

// Enhanced Player class with character integration
class Player {
    constructor(x, y, character, name, controls, isAI = false) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.character = character;
        this.name = name;
        this.controls = controls;
        this.isAI = isAI;
        
        // Movement (use character stats)
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.facing = 1; // 1 = right, -1 = left
        this.baseSpeed = character.stats.speed;
        this.baseJump = character.stats.jumpPower;
        
        // Combat
        this.damage = 0;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.currentAttack = 'neutral';
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.invulnerable = 0;
        this.stocks = 3;
        
        // Special effects
        this.isInvincible = 0;
        this.starPower = 0;
        this.hasHomerunBat = 0;
        this.sizeMultiplier = 1;
        this.mushroomEffect = 0;
        
        // Power-ups
        this.powerUps = {
            speed: 0,
            strength: 0, 
            shield: 0,
            jump: 0
        };
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.flashTimer = 0;
    }

    draw() {
        ctx.save();
        
        // Apply size multiplier
        if (this.sizeMultiplier !== 1) {
            const scaleX = this.sizeMultiplier;
            const scaleY = this.sizeMultiplier;
            ctx.scale(scaleX, scaleY);
            this.width = 40 * scaleX;
            this.height = 60 * scaleY;
        }
        
        // Star power effect
        if (this.starPower > 0) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;
        }
        
        // Flash effect when taking damage
        if (this.flashTimer > 0) {
            this.flashTimer--;
            if (this.flashTimer % 8 < 4) {
                ctx.globalAlpha = 0.5;
            }
        }
        
        // Use character sprite
        this.character.drawSprite(ctx, this.x / this.sizeMultiplier, this.y / this.sizeMultiplier, 
                                  40, 60, this.facing > 0);
        
        ctx.restore();
        
        // Draw attack indicator
        if (this.isAttacking) {
            const move = this.character.moves[this.currentAttack];
            if (move) {
                ctx.fillStyle = this.hasHomerunBat > 0 ? '#FFD700' : '#FF6666';
                const attackX = this.facing > 0 ? this.x + this.width : this.x - move.range;
                const attackY = this.currentAttack === 'up' ? this.y - move.range : 
                               this.currentAttack === 'down' ? this.y + this.height : this.y + 15;
                const attackW = this.currentAttack === 'up' || this.currentAttack === 'down' ? this.width : move.range;
                const attackH = this.currentAttack === 'up' || this.currentAttack === 'down' ? move.range : 30;
                
                ctx.globalAlpha = 0.5;
                ctx.fillRect(attackX, attackY, attackW, attackH);
                ctx.globalAlpha = 1;
            }
        }
        
        // Draw damage percentage
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(`${Math.floor(this.damage)}%`, this.x + this.width/2, this.y - 10);
        ctx.fillText(`${Math.floor(this.damage)}%`, this.x + this.width/2, this.y - 10);
        
        // Draw character name
        ctx.fillStyle = this.character.color;
        ctx.font = '12px Arial';
        ctx.strokeText(this.character.name, this.x + this.width/2, this.y - 25);
        ctx.fillText(this.character.name, this.x + this.width/2, this.y - 25);
        
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
        // Update special effects
        if (this.isInvincible > 0) this.isInvincible--;
        if (this.starPower > 0) this.starPower--;
        if (this.hasHomerunBat > 0) this.hasHomerunBat--;
        if (this.mushroomEffect > 0) {
            this.mushroomEffect--;
            if (this.mushroomEffect <= 0) {
                this.sizeMultiplier = 1;
            }
        }
        
        // Update power-ups
        Object.keys(this.powerUps).forEach(powerUp => {
            if (this.powerUps[powerUp] > 0) {
                this.powerUps[powerUp]--;
            }
        });
        
        // Update invulnerability
        if (this.invulnerable > 0) this.invulnerable--;
        
        // Apply gravity (use character stats)
        this.velocityY += GRAVITY * this.character.stats.fallSpeed;
        
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
        
        // Platform collision (use current stage platforms)
        this.isGrounded = false;
        if (currentStage) {
            for (let platform of currentStage.platforms) {
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
        }
        
        // Screen boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        
        // Death zone (fall off screen) - lose stock
        if (this.y > canvas.height + 100) {
            this.loseStock();
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
            playSound(220, 0.1, 'sine');
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

    attack(type = 'neutral') {
        if (this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.currentAttack = type;
            this.attackCooldown = 20;
            
            // Create projectile for special attacks
            if (type === 'special' && this.character.moves.special) {
                this.createSpecialProjectile();
            }
            
            // Attack sound
            const frequencies = { neutral: 150, forward: 100, up: 200, down: 120, special: 250 };
            playSound(frequencies[type] || 150, 0.2, 'square');
            
            return true;
        }
        return false;
    }

    createSpecialProjectile() {
        const special = this.character.moves.special;
        let projectileType = 'normal';
        
        switch (this.character.name) {
            case 'Mario':
                projectileType = 'fireball';
                break;
            case 'Link':
                projectileType = 'sword_beam';
                break;
            case 'Pikachu':
                projectileType = 'thunder';
                break;
            case 'Samus':
                projectileType = 'laser';
                break;
        }
        
        projectiles.push(new Projectile(
            this.x + (this.facing > 0 ? this.width : 0),
            this.y + this.height/2,
            this.facing * 10,
            0,
            special.damage,
            this,
            projectileType
        ));
    }

    takeDamage(damage, knockbackX, knockbackY) {
        if (this.invulnerable > 0 || this.isInvincible > 0) return;
        
        // Shield reduces damage
        if (this.powerUps.shield > 0) {
            damage *= 0.5;
            knockbackX *= 0.5;
            knockbackY *= 0.5;
        }
        
        // Star power makes invincible
        if (this.starPower > 0) return;
        
        this.damage += damage;
        
        // Knockback increases with damage percentage
        let knockbackMultiplier = 1 + (this.damage / 100);
        
        // Homerun bat multiplier
        if (knockbackX > 0 || knockbackY > 0) { // If this is from an attack
            if (this.hasHomerunBat > 0) {
                knockbackMultiplier *= 2;
            }
        }
        
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

    loseStock() {
        this.stocks--;
        if (this === player1) player1Stocks--;
        if (this === player2) player2Stocks--;
        
        // Reset position and state
        const spawns = currentStage.spawns;
        const spawn = this === player1 ? spawns[0] : spawns[1];
        this.x = spawn.x;
        this.y = spawn.y;
        this.damage = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.invulnerable = 120; // 2 seconds of invulnerability
        
        // Reset effects
        this.isInvincible = 0;
        this.starPower = 0;
        this.hasHomerunBat = 0;
        this.sizeMultiplier = 1;
        this.mushroomEffect = 0;
        
        // Reset power-ups
        Object.keys(this.powerUps).forEach(key => {
            this.powerUps[key] = 0;
        });
        
        playSound(60, 0.5, 'triangle');
    }

    getAttackBox() {
        if (!this.isAttacking) return null;
        
        const move = this.character.moves[this.currentAttack];
        if (!move) return null;
        
        const attackX = this.facing > 0 ? this.x + this.width : this.x - move.range;
        const attackY = this.currentAttack === 'up' ? this.y - move.range : 
                       this.currentAttack === 'down' ? this.y + this.height : this.y + 15;
        const attackW = this.currentAttack === 'up' || this.currentAttack === 'down' ? this.width : move.range;
        const attackH = this.currentAttack === 'up' || this.currentAttack === 'down' ? move.range : 30;
        
        return { x: attackX, y: attackY, width: attackW, height: attackH, damage: move.damage, knockback: move.knockback };
    }
}

// Constants
const GRAVITY = 0.8;
const FRICTION = 0.8;
const AIR_RESISTANCE = 0.95;
const KNOCKBACK_DECAY = 0.9;

// Sound effects (Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    try {
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
    } catch (e) {
        // Ignore audio errors
    }
}

// Initialize game systems
let powerUps = [];
let particles = [];
let player1 = null;
let player2 = null;
let aiController = null;

// Power-up types (simplified version)
const POWERUP_TYPES = {
    SPEED: { color: '#FFD700', effect: 'speed', duration: 300, symbol: '⚡' },
    STRENGTH: { color: '#FF4500', effect: 'strength', duration: 300, symbol: '💪' },
    SHIELD: { color: '#00CED1', effect: 'shield', duration: 200, symbol: '🛡️' },
    JUMP: { color: '#9370DB', effect: 'jump', duration: 250, symbol: '🦘' },
    HEALTH: { color: '#32CD32', effect: 'health', duration: 0, symbol: '❤️' }
};

// Game functions
function initializeGame(selectedCharacter, selectedStage, mode) {
    gameMode = mode;
    
    // Create stage
    const StageClass = STAGES[selectedStage];
    currentStage = new StageClass();
    
    // Create characters
    const CharacterClass = CHARACTERS[selectedCharacter];
    const playerCharacter = new CharacterClass();
    const aiCharacterName = CHARACTER_NAMES[Math.floor(Math.random() * CHARACTER_NAMES.length)];
    const AICharacterClass = CHARACTERS[aiCharacterName];
    const aiCharacter = new AICharacterClass();
    
    // Create players
    player1 = new Player(
        currentStage.spawns[0].x,
        currentStage.spawns[0].y,
        playerCharacter,
        'Player',
        {
            left: 'a', right: 'd', jump: 'w',
            attack: 's', strongAttack: 'q', upAttack: 'e', downAttack: 'x', special: 'c'
        }
    );
    
    player2 = new Player(
        currentStage.spawns[1].x,
        currentStage.spawns[1].y,
        aiCharacter,
        `AI (${aiCharacterName})`,
        {},
        true
    );
    
    // Setup AI if needed
    if (mode.name === 'VS CPU') {
        const AI_CONFIG = {
            MEDIUM: {
                reactionTime: 20,
                accuracy: 0.75,
                aggressiveness: 0.6,
                powerUpPriority: 0.6
            }
        };
        
        aiController = {
            player: player2,
            opponent: player1,
            config: AI_CONFIG.MEDIUM,
            decisionTimer: 0,
            update() {
                this.decisionTimer++;
                if (this.decisionTimer >= this.config.reactionTime) {
                    this.makeDecision();
                    this.decisionTimer = 0;
                }
            },
            makeDecision() {
                const distance = Math.abs(this.player.x - this.opponent.x);
                
                if (distance < 100 && Math.random() < this.config.aggressiveness) {
                    if (Math.random() < this.config.accuracy) {
                        this.player.attack('neutral');
                    }
                } else if (distance > 150) {
                    const direction = this.opponent.x > this.player.x ? 1 : -1;
                    this.player.move(direction);
                    
                    if (this.opponent.y < this.player.y - 50 && this.player.isGrounded) {
                        this.player.jump();
                    }
                }
            }
        };
    }
    
    // Reset game state
    player1Stocks = 3;
    player2Stocks = 3;
    battleTime = 7200;
    gameTime = 0;
    powerUpSpawnTimer = 0;
    itemSpawnTimer = 0;
    items = [];
    powerUps = [];
    particles = [];
    projectiles = [];
    explosions = [];
    summons = [];
    
    gameState = 'playing';
}

function updateGame() {
    if (gameState !== 'playing') return;
    
    gameTime++;
    battleTime--;
    
    // Spawn items occasionally
    itemSpawnTimer++;
    if (itemSpawnTimer >= 600) { // Every 10 seconds
        spawnRandomItem();
        itemSpawnTimer = 0;
    }
    
    // Update players
    player1.update();
    player2.update();
    
    // Update AI
    if (aiController) {
        aiController.update();
    }
    
    // Update game objects
    updateItems();
    updateProjectiles();
    updateParticles();
    updateExplosions();
    updateSummons();
    
    // Check combat
    checkCombat();
    
    // Check win conditions
    checkWinConditions();
}

function spawnRandomItem() {
    if (items.length < 2 && currentStage) {
        const platform = currentStage.platforms[Math.floor(Math.random() * currentStage.platforms.length)];
        const x = platform.x + Math.random() * (platform.width - 30);
        const y = platform.y - 35;
        
        const itemTypes = Object.keys(ITEM_TYPES);
        const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        
        items.push(new Item(x, y, randomType));
    }
}

function updateItems() {
    items = items.filter(item => {
        const stillAlive = item.update();
        
        // Check collision with players
        if (item.checkCollision(player1)) {
            item.use(player1, player2);
            return false;
        }
        if (item.checkCollision(player2)) {
            item.use(player2, player1);
            return false;
        }
        
        return stillAlive && !item.isPickedUp;
    });
}

function updateProjectiles() {
    projectiles = projectiles.filter(projectile => {
        const stillAlive = projectile.update();
        
        // Check collisions with players
        if (projectile.checkCollision(player1)) {
            projectile.hit(player1);
        }
        if (projectile.checkCollision(player2)) {
            projectile.hit(player2);
        }
        
        return stillAlive;
    });
}

function updateParticles() {
    particles = particles.filter(particle => {
        particle.update();
        return particle.life > 0;
    });
}

function updateExplosions() {
    explosions = explosions.filter(explosion => {
        const stillAlive = explosion.update();
        
        // Check collision with players
        explosion.checkCollision(player1);
        explosion.checkCollision(player2);
        
        return stillAlive;
    });
}

function updateSummons() {
    summons = summons.filter(summon => {
        const stillAlive = summon.update();
        return stillAlive;
    });
}

function checkCombat() {
    // Player 1 attacking Player 2
    if (player1.isAttacking) {
        const attackBox = player1.getAttackBox();
        if (attackBox && player2.x < attackBox.x + attackBox.width &&
            player2.x + player2.width > attackBox.x &&
            player2.y < attackBox.y + attackBox.height &&
            player2.y + player2.height > attackBox.y) {
            
            let damage = attackBox.damage;
            let knockbackX = player1.facing * attackBox.knockback;
            let knockbackY = -5;
            
            // Apply power-up bonuses
            if (player1.powerUps.strength > 0) {
                damage *= 1.5;
                knockbackX *= 1.3;
                knockbackY *= 1.3;
            }
            
            player2.takeDamage(damage, knockbackX, knockbackY);
            player1.isAttacking = false;
        }
    }
    
    // Player 2 attacking Player 1 (similar logic)
    if (player2.isAttacking) {
        const attackBox = player2.getAttackBox();
        if (attackBox && player1.x < attackBox.x + attackBox.width &&
            player1.x + player1.width > attackBox.x &&
            player1.y < attackBox.y + attackBox.height &&
            player1.y + player1.height > attackBox.y) {
            
            let damage = attackBox.damage;
            let knockbackX = player2.facing * attackBox.knockback;
            let knockbackY = -5;
            
            if (player2.powerUps.strength > 0) {
                damage *= 1.5;
                knockbackX *= 1.3;
                knockbackY *= 1.3;
            }
            
            player1.takeDamage(damage, knockbackX, knockbackY);
            player2.isAttacking = false;
        }
    }
}

function checkWinConditions() {
    // Stock battle
    if (gameMode.name === 'STOCK BATTLE' || gameMode.name === 'VS CPU') {
        if (player1Stocks <= 0) {
            endGame(player2.character.name + ' Wins!');
        } else if (player2Stocks <= 0) {
            endGame(player1.character.name + ' Wins!');
        }
    }
    
    // Time battle
    if (gameMode.name === 'TIME BATTLE') {
        if (battleTime <= 0) {
            if (player1.damage < player2.damage) {
                endGame(player1.character.name + ' Wins!');
            } else if (player2.damage < player1.damage) {
                endGame(player2.character.name + ' Wins!');
            } else {
                endGame('Draw!');
            }
        }
    }
}

function endGame(winner) {
    gameState = 'gameOver';
    setTimeout(() => {
        gameState = 'menu';
        gameModeScreen = new GameModeScreen();
    }, 5000);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'menu') {
        gameModeScreen.update();
        gameModeScreen.draw(ctx, canvas);
    } else if (gameState === 'selection') {
        selectionScreen.update();
        selectionScreen.draw(ctx, canvas);
    } else if (gameState === 'playing' || gameState === 'paused') {
        // Draw stage
        if (currentStage) {
            currentStage.draw(ctx, canvas);
        }
        
        // Draw game objects
        items.forEach(item => item.draw(ctx));
        projectiles.forEach(projectile => projectile.draw(ctx));
        particles.forEach(particle => particle.draw(ctx));
        explosions.forEach(explosion => explosion.draw(ctx));
        summons.forEach(summon => summon.draw(ctx));
        
        // Draw players
        if (player1) player1.draw();
        if (player2) player2.draw();
        
        // Draw UI
        drawGameUI();
        
        if (gameState === 'paused') {
            drawPauseScreen();
        }
    } else if (gameState === 'gameOver') {
        drawGameOverScreen();
    }
}

function drawGameUI() {
    // Background for UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 120);
    
    // Player 1 info
    ctx.fillStyle = player1.character.color;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${player1.character.name}: ${Math.floor(player1.damage)}%`, 20, 25);
    
    // Player 1 stocks
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < player1Stocks; i++) {
        ctx.fillText('★', 20 + i * 25, 50);
    }
    
    // Player 2 info
    ctx.textAlign = 'right';
    ctx.fillStyle = player2.character.color;
    ctx.fillText(`${player2.character.name}: ${Math.floor(player2.damage)}%`, canvas.width - 20, 25);
    
    // Player 2 stocks
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < player2Stocks; i++) {
        ctx.fillText('★', canvas.width - 20 - i * 25, 50);
    }
    
    // Timer
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    if (gameMode.name === 'TIME BATTLE') {
        const minutes = Math.floor(battleTime / 3600);
        const seconds = Math.floor((battleTime % 3600) / 60);
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width / 2, 35);
    } else {
        const minutes = Math.floor(gameTime / 3600);
        const seconds = Math.floor((gameTime % 3600) / 60);
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width / 2, 35);
    }
    
    // Stage name
    ctx.font = '16px Arial';
    ctx.fillText(currentStage ? currentStage.name : '', canvas.width / 2, 60);
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '24px Arial';
    ctx.fillText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 50);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('Returning to menu...', canvas.width / 2, canvas.height / 2 + 50);
}

// Input handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    if (gameState === 'menu') {
        const selectedMode = gameModeScreen.handleInput(e.key);
        if (selectedMode) {
            gameState = 'selection';
            selectionScreen = new SelectionScreen();
        }
    } else if (gameState === 'selection') {
        const startGame = selectionScreen.handleInput(e.key);
        if (startGame) {
            initializeGame(
                selectionScreen.getSelectedCharacter(),
                selectionScreen.getSelectedStage(),
                gameMode
            );
        }
    } else if (gameState === 'playing') {
        handleGameInput();
    }
    
    // Global controls
    if (e.key === 'Escape') {
        if (gameState === 'playing') {
            gameState = 'paused';
        } else if (gameState === 'paused') {
            gameState = 'playing';
        }
    }
    
    if (e.key === 'r' || e.key === 'R') {
        gameState = 'menu';
        gameModeScreen = new GameModeScreen();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function handleGameInput() {
    if (!player1) return;
    
    // Player 1 controls
    if (keys['a']) player1.move(-1);
    if (keys['d']) player1.move(1);
    if (keys['w']) player1.jump();
    if (keys['s']) player1.attack('neutral');
    if (keys['q']) player1.attack('forward');
    if (keys['e']) player1.attack('up');
    if (keys['x']) player1.attack('down');
    if (keys['c']) player1.attack('special');
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
        this.velocityY += 0.2;
        this.life--;
        return this.life > 0;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// Main game loop
function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
