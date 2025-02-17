import { writable, derived } from 'svelte/store';

export type GameTime = {
    start: number;
    current: number;
    pauseStart: number;
    pausedDuration: number;
};

export type GameState = {
    started: boolean;
    paused: boolean;
    over: boolean;
    time: GameTime;
    score: number;
    currentPiece: string;
};

export interface GameStatus {
    isActive: boolean;
    isPaused: boolean;
    started: boolean;
    over: boolean; // Add over state
    score: number;
    currentPiece: string;
}

function createGameStore() {
    const initialState: GameState = {
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
        currentPiece: ''
    };

    const { subscribe, set, update } = writable(initialState);

    // Helper to format time
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return {
        subscribe,
        reset: () => {
            const now = Date.now();
            set({
                ...initialState,
                started: true, // Set to true on reset
                over: false, // Ensure over is reset
                time: { 
                    ...initialState.time, 
                    start: now,
                    current: 0,
                    pausedDuration: 0
                }
            });
        },
        updateTime: () => {
            update(state => {
                if (!state.paused && !state.over && state.started) {
                    const current = Date.now();
                    const elapsed = Math.floor(
                        (current - state.time.start - state.time.pausedDuration) / 1000
                    );
                    return {
                        ...state,
                        time: { ...state.time, current: elapsed }
                    };
                }
                return state;
            });
        },
        togglePause: () => {
            update(state => {
                const now = Date.now();
                if (!state.paused) {
                    // Pausing
                    return {
                        ...state,
                        paused: true,
                        time: { ...state.time, pauseStart: now }
                    };
                } else {
                    // Resuming
                    const pausedDuration = state.time.pausedDuration + (now - state.time.pauseStart);
                    return {
                        ...state,
                        paused: false,
                        time: { ...state.time, pausedDuration }
                    };
                }
            });
        },
        updateScore: (score: number) => {
            update(state => ({ ...state, score }));
        },
        updatePiece: (piece: string) => {
            update(state => ({ ...state, currentPiece: piece }));
        },
        setStarted: (started: boolean) => {
            update(state => ({ ...state, started }));
        },
        setGameOver: () => {
            update(state => ({
                ...state,
                over: true,
                started: false,
                paused: false
            }));
        }
    };
}

export const gameStore = createGameStore();

// Derived stores for commonly used values
export const displayTime = derived(gameStore, $game => 
    formatTime($game.time.current)
);

export const gameStatus = derived<typeof gameStore, GameStatus>(gameStore, $game => ({
    isActive: $game.started,
    isPaused: $game.paused,
    started: $game.started,
    over: $game.over,
    score: $game.score,
    currentPiece: $game.currentPiece
}));

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

