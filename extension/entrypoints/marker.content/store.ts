import { storage } from 'wxt/utils/storage';
import type { Annotation } from './core';
import type { AppState, UserPreferences } from './state';
import { DEFAULT_PREFERENCES } from './state';

function storageKey(): string {
  return 'local:wm::' + location.href;
}

export async function loadAnnotations(): Promise<Annotation[]> {
  const raw = await storage.getItem<{ v: number; annotations: Annotation[] }>(storageKey());
  if (!raw) return [];
  return Array.isArray(raw.annotations) ? raw.annotations : [];
}

export async function saveAnnotations(state: AppState): Promise<void> {
  await storage.setItem(storageKey(), {
    v: 1,
    url: location.href,
    annotations: state.annotations,
  });
}

export async function clearAnnotations(state: AppState): Promise<void> {
  state.annotations = [];
  await saveAnnotations(state);
}

export async function getAnnotationCount(url: string): Promise<number> {
  const raw = await storage.getItem<{ annotations: Annotation[] }>('local:wm::' + url);
  if (!raw) return 0;
  return Array.isArray(raw.annotations) ? raw.annotations.length : 0;
}

const prefsItem = storage.defineItem<UserPreferences>('local:wm::prefs', {
  defaultValue: DEFAULT_PREFERENCES,
});

export async function loadPreferences(): Promise<UserPreferences> {
  const prefs = await prefsItem.getValue();
  return { ...DEFAULT_PREFERENCES, ...prefs, toolConfigs: { ...DEFAULT_PREFERENCES.toolConfigs, ...prefs?.toolConfigs } };
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await prefsItem.setValue(prefs);
}

export interface FabPosition {
  side: 'left' | 'right';
  y: number;
}

const fabPosItem = storage.defineItem<FabPosition>('local:wm::fabPos', {
  defaultValue: { side: 'right', y: 30 },
});

export async function loadFabPosition(): Promise<FabPosition> {
  return await fabPosItem.getValue();
}

export async function saveFabPosition(pos: FabPosition): Promise<void> {
  await fabPosItem.setValue(pos);
}
