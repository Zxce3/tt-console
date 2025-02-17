<script lang="ts">
    import Tetris from '$lib/components/Tetris.svelte';
    import type { TetrisSettings, ScoreRecord, TetrisComponent } from '$lib/types';
    import { gameStore, displayTime, gameStatus } from '$lib/stores/game';
    
    // Game state and refs with proper reactivity
    let tetrisComponent = $state<TetrisComponent | undefined>(undefined);
    let settings = $state<TetrisSettings>({
        rows: 20,
        cols: 12,
        speed: 1000,
        ghostPiece: true,
        showNext: true
    });
    let scoreHistory = $state<ScoreRecord[]>([]);

    // Computed button states using store values
    let buttonStates = $derived({
        start: {
            text: $gameStatus.isActive ? 'Game Running' : 'Start Game',
            disabled: $gameStatus.isActive
        },
        pause: {
            text: $gameStatus.isPaused ? 'Resume Game' : 'Pause Game',
            class: $gameStatus.isPaused ? 'paused' : ''
        },
        restart: {
            text: 'Restart Game',
            class: 'restart'
        }
    });

    // Updated game status handler
    function handleGameStatus(data: {
        paused: boolean;
        score: number;
        time: number;
        piece: string;
    }) {
        gameStore.updateScore(data.score);
        gameStore.updatePiece(data.piece);
        if (data.paused !== $gameStatus.isPaused) {
            gameStore.togglePause();
        }
    }

    // Initialize game
    function initGame() {
        gameStore.reset(); // Reset the store first
        gameStore.setStarted(true);
        console.clear();
        requestAnimationFrame(() => {
            console.log('%cTETRIS CONSOLE EDITION', 'color: #ff3e00; font-size: 20px; font-weight: bold;');
            console.log('%cGame starting...', 'color: #666;');
        });
    }

    // Load history on mount
    $effect(() => {
        const saved = localStorage.getItem('tetris-history');
        if (saved) {
            scoreHistory = JSON.parse(saved);
        }
    });

    function handleGameOver({ score, duration }: { score: number; duration: number }) {
        const record: ScoreRecord = {
            score,
            timestamp: new Date().toLocaleString(),
            duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
            rows: settings.rows,
            cols: settings.cols
        };
        
        scoreHistory = [record, ...scoreHistory.slice(0, 9)];
        localStorage.setItem('tetris-history', JSON.stringify(scoreHistory));
        
        // Reset game state after saving score
        gameStore.setGameOver();
        gameStore.setStarted(false);
    }
</script>

<svelte:head>
    <title>Tetris Console Edition - A Browser Console Game</title>
    <meta name="description" content="Play Tetris directly in your browser's developer console. A unique implementation built with Svelte featuring customizable settings, score tracking, and ghost pieces." />
    <meta name="keywords" content="tetris, console game, browser game, svelte, typescript" />
    <meta property="og:title" content="Tetris Console Edition" />
    <meta property="og:description" content="A unique Tetris game that runs in your browser's developer console" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Tetris Console Edition" />
    <meta name="twitter:description" content="Play Tetris in your browser's console" />
</svelte:head>

<div class="container">
    <h1>Tetris Console Edition</h1>
    
    {#if !$gameStatus.isActive || $gameStatus.over}
        <div class="settings">
            <h2>Game Settings</h2>
            <div class="setting-group">
                <label>
                    Rows: <input type="number" bind:value={settings.rows} min="10" max="30" />
                </label>
                <label>
                    Columns: <input type="number" bind:value={settings.cols} min="8" max="16" />
                </label>
                <label>
                    Speed: <select bind:value={settings.speed}>
                        <option value={1200}>Slow</option>
                        <option value={1000}>Normal</option>
                        <option value={700}>Fast</option>
                        <option value={500}>Expert</option>
                    </select>
                </label>
                <label>
                    <input type="checkbox" bind:checked={settings.ghostPiece} />
                    Show Ghost Piece
                </label>
                <label>
                    <input type="checkbox" bind:checked={settings.showNext} />
                    Show Next Piece
                </label>
            </div>
        </div>
    {/if}

    {#if $gameStatus.isActive && !$gameStatus.over}
        <div class="game-info">
            <div class="stats">
                <div>Score: {$gameStatus.score}</div>
                <div>Time: {$displayTime}</div>
                <div>Current: {$gameStatus.currentPiece}</div>
                {#if $gameStatus.isPaused}
                    <div class="paused-text">GAME PAUSED</div>
                {/if}
            </div>
            <div class="controls-hint">
                <h3>Controls</h3>
                <div>← → : Move</div>
                <div>↑ : Rotate</div>
                <div>↓ : Drop</div>
                <div>Space : Hard Drop</div>
                <div>P : Pause</div>
            </div>
        </div>
    {/if}

    <div class="controls">
        <button 
            class:active={$gameStatus.isActive} 
            onclick={initGame}
            disabled={buttonStates.start.disabled}
        >
            {buttonStates.start.text}
        </button>
        
        {#if $gameStatus.isActive}
            <button 
                class={buttonStates.pause.class}
                onclick={() => tetrisComponent?.togglePause()}
            >
                {buttonStates.pause.text}
            </button>
            <button 
                class={buttonStates.restart.class}
                onclick={() => tetrisComponent?.restart()}
            >
                {buttonStates.restart.text}
            </button>
        {/if}
    </div>

    {#if $gameStatus.isActive && !$gameStatus.over}
        <Tetris
            bind:this={tetrisComponent}
            {...settings}
            onGameOver={handleGameOver}
            onGameStatus={handleGameStatus}
        />
    {/if}

    {#if scoreHistory.length > 0}
        <div class="history">
            <h2>High Scores</h2>
            <table>
                <thead>
                    <tr>
                        <th>Score</th>
                        <th>Time</th>
                        <th>Duration</th>
                        <th>Board Size</th>
                    </tr>
                </thead>
                <tbody>
                    {#each scoreHistory as record}
                        <tr>
                            <td>{record.score}</td>
                            <td>{record.timestamp}</td>
                            <td>{record.duration}</td>
                            <td>{record.rows}×{record.cols}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .container {
        text-align: center;
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .settings {
        margin: 2rem 0;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .setting-group {
        display: grid;
        gap: 1rem;
        max-width: 300px;
        margin: 0 auto;
    }

    .controls {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 1rem 0;
    }

    button {
        padding: 1rem 2rem;
        font-size: 1.2rem;
        cursor: pointer;
        background: #ff3e00;
        color: white;
        border: none;
        border-radius: 4px;
        transition: all 0.3s;
    }

    button:hover:not(:disabled) {
        background: #ff6240;
    }

    button.active {
        background: #666;
    }

    .game-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin: 1rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .stats {
        text-align: left;
        font-size: 1.2rem;
        line-height: 1.5;
    }

    .controls-hint {
        text-align: left;
    }

    .controls-hint h3 {
        margin-top: 0;
    }

    button.paused {
        background: #ffa500;
    }

    button.restart {
        background: #666;
    }

    button.restart:hover {
        background: #888;
    }

    .history {
        margin-top: 2rem;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }

    th, td {
        padding: 0.5rem;
        border: 1px solid #ccc;
    }

    th {
        background: #f5f5f5;
    }

    .paused-text {
        color: #ffa500;
        font-weight: bold;
        margin-top: 0.5rem;
    }
</style>
