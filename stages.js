// Stage System for Super Smash Bros Clone
class Stage {
    constructor(config) {
        this.name = config.name;
        this.platforms = config.platforms;
        this.background = config.background;
        this.music = config.music;
        this.hazards = config.hazards || [];
        this.boundaries = config.boundaries;
        this.spawns = config.spawns;
    }
    
    draw(ctx, canvas) {
        this.drawBackground(ctx, canvas);
        this.drawPlatforms(ctx);
        this.drawHazards(ctx);
    }
    
    drawBackground(ctx, canvas) {
        // Override in stage implementations
    }
    
    drawPlatforms(ctx) {
        ctx.fillStyle = '#8B4513';
        this.platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Platform borders
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
    }
    
    drawHazards(ctx) {
        // Override in stage implementations
    }
    
    update() {
        // Update hazards and moving platforms
        this.hazards.forEach(hazard => {
            if (hazard.update) hazard.update();
        });
    }
}

// Battlefield Stage
class Battlefield extends Stage {
    constructor() {
        super({
            name: 'Battlefield',
            platforms: [
                { x: 0, y: 760, width: 1200, height: 40 }, // Main platform
                { x: 300, y: 600, width: 180, height: 20 }, // Left platform
                { x: 720, y: 600, width: 180, height: 20 }, // Right platform
                { x: 510, y: 450, width: 180, height: 20 }  // Top platform
            ],
            spawns: [
                { x: 200, y: 700 },
                { x: 1000, y: 700 }
            ]
        });
    }
    
    drawBackground(ctx, canvas) {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98D8E8');
        gradient.addColorStop(1, '#B0E0E6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(ctx, 200, 100, 80);
        this.drawCloud(ctx, 600, 150, 60);
        this.drawCloud(ctx, 1000, 80, 70);
        
        // Distant mountains
        ctx.fillStyle = '#4A90E2';
        ctx.beginPath();
        ctx.moveTo(0, 400);
        ctx.lineTo(200, 300);
        ctx.lineTo(400, 350);
        ctx.lineTo(600, 280);
        ctx.lineTo(800, 320);
        ctx.lineTo(1000, 290);
        ctx.lineTo(1200, 340);
        ctx.lineTo(1200, 800);
        ctx.lineTo(0, 800);
        ctx.closePath();
        ctx.fill();
    }
    
    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x - size * 0.3, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.arc(x - size * 0.6, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Final Destination Stage
class FinalDestination extends Stage {
    constructor() {
        super({
            name: 'Final Destination',
            platforms: [
                { x: 200, y: 700, width: 800, height: 100 } // Single main platform
            ],
            spawns: [
                { x: 300, y: 640 },
                { x: 900, y: 640 }
            ]
        });
    }
    
    drawBackground(ctx, canvas) {
        // Space background
        ctx.fillStyle = '#000022';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Stars
        ctx.fillStyle = 'white';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.7;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }
        
        // Nebula effect
        const nebula = ctx.createRadialGradient(canvas.width/2, canvas.height/3, 0, canvas.width/2, canvas.height/3, 400);
        nebula.addColorStop(0, 'rgba(128, 0, 255, 0.3)');
        nebula.addColorStop(0.5, 'rgba(255, 0, 128, 0.2)');
        nebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Pokemon Stadium Stage
class PokemonStadium extends Stage {
    constructor() {
        super({
            name: 'Pokemon Stadium',
            platforms: [
                { x: 0, y: 720, width: 1200, height: 80 }, // Main platform
                { x: 250, y: 580, width: 120, height: 15 }, // Left platform
                { x: 830, y: 580, width: 120, height: 15 }  // Right platform
            ],
            spawns: [
                { x: 200, y: 660 },
                { x: 1000, y: 660 }
            ]
        });
    }
    
    drawBackground(ctx, canvas) {
        // Stadium background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#2E7D32');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Stadium stands
        ctx.fillStyle = '#757575';
        ctx.fillRect(0, 0, canvas.width, 200);
        
        // Stadium lights
        ctx.fillStyle = '#FFEB3B';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(100 + i * 200, 50, 20, 30);
        }
        
        // Pokemon logo
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(canvas.width/2, 300, 50, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(canvas.width/2, 300, 35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(canvas.width/2, 300, 15, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Hyrule Castle Stage
class HyruleCastle extends Stage {
    constructor() {
        super({
            name: 'Hyrule Castle',
            platforms: [
                { x: 0, y: 750, width: 1200, height: 50 }, // Ground
                { x: 200, y: 600, width: 200, height: 20 }, // Left tower base
                { x: 800, y: 600, width: 200, height: 20 }, // Right tower base
                { x: 150, y: 450, width: 100, height: 20 }, // Left tower top
                { x: 950, y: 450, width: 100, height: 20 }, // Right tower top
                { x: 500, y: 650, width: 200, height: 20 }  // Center platform
            ],
            spawns: [
                { x: 300, y: 540 },
                { x: 900, y: 540 }
            ]
        });
    }
    
    drawBackground(ctx, canvas) {
        // Castle background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#FFB74D');
        gradient.addColorStop(1, '#FF8A65');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Castle walls
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(150, 300, 120, 300);
        ctx.fillRect(930, 300, 120, 300);
        ctx.fillRect(450, 400, 300, 250);
        
        // Castle towers
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(180, 200, 60, 100);
        ctx.fillRect(960, 200, 60, 100);
        
        // Tower roofs
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(170, 200);
        ctx.lineTo(210, 150);
        ctx.lineTo(250, 200);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(950, 200);
        ctx.lineTo(990, 150);
        ctx.lineTo(1030, 200);
        ctx.closePath();
        ctx.fill();
        
        // Triforce symbol
        ctx.fillStyle = '#FFD700';
        const centerX = canvas.width / 2;
        const centerY = 300;
        this.drawTriforce(ctx, centerX, centerY, 30);
    }
    
    drawTriforce(ctx, x, y, size) {
        // Top triangle
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.closePath();
        ctx.fill();
        
        // Bottom left triangle
        ctx.beginPath();
        ctx.moveTo(x - size/2, y);
        ctx.lineTo(x - size * 1.5, y + size);
        ctx.lineTo(x + size/2, y + size);
        ctx.closePath();
        ctx.fill();
        
        // Bottom right triangle
        ctx.beginPath();
        ctx.moveTo(x + size/2, y);
        ctx.lineTo(x - size/2, y + size);
        ctx.lineTo(x + size * 1.5, y + size);
        ctx.closePath();
        ctx.fill();
    }
}

// Stage selection
const STAGES = {
    BATTLEFIELD: Battlefield,
    FINAL_DESTINATION: FinalDestination,
    POKEMON_STADIUM: PokemonStadium,
    HYRULE_CASTLE: HyruleCastle
};

const STAGE_NAMES = ['BATTLEFIELD', 'FINAL_DESTINATION', 'POKEMON_STADIUM', 'HYRULE_CASTLE'];
