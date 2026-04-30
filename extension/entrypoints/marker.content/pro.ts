import { storage } from 'wxt/utils/storage';

export interface LicenseState {
  isPro: boolean;
  licenseKey?: string;
  activatedAt?: number;
  email?: string;
}

const licenseItem = storage.defineItem<LicenseState>('local:wm::license', {
  defaultValue: { isPro: false },
});

let _cached: LicenseState | null = null;

export async function getProStatus(): Promise<LicenseState> {
  if (_cached) return _cached;
  _cached = await licenseItem.getValue();
  return _cached;
}

export function isProCached(): boolean {
  return _cached?.isPro ?? false;
}

export async function activatePro(key: string, email: string): Promise<boolean> {
  const state: LicenseState = {
    isPro: true,
    licenseKey: key,
    activatedAt: Date.now(),
    email,
  };
  await licenseItem.setValue(state);
  _cached = state;
  return true;
}

export async function deactivatePro(): Promise<void> {
  const state: LicenseState = { isPro: false };
  await licenseItem.setValue(state);
  _cached = state;
}

export interface ProGating {
  underlineStyles: string[];
  brushTextures: string[];
  customColors: boolean;
  miniToolbarCustomSlots: boolean;
  exportImport: boolean;
}

export const FREE_GATING: ProGating = {
  underlineStyles: ['solid', 'dashed', 'wavy'],
  brushTextures: ['felt'],
  customColors: false,
  miniToolbarCustomSlots: false,
  exportImport: false,
};

export const PRO_GATING: ProGating = {
  underlineStyles: ['solid', 'dashed', 'wavy', 'double', 'sketch', 'marker'],
  brushTextures: ['felt', 'watercolor', 'crayon', 'neon'],
  customColors: true,
  miniToolbarCustomSlots: true,
  exportImport: true,
};

export function getGating(isPro: boolean): ProGating {
  return isPro ? PRO_GATING : FREE_GATING;
}

export function isStyleLocked(toolName: string, styleName: string, isPro: boolean): boolean {
  if (isPro) return false;
  const gating = FREE_GATING;
  if (toolName === 'underline') {
    return !gating.underlineStyles.includes(styleName);
  }
  if (toolName === 'brushHighlight') {
    return !gating.brushTextures.includes(styleName);
  }
  return false;
}
