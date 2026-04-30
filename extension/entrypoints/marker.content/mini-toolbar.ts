import { getTool } from './tools';
import type { AppState, ToolConfig } from './state';
import { t } from './i18n';

const MINI_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :host{all:initial}

  .wm-mini{
    position:fixed;
    display:flex;align-items:center;gap:2px;
    background:rgba(28,28,30,.92);
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    border-radius:10px;
    padding:4px;
    box-shadow:0 4px 16px rgba(0,0,0,.4);
    z-index:2147483647;
    pointer-events:auto;
    opacity:0;transform:translateY(6px);
    transition:opacity .15s ease,transform .15s ease;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    cursor:default;
  }
  .wm-mini.visible{
    opacity:1;transform:translateY(0);
  }
  .wm-mini.above{
    transform:translateY(-6px);
  }
  .wm-mini.above.visible{
    transform:translateY(0);
  }

  .wm-mini-btn{
    position:relative;
    width:30px;height:30px;border-radius:8px;border:none;
    background:rgba(255,255,255,.07);color:rgba(255,255,255,.75);
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    padding:0;transition:all .12s;
  }
  .wm-mini-btn:hover{background:rgba(255,255,255,.16);color:#fff}
  .wm-mini-btn:active{transform:scale(.9)}
  .wm-mini-btn svg{width:16px;height:16px}

  .wm-mini-badge{
    position:absolute;bottom:1px;right:1px;
    width:8px;height:8px;border-radius:50%;
    border:1px solid rgba(28,28,30,.92);
    pointer-events:none;
  }

  .wm-mini-sep{
    width:1px;height:20px;background:rgba(255,255,255,.12);margin:0 2px;
    flex-shrink:0;
  }

  .wm-mini-expand{
    width:26px;height:30px;border-radius:8px;border:none;
    background:rgba(255,255,255,.04);color:rgba(255,255,255,.45);
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    padding:0;transition:all .12s;
  }
  .wm-mini-expand:hover{background:rgba(255,255,255,.12);color:#fff}
  .wm-mini-expand svg{width:12px;height:12px}

  .wm-mini-hint{
    position:absolute;top:100%;left:50%;transform:translateX(-50%);
    margin-top:4px;
    font-size:11px;color:rgba(255,255,255,.55);
    background:rgba(28,28,30,.85);
    border-radius:6px;padding:2px 8px;
    white-space:nowrap;
    pointer-events:none;
  }
`;

const EXPAND_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></svg>';

export interface MiniToolbarRefs {
  show: (rect: DOMRect) => void;
  hide: () => void;
  destroy: () => void;
  isVisible: () => boolean;
}

export function createMiniToolbar(
  state: AppState,
  onAnnotate: (toolName: string, config: ToolConfig) => void,
  onExpand: () => void,
): MiniToolbarRefs {
  const host = document.createElement('div');
  host.id = 'wm-mini-root';
  host.style.cssText = 'all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = MINI_CSS;
  shadow.appendChild(style);

  const bar = document.createElement('div');
  bar.className = 'wm-mini';
  shadow.appendChild(bar);

  let visible = false;
  let showHintOnce = !state.prefs.firstAnnotationDone;

  function render() {
    bar.innerHTML = '';
    const slots = state.prefs.miniToolbarSlots;

    for (const toolName of slots) {
      const tool = getTool(toolName);
      if (!tool || !tool.isAnnotator) continue;

      const btn = document.createElement('button');
      btn.className = 'wm-mini-btn';
      btn.innerHTML = tool.icon;
      btn.title = t(tool.label as any);

      const config = state.prefs.toolConfigs[toolName];
      const color = config?.color || tool.defaultColor;

      const badge = document.createElement('span');
      badge.className = 'wm-mini-badge';
      badge.style.background = color;
      btn.appendChild(badge);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cfg: ToolConfig = {
          color: config?.color || tool.defaultColor,
          style: config?.style || tool.defaultStyle,
        };
        onAnnotate(toolName, cfg);
        hide();
      });

      bar.appendChild(btn);
    }

    const sep = document.createElement('div');
    sep.className = 'wm-mini-sep';
    bar.appendChild(sep);

    const expandBtn = document.createElement('button');
    expandBtn.className = 'wm-mini-expand';
    expandBtn.innerHTML = EXPAND_ICON;
    expandBtn.title = t('ui.expandPanel');
    expandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hide();
      onExpand();
    });
    bar.appendChild(expandBtn);

    if (showHintOnce) {
      const hint = document.createElement('div');
      hint.className = 'wm-mini-hint';
      hint.textContent = t('ui.clickToAnnotate');
      bar.appendChild(hint);
      showHintOnce = false;
    }
  }

  function show(rect: DOMRect) {
    if (state.annotateMode) return;

    render();

    const barW = 160;
    const barH = 42;
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = rect.right + gap;
    let y = rect.bottom + gap;
    let above = false;

    if (x + barW > vw) {
      x = rect.left - barW - gap;
      if (x < 0) x = Math.max(4, rect.left);
    }

    if (y + barH > vh) {
      y = rect.top - barH - gap;
      above = true;
    }

    x = Math.max(4, Math.min(x, vw - barW - 4));
    y = Math.max(4, Math.min(y, vh - barH - 4));

    bar.style.left = x + 'px';
    bar.style.top = y + 'px';
    bar.classList.toggle('above', above);

    requestAnimationFrame(() => {
      bar.classList.add('visible');
    });
    visible = true;
  }

  function hide() {
    bar.classList.remove('visible');
    visible = false;
  }

  function destroy() {
    host.remove();
  }

  return {
    show,
    hide,
    destroy,
    isVisible: () => visible,
  };
}
