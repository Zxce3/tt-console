<script lang="ts">
    import Tetris from '$lib/components/Tetris.svelte';
    import type { TetrisSettings, ScoreRecord, TetrisComponent } from '$lib/types';
    import { gameStore, displayTime, gameStatus } from '$lib/stores/game';
    import devtools from 'devtools-detect';
    import { devToolsStore } from '$lib/stores/devtools';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import '../app.css';
    import ScoreTable from '$lib/components/ScoreTable.svelte';
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
    let showHistory = $state<boolean>(false);

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

    onMount(() => {
        if (browser) {
            devToolsStore.set({
                isOpen: devtools.isOpen,
                orientation: devtools.orientation
            });
        }
    });

    // Initialize game
    function initGame() {
        if (!$devToolsStore.isOpen) {
            alert('Please open DevTools (F12) to play!');
            return;
        }
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

    function handleKeydown(e: KeyboardEvent) {
        if ($gameStatus.isActive && ['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
            e.preventDefault();
        }
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

<svelte:window on:keydown={handleKeydown} />

<div class="container">
    <h1>Tetris Console Edition</h1>
    
    {#if browser && !$devToolsStore.isOpen}
        <div class="devtools-warning">
            Please open DevTools (F12) to play the game!
        </div>
    {:else}
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
                <button class="toggle-history" onclick={() => showHistory = !showHistory}>
                    Show High Scores
                </button>
            </div>
            <ScoreTable scores={scoreHistory} bind:show={showHistory} />
        {/if}
    {/if}
</div>
