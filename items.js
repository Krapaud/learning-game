// Items and Projectiles System
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.type = type;
        this.velocityX = 0;
        this.velocityY = 0;
        this.lifetime = 1200; // 20 seconds at 60fps
        this.bobOffset = Math.random() * Math.PI * 2;
        this.isPickedUp = false;
        this.config = ITEM_TYPES[type];
    }
    
    update() {
        this.bobOffset += 0.1;
        this.y += Math.sin(this.bobOffset) * 0.3;
        this.lifetime--;
        
        // Apply gravity if thrown
        if (this.velocityY !== 0) {
            this.velocityY += 0.3;
            this.x += this.velocityX;
            this.y += this.velocityY;
            
            // Friction
            this.velocityX *= 0.98;
            
            // Ground collision
            if (this.y > canvas.height - 100) {
                this.y = canvas.height - 100;
                this.velocityY = -this.velocityY * 0.5;
                this.velocityX *= 0.8;
            }
        }
        
        return this.lifetime > 0;
    }
    
    draw(ctx) {
        // Glow effect
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 8;
        
        ctx.fillStyle = this.config.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Item symbol
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.config.symbol, this.x + this.width/2, this.y + this.height/2 + 5);
        
        ctx.shadowBlur = 0;
    }
    
    checkCollision(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }
    
    use(player, opponent) {
        this.config.effect(player, opponent, this);
        this.isPickedUp = true;
    }
}

class Projectile {
    constructor(x, y, velocityX, velocityY, damage, owner, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.damage = damage;
        this.owner = owner;
        this.type = type;
        this.lifetime = 180; // 3 seconds
        this.hitTargets = new Set();
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Gravity for some projectiles
        if (this.type === 'fireball' || this.type === 'bomb') {
            this.velocityY += 0.2;
        }
        
        this.lifetime--;
        
        // Remove if off screen or lifetime expired
        return this.lifetime > 0 && 
               this.x > -50 && this.x < canvas.width + 50 &&
               this.y > -50 && this.y < canvas.height + 50;
    }
    
    draw(ctx) {
        switch (this.type) {
            case 'fireball':
                ctx.fillStyle = '#FF4500';
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Fire effect
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'laser':
                ctx.fillStyle = '#00FFFF';
                ctx.fillRect(this.x, this.y + this.height/3, this.width, this.height/3);
                
                // Laser glow
                ctx.shadowColor = '#00FFFF';
                ctx.shadowBlur = 10;
                ctx.fillRect(this.x, this.y + this.height/3, this.width, this.height/3);
                ctx.shadowBlur = 0;
                break;
                
            case 'sword_beam':
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Sparkle effect
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(this.x + 2, this.y + 2, 3, 3);
                ctx.fillRect(this.x + this.width - 5, this.y + this.height - 5, 3, 3);
                break;
                
            case 'thunder':
                ctx.strokeStyle = '#FFFF00';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + 5, this.y + this.height/2);
                ctx.lineTo(this.x - 5, this.y + this.height/2);
                ctx.lineTo(this.x, this.y + this.height);
                ctx.stroke();
                
                // Electric effect
                ctx.shadowColor = '#FFFF00';
                ctx.shadowBlur = 15;
                ctx.stroke();
                ctx.shadowBlur = 0;
                break;
                
            default:
                ctx.fillStyle = '#888888';
                ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    checkCollision(target) {
        if (this.hitTargets.has(target) || target === this.owner) return false;
        
        return this.x < target.x + target.width &&
               this.x + this.width > target.x &&
               this.y < target.y + target.height &&
               this.y + this.height > target.y;
    }
    
    hit(target) {
        this.hitTargets.add(target);
        
        // Calculate knockback direction
        const knockbackX = this.velocityX > 0 ? 8 : -8;
        const knockbackY = -3;
        
        target.takeDamage(this.damage, knockbackX, knockbackY);
        
        // Create hit effect
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(
                this.x + this.width/2,
                this.y + this.height/2,
                '#FFFF00',
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8,
                25
            ));
        }
        
        // Remove projectile after hit for most types
        if (this.type !== 'laser') {
            this.lifetime = 0;
        }
    }
}

// Item types configuration
const ITEM_TYPES = {
    POKEBALL: {
        color: '#FF0000',
        symbol: '⚪',
        effect: (player, opponent, item) => {
            // Summon a Pokemon that attacks the opponent
            const pokemon = new PokemonSummon(item.x, item.y, player, opponent);
            summons.push(pokemon);
            playSound(400, 0.3, 'sine');
        }
    },
    
    HOMERUN_BAT: {
        color: '#8B4513',
        symbol: '🏏',
        effect: (player, opponent, item) => {
            // Give player a powerful bat attack
            player.hasHomerunBat = 180; // 3 seconds
            playSound(300, 0.2, 'square');
        }
    },
    
    HEART: {
        color: '#FF69B4',
        symbol: '❤️',
        effect: (player, opponent, item) => {
            player.damage = Math.max(0, player.damage - 50);
            playSound(550, 0.3, 'sine');
            
            // Healing particles
            for (let i = 0; i < 12; i++) {
                particles.push(new Particle(
                    player.x + player.width/2,
                    player.y + player.height/2,
                    '#FF69B4',
                    (Math.random() - 0.5) * 6,
                    -Math.random() * 8,
                    40
                ));
            }
        }
    },
    
    STAR: {
        color: '#FFD700',
        symbol: '⭐',
        effect: (player, opponent, item) => {
            player.isInvincible = 300; // 5 seconds of invincibility
            player.starPower = 300;
            playSound(660, 0.5, 'sine');
        }
    },
    
    BOMB: {
        color: '#333333',
        symbol: '💣',
        effect: (player, opponent, item) => {
            // Create explosion
            const explosion = new Explosion(item.x, item.y, 80, 35);
            explosions.push(explosion);
            playSound(100, 0.8, 'sawtooth');
        }
    },
    
    MUSHROOM: {
        color: '#FF0000',
        symbol: '🍄',
        effect: (player, opponent, item) => {
            player.sizeMultiplier = 1.5;
            player.mushroomEffect = 600; // 10 seconds
            playSound(440, 0.3, 'triangle');
        }
    }
};

// Special summons and effects
class PokemonSummon {
    constructor(x, y, owner, target) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.target = target;
        this.lifetime = 300; // 5 seconds
        this.attackCooldown = 0;
        this.type = ['PIKACHU', 'CHARIZARD', 'BLASTOISE'][Math.floor(Math.random() * 3)];
    }
    
    update() {
        this.lifetime--;
        this.attackCooldown--;
        
        if (this.attackCooldown <= 0 && this.lifetime > 0) {
            this.attack();
            this.attackCooldown = 60; // Attack every second
        }
        
        return this.lifetime > 0;
    }
    
    attack() {
        switch (this.type) {
            case 'PIKACHU':
                // Lightning attack
                projectiles.push(new Projectile(
                    this.x, this.y - 100, 0, 5, 20, this.owner, 'thunder'
                ));
                break;
                
            case 'CHARIZARD':
                // Fire breath
                for (let i = 0; i < 3; i++) {
                    projectiles.push(new Projectile(
                        this.x + i * 30, this.y,
                        this.target.x > this.x ? 8 : -8, -2 + i,
                        15, this.owner, 'fireball'
                    ));
                }
                break;
                
            case 'BLASTOISE':
                // Water cannon
                projectiles.push(new Projectile(
                    this.x, this.y,
                    this.target.x > this.x ? 12 : -12, -1,
                    18, this.owner, 'laser'
                ));
                break;
        }
    }
    
    draw(ctx) {
        // Simple Pokemon representation
        ctx.fillStyle = this.type === 'PIKACHU' ? '#FFFF00' : 
                       this.type === 'CHARIZARD' ? '#FF4500' : '#0066FF';
        ctx.fillRect(this.x, this.y, 40, 40);
        
        // Pokemon symbol
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        const symbol = this.type === 'PIKACHU' ? '⚡' : 
                      this.type === 'CHARIZARD' ? '🔥' : '💧';
        ctx.fillText(symbol, this.x + 20, this.y + 25);
    }
}

class Explosion {
    constructor(x, y, radius, damage) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.damage = damage;
        this.currentRadius = 0;
        this.lifetime = 30;
        this.hasHit = new Set();
    }
    
    update() {
        this.currentRadius += this.radius / 15;
        this.lifetime--;
        
        return this.lifetime > 0;
    }
    
    draw(ctx) {
        // Explosion effect
        const alpha = this.lifetime / 30;
        ctx.globalAlpha = alpha;
        
        // Outer ring
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner ring
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
    
    checkCollision(player) {
        if (this.hasHit.has(player)) return false;
        
        const dx = player.x + player.width/2 - this.x;
        const dy = player.y + player.height/2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.currentRadius) {
            this.hasHit.add(player);
            const knockbackX = (dx / distance) * 15;
            const knockbackY = (dy / distance) * 15 - 5;
            player.takeDamage(this.damage, knockbackX, knockbackY);
            return true;
        }
        
        return false;
    }
}

// Global arrays for items and effects
let items = [];
let projectiles = [];
let summons = [];
let explosions = [];
