// Game state variables
let selectedCell = null;
let hintsUsed = 0;
let wordsFound = 0;
let gameGrid = Array(9).fill().map(() => Array(9).fill(0));
let revealedCells = new Set();
let revealedWords = new Set();
let currentTheme = 'animals';
let isDarkTheme = false;

// Word themes - each word is 9 letters representing complete lines
const wordThemes = {
    animals: [
        'ALLIGATOR', // Row 1
        'BUTTERFLY', // Row 2  
        'CROCODILE', // Row 3
        'DRAGONFLY', // Row 4
        'ELEPHANTS', // Row 5
        'FLAMINGOS', // Row 6
        'GIRAFFESS', // Row 7
        'HEDGEHOGS', // Row 8
        'JELLYFISH'  // Row 9
    ],
    colors: [
        'TURQUOISE',
        'ORANGERED',
        'LIMEGREEN',
        'GOLDENROD',
        'ROSYBROWN',
        'SLATEGRAY',
        'DARKKHAKI',
        'INDIANRED',
        'STEELBLUE'
    ],
    countries: [
        'AUSTRALIA',
        'ARGENTINA',
        'SINGAPORE',
        'INDONESIA',
        'GUATEMALA',
        'LITHUANIA',
        'MAURITIUS',
        'NICARAGUA',
        'BARBADOSS'
    ]
};

// Game initialization
function initGame() {
    createGrid();
    fillInitialCells();
    updateUI();
}

// Create the Sudoku grid HTML elements
function createGrid() {
    const grid = document.getElementById('sudokuGrid');
    grid.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => selectCell(row, col));
            
            // Add cloud overlay
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.textContent = '☁️';
            cell.appendChild(cloud);
            
            grid.appendChild(cell);
        }
    }
}

// Fill some initial cells to make the puzzle playable
function fillInitialCells() {
    // Clear previous game state
    gameGrid = Array(9).fill().map(() => Array(9).fill(0));
    revealedCells.clear();
    revealedWords.clear();
    wordsFound = 0;
    hintsUsed = 0;
    
    // Add starter numbers based on animal theme
    const starters = [
        [0, 0, 1],  [0, 4, 12], [0, 8, 18], // A, L, R (ALLIGATOR)
        [1, 1, 21], [1, 5, 20], [1, 7, 25], // U, T, Y (BUTTERFLY)
        [2, 2, 15], [2, 6, 9],              // O, I (CROCODILE)
        [3, 0, 4],  [3, 8, 25],             // D, Y (DRAGONFLY)
        [4, 2, 5],  [4, 6, 14],             // E, N (ELEPHANTS)
        [5, 1, 12], [5, 7, 15],             // L, O (FLAMINGOS)
        [6, 3, 1],  [6, 5, 6],              // A, F (GIRAFFESS)
        [7, 0, 8],  [7, 4, 7],              // H, G (HEDGEHOGS)
        [8, 0, 10], [8, 8, 8]               // J, H (JELLYFISH)
    ];

    starters.forEach(([row, col, value]) => {
        gameGrid[row][col] = value;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = numberToLetter(value);
        cell.classList.add('revealed');
        const cloud = cell.querySelector('.cloud');
        if (cloud) {
            cloud.style.display = 'none';
        }
        revealedCells.add(`${row}-${col}`);
    });
}

// Cell selection handler
function selectCell(row, col) {
    // Remove previous selection
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected');
    });

    // Select new cell if it's not already revealed
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!revealedCells.has(`${row}-${col}`)) {
        cell.classList.add('selected');
        selectedCell = { row, col };
    }
}

// Number selection and placement
function selectNumber(number) {
    if (!selectedCell) {
        showMessage('Please select a cell first!', 'warning');
        return;
    }
    
    const { row, col } = selectedCell;
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    // Check if move is valid (basic Sudoku rules)
    if (!isValidMove(row, col, number)) {
        showMessage('Invalid move! Number already exists in row, column, or box.', 'error');
        return;
    }
    
    // Update game state
    gameGrid[row][col] = number;
    cell.textContent = numberToLetter(number);
    
    // Animate cloud removal
    const cloud = cell.querySelector('.cloud');
    if (cloud) {
        cloud.classList.add('dissipating');
        setTimeout(() => {
            cloud.style.display = 'none';
            cell.classList.add('revealed');
            animateCellReveal(cell);
        }, 400);
    }
    
    revealedCells.add(`${row}-${col}`);
    
    // Check for completed words after animation
    setTimeout(() => {
        checkForCompletedWords();
        updateUI();
    }, 1000);
    
    // Clear selection
    cell.classList.remove('selected');
    selectedCell = null;
}

// Clear selected cell
function clearCell() {
    if (!selectedCell) {
        showMessage('Please select a cell first!', 'warning');
        return;
    }
    
    const { row, col } = selectedCell;
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    // Don't clear pre-filled cells
    if (isPrefilledCell(row, col)) {
        showMessage('Cannot clear pre-filled cells!', 'warning');
        return;
    }
    
    gameGrid[row][col] = 0;
    cell.textContent = '';
    cell.classList.remove('revealed');
    
    // Show cloud again
    const cloud = cell.querySelector('.cloud');
    if (cloud) {
        cloud.style.display = 'flex';
        cloud.classList.remove('dissipating');
    }
    
    revealedCells.delete(`${row}-${col}`);
    updateUI();
}

// Validate Sudoku move
function isValidMove(row, col, number) {
    // Check row
    for (let c = 0; c < 9; c++) {
        if (c !== col && gameGrid[row][c] === number) {
            return false;
        }
    }
    
    // Check column  
    for (let r = 0; r < 9; r++) {
        if (r !== row && gameGrid[r][col] === number) {
            return false;
        }
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (r !== row && c !== col && gameGrid[r][c] === number) {
                return false;
            }
        }
    }
    
    return true;
}

// Check if cell is pre-filled
function isPrefilledCell(row, col) {
    const starters = [
        [0, 0], [0, 4], [0, 8],
        [1, 1], [1, 5], [1, 7],
        [2, 2], [2, 6],
        [3, 0], [3, 8],
        [4, 2], [4, 6],
        [5, 1], [5, 7],
        [6, 3], [6, 5],
        [7, 0], [7, 4],
        [8, 0], [8, 8]
    ];
    
    return starters.some(([r, c]) => r === row && c === col);
}

// Check for completed words (rows and columns)
function checkForCompletedWords() {
    const currentWords = wordThemes[currentTheme];
    
    // Check rows for complete words
    for (let row = 0; row < 9; row++) {
        let complete = true;
        for (let col = 0; col < 9; col++) {
            if (gameGrid[row][col] === 0) {
                complete = false;
                break;
            }
        }
        
        if (complete && !revealedWords.has(`row-${row}`)) {
            revealWord(`row-${row}`, currentWords[row], row, 'row');
        }
    }
    
    // Check columns
    for (let col = 0; col < 9; col++) {
        let complete = true;
        let columnWord = '';
        
        for (let row = 0; row < 9; row++) {
            if (gameGrid[row][col] === 0) {
                complete = false;
                break;
            }
            columnWord += numberToLetter(gameGrid[row][col]);
        }
        
        if (complete && !revealedWords.has(`col-${col}`)) {
            revealWord(`col-${col}`, columnWord, col, 'col');
        }
    }
}

// Reveal a discovered word
function revealWord(wordId, word, index, type) {
    revealedWords.add(wordId);
    wordsFound++;
    
    // Create celebration animation
    const wordDiv = document.createElement('div');
    wordDiv.className = 'word-discovered';
    
    if (type === 'row') {
        wordDiv.textContent = `🎉 Row ${index + 1}: ${word}!`;
    } else {
        wordDiv.textContent = `🎉 Column ${index + 1}: ${word}!`;
    }
    
    document.getElementById('discoveredWords').appendChild(wordDiv);
    
    // Highlight the completed line
    highlightCompletedLine(index, type);
    
    // Update UI
    updateUI();
    
    // Remove announcement after 4 seconds
    setTimeout(() => {
        wordDiv.remove();
    }, 4000);
    
    // Check for game completion
    if (wordsFound >= 18) {
        setTimeout(() => {
            showMessage('🏆 Congratulations! You\'ve discovered all words!', 'success');
        }, 1000);
    }
}

// Highlight completed line
function highlightCompletedLine(index, type) {
    if (type === 'row') {
        for (let col = 0; col < 9; col++) {
            const cell = document.querySelector(`[data-row="${index}"][data-col="${col}"]`);
            cell.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
            cell.style.color = 'white';
        }
    } else {
        for (let row = 0; row < 9; row++) {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${index}"]`);
            cell.style.background = 'linear-gradient(135deg, #4299e1, #3182ce)';
            cell.style.color = 'white';
        }
    }
}

// Use hint system
function useHint() {
    // Find first empty cell and provide context
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (gameGrid[row][col] === 0) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const cloud = cell.querySelector('.cloud');
                
                // Visual hint: make cloud semi-transparent
                cloud.style.background = 'rgba(255, 215, 0, 0.6)';
                cloud.textContent = '💨';
                
                const currentWords = wordThemes[currentTheme];
                const expectedLetter = currentWords[row][col];
                const expectedNumber = letterToNumber(expectedLetter);
                
                showMessage(
                    `Hint: Try letter "${expectedLetter}" (${expectedNumber}) at row ${row + 1}, column ${col +
