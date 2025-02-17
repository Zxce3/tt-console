<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import type { TetrisSettings } from '$lib/types';
    import { onMount, onDestroy } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    // Types and constants first
    type Board = number[][];
    type Shape = number[][];
;

    // Display constants
    const EMPTY = '⬛';
    const PLACED = '🟪';
    const ACTIVE = '🟨';
    const GHOST = '⬜';
    const BORDER = '🟦';
    const DISPLAY_BUFFER = 4; // Extra rows above play area

    // Shape definitions
    const SHAPES = {
        I: { shape: [[1, 1, 1, 1]], name: 'I-Block' },
        O: { shape: [[1, 1], [1, 1]], name: 'O-Block' },
        T: { shape: [[0, 1, 0], [1, 1, 1]], name: 'T-Block' },
        Z: { shape: [[1, 1, 0], [0, 1, 1]], name: 'Z-Block' },
        S: { shape: [[0, 1, 1], [1, 1, 0]], name: 'S-Block' },
        L: { shape: [[1, 0, 0], [1, 1, 1]], name: 'L-Block' },
        J: { shape: [[0, 0, 1], [1, 1, 1]], name: 'J-Block' }
    };

    // Game intervals and timeouts
    let gameInterval: ReturnType<typeof setInterval>;
    let renderTimeout: number;

    // Props using destructuring
    let { 
        rows, cols, speed, 
        onGameOver, onRestart    } = $props<{
        rows: number;
        cols: number;
        speed: number;
        ghostPiece: boolean;
        showNext: boolean;
        onGameOver?: (data: { score: number; duration: number }) => void;
        onPause?: (data: { paused: boolean }) => void;
        onRestart?: () => void;
        onGameStatus?: (data: { 
            paused: boolean; 
            score: number; 
            time: number;
            piece: string;
        }) => void;
    }>();

    // Game state manager
    const createGameState = () => ({
        started: false,
        paused: false,
        over: false,
        time: {
            start: 0,
            current: 0,
            pauseStart: 0,
            pausedDuration: 0
        },
        score: 0,
        board: [] as number[][],
        currentPiece: {
            shape: [] as number[][],
            row: 0,
            col: 0,
            name: ''
        }
    });

    // Initialize state using the manager
    let gameState = $state(createGameState());

    // Simplify state access with derived values
    let gameTime = $derived(Math.floor(
        (Date.now() - gameState.time.start - gameState.time.pausedDuration) / 1000
    ));


    // Add constants for display height control
    const TOTAL_DISPLAY_LINES = rows + DISPLAY_BUFFER;

    // Add utility function for line numbers
    function formatLineNumber(num: number): string {
        return num.toString().padStart(2, '0');
    }

    // Update ghost position calculation
    function getGhostPosition(): { row: number, col: number } {
        if (!gameState.currentPiece.shape.length) return { row: 0, col: 0 };
        
        let ghostRow = gameState.currentPiece.row;
        let maxDrop = 0;

        // Calculate maximum drop distance
        while (!collision(ghostRow + maxDrop + 1, gameState.currentPiece.col, gameState.currentPiece.shape)) {
            maxDrop++;
        }

        return { 
            row: ghostRow + maxDrop, 
            col: gameState.currentPiece.col 
        };
    }

    const dispatch = createEventDispatcher<{
        gameStatus: {
            paused: boolean;
            score: number;
            time: number;
            piece: string;
        };
        gameover: { score: number; duration: number };
        pause: { paused: boolean };
        restart: undefined;
    }>();

    // Replace auto-update status effect
    $effect.root(() => {
        if (gameState.started) {
            const status = {
                paused: gameState.paused,
                score: gameState.score,
                time: gameTime,
                piece: gameState.currentPiece.name
            };
            dispatch('gameStatus', status);
        }
    });

    // Improved time tracking
    function updateGameTime() {
        if (!gameState.paused && !gameState.over && gameState.started) {
            const currentTime = Date.now();
            const elapsed = currentTime - gameState.time.start - gameState.time.pausedDuration;
            gameState.time.current = Math.floor(elapsed / 1000);
            
            dispatch('gameStatus', {
                paused: gameState.paused,
                score: gameState.score,
                time: gameState.time.current,
                piece: gameState.currentPiece.name
            });
        }
    }

    // Add timer for smoother updates
    let timeInterval: ReturnType<typeof setInterval>;

    // Update timer initialization
    function startTimers() {
        clearTimers();
        gameState.time.start = Date.now(); // Set local time
        gameInterval = setInterval(() => movePiece(1, 0), speed);
        timeInterval = setInterval(() => {
            updateGameTime();
            gameStore.updateTime(); // Keep store in sync
        }, 100);
    }

    function clearTimers() {
        clearInterval(gameInterval);
        clearInterval(timeInterval);
    }

    // Modify render for smooth display
    function render() {
        if (gameState.over || !gameState.started) return;

        if (renderTimeout) {
            cancelAnimationFrame(renderTimeout);
        }

        renderTimeout = requestAnimationFrame(() => {
            console.clear();
            
            // Update game time
            if (!gameState.paused && !gameState.over) {
                gameState.time.current = Math.floor((Date.now() - gameState.time.start) / 1000);
            }

            const display = gameState.board.map(row => [...row]);
            const ghost = getGhostPosition();
            
            // Add ghost piece
            gameState.currentPiece.shape.forEach((row, dy) => {
                row.forEach((cell, dx) => {
                    const y = ghost.row + dy;
                    const x = ghost.col + dx;
                    if (cell && y >= 0 && y < rows && x >= 0 && x < cols && !display[y][x]) {
                        display[y][x] = 3; // Ghost piece
                    }
                });
            });

            // Add current piece
            gameState.currentPiece.shape.forEach((row, dy) => {
                row.forEach((cell, dx) => {
                    const y = gameState.currentPiece.row + dy;
                    const x = gameState.currentPiece.col + dx;
                    if (cell && y >= 0 && y < rows && x >= 0 && x < cols) {
                        display[y][x] = 2; // Active piece
                    }
                });
            });

            // Create fixed height display with numbered borders
            const displayLines = Array(TOTAL_DISPLAY_LINES).fill(null).map((_, i) => {
                const lineNum = formatLineNumber(i);
                if (i < DISPLAY_BUFFER) {
                    return `${lineNum} ${BORDER}${EMPTY.repeat(cols)}${BORDER}`;
                }
                const boardRow = display[i - DISPLAY_BUFFER];
                if (!boardRow) return `${lineNum} ${BORDER}${EMPTY.repeat(cols)}${BORDER}`;
                
                const cells = boardRow.map(cell => {
                    if (cell === 0) return EMPTY;
                    if (cell === 1) return PLACED;
                    if (cell === 2) return ACTIVE;
                    return GHOST;
                }).join('');
                return `${lineNum} ${BORDER}${cells}${BORDER}`;
            });

            // Top border with column numbers
            console.log(`   ${Array(cols).fill(0).map((_, i) => formatLineNumber(i)).join('')}`);
            console.log(`   ${BORDER.repeat(cols + 2)}`);
            
            // Render board with line numbers
            displayLines.forEach(line => console.log(line));
            
            // Bottom border
            console.log(`   ${BORDER.repeat(cols + 2)}`);
            console.log(`Current Piece: ${gameState.currentPiece.name}`);
            console.log(`Score: ${gameState.score}`);
        });
    }

    function createBoard(): void {
        gameState.board = Array.from({ length: rows }, () => Array(cols).fill(0));
    }

    // Update collision detection to be more precise
    function collision(row: number, col: number, shape: Shape): boolean {
        if (!shape.length) return true;
        
        return shape.some((shapeRow, dy) => 
            shapeRow.some((cell, dx) => {
                if (!cell) return false; // Skip empty cells

                const boardY = row + dy;
                const boardX = col + dx;
                
                // Check boundaries
                if (boardY >= rows || boardX < 0 || boardX >= cols) {
                    return true;
                }
                
                // Check bottom boundary
                if (boardY < 0) {
                    return false; // Allow piece to spawn above board
                }
                
                // Check collision with placed pieces
                return gameState.board[boardY]?.[boardX] === 1;
            })
        );
    }

    function placePiece(): void {
        gameState.currentPiece.shape.forEach((row, dy) => row.forEach((cell, dx) => {
            if (cell && gameState.board[gameState.currentPiece.row + dy]) {
                gameState.board[gameState.currentPiece.row + dy][gameState.currentPiece.col + dx] = cell;
            }
        }));
        clearLines();
        newPiece();
    }

    function clearLines(): void {
        let linesCleared = 0;
        const newBoard: Board = [];
        
        // Process all full lines at once
        gameState.board.forEach(row => {
            if (row.every(cell => cell)) {
                linesCleared++;
            } else {
                newBoard.push(row);
            }
        });
        
        // Add new empty lines at the top
        while (newBoard.length < rows) {
            newBoard.unshift(Array(cols).fill(0));
        }
        
        // Update score based on total lines cleared
        if (linesCleared > 0) {
            // Bonus points for multiple lines
            const bonus = [0, 10, 30, 50, 80][linesCleared] || 100;
            gameState.score += bonus;
        }
        
        gameState.board = newBoard;
    }

    function newPiece(): void {
        const shapeKeys = Object.keys(SHAPES) as (keyof typeof SHAPES)[];
        const randomShape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
        const { shape, name } = SHAPES[randomShape];
        gameState.currentPiece.name = name;
        gameState.currentPiece.shape = shape;
        gameState.currentPiece.row = 0;
        gameState.currentPiece.col = Math.floor((cols - shape[0].length) / 2);
        
        // Check for game over
        if (collision(gameState.currentPiece.row, gameState.currentPiece.col, gameState.currentPiece.shape)) {
            gameOver();
        } else {
            render();
        }
    }

    // Update move piece to handle drops better
    function movePiece(deltaRow: number, deltaCol: number): void {
        if (gameState.over) return;
        
        const { row, col, shape } = gameState.currentPiece;
        const newRow = row + deltaRow;
        const newCol = col + deltaCol;

        if (!collision(newRow, newCol, shape)) {
            gameState.currentPiece.row = newRow;
            gameState.currentPiece.col = newCol;
            render();
        } else if (deltaRow > 0) {
            // Only place piece if moving down and collision occurs
            placePiece();
        }
    }

    function rotatePiece(): void {
        const rotated = gameState.currentPiece.shape[0].map((_, i) => 
            gameState.currentPiece.shape.map(row => row[i]).reverse()
        );
        if (!collision(gameState.currentPiece.row, gameState.currentPiece.col, rotated)) {
            gameState.currentPiece.shape = rotated;
        }
        render();
    }

    // Update hard drop to use calculated position
    function hardDrop(): void {
        if (gameState.over) return;
        
        const dropPosition = getGhostPosition();
        if (dropPosition.row > gameState.currentPiece.row) {
            gameState.currentPiece.row = dropPosition.row;
            placePiece();
            render();
        }
    }

    // Add togglePause before it's used in handleKeydown
    function togglePause() {
        gameState.paused = !gameState.paused;
        if (gameState.paused) {
            clearTimers();
            gameState.time.pauseStart = Date.now();
        } else {
            gameState.time.pausedDuration += Date.now() - gameState.time.pauseStart;
            startTimers();
        }
        
        // Sync with store
        gameStore.togglePause();
        
        dispatch('gameStatus', {
            paused: gameState.paused,
            score: gameState.score,
            time: gameState.time.current,
            piece: gameState.currentPiece.name
        });
        render();
    }

    // Make it available as an export
    export { togglePause };

    // Modify keydown handler for pause
    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'p' || event.key === 'P') {
            togglePause();
            return;
        }

        if (gameState.paused) return;

        switch (event.key) {
            case 'ArrowLeft':
                movePiece(0, -1);
                break;
            case 'ArrowRight':
                movePiece(0, 1);
                break;
            case 'ArrowDown':
                movePiece(1, 0);
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case ' ':
                hardDrop();
                break;
        }
        render();
    }

    function gameOver() {
        gameState.over = true;
        gameState.started = false;
        clearTimers();
        
        // Sync with store
        gameStore.setGameOver();
        
        console.clear();
        console.log('Game Over!');
        console.log('Final Score: ' + gameState.score);
        
        onGameOver?.({
            score: gameState.score,
            duration: gameState.time.current
        });
        
        cleanup();
    }

    function cleanup() {
        clearTimers();
        window.removeEventListener('keydown', handleKeydown);
    }

    // Update restart
    export function restart() {
        cleanup();
        resetGameState();
        gameState.started = true;
        gameState.over = false;
        createBoard();
        newPiece();
        startTimers();
        window.addEventListener('keydown', handleKeydown);
        onRestart?.();
        render();
    }

    // Reset game state
    function resetGameState() {
        gameState = createGameState();
        gameState.time.start = Date.now();
        gameStore.reset(); // Keep store in sync
    }

    // Update game start
    function startGame() {
        resetGameState();
        gameState.started = true;
        createBoard();
        newPiece();
        startTimers();
        window.addEventListener('keydown', handleKeydown);
        
        // Sync with store
        gameStore.updateScore(gameState.score);
        gameStore.updatePiece(gameState.currentPiece.name);
    }

    onMount(() => {
        if ($gameStore.started && !$gameStore.over) {
            setTimeout(startGame, 100);
        }
    });

    onDestroy(() => {
        cleanup();
    });
</script>

<div style="display: none;">
    <!-- Hidden element to maintain Svelte component mounting -->
</div>