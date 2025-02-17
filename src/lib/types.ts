export interface TetrisSettings {
    rows: number;
    cols: number;
    speed: number;
    ghostPiece: boolean;
    showNext: boolean;
}

export interface TetrisComponent {
    togglePause: () => void;
    restart: () => void;
}

export interface ScoreRecord {
    score: number;
    timestamp: string;
    duration: string;
    rows: number;
    cols: number;
}

// Game store types
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
    over: boolean;
    score: number;
    currentPiece: string;
}

// Tetris game types
export type Board = number[][];
export type Shape = number[][];
export type Piece = {
    shape: Shape;
    row: number;
    col: number;
    name: string;
};

export interface TetrisGameState {
    started: boolean;
    paused: boolean;
    over: boolean;
    time: GameTime;
    score: number;
    board: Board;
    currentPiece: Piece;
}

export interface GameEventData {
    paused: boolean;
    score: number;
    time: number;
    piece: string;
}

export interface GameOverData {
    score: number;
    duration: number;
}
