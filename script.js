// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect (unused by starter but kept)
let currentCans = 0;         // Current number of items collected
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let countdownInterval;       // Holds the interval for the game timer
let timeLeft = 30;           // Game time in seconds
let obstacleInterval;        // Interval for spawning obstacles

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
        <div class="obstacle" aria-hidden="true">!</div>
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

  // Spawn water cans every second
  spawnInterval = setInterval(spawnWaterCan, 1000);

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
  if (currentCans >= 20) {
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

  const waterCan = e.target.closest('.water-can');
  const obstacle = e.target.closest('.obstacle');
  if (waterCan) {
    // Hit: Increase score and update UI
    currentCans += 1;
    updateScoreUI();

    // Add hit feedback to the cell
    gridCell.classList.add('hit');
    setTimeout(() => gridCell.classList.remove('hit'), 250);

    // Remove the can immediately to prevent multiple clicks
    const wrapper = waterCan.closest('.water-can-wrapper');
    if (wrapper) wrapper.remove();
  } else if (obstacle) {
    // Player clicked an obstacle: apply penalty
    currentCans = Math.max(0, currentCans - 2);
    updateScoreUI();
    gridCell.classList.add('miss');
    setTimeout(() => gridCell.classList.remove('miss'), 300);
    const wrapper = obstacle.closest('.obstacle-wrapper');
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
