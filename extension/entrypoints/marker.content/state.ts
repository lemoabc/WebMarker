import type { Annotation } from './core';

export interface ToolConfig {
  color: string;
  style?: string;
}

export interface UserPreferences {
  miniToolbarSlots: [string, string, string];
  toolConfigs: Record<string, ToolConfig>;
  onboardingDone: boolean;
  firstAnnotationDone: boolean;
  locale?: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  miniToolbarSlots: ['highlight', 'textColor', 'underline'],
  toolConfigs: {
    highlight: { color: '#FFF176' },
    textColor: { color: '#E53935' },
    underline: { color: '#E53935', style: 'solid' },
    brushHighlight: { color: '#FFF176', style: 'felt' },
  },
  onboardingDone: false,
  firstAnnotationDone: false,
};

export interface AppState {
  /** Side panel open */
  open: boolean;
  /** Whether annotate mode (side panel) is active */
  annotateMode: boolean;
  tool: string | null;
  color: string | null;
  style: string | null;
  annotations: Annotation[];
  prefs: UserPreferences;
}

export function createState(): AppState {
  return {
    open: false,
    annotateMode: false,
    tool: null,
    color: null,
    style: null,
    annotations: [],
    prefs: { ...DEFAULT_PREFERENCES, toolConfigs: { ...DEFAULT_PREFERENCES.toolConfigs } },
  };
}
