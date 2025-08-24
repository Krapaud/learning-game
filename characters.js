// Character System for Super Smash Bros Clone
class Character {
    constructor(config) {
        this.name = config.name;
        this.color = config.color;
        this.sprite = config.sprite;
        this.stats = config.stats;
        this.moves = config.moves;
        this.animations = config.animations;
        this.sounds = config.sounds;
        
        // Animation state
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.facingRight = true;
    }
    
    drawSprite(ctx, x, y, width, height, facing) {
        // Simple colored rectangle sprite for now (will be replaced with actual sprites)
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, width, height);
        
        // Character features
        this.drawCharacterFeatures(ctx, x, y, width, height, facing);
    }
    
    drawCharacterFeatures(ctx, x, y, width, height, facing) {
        // Override in character implementations
    }
}

// Mario Character
class Mario extends Character {
    constructor() {
        super({
            name: 'Mario',
            color: '#FF0000',
            stats: {
                speed: 6,
                jumpPower: -16,
                weight: 1.0,
                fallSpeed: 0.8
            },
            moves: {
                neutral: { damage: 12, knockback: 6, range: 35 },
                forward: { damage: 18, knockback: 10, range: 40 },
                up: { damage: 15, knockback: 8, range: 30 },
                down: { damage: 20, knockback: 4, range: 45 },
                special: { damage: 25, knockback: 12, range: 50, name: 'Fireball' }
            }
        });
    }
    
    drawCharacterFeatures(ctx, x, y, width, height, facing) {
        // Mario's hat
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 5, y - 5, width - 10, 15);
        
        // Mario's face
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 8, y + 8, width - 16, height - 25);
        
        // Mario's overalls
        ctx.fillStyle = '#0066FF';
        ctx.fillRect(x + 10, y + height/2, width - 20, height/2 - 5);
        
        // Mario's mustache
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 12, y + 18, width - 24, 6);
        
        // Eyes
        ctx.fillStyle = 'black';
        const eyeX = facing ? x + 15 : x + width - 20;
        ctx.fillRect(eyeX, y + 12, 3, 3);
        ctx.fillRect(eyeX + 8, y + 12, 3, 3);
    }
}

// Link Character
class Link extends Character {
    constructor() {
        super({
            name: 'Link',
            color: '#00AA00',
            stats: {
                speed: 7,
                jumpPower: -15,
                weight: 0.9,
                fallSpeed: 0.7
            },
            moves: {
                neutral: { damage: 14, knockback: 7, range: 40 },
                forward: { damage: 20, knockback: 11, range: 45 },
                up: { damage: 16, knockback: 9, range: 35 },
                down: { damage: 18, knockback: 5, range: 40 },
                special: { damage: 22, knockback: 10, range: 60, name: 'Sword Beam' }
            }
        });
    }
    
    drawCharacterFeatures(ctx, x, y, width, height, facing) {
        // Link's tunic
        ctx.fillStyle = '#00AA00';
        ctx.fillRect(x + 5, y + 15, width - 10, height - 20);
        
        // Link's hat
        ctx.fillStyle = '#006600';
        ctx.fillRect(x + 8, y, width - 16, 20);
        
        // Link's face
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 10, y + 8, width - 20, 15);
        
        // Link's sword (when facing right)
        if (facing) {
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(x + width, y + 10, 8, 25);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + width, y + 30, 8, 8);
        } else {
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(x - 8, y + 10, 8, 25);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x - 8, y + 30, 8, 8);
        }
        
        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(x + 13, y + 12, 2, 2);
        ctx.fillRect(x + width - 15, y + 12, 2, 2);
    }
}

// Pikachu Character
class Pikachu extends Character {
    constructor() {
        super({
            name: 'Pikachu',
            color: '#FFFF00',
            stats: {
                speed: 8,
                jumpPower: -14,
                weight: 0.7,
                fallSpeed: 0.6
            },
            moves: {
                neutral: { damage: 10, knockback: 5, range: 30 },
                forward: { damage: 16, knockback: 8, range: 35 },
                up: { damage: 12, knockback: 12, range: 25 },
                down: { damage: 14, knockback: 3, range: 40 },
                special: { damage: 20, knockback: 10, range: 80, name: 'Thunder Bolt' }
            }
        });
    }
    
    drawCharacterFeatures(ctx, x, y, width, height, facing) {
        // Pikachu's body (yellow)
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(x, y, width, height);
        
        // Pikachu's cheeks
        ctx.fillStyle = '#FF6666';
        ctx.fillRect(x + 2, y + 15, 8, 6);
        ctx.fillRect(x + width - 10, y + 15, 8, 6);
        
        // Pikachu's ears
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(x + 8, y - 8, 6, 12);
        ctx.fillRect(x + width - 14, y - 8, 6, 12);
        
        // Ear tips
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 9, y - 6, 4, 4);
        ctx.fillRect(x + width - 13, y - 6, 4, 4);
        
        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(x + 10, y + 8, 4, 4);
        ctx.fillRect(x + width - 14, y + 8, 4, 4);
        
        // Tail (lightning bolt shape)
        if (facing) {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(x + width - 5, y + 20, 10, 4);
            ctx.fillRect(x + width + 2, y + 15, 6, 4);
            ctx.fillRect(x + width - 2, y + 25, 8, 4);
        }
    }
}

// Samus Character
class Samus extends Character {
    constructor() {
        super({
            name: 'Samus',
            color: '#FF6600',
            stats: {
                speed: 5,
                jumpPower: -13,
                weight: 1.3,
                fallSpeed: 0.9
            },
            moves: {
                neutral: { damage: 15, knockback: 8, range: 35 },
                forward: { damage: 22, knockback: 12, range: 40 },
                up: { damage: 18, knockback: 10, range: 30 },
                down: { damage: 25, knockback: 6, range: 45 },
                special: { damage: 28, knockback: 15, range: 100, name: 'Charge Beam' }
            }
        });
    }
    
    drawCharacterFeatures(ctx, x, y, width, height, facing) {
        // Samus suit body
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(x, y, width, height);
        
        // Helmet/visor
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 5, y, width - 10, 20);
        
        // Visor
        ctx.fillStyle = '#0066FF';
        ctx.fillRect(x + 8, y + 5, width - 16, 10);
        
        // Arm cannon
        if (facing) {
            ctx.fillStyle = '#FF4400';
            ctx.fillRect(x + width - 5, y + 15, 15, 10);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + width + 8, y + 18, 4, 4);
        } else {
            ctx.fillStyle = '#FF4400';
            ctx.fillRect(x - 10, y + 15, 15, 10);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x - 12, y + 18, 4, 4);
        }
        
        // Chest details
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(x + width/2 - 3, y + 25, 6, 8);
    }
}

// Character selection
const CHARACTERS = {
    MARIO: Mario,
    LINK: Link,
    PIKACHU: Pikachu,
    SAMUS: Samus
};

const CHARACTER_NAMES = ['MARIO', 'LINK', 'PIKACHU', 'SAMUS'];
