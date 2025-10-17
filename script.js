// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect (unused by starter but kept)
let currentCans = 0;         // Current number of items collected
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let countdownInterval;       // Holds the interval for the game timer
let timeLeft = 30;           // Game time in seconds
let obstacleInterval;        // Interval for spawning obstacles
let currentGoal = 20;        // Goal to win (differs by difficulty)
let spawnRate = 1000;       // ms between water can spawns
let obstacleRate = 3000;    // ms between obstacle spawns

// End-game message arrays
const winMessages = [
  'You did it! Clean water for all!',
  'Amazing work — you collected enough cans!',
  'Champion! The community thanks you!'
];

const loseMessages = [
  'Nice try — keep going and try again!',
  'Almost there! Give it another shot!',
  'So close! Practice makes perfect.'
];

// Milestone messages: keyed by target (relative or absolute); each has several possible messages
const milestoneMessages = {
  0.25: ['Nice start!', 'You got this — keep going!'],
  0.5: ['Halfway there!', 'You are halfway to the goal!'],
  0.75: ['Almost there!', 'You can finish strong!'],
  1.0: ['Goal reached! Great work!']
};

// Track which milestone fractions have been announced this round
let announcedMilestones = new Set();

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  
  // Clear all cells before spawning a new water can
  cells.forEach(cell => (cell.innerHTML = ''));

  // Select a random cell from the grid to place the water can
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // Use a template literal to create the wrapper and water-can element
  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can"></div>
    </div>
  `;
}

// Spawns an obstacle that penalizes the player if clicked
function spawnObstacle() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  if (!randomCell) return;

  // Only place obstacle if cell is empty
  if (randomCell.innerHTML.trim() === '') {
    randomCell.innerHTML = `
      <div class="obstacle-wrapper">
        <div class="obstacle" aria-hidden="true">💥</div>
      </div>
    `;
    // Remove obstacle after a short duration so it doesn't stay forever
    setTimeout(() => {
      if (randomCell && randomCell.querySelector('.obstacle-wrapper')) {
        randomCell.innerHTML = '';
      }
    }, 1200);
  }
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active
  gameActive = true;
  createGrid(); // Set up the game grid
  // Reset score and timer UI
  currentCans = 0;
  timeLeft = 30;
  updateScoreUI();
  updateTimerUI();
  document.getElementById('end-message').textContent = '';

  // Read difficulty and set parameters
  const difficulty = document.getElementById('difficulty')?.value || 'normal';
  switch (difficulty) {
    case 'easy':
      currentGoal = 15;
      timeLeft = 40;
      spawnRate = 1200;
      obstacleRate = 4000;
      break;
    case 'hard':
      currentGoal = 30;
      timeLeft = 20;
      spawnRate = 700;
      obstacleRate = 2200;
      break;
    default:
      currentGoal = 20;
      timeLeft = 30;
      spawnRate = 1000;
      obstacleRate = 3000;
  }

  // Spawn water cans and obstacles at rates dependent on difficulty
  spawnInterval = setInterval(spawnWaterCan, spawnRate);
  obstacleInterval = setInterval(spawnObstacle, obstacleRate);

  // Spawn obstacles occasionally (every 3 seconds)
  obstacleInterval = setInterval(spawnObstacle, 3000);

  // Start countdown timer
  countdownInterval = setInterval(() => {
    if (!gameActive) return;
    timeLeft -= 1;
    updateTimerUI();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  // Mark the game as inactive and stop intervals
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(countdownInterval);
  clearInterval(obstacleInterval);

  // Clear any visible water cans
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));

  // Show end-game message based on score
  const messageEl = document.getElementById('end-message');
  let chosenMessage = '';
  if (currentCans >= currentGoal) {
    chosenMessage = winMessages[Math.floor(Math.random() * winMessages.length)];
    messageEl.classList.remove('lose');
    messageEl.classList.add('win');
    // celebrate with confetti
    launchConfetti();
  } else {
    chosenMessage = loseMessages[Math.floor(Math.random() * loseMessages.length)];
    messageEl.classList.remove('win');
    messageEl.classList.add('lose');
  }
  messageEl.textContent = `${chosenMessage} You collected ${currentCans} cans.`;
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);

// Delegate clicks on the grid to handle collecting cans
document.querySelector('.game-grid').addEventListener('click', (e) => {
  if (!gameActive) return; // Only count clicks while the game is active

  // If the clicked element or any parent has the .water-can class, count it
  const gridCell = e.target.closest('.grid-cell');
  if (!gridCell) return; // click outside grid

  // If the grid cell contains a can anywhere, count it as a hit (easier UX)
  const waterCan = gridCell.querySelector('.water-can');
  const obstacle = gridCell.querySelector('.obstacle');
  if (waterCan) {
    // Hit: Increase score and update UI
    currentCans += 1;
    updateScoreUI();

    // Check milestones (fractions of currentGoal)
    checkAndAnnounceMilestones();

    // Add hit feedback to the cell
    gridCell.classList.add('hit');
    setTimeout(() => gridCell.classList.remove('hit'), 250);

    // Remove the can immediately to prevent multiple clicks
    const wrapper = waterCan.closest('.water-can-wrapper');
    if (wrapper) wrapper.remove();
    // Add to collection UI
    const collectionGrid = document.getElementById('collection-grid');
    if (collectionGrid) {
      const item = document.createElement('div');
      item.className = 'collection-item';
      collectionGrid.appendChild(item);
      // optionally limit the number of visible items
      if (collectionGrid.children.length > 20) {
        collectionGrid.removeChild(collectionGrid.children[0]);
      }
    }
  } else if (obstacle) {
    // Player clicked an obstacle: apply penalty
    currentCans = Math.max(0, currentCans - 2);
    updateScoreUI();
    gridCell.classList.add('miss');
    setTimeout(() => gridCell.classList.remove('miss'), 300);
    const wrapper = gridCell.querySelector('.obstacle-wrapper');
    if (wrapper) wrapper.remove();
  } else {
    // Miss: user clicked an empty cell — provide feedback but do not change score
    gridCell.classList.add('miss');
    setTimeout(() => gridCell.classList.remove('miss'), 250);
  }
});

// Reset button handler
const resetBtn = document.getElementById('reset-game');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    gameActive = false;
    clearInterval(spawnInterval);
    clearInterval(countdownInterval);
    clearInterval(obstacleInterval);
    currentCans = 0;
    timeLeft = 30;
    updateScoreUI();
    updateTimerUI();
    document.getElementById('end-message').textContent = '';
    // clear grid contents
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => (cell.innerHTML = ''));
    // clear collection UI
    const collectionGrid = document.getElementById('collection-grid');
    if (collectionGrid) collectionGrid.innerHTML = '';
  // clear milestone announcements
  announcedMilestones.clear();
    // remove confetti if present
    const confetti = document.querySelectorAll('.confetti-container');
    confetti.forEach(c => c.remove());
  });
}

// Confetti — simple implementation using DOM particles and CSS animations
function launchConfetti() {
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);

  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = ['#FFC907', '#2E9DF7', '#4FCB53', '#FF902A', '#F16061'][Math.floor(Math.random() * 5)];
    confettiContainer.appendChild(piece);
  }

  setTimeout(() => {
    confettiContainer.classList.add('hide');
    setTimeout(() => confettiContainer.remove(), 1500);
  }, 900);
}

// UI helper functions
function updateScoreUI() {
  const el = document.getElementById('current-cans');
  if (el) el.textContent = currentCans;
}

function updateTimerUI() {
  const el = document.getElementById('timer');
  if (el) el.textContent = timeLeft;
}

// Check milestone thresholds and announce if reached (fractions of currentGoal)
function checkAndAnnounceMilestones() {
  if (!currentGoal) return;
  const fractions = Object.keys(milestoneMessages).map(Number).sort((a,b)=>a-b);
  for (const f of fractions) {
    const target = Math.ceil(currentGoal * f);
    if (currentCans >= target && !announcedMilestones.has(f)) {
      announcedMilestones.add(f);
      const msgs = milestoneMessages[f];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      showAchievement(msg);
    }
  }
}

// Display a short achievement message in the #achievements element
function showAchievement(text) {
  const container = document.getElementById('achievements');
  if (!container) return;
  container.textContent = text;
  container.classList.add('visible');
  setTimeout(() => {
    container.classList.remove('visible');
    // clear text after hide transition
    setTimeout(() => { container.textContent = ''; }, 300);
  }, 1800);
}
