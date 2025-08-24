// Character and Stage Selection Screen
class SelectionScreen {
    constructor() {
        this.currentScreen = 'character'; // 'character', 'stage', 'game'
        this.selectedCharacter = 0;
        this.selectedStage = 0;
        this.confirmedCharacter = false;
        this.confirmedStage = false;
        this.menuTimer = 0;
        this.cursorBlink = 0;
    }
    
    update() {
        this.menuTimer++;
        this.cursorBlink = Math.floor(this.menuTimer / 30) % 2;
    }
    
    draw(ctx, canvas) {
        if (this.currentScreen === 'character') {
            this.drawCharacterSelect(ctx, canvas);
        } else if (this.currentScreen === 'stage') {
            this.drawStageSelect(ctx, canvas);
        }
    }
    
    drawCharacterSelect(ctx, canvas) {
        // Background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1A237E');
        gradient.addColorStop(1, '#3F51B5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT YOUR FIGHTER', canvas.width/2, 80);
        
        // Character portraits
        const portraitSize = 150;
        const startX = (canvas.width - (CHARACTER_NAMES.length * portraitSize + (CHARACTER_NAMES.length - 1) * 20)) / 2;
        
        CHARACTER_NAMES.forEach((charName, index) => {
            const x = startX + index * (portraitSize + 20);
            const y = 150;
            
            // Portrait background
            if (index === this.selectedCharacter) {
                ctx.fillStyle = this.cursorBlink ? '#FFD700' : '#FFF';
                ctx.fillRect(x - 5, y - 5, portraitSize + 10, portraitSize + 10);
            }
            
            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, portraitSize, portraitSize);
            
            // Character preview
            const CharacterClass = CHARACTERS[charName];
            const tempChar = new CharacterClass();
            
            // Draw character in portrait
            ctx.save();
            ctx.scale(2, 2);
            tempChar.drawSprite(ctx, x/2 + 20, y/2 + 20, 40, 60, true);
            ctx.restore();
            
            // Character name
            ctx.fillStyle = index === this.selectedCharacter ? '#FFD700' : '#FFF';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(charName.replace('_', ' '), x + portraitSize/2, y + portraitSize + 30);
            
            // Character stats
            ctx.font = '12px Arial';
            ctx.fillStyle = '#BBB';
            ctx.fillText(`Speed: ${'★'.repeat(Math.floor(tempChar.stats.speed/2))}`, x + portraitSize/2, y + portraitSize + 50);
            ctx.fillText(`Jump: ${'★'.repeat(Math.floor(Math.abs(tempChar.stats.jumpPower)/3))}`, x + portraitSize/2, y + portraitSize + 65);
            ctx.fillText(`Weight: ${'★'.repeat(Math.floor(tempChar.stats.weight * 3))}`, x + portraitSize/2, y + portraitSize + 80);
        });
        
        // Instructions
        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText('Use A/D to select, W to confirm', canvas.width/2, canvas.height - 100);
        
        // Selected character details
        if (CHARACTER_NAMES[this.selectedCharacter]) {
            const CharacterClass = CHARACTERS[CHARACTER_NAMES[this.selectedCharacter]];
            const tempChar = new CharacterClass();
            
            ctx.fillStyle = '#FFF';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Special Moves:', 50, canvas.height - 200);
            ctx.fillText(`• Neutral: ${tempChar.moves.neutral.damage} damage`, 50, canvas.height - 180);
            ctx.fillText(`• Forward: ${tempChar.moves.forward.damage} damage`, 50, canvas.height - 160);
            ctx.fillText(`• Up: ${tempChar.moves.up.damage} damage`, 50, canvas.height - 140);
            ctx.fillText(`• Down: ${tempChar.moves.down.damage} damage`, 50, canvas.height - 120);
            if (tempChar.moves.special) {
                ctx.fillText(`• Special: ${tempChar.moves.special.name} (${tempChar.moves.special.damage} damage)`, 50, canvas.height - 100);
            }
        }
    }
    
    drawStageSelect(ctx, canvas) {
        // Background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#2E7D32');
        gradient.addColorStop(1, '#4CAF50');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT STAGE', canvas.width/2, 80);
        
        // Stage previews
        const previewWidth = 250;
        const previewHeight = 150;
        const cols = 2;
        const startX = (canvas.width - (cols * previewWidth + (cols - 1) * 40)) / 2;
        
        STAGE_NAMES.forEach((stageName, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (previewWidth + 40);
            const y = 150 + row * (previewHeight + 60);
            
            // Preview background
            if (index === this.selectedStage) {
                ctx.fillStyle = this.cursorBlink ? '#FFD700' : '#FFF';
                ctx.fillRect(x - 5, y - 5, previewWidth + 10, previewHeight + 10);
            }
            
            ctx.fillStyle = '#000';
            ctx.fillRect(x, y, previewWidth, previewHeight);
            
            // Stage preview (simplified)
            ctx.save();
            ctx.clipRect(x, y, previewWidth, previewHeight);
            
            const StageClass = STAGES[stageName];
            const tempStage = new StageClass();
            
            // Scale down and draw stage preview
            ctx.scale(0.2, 0.15);
            tempStage.drawBackground(ctx, { width: canvas.width * 5, height: canvas.height * 6.67 });
            tempStage.drawPlatforms(ctx);
            
            ctx.restore();
            
            // Stage name
            ctx.fillStyle = index === this.selectedStage ? '#FFD700' : '#FFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(stageName.replace('_', ' '), x + previewWidth/2, y + previewHeight + 25);
        });
        
        // Instructions
        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText('Use A/D/W/S to select, Enter to confirm', canvas.width/2, canvas.height - 50);
    }
    
    handleInput(key) {
        if (this.currentScreen === 'character') {
            switch (key) {
                case 'a':
                case 'ArrowLeft':
                    this.selectedCharacter = (this.selectedCharacter - 1 + CHARACTER_NAMES.length) % CHARACTER_NAMES.length;
                    playSound(300, 0.1, 'square');
                    break;
                case 'd':
                case 'ArrowRight':
                    this.selectedCharacter = (this.selectedCharacter + 1) % CHARACTER_NAMES.length;
                    playSound(300, 0.1, 'square');
                    break;
                case 'w':
                case 'Enter':
                    this.confirmedCharacter = true;
                    this.currentScreen = 'stage';
                    playSound(440, 0.2, 'sine');
                    break;
            }
        } else if (this.currentScreen === 'stage') {
            switch (key) {
                case 'a':
                case 'ArrowLeft':
                    this.selectedStage = (this.selectedStage - 1 + STAGE_NAMES.length) % STAGE_NAMES.length;
                    playSound(300, 0.1, 'square');
                    break;
                case 'd':
                case 'ArrowRight':
                    this.selectedStage = (this.selectedStage + 1) % STAGE_NAMES.length;
                    playSound(300, 0.1, 'square');
                    break;
                case 'w':
                case 's':
                case 'ArrowUp':
                case 'ArrowDown':
                    if (STAGE_NAMES.length > 2) {
                        this.selectedStage = (this.selectedStage + 2) % STAGE_NAMES.length;
                        playSound(300, 0.1, 'square');
                    }
                    break;
                case 'Enter':
                    this.confirmedStage = true;
                    this.currentScreen = 'game';
                    playSound(523, 0.3, 'sine');
                    return true; // Signal to start game
            }
        }
        return false;
    }
    
    getSelectedCharacter() {
        return CHARACTER_NAMES[this.selectedCharacter];
    }
    
    getSelectedStage() {
        return STAGE_NAMES[this.selectedStage];
    }
}

// Game mode selection
class GameModeScreen {
    constructor() {
        this.selectedMode = 0;
        this.modes = [
            { name: 'VS CPU', description: 'Fight against AI opponent' },
            { name: 'TIME BATTLE', description: '2 minute timed battle' },
            { name: 'STOCK BATTLE', description: 'Battle with lives' },
            { name: 'TRAINING', description: 'Practice mode' }
        ];
        this.cursorBlink = 0;
        this.timer = 0;
    }
    
    update() {
        this.timer++;
        this.cursorBlink = Math.floor(this.timer / 30) % 2;
    }
    
    draw(ctx, canvas) {
        // Background
        const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, 600);
        gradient.addColorStop(0, '#FF6B35');
        gradient.addColorStop(1, '#B71C1C');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SUPER SMASH BROS', canvas.width/2, 100);
        ctx.font = 'bold 30px Arial';
        ctx.fillText('ULTIMATE CLONE', canvas.width/2, 140);
        
        // Mode selection
        const startY = 250;
        this.modes.forEach((mode, index) => {
            const y = startY + index * 80;
            
            // Selection cursor
            if (index === this.selectedMode && this.cursorBlink) {
                ctx.fillStyle = '#FFD700';
                ctx.fillText('▶', canvas.width/2 - 200, y);
                ctx.fillText('◀', canvas.width/2 + 200, y);
            }
            
            // Mode name
            ctx.fillStyle = index === this.selectedMode ? '#FFD700' : '#FFF';
            ctx.font = 'bold 32px Arial';
            ctx.fillText(mode.name, canvas.width/2, y);
            
            // Mode description
            ctx.fillStyle = '#CCC';
            ctx.font = '18px Arial';
            ctx.fillText(mode.description, canvas.width/2, y + 25);
        });
        
        // Instructions
        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText('Use W/S to select, Enter to confirm', canvas.width/2, canvas.height - 50);
    }
    
    handleInput(key) {
        switch (key) {
            case 'w':
            case 'ArrowUp':
                this.selectedMode = (this.selectedMode - 1 + this.modes.length) % this.modes.length;
                playSound(300, 0.1, 'square');
                break;
            case 's':
            case 'ArrowDown':
                this.selectedMode = (this.selectedMode + 1) % this.modes.length;
                playSound(300, 0.1, 'square');
                break;
            case 'Enter':
                playSound(523, 0.3, 'sine');
                return this.modes[this.selectedMode];
        }
        return null;
    }
}
