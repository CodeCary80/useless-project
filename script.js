const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById('startScreen');

const CONFIG = {
    rows: 3, // Reduced from 4 to 3 rows
    cols: 4, // Reduced from 5 to 4 columns
    deskWidth: 70, // Increased from 60 to 70
    deskHeight: 50, // Increased from 40 to 50
    startX: 150,
    startY: 120,
    gap: 80, // Increased from 30 to 80
    playerSpeed: 20,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height
};

const state = {
    score: 0,  // Current embarrassment points
    gameRunning: false, // Is game currently active?
    gameStarted: false // Has game been started?
};

const player = {
    x: 700, //Starts at bottom right corner (x: 700, y: 500)
    y: 500,
    width: 30,
    height: 30,
    color: "#4A90E2",
    speed: CONFIG.playerSpeed,

    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (this.isValidMove(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return true; 
        }
        return false; 
    },

    isValidMove(newX, newY) {
        if (newX < 0 || newX + this.width > CONFIG.canvasWidth ||
            newY < 0 || newY + this.height > CONFIG.canvasHeight) {
            return false;
        }
        return !walls.some(wall => checkCollision(
            {x: newX, y: newY, width: this.width, height: this.height},
            wall
        ));
    },

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(this.x + 3, this.y + 3, this.width, this.height);
    }
};

const walls = [];
const possibleGoalPositions = [];

class Teacher {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.speed = 2;
        this.x = CONFIG.startX;
        this.y = CONFIG.startY - 60;
        this.color = "#FF4444";
        
        // Create more complex patrol points with vertical movement
        this.createPatrolPath();
        
        this.currentPoint = 0;
        this.moving = true;
        this.randomizePath = true; // Option to use random path selection
        this.pathUpdateTimer = 0; // Timer for path changes
    }

    createPatrolPath() {
        this.patrolPoints = [];
        
        // Add vertical paths between rows
        for (let col = 0; col < CONFIG.cols; col++) {
            const x = CONFIG.startX + col * (CONFIG.deskWidth + CONFIG.gap) + CONFIG.deskWidth/2 - this.width/2;
            
            // Each column gets a top-to-bottom path
            this.patrolPoints.push({ x, y: CONFIG.startY - 60 }); // Top of column
            this.patrolPoints.push({ x, y: CONFIG.startY + (CONFIG.rows - 1) * (CONFIG.deskHeight + CONFIG.gap) + CONFIG.deskHeight + 20 }); // Bottom of column
            
            // Alternate direction - if even column, go down-up, if odd column, go up-down
            if (col % 2 === 1) {
                // Swap the last two points to reverse direction
                let temp = this.patrolPoints[this.patrolPoints.length - 1];
                this.patrolPoints[this.patrolPoints.length - 1] = this.patrolPoints[this.patrolPoints.length - 2];
                this.patrolPoints[this.patrolPoints.length - 2] = temp;
            }
        }
        
        // Add horizontal paths to create a more connected patrol pattern
        for (let row = 0; row < CONFIG.rows; row++) {
            const y = CONFIG.startY + row * (CONFIG.deskHeight + CONFIG.gap) + CONFIG.deskHeight/2 - this.height/2;
            
            // Each row gets a path from left to right
            this.patrolPoints.push({ x: CONFIG.startX - 40, y }); // Left of row
            this.patrolPoints.push({ x: CONFIG.startX + (CONFIG.cols - 1) * (CONFIG.deskWidth + CONFIG.gap) + CONFIG.deskWidth + 20, y }); // Right of row
            
            // Alternate direction
            if (row % 2 === 1) {
                // Swap the last two points to reverse direction
                let temp = this.patrolPoints[this.patrolPoints.length - 1];
                this.patrolPoints[this.patrolPoints.length - 1] = this.patrolPoints[this.patrolPoints.length - 2];
                this.patrolPoints[this.patrolPoints.length - 2] = temp;
            }
        }
    }

    update() {
        if (!this.moving) return;

        // Occasionally change path approach to be more unpredictable
        this.pathUpdateTimer++;
        if (this.pathUpdateTimer > 150) { // Change behavior every few seconds
            this.pathUpdateTimer = 0;
            if (Math.random() > 0.5) {
                // Randomly pick a new patrol point from our path
                this.currentPoint = Math.floor(Math.random() * this.patrolPoints.length);
            }
        }

        const target = this.patrolPoints[this.currentPoint];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.x = target.x;
            this.y = target.y;
            this.currentPoint = (this.currentPoint + 1) % this.patrolPoints.length;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("T", this.x + 13, this.y + 25);
    }

    checkCollision(player) {
        return checkCollision(player, this);
    }
}

const eventManager = {
    teacher: new Teacher(),
    
    update() {
        this.teacher.update();
    },

    draw() {
        this.teacher.draw();
    },

    checkCollisions(player) {
        if (this.teacher.checkCollision(player)) {
            this.showAlert("The teacher caught you!");
            gameOver("Oh no! The teacher caught you running in class!");
            return true;
        }
        return false;
    },

    showAlert(message) {
        const alert = document.getElementById('eventAlert');
        alert.textContent = message;
        alert.classList.add('show');
        setTimeout(() => alert.classList.remove('show'), 2000);
    }
};

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function getRandomGoalPosition() {
    const randomIndex = Math.floor(Math.random() * possibleGoalPositions.length);
    const selectedGoal = possibleGoalPositions[randomIndex];
    
    // First, find if there's a wall (desk) at the selected position
    const wallIndex = walls.findIndex(wall => 
        wall.x === selectedGoal.x && wall.y === selectedGoal.y
    );
    if (wallIndex !== -1) { //If wallIndex is -1, nothing was found
        //If wallIndex is any other number, a wall was found at that position
        walls.splice(wallIndex, 1); //// If a wall was found (wallIndex !== -1), remove it
    }
    
    return selectedGoal;
}

const goal = {
    ...getRandomGoalPosition(),
    color: "#2ECC71",
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        const glowAmount = Math.sin(Date.now() / 500) * 0.1 + 0.9; //Makes the glow pulse
        ctx.strokeStyle = `rgba(46, 204, 113, ${glowAmount})`; // Transparent green
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height); // Draw the glowing border
    }
};

let animationFrameId = null;
let timer = null;

function gameOver(message) {
    state.gameRunning = false;
    if (timer) clearInterval(timer);
    cancelAnimationFrame(animationFrameId);
    
    // Try to play sound with error handling
    try {
        // Force sound to reset before playing
        const caughtSound = document.getElementById('caughtSound');
        if (caughtSound) {
            caughtSound.pause();
            caughtSound.currentTime = 0;
            // Use the native play method with promise handling
            caughtSound.play().catch(e => console.log("Sound play error:", e));
        }
    } catch (e) {
        console.log("Sound error:", e);
    }
    
    // Ensure game over message shows after a slight delay
    setTimeout(() => {
        const finalScore = state.score;
        const fullMessage = `${message}\nEmbarrassment Points: ${finalScore}`;
        alert(fullMessage);
        
        // Use a separate timeout for the confirmation to ensure it appears after the alert
        setTimeout(() => {
            if (confirm("Would you like to try again?")) {
                startGame();
            } else {
                startScreen.classList.remove('hidden');
                state.gameStarted = false;
            }
        }, 100);
    }, 200);
}

function draw() {
    ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // Draw background grid
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;
    for (let i = 0; i < CONFIG.canvasWidth; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CONFIG.canvasHeight);
        ctx.stroke();
    }
    for (let i = 0; i < CONFIG.canvasHeight; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CONFIG.canvasWidth, i);
        ctx.stroke();
    }

    walls.forEach(wall => {
        ctx.fillStyle = "#95A5A6";
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.fillStyle = "#7F8C8D";
        ctx.fillRect(wall.x, wall.y + wall.height - 5, wall.width, 5);
    });

    eventManager.draw();
    goal.draw();
    player.draw();

    document.getElementById("score").textContent = state.score;
}

function checkWin() {
    if (checkCollision(player, goal)) {
        state.gameRunning = false;
        if (timer) clearInterval(timer);
        cancelAnimationFrame(animationFrameId);
        
        // Try to play win sound with error handling
        try {
            const winSound = document.getElementById('winSound');
            if (winSound) {
                winSound.pause();
                winSound.currentTime = 0;
                winSound.play().catch(e => console.log("Win sound play error:", e));
            }
        } catch (e) {
            console.log("Win sound error:", e);
        }
        
        // Store the final score
        const finalScore = state.score;
        
        // Show win message with slight delay
        setTimeout(() => {
            alert(`Congratulations! You found your seat!\nEmbarrassment Points: ${finalScore}`);
            
            // Use a separate timeout for the confirmation
            setTimeout(() => {
                if (confirm("Would you like to play again?")) {
                    startGame();
                } else {
                    startScreen.classList.remove('hidden');
                    state.gameStarted = false;
                }
            }, 100);
        }, 200);
    }
}

function resetGame() {
    state.score = 0;
    state.gameRunning = true;
    
    player.x = 700;
    player.y = 500;

    walls.length = 0;
    possibleGoalPositions.length = 0;
    
    for (let row = 0; row < CONFIG.rows; row++) {
        for (let col = 0; col < CONFIG.cols; col++) {
            const desk = {
                x: CONFIG.startX + col * (CONFIG.deskWidth + CONFIG.gap),
                y: CONFIG.startY + row * (CONFIG.deskHeight + CONFIG.gap),
                width: CONFIG.deskWidth,
                height: CONFIG.deskHeight
            };
            possibleGoalPositions.push({...desk});
            walls.push(desk);
        }
    }
    
    const newGoalPosition = getRandomGoalPosition();
    Object.assign(goal, newGoalPosition);
}

function gameLoop() {
    if (state.gameRunning) {
        draw();
        eventManager.update();
        eventManager.checkCollisions(player);
        checkWin();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    if (timer) {
        clearInterval(timer);
    }

    try {
        soundManager.stopAll();
        // Use a try-catch for audio since it might fail
        try {
            // Direct approach to play background music
            const bgMusic = document.getElementById('bgMusic');
            if (bgMusic) {
                bgMusic.volume = 0.5; // Set volume to 50%
                bgMusic.loop = true;  // Ensure it loops
                
                const playPromise = bgMusic.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Background music play error:", error);
                        // Most browsers require user interaction before playing audio
                        console.log("Music may require user interaction first");
                    });
                }
            } else {
                console.log("Background music element not found");
            }
        } catch (e) {
            console.log("Audio play error:", e);
            // Continue game even if audio fails
        }
    } catch (e) {
        console.log("Sound manager error:", e);
        // Continue game even if audio fails
    }
    
    startScreen.classList.add('hidden');
    state.gameRunning = true;
    state.gameStarted = true;
    
    eventManager.teacher = new Teacher();
    
    resetGame();
    
    timer = setInterval(() => {
        if (state.gameRunning) {
            state.score++;
        }
    }, 1000);
    
    gameLoop();
}

document.addEventListener("keydown", (event) => {
    if (!state.gameRunning) return;

    const speed = player.speed;
    let moved = false;
    
    switch (event.key) {
        case "ArrowUp":    
            moved = player.move(0, -speed); 
            break;
        case "ArrowDown":  
            moved = player.move(0, speed);  
            break;
        case "ArrowLeft":  
            moved = player.move(-speed, 0); 
            break;
        case "ArrowRight": 
            moved = player.move(speed, 0);  
            break;
    }
    
    // Play sound if movement was successful
    if (moved) {
        soundManager.play('move');
    }
});

// Simple variable to track mute state
let muted = false;

// We'll add a keyboard shortcut for muting since there's no button in the HTML
document.addEventListener('keydown', (event) => {
    if (event.key === 'M' || event.key === 'm') {
        muted = !muted;
        
        // Set volume on all audio elements
        const audioElements = document.querySelectorAll('audio');
        for (let audio of audioElements) {
            audio.volume = muted ? 0 : 1;
        }
        
        // Show a quick alert about mute status
        const alert = document.getElementById('eventAlert');
        if (alert) {
            alert.textContent = muted ? "🔇 Sound Muted" : "🔊 Sound Unmuted";
            alert.classList.add('show');
            setTimeout(() => alert.classList.remove('show'), 1000);
        }
    }
});

// Initial draw
draw();
