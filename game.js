// Game constants
const GRAVITY = 0.5;
const FLAP_SPEED = -8;
const BASE_PIPE_SPEED = 2;
const PIPE_SPACING = 150;
const PIPE_WIDTH = 50;
const BIRD_SIZE = 30;
const COIN_SIZE = 20;
const BILL_SIZE = 30;
const SILVER_COIN_VALUE = 5;
const GOLD_COIN_VALUE = 10;
const MONEY_BILL_VALUE = 50;
const MAX_TOP_SCORES = 5;
const SPEED_INCREASE_INTERVAL = 50; // Points needed for speed increase
const SPEED_INCREASE_AMOUNT = 0.3; // Increased for more noticeable speed changes
const MAX_SPEED = 5; // Maximum speed cap

// Collectible types and their probabilities
const COLLECTIBLE_TYPES = {
    SILVER_COIN: { value: SILVER_COIN_VALUE, probability: 0.6, color: '#C0C0C0', size: COIN_SIZE },
    GOLD_COIN: { value: GOLD_COIN_VALUE, probability: 0.3, color: '#FFD700', size: COIN_SIZE },
    MONEY_BILL: { value: MONEY_BILL_VALUE, probability: 0.1, color: '#32CD32', size: BILL_SIZE }
};

// Load images
const backgroundImage = new Image();
backgroundImage.src = 'assets/background.svg';
const treeImage = new Image();
treeImage.src = 'assets/tree.svg';
const owlImage = new Image();
owlImage.src = 'assets/owl.svg';

// Create collectible images
const collectibleImages = {
    SILVER_COIN: createCollectibleImage(COLLECTIBLE_TYPES.SILVER_COIN.color),
    GOLD_COIN: createCollectibleImage(COLLECTIBLE_TYPES.GOLD_COIN.color),
    MONEY_BILL: createBillImage()
};

function createCollectibleImage(color) {
    const canvas = document.createElement('canvas');
    canvas.width = COIN_SIZE;
    canvas.height = COIN_SIZE;
    const ctx = canvas.getContext('2d');
    
    // Draw coin
    ctx.beginPath();
    ctx.arc(COIN_SIZE/2, COIN_SIZE/2, COIN_SIZE/2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Add shine effect
    ctx.beginPath();
    ctx.arc(COIN_SIZE/2, COIN_SIZE/2, COIN_SIZE/3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    return canvas;
}

function createBillImage() {
    const canvas = document.createElement('canvas');
    canvas.width = BILL_SIZE;
    canvas.height = BILL_SIZE;
    const ctx = canvas.getContext('2d');
    
    // Draw bill
    ctx.fillStyle = COLLECTIBLE_TYPES.MONEY_BILL.color;
    ctx.fillRect(0, 0, BILL_SIZE, BILL_SIZE);
    
    // Add dollar sign
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', BILL_SIZE/2, BILL_SIZE/2);
    
    return canvas;
}

function getRandomCollectible() {
    const rand = Math.random();
    let sum = 0;
    
    for (const [type, data] of Object.entries(COLLECTIBLE_TYPES)) {
        sum += data.probability;
        if (rand <= sum) {
            return { type, ...data };
        }
    }
    
    return { type: 'SILVER_COIN', ...COLLECTIBLE_TYPES.SILVER_COIN };
}

// Background scroll position
let bgScroll = 0;

// Game state
let gameState = {
    bird: {
        x: 100,
        y: 300,
        velocity: 0,
        currentSkin: 'default'
    },
    pipes: [],
    coins: [],
    score: 0,
    coinCount: 0,
    highScore: localStorage.getItem('flappyHighScore') || 0,
    topScores: JSON.parse(localStorage.getItem('flappyTopScores')) || [],
    gameOver: false,
    isPaused: false,
    hasStarted: false,
    currentSpeed: BASE_PIPE_SPEED,
    speedLevel: 1,
    playerName: localStorage.getItem('flappyPlayerName') || '',
    currentBackground: 'default',
    backgrounds: [
        { id: 'default', name: 'Default Sky', price: 0, owned: true, color: '#3498db' },
        { id: 'sunset', name: 'Sunset', price: 150, owned: false, color: '#e67e22' },
        { id: 'night', name: 'Night Sky', price: 250, owned: false, color: '#2c3e50' },
        { id: 'ocean', name: 'Ocean Blue', price: 350, owned: false, color: '#1abc9c' },
        { id: 'forest', name: 'Forest Green', price: 450, owned: false, color: '#27ae60' },
        { id: 'purple', name: 'Purple Dream', price: 550, owned: false, color: '#9b59b6' },
        { id: 'desert', name: 'Desert Sand', price: 650, owned: false, color: '#f1c40f' },
        { id: 'arctic', name: 'Arctic Blue', price: 750, owned: false, color: '#3498db' },
        { id: 'volcano', name: 'Volcano Red', price: 850, owned: false, color: '#e74c3c' },
        { id: 'rainbow', name: 'Rainbow', price: 1000, owned: false, color: '#3498db' }
    ],
    skins: [
        { id: 'default', name: 'Default Owl', price: 0, owned: true, image: 'owl.svg' },
        { id: 'pirate', name: 'Pirate Owl', price: 150, owned: false, image: 'owl-pirate.svg' },
        { id: 'wizard', name: 'Wizard Owl', price: 250, owned: false, image: 'owl-wizard.svg' },
        { id: 'cowboy', name: 'Cowboy Owl', price: 350, owned: false, image: 'owl-cowboy.svg' },
        { id: 'ninja', name: 'Ninja Owl', price: 450, owned: false, image: 'owl-ninja.svg' },
        { id: 'viking', name: 'Viking Owl', price: 550, owned: false, image: 'owl-viking.svg' },
        { id: 'astronaut', name: 'Astronaut Owl', price: 650, owned: false, image: 'owl-astronaut.svg' },
        { id: 'superhero', name: 'Superhero Owl', price: 750, owned: false, image: 'owl-superhero.svg' },
        { id: 'chef', name: 'Chef Owl', price: 850, owned: false, image: 'owl-chef.svg' },
        { id: 'detective', name: 'Detective Owl', price: 950, owned: false, image: 'owl-detective.svg' }
    ]
};

// Load all owl images
const owlImages = {};
gameState.skins.forEach(skin => {
    owlImages[skin.id] = new Image();
    owlImages[skin.id].src = `assets/${skin.image}`;
});

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');
const startButton = document.getElementById('startButton');
const continueButton = document.getElementById('continueButton');
const pauseButton = document.getElementById('pauseButton');
const shopButton = document.getElementById('shopButton');
const topScoresList = document.getElementById('topScores');
const clearScoresButton = document.getElementById('clearScores');
const scoreboardToggle = document.getElementById('scoreboardToggle');
const scoreboard = document.getElementById('scoreboard');

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState.gameOver) {
            resetGame();
        } else if (document.getElementById('nameInputContainer').style.display !== 'none') {
            handleContinue();
        } else if (!gameState.hasStarted && gameState.playerName) {
            startGame();
        } else if (gameState.hasStarted && !gameState.isPaused) {
            gameState.bird.velocity = FLAP_SPEED;
        }
    } else if (e.code === 'Enter') {
        if (document.getElementById('nameInputContainer').style.display !== 'none') {
            handleContinue();
        } else if (!gameState.hasStarted && gameState.playerName) {
            startGame();
        } else if (gameState.isPaused) {
            togglePause();
        }
    }
});

canvas.addEventListener('click', () => {
    if (gameState.gameOver) {
        resetGame();
    } else if (gameState.hasStarted && !gameState.isPaused) {
        gameState.bird.velocity = FLAP_SPEED;
    }
});

restartButton.addEventListener('click', resetGame);
startButton.addEventListener('click', startGame);

continueButton.addEventListener('click', handleContinue);
pauseButton.addEventListener('click', togglePause);
shopButton.addEventListener('click', toggleShop);
clearScoresButton.addEventListener('click', clearScores);
scoreboardToggle.addEventListener('click', () => {
    scoreboard.classList.toggle('collapsed');
    scoreboardToggle.textContent = scoreboard.classList.contains('collapsed') ? '>>' : '<<';
});

function handleContinue() {
    const playerNameInput = document.getElementById('playerName');
    const name = playerNameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name before continuing!');
        return;
    }
    
    gameState.playerName = name;
    localStorage.setItem('flappyPlayerName', name);
    document.getElementById('nameInputContainer').style.display = 'none';
    
    // Show space prompt with animation
    const spacePrompt = document.querySelector('.space-prompt');
    spacePrompt.style.display = 'block';
    setTimeout(() => {
        spacePrompt.classList.add('show');
    }, 100);
}

function startGame() {
    if (!gameState.playerName) {
        alert('Please enter your name first!');
        return;
    }
    gameState.hasStarted = true;
    document.querySelector('.space-prompt').style.display = 'none';
    pauseButton.style.display = 'block';
}

function togglePause() {
    if (gameState.hasStarted) {
        gameState.isPaused = !gameState.isPaused;
        pauseButton.textContent = gameState.isPaused ? 'Resume' : 'Pause';
    }
}

// Shop functionality
function toggleShop() {
    const shop = document.getElementById('shop');
    const isVisible = shop.style.display === 'block';
    
    // If opening the shop, pause the game
    if (!isVisible && gameState.hasStarted) {
        gameState.isPaused = true;
        pauseButton.textContent = 'Resume';
    }
    
    shop.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
        updateShopUI();
    }
}

function updateShopUI() {
    const skinsList = document.getElementById('skinsList');
    const backgroundsList = document.getElementById('backgroundsList');
    
    // Update skins section
    skinsList.innerHTML = gameState.skins.map(skin => `
        <li class="skin-item">
            <img src="assets/${skin.image}" alt="${skin.name}">
            <span>${skin.name}</span>
            <button onclick="buySkin('${skin.id}')" 
                    ${skin.owned ? 'disabled' : ''}>
                ${skin.owned ? 'Owned' : `${skin.price} coins`}
            </button>
        </li>
    `).join('');
    
    // Update backgrounds section
    backgroundsList.innerHTML = gameState.backgrounds.map(bg => `
        <li class="skin-item">
            <div class="background-preview" style="background-color: ${bg.color}"></div>
            <span>${bg.name}</span>
            <button onclick="buyBackground('${bg.id}')" 
                    ${bg.owned ? 'disabled' : ''}>
                ${bg.owned ? 'Owned' : `${bg.price} coins`}
            </button>
        </li>
    `).join('');
}

function updateInventoryUI() {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = `
        <h3>Owl Skins</h3>
        ${gameState.skins.filter(skin => skin.owned).map(skin => `
            <li class="inventory-item">
                <img src="assets/${skin.image}" alt="${skin.name}">
                <span>${skin.name}</span>
                <button onclick="useSkin('${skin.id}')" 
                        ${gameState.bird.currentSkin === skin.id ? 'class="active"' : ''}>
                    ${gameState.bird.currentSkin === skin.id ? 'Active' : 'Use'}
                </button>
            </li>
        `).join('')}
        <h3>Backgrounds</h3>
        ${gameState.backgrounds.filter(bg => bg.owned).map(bg => `
            <li class="inventory-item">
                <div class="background-preview" style="background-color: ${bg.color}"></div>
                <span>${bg.name}</span>
                <button onclick="useBackground('${bg.id}')" 
                        ${gameState.currentBackground === bg.id ? 'class="active"' : ''}>
                    ${gameState.currentBackground === bg.id ? 'Active' : 'Use'}
                </button>
            </li>
        `).join('')}
    `;
}

function buySkin(skinId) {
    const skin = gameState.skins.find(s => s.id === skinId);
    if (skin && !skin.owned && gameState.coinCount >= skin.price) {
        gameState.coinCount -= skin.price;
        skin.owned = true;
        updateShopUI();
        updateInventoryUI();
        updateCoinsDisplay();
        
        // Show purchase effect
        showPurchaseEffect(skin.name);
    }
}

function useSkin(skinId) {
    gameState.bird.currentSkin = skinId;
    updateInventoryUI();
}

function buyBackground(bgId) {
    const bg = gameState.backgrounds.find(b => b.id === bgId);
    if (bg && !bg.owned && gameState.coinCount >= bg.price) {
        gameState.coinCount -= bg.price;
        bg.owned = true;
        updateShopUI();
        updateInventoryUI();
        updateCoinsDisplay();
        showPurchaseEffect(bg.name);
    }
}

function useBackground(bgId) {
    gameState.currentBackground = bgId;
    updateInventoryUI();
}

function showPurchaseEffect(skinName) {
    const text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.left = '50%';
    text.style.top = '50%';
    text.style.transform = 'translate(-50%, -50%)';
    text.style.color = '#2ecc71';
    text.style.fontSize = '24px';
    text.style.fontWeight = 'bold';
    text.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    text.style.animation = 'purchaseText 2s ease-out forwards';
    text.textContent = `Purchased ${skinName}!`;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes purchaseText {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
    `;
    
    document.head.appendChild(style);
    document.getElementById('gameContainer').appendChild(text);
    
    setTimeout(() => {
        text.remove();
        style.remove();
    }, 2000);
}

// Scoreboard functions
function updateTopScores(score) {
    const newScore = {
        score: score,
        name: gameState.playerName,
        date: new Date().toLocaleDateString(),
        isNew: true
    };
    
    // Add new score to top scores
    gameState.topScores.push(newScore);
    
    // Sort scores in descending order
    gameState.topScores.sort((a, b) => b.score - a.score);
    
    // Keep only top 5 scores
    gameState.topScores = gameState.topScores.slice(0, MAX_TOP_SCORES);
    
    // Save to localStorage
    localStorage.setItem('flappyTopScores', JSON.stringify(gameState.topScores));
    
    // Update display
    displayTopScores();
}

function displayTopScores() {
    topScoresList.innerHTML = '';
    gameState.topScores.forEach((scoreData, index) => {
        const li = document.createElement('li');
        if (scoreData.isNew) {
            li.classList.add('new-high-score');
        }
        
        const scoreContent = document.createElement('div');
        scoreContent.style.display = 'flex';
        scoreContent.style.alignItems = 'center';
        
        // Add medal for top 3
        if (index < 3) {
            const medal = document.createElement('img');
            medal.src = `assets/medal${index + 1}.svg`;
            medal.className = 'score-medal';
            scoreContent.appendChild(medal);
        }
        
        // Add score number, name, and value
        const scoreText = document.createElement('span');
        scoreText.textContent = `${index + 1}. ${scoreData.name || 'Anonymous'}: ${scoreData.score}`;
        scoreContent.appendChild(scoreText);
        
        // Add date
        const date = document.createElement('span');
        date.className = 'score-date';
        date.textContent = scoreData.date;
        
        li.appendChild(scoreContent);
        li.appendChild(date);
        topScoresList.appendChild(li);
        
        // Remove new score highlight after 5 seconds
        if (scoreData.isNew) {
            setTimeout(() => {
                scoreData.isNew = false;
                li.classList.remove('new-high-score');
            }, 5000);
        }
    });
}

function clearScores() {
    if (confirm('Are you sure you want to clear all scores?')) {
        gameState.topScores = [];
        gameState.highScore = 0;
        localStorage.removeItem('flappyTopScores');
        localStorage.removeItem('flappyHighScore');
        displayTopScores();
    }
}

// Game functions
function initGame() {
    // Show title screen first
    const titleScreen = document.getElementById('titleScreen');
    titleScreen.style.display = 'flex';
    
    // After 2.5 seconds, fade out title screen and show name input
    setTimeout(() => {
        titleScreen.classList.add('fade-out');
        setTimeout(() => {
            titleScreen.style.display = 'none';
            // Show name input with a slight delay
            setTimeout(() => {
                document.getElementById('nameInputContainer').style.display = 'flex';
                document.querySelector('.space-prompt').style.display = 'none';
            }, 200);
        }, 1000);
    }, 2500);
}

function resetGame() {
    // Reset game state
    gameState.bird.y = 300;
    gameState.bird.velocity = 0;
    gameState.pipes = [];
    gameState.coins = [];
    gameState.score = 0;
    gameState.gameOver = false;
    gameState.currentSpeed = BASE_PIPE_SPEED;
    gameState.speedLevel = 1;
    gameState.hasStarted = false;
    gameState.isPaused = false;
    gameState.coinCount = 0;
    
    // Update UI
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('coins').textContent = 'Coins: 0';
    
    // Hide all UI elements
    document.getElementById('nameInputContainer').style.display = 'none';
    document.querySelector('.space-prompt').style.display = 'none';
    document.getElementById('startButton').style.display = 'none';
    restartButton.style.display = 'none';
    pauseButton.style.display = 'none';
    pauseButton.textContent = 'Pause';
    
    // Generate initial pipe
    generatePipe();
}

function generatePipe() {
    const gapY = Math.random() * (canvas.height - PIPE_SPACING - 100) + 50;
    gameState.pipes.push({
        x: canvas.width,
        gapY: gapY,
        passed: false
    });
    
    // Add collectible between pipes
    const collectible = getRandomCollectible();
    gameState.coins.push({
        x: canvas.width + PIPE_WIDTH + 20,
        y: gapY + PIPE_SPACING/2,
        collected: false,
        rotation: 0,
        type: collectible.type,
        value: collectible.value,
        size: collectible.size
    });
}

function showSpeedUpEffect() {
    const text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.left = '50%';
    text.style.top = '50%';
    text.style.transform = 'translate(-50%, -50%)';
    text.style.color = '#f1c40f';
    text.style.fontSize = '24px';
    text.style.fontWeight = 'bold';
    text.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    text.style.animation = 'speedUpText 2s ease-out forwards';
    text.textContent = `Speed Level ${gameState.speedLevel}!`;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes speedUpText {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
    `;
    
    document.head.appendChild(style);
    document.getElementById('gameContainer').appendChild(text);
    
    setTimeout(() => {
        text.remove();
        style.remove();
    }, 2000);
}

function update() {
    if (gameState.gameOver || !gameState.hasStarted || gameState.isPaused) return;

    // Update bird
    gameState.bird.velocity += GRAVITY;
    gameState.bird.y += gameState.bird.velocity;

    // Check collisions with ground and ceiling
    if (gameState.bird.y + BIRD_SIZE > canvas.height || gameState.bird.y < 0) {
        gameOver();
    }

    // Update pipes and coins with current speed
    for (let i = gameState.pipes.length - 1; i >= 0; i--) {
        const pipe = gameState.pipes[i];
        pipe.x -= gameState.currentSpeed;

        // Check collision with pipes
        if (gameState.bird.x + BIRD_SIZE > pipe.x && 
            gameState.bird.x < pipe.x + PIPE_WIDTH) {
            if (gameState.bird.y < pipe.gapY || 
                gameState.bird.y + BIRD_SIZE > pipe.gapY + PIPE_SPACING) {
                gameOver();
            }
        }

        // Score point when passing pipe
        if (!pipe.passed && pipe.x + PIPE_WIDTH < gameState.bird.x) {
            pipe.passed = true;
            gameState.score++;
            updateScoreDisplay();
        }

        // Remove off-screen pipes
        if (pipe.x + PIPE_WIDTH < 0) {
            gameState.pipes.splice(i, 1);
            gameState.coins.splice(i, 1);
        }
    }

    // Update collectibles
    for (let i = gameState.coins.length - 1; i >= 0; i--) {
        const coin = gameState.coins[i];
        coin.x -= gameState.currentSpeed;
        coin.rotation += 0.1;

        // Check coin collection
        if (!coin.collected && 
            gameState.bird.x + BIRD_SIZE > coin.x && 
            gameState.bird.x < coin.x + coin.size &&
            gameState.bird.y + BIRD_SIZE > coin.y && 
            gameState.bird.y < coin.y + coin.size) {
            coin.collected = true;
            gameState.coinCount += coin.value;
            updateCoinsDisplay();
            showCoinEffect(coin.x, coin.y, coin.type);
        }
    }

    // Generate new pipes
    if (gameState.pipes.length === 0 || 
        gameState.pipes[gameState.pipes.length - 1].x < canvas.width - 200) {
        generatePipe();
    }

    // Check for score increase and update speed
    if (gameState.pipes.length > 0 && !gameState.pipes[0].passed && 
        gameState.bird.x > gameState.pipes[0].x + PIPE_WIDTH) {
        gameState.score++;
        gameState.pipes[0].passed = true;
        
        // Increase speed every SPEED_INCREASE_INTERVAL points
        if (gameState.score % SPEED_INCREASE_INTERVAL === 0) {
            const newSpeed = Math.min(gameState.currentSpeed + SPEED_INCREASE_AMOUNT, MAX_SPEED);
            if (newSpeed !== gameState.currentSpeed) {
                gameState.currentSpeed = newSpeed;
                gameState.speedLevel++;
                showSpeedUpEffect();
            }
        }
        
        document.getElementById('score').textContent = `Score: ${gameState.score}`;
    }
}

function showCoinEffect(x, y, type) {
    const effect = {
        x: x,
        y: y,
        size: COLLECTIBLE_TYPES[type].size,
        alpha: 1,
        scale: 1
    };
    
    function animate() {
        effect.alpha -= 0.05;
        effect.scale += 0.1;
        effect.y -= 2;
        
        if (effect.alpha > 0) {
            ctx.save();
            ctx.globalAlpha = effect.alpha;
            ctx.fillStyle = COLLECTIBLE_TYPES[type].color;
            ctx.beginPath();
            ctx.arc(effect.x + effect.size/2, effect.y + effect.size/2, 
                   effect.size * effect.scale / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

function draw() {
    // Draw scrolling background
    const bgWidth = canvas.width;
    const bgHeight = canvas.height;
    
    // Set background color based on current background
    const currentBg = gameState.backgrounds.find(bg => bg.id === gameState.currentBackground);
    canvas.style.backgroundColor = currentBg ? currentBg.color : '#3498db';
    
    // Draw two background images for seamless scrolling
    ctx.drawImage(backgroundImage, bgScroll, 0, bgWidth, bgHeight);
    ctx.drawImage(backgroundImage, bgScroll + bgWidth, 0, bgWidth, bgHeight);
    
    // Update background scroll position
    bgScroll -= gameState.currentSpeed * 0.5;
    if (bgScroll <= -bgWidth) {
        bgScroll = 0;
    }

    // Draw trees (formerly pipes)
    gameState.pipes.forEach(pipe => {
        // Draw bottom tree
        ctx.drawImage(treeImage, pipe.x, pipe.gapY + PIPE_SPACING, 
                     PIPE_WIDTH, canvas.height - pipe.gapY - PIPE_SPACING);
        
        // Draw top tree (inverted)
        ctx.save();
        ctx.translate(pipe.x + PIPE_WIDTH/2, pipe.gapY);
        ctx.scale(1, -1);
        ctx.drawImage(treeImage, -PIPE_WIDTH/2, 0, PIPE_WIDTH, pipe.gapY);
        ctx.restore();
    });

    // Draw collectibles
    gameState.coins.forEach(coin => {
        if (!coin.collected) {
            ctx.save();
            ctx.translate(coin.x + coin.size/2, coin.y + coin.size/2);
            ctx.rotate(coin.rotation);
            
            // Add glow effect
            ctx.shadowColor = COLLECTIBLE_TYPES[coin.type].color;
            ctx.shadowBlur = 10;
            
            if (coin.type === 'MONEY_BILL') {
                ctx.drawImage(collectibleImages[coin.type], 
                            -coin.size/2, -coin.size/2, 
                            coin.size, coin.size);
            } else {
                ctx.drawImage(collectibleImages[coin.type], 
                            -coin.size/2, -coin.size/2, 
                            coin.size, coin.size);
            }
            
            ctx.restore();
        }
    });

    // Draw owl with current skin
    ctx.save();
    ctx.translate(gameState.bird.x, gameState.bird.y);
    
    // Add slight rotation based on velocity
    const rotation = Math.min(Math.max(gameState.bird.velocity * 0.1, -0.5), 0.5);
    ctx.rotate(rotation);
    
    ctx.drawImage(owlImages[gameState.bird.currentSkin], 
                 -BIRD_SIZE/2, -BIRD_SIZE/2, 
                 BIRD_SIZE, BIRD_SIZE);
    ctx.restore();

    // Draw game over or pause text
    if (gameState.gameOver) {
        drawGameOver();
    } else if (gameState.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px Arial';
        ctx.fillText('Press Enter to Resume', canvas.width / 2, canvas.height / 2 + 20);
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 10);
    
    // Add credit text at the bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px Arial';
    ctx.fillText('@WladysTrb', canvas.width / 2, canvas.height - 20);
    
    restartButton.style.display = 'block';
}

function getBirdColor() {
    switch (gameState.bird.currentSkin) {
        case 'golden': return '#f1c40f';
        case 'rainbow': return `hsl(${Math.random() * 360}, 100%, 50%)`;
        case 'ninja': return '#2c3e50';
        default: return '#e74c3c';
    }
}

function gameOver() {
    gameState.gameOver = true;
    restartButton.style.display = 'block';
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('flappyHighScore', gameState.highScore);
    }
    updateTopScores(gameState.score);
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
}

function updateCoinsDisplay() {
    document.getElementById('coins').textContent = `Coins: ${gameState.coinCount}`;
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
initGame();
displayTopScores();
gameLoop();

// Add section switching functionality
document.addEventListener('DOMContentLoaded', () => {
    const sectionButtons = document.querySelectorAll('.section-button');
    const sections = document.querySelectorAll('.shop-section');
    
    sectionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            sectionButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show active section
            const sectionId = button.getAttribute('data-section');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `${sectionId}Section`) {
                    section.classList.add('active');
                }
            });
        });
    });
}); 