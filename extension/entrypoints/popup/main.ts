import { storage } from 'wxt/utils/storage';
import { tp, setPopupLocale, getPopupLocale } from './i18n';

const versionEl = document.getElementById('version')!;
const countEl = document.getElementById('count')!;
const toggleEl = document.getElementById('toggle') as HTMLInputElement;
const exportBtn = document.getElementById('export-btn')!;
const importBtn = document.getElementById('import-btn')!;
const importFile = document.getElementById('import-file') as HTMLInputElement;

const proFreeEl = document.getElementById('pro-free')!;
const proActiveEl = document.getElementById('pro-active')!;
const proEmailEl = document.getElementById('pro-email')!;
const proActivateBtn = document.getElementById('pro-activate-btn')!;
const proInputRow = document.getElementById('pro-input-row')!;
const proEmailInput = document.getElementById('pro-email-input') as HTMLInputElement;
const proKeyInput = document.getElementById('pro-key-input') as HTMLInputElement;
const proSubmitBtn = document.getElementById('pro-submit-btn')!;
const langSelect = document.getElementById('lang-select') as HTMLSelectElement;

const manifest = browser.runtime.getManifest();
versionEl.textContent = 'v' + manifest.version;

const enabledItem = storage.defineItem<boolean>('local:wm::enabled', {
  defaultValue: true,
});

interface LicenseState {
  isPro: boolean;
  licenseKey?: string;
  activatedAt?: number;
  email?: string;
}

const licenseItem = storage.defineItem<LicenseState>('local:wm::license', {
  defaultValue: { isPro: false },
});

interface UserPrefsPartial {
  locale?: string;
}

const prefsItem = storage.defineItem<UserPrefsPartial>('local:wm::prefs', {
  defaultValue: {},
});

interface ExportData {
  version: 2;
  exportedAt: number;
  url: string;
  annotations: unknown[];
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')!;
    if (el instanceof HTMLInputElement) {
      el.placeholder = tp(key);
    } else {
      el.textContent = tp(key);
    }
  });
  proEmailInput.placeholder = tp('popup.emailPlaceholder');
  proKeyInput.placeholder = tp('popup.keyPlaceholder');
}

async function init() {
  const prefs = await prefsItem.getValue();
  const savedLocale = prefs?.locale || (navigator.language.startsWith('zh') ? 'zh' : 'en');
  setPopupLocale(savedLocale);
  langSelect.value = getPopupLocale();
  applyI18n();

  langSelect.addEventListener('change', async () => {
    const loc = langSelect.value;
    setPopupLocale(loc);
    applyI18n();
    const current = await prefsItem.getValue();
    await prefsItem.setValue({ ...current, locale: loc });
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      browser.tabs.reload(activeTab.id);
    }
  });

  const enabled = await enabledItem.getValue();
  toggleEl.checked = enabled;

  toggleEl.addEventListener('change', async () => {
    await enabledItem.setValue(toggleEl.checked);
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      browser.tabs.sendMessage(tab.id, {
        type: 'wm:toggle',
        enabled: toggleEl.checked,
      }).catch(() => {});
    }
  });

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  let currentUrl = tab?.url || '';
  let annotations: unknown[] = [];

  if (currentUrl) {
    const key = 'local:wm::' + currentUrl;
    const raw = await storage.getItem<{ annotations: unknown[] }>(key);
    annotations = raw?.annotations || [];
    countEl.textContent = String(annotations.length);
  } else {
    countEl.textContent = '0';
  }

  exportBtn.addEventListener('click', async () => {
    if (!currentUrl || annotations.length === 0) {
      exportBtn.textContent = tp('popup.noAnnotations');
      setTimeout(() => { exportBtn.textContent = tp('popup.export'); }, 1500);
      return;
    }

    const data: ExportData = {
      version: 2,
      exportedAt: Date.now(),
      url: currentUrl,
      annotations,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const host = new URL(currentUrl).hostname || 'local';
    a.download = `webmarker-${host}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    exportBtn.textContent = tp('popup.exported');
    setTimeout(() => { exportBtn.textContent = tp('popup.export'); }, 1500);
  });

  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;

      if (!data.url || !Array.isArray(data.annotations)) {
        importBtn.textContent = tp('popup.formatError');
        setTimeout(() => { importBtn.textContent = tp('popup.import'); }, 2000);
        return;
      }

      const key = 'local:wm::' + data.url;
      const existing = await storage.getItem<{ v: number; annotations: unknown[] }>(key);
      const merged = existing?.annotations || [];
      const existingIds = new Set(merged.map((a: any) => a.id));
      let added = 0;

      for (const ann of data.annotations) {
        if (!(ann as any).id || existingIds.has((ann as any).id)) continue;
        merged.push(ann);
        existingIds.add((ann as any).id);
        added++;
      }

      await storage.setItem(key, { v: 1, url: data.url, annotations: merged });

      importBtn.textContent = tp('popup.addedItems', { n: added });
      setTimeout(() => { importBtn.textContent = tp('popup.import'); }, 2000);

      if (data.url === currentUrl) {
        countEl.textContent = String(merged.length);
        const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          browser.tabs.reload(activeTab.id);
        }
      }
    } catch {
      importBtn.textContent = tp('popup.importFailed');
      setTimeout(() => { importBtn.textContent = tp('popup.import'); }, 2000);
    }

    importFile.value = '';
  });

  const license = await licenseItem.getValue();
  if (license.isPro) {
    proFreeEl.style.display = 'none';
    proActiveEl.style.display = 'flex';
    proEmailEl.textContent = license.email || '';
  } else {
    proFreeEl.style.display = 'flex';
    proActiveEl.style.display = 'none';
  }

  proActivateBtn.addEventListener('click', () => {
    proInputRow.style.display = proInputRow.style.display === 'none' ? 'flex' : 'none';
  });

  proSubmitBtn.addEventListener('click', async () => {
    const email = proEmailInput.value.trim();
    const key = proKeyInput.value.trim();
    if (!email || !key) {
      proSubmitBtn.textContent = tp('popup.fillComplete');
      setTimeout(() => { proSubmitBtn.textContent = tp('popup.verify'); }, 1500);
      return;
    }

    proSubmitBtn.textContent = tp('popup.verifying');

    const state: LicenseState = {
      isPro: true,
      licenseKey: key,
      activatedAt: Date.now(),
      email,
    };
    await licenseItem.setValue(state);

    proFreeEl.style.display = 'none';
    proInputRow.style.display = 'none';
    proActiveEl.style.display = 'flex';
    proEmailEl.textContent = email;

    proSubmitBtn.textContent = tp('popup.verify');
  });

  if (!license.isPro) {
    exportBtn.title = tp('popup.exportPro');
    importBtn.title = tp('popup.importPro');
  }
}

init();
