/** 0 vacío · 1 cuerpo · 2 ojo · 3 ojo feliz · 4 sonrisa · 5 ceño · 6 ojo molesto · 7 ceño boca */
export type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ClawdFace = 'neutral' | 'happy' | 'annoyed';

const BODY: Cell[][] = [
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const FEET: Cell[][] = [
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
];

const NEUTRAL_FACE: Cell[][] = [
  [1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1],
  [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1],
];

const HAPPY_FACE: Cell[][] = [
  [1, 1, 3, 3, 1, 1, 1, 1, 3, 3, 1, 1],
  [1, 1, 0, 0, 4, 4, 4, 4, 0, 0, 1, 1],
];

const ANNOYED_FACE: Cell[][] = [
  [1, 5, 6, 6, 1, 1, 1, 1, 6, 6, 5, 1],
  [1, 1, 0, 7, 7, 0, 0, 7, 7, 0, 1, 1],
];

function buildGrid(faceRows: Cell[][]): Cell[][] {
  return [...BODY, ...faceRows, ...FEET];
}

export const FACE_GRIDS: Record<ClawdFace, Cell[][]> = {
  neutral: buildGrid(NEUTRAL_FACE),
  happy: buildGrid(HAPPY_FACE),
  annoyed: buildGrid(ANNOYED_FACE),
};

export const GRID = FACE_GRIDS.neutral;
export const COLS = GRID[0].length;
export const ROWS = GRID.length;
