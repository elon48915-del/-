export type TreeMorphState = 'SCATTERED' | 'TREE_SHAPE' | 'FOCUS';

export interface DualPosition {
  scatter: [number, number, number];
  tree: [number, number, number];
}

export interface OrnamentData extends DualPosition {
  scale: number;
  color: string;
  rotationSpeed: number;
}