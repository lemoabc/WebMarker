import { storage } from 'wxt/utils/storage';

const versionEl = document.getElementById('version')!;
const countEl = document.getElementById('count')!;
const toggleEl = document.getElementById('toggle') as HTMLInputElement;

const manifest = browser.runtime.getManifest();
versionEl.textContent = 'v' + manifest.version;

const enabledItem = storage.defineItem<boolean>('local:wm::enabled', {
  defaultValue: true,
});

async function init() {
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
  if (tab?.url) {
    const key = 'local:wm::' + tab.url;
    const raw = await storage.getItem<{ annotations: unknown[] }>(key);
    const count = raw?.annotations?.length ?? 0;
    countEl.textContent = String(count);
  } else {
    countEl.textContent = '0';
  }
}

init();
