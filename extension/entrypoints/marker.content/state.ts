import type { Annotation } from './core';

export interface AppState {
  open: boolean;
  tool: string | null;
  color: string | null;
  annotations: Annotation[];
}

export function createState(): AppState {
  return {
    open: false,
    tool: null,
    color: null,
    annotations: [],
  };
}
