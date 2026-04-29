import { storage } from 'wxt/utils/storage';
import type { Annotation } from './core';
import type { AppState } from './state';

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
