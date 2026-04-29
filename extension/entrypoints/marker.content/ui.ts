import { ICONS, HIGHLIGHT_COLORS, TEXT_COLORS, HL_CLASS, unwrapAll } from './core';
import { updateCursor } from './cursors';
import type { AppState } from './state';

const UI_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :host{all:initial}
  .wm-wrap{
    position:fixed;top:30%;right:12px;
    display:flex;flex-direction:column;align-items:center;gap:8px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    z-index:2147483647;pointer-events:auto;cursor:default;
  }
  .wm-btn{
    width:40px;height:40px;border-radius:50%;border:none;
    background:rgba(30,30,30,.85);color:#fff;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 10px rgba(0,0,0,.35);
    transition:background .2s,box-shadow .2s,transform .15s;
    padding:0;
  }
  .wm-btn:hover{background:rgba(50,50,50,.95);box-shadow:0 3px 14px rgba(0,0,0,.45)}
  .wm-btn:active{transform:scale(.92)}
  .wm-btn svg{width:20px;height:20px}
  .wm-panel{
    width:52px;
    background:rgba(28,28,30,.92);
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    border-radius:14px;
    padding:0;
    display:flex;flex-direction:column;align-items:center;
    box-shadow:0 4px 20px rgba(0,0,0,.35);
    overflow:hidden;
    max-height:0;opacity:0;
    transition:max-height .25s ease,opacity .2s ease,padding .25s ease;
    pointer-events:none;
  }
  .wm-panel.open{
    max-height:520px;opacity:1;padding:10px 0;pointer-events:auto;
  }
  .wm-tool{
    width:38px;height:38px;border-radius:10px;border:2px solid transparent;
    background:rgba(255,255,255,.07);color:rgba(255,255,255,.75);
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    padding:0;transition:all .15s;margin:3px 0;
  }
  .wm-tool:hover{background:rgba(255,255,255,.14);color:#fff}
  .wm-tool.active{border-color:#64B5F6;background:rgba(100,181,246,.18);color:#fff}
  .wm-tool svg{width:18px;height:18px}
  .wm-sep{width:34px;height:1px;background:rgba(255,255,255,.12);margin:8px 0}
  .wm-colors{
    display:flex;flex-wrap:wrap;gap:6px;justify-content:center;
    overflow:hidden;max-height:0;transition:max-height .25s,padding .25s;padding:0 4px;
  }
  .wm-colors.show{max-height:90px;padding:6px 4px}
  .wm-dot{
    width:18px;height:18px;border-radius:50%;border:2px solid transparent;
    cursor:pointer;transition:transform .12s,border-color .12s;padding:0;
    outline:none;flex-shrink:0;
  }
  .wm-dot:hover{transform:scale(1.25)}
  .wm-dot.active{border-color:#fff;box-shadow:0 0 6px rgba(255,255,255,.5)}
  .wm-label{
    font-size:9px;color:rgba(255,255,255,.45);text-align:center;
    margin-top:-2px;margin-bottom:2px;line-height:1;user-select:none;
  }
`;

function el(tag: string, props?: Record<string, any>): HTMLElement {
  const e = document.createElement(tag);
  if (props) Object.assign(e, props);
  return e;
}

function toolBtn(name: string, icon: string, label: string) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;';
  const btn = el('button', { className: 'wm-tool' }) as HTMLButtonElement;
  btn.dataset.tool = name;
  btn.innerHTML = icon;
  btn.title = label;
  wrap.appendChild(btn);
  const lbl = el('div', { className: 'wm-label' });
  lbl.textContent = label;
  wrap.appendChild(lbl);
  return { wrap, btn };
}

function colorRow(colors: string[], group: string): HTMLDivElement {
  const row = el('div', { className: 'wm-colors' }) as HTMLDivElement;
  row.dataset.group = group;
  colors.forEach(c => {
    const dot = el('button', { className: 'wm-dot' }) as HTMLButtonElement;
    dot.style.background = c;
    dot.dataset.color = c;
    dot.title = c;
    row.appendChild(dot);
  });
  return row;
}

export interface UIRefs {
  host: HTMLDivElement;
  deactivate: () => void;
}

export function createUI(state: AppState, storeClear: () => Promise<void>): UIRefs {
  const host = document.createElement('div');
  host.id = 'wm-root';
  host.style.cssText = 'all:initial;position:fixed;top:0;right:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = UI_CSS;
  shadow.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'wm-wrap';
  shadow.appendChild(wrap);

  const toggleBtn = el('button', { className: 'wm-btn', title: 'Web Marker' });
  toggleBtn.innerHTML = ICONS.pen;
  wrap.appendChild(toggleBtn);

  const panel = document.createElement('div');
  panel.className = 'wm-panel';
  wrap.appendChild(panel);

  const hlBtn = toolBtn('highlight', ICONS.highlight, '高亮');
  const hlColors = colorRow(HIGHLIGHT_COLORS, 'highlight');
  const tcBtn = toolBtn('textColor', ICONS.textColor, '字色');
  const tcColors = colorRow(TEXT_COLORS, 'textColor');
  const sep1 = el('div', { className: 'wm-sep' });
  const eraserBtn = toolBtn('eraser', ICONS.eraser, '擦除');
  const sep2 = el('div', { className: 'wm-sep' });
  const clearBtn = toolBtn('clearAll', ICONS.trash, '清除');

  [hlBtn.wrap, hlColors, tcBtn.wrap, tcColors, sep1, eraserBtn.wrap, sep2, clearBtn.wrap]
    .forEach(n => panel.appendChild(n));

  toggleBtn.addEventListener('click', () => {
    state.open = !state.open;
    panel.classList.toggle('open', state.open);
    toggleBtn.innerHTML = state.open ? ICONS.close : ICONS.pen;
  });

  const toolBtns: Record<string, HTMLButtonElement> = {
    highlight: hlBtn.btn,
    textColor: tcBtn.btn,
    eraser: eraserBtn.btn,
  };
  const colorRows: Record<string, HTMLDivElement> = {
    highlight: hlColors,
    textColor: tcColors,
  };

  function deactivateTool() {
    state.tool = null;
    state.color = null;
    document.body.classList.remove('wm-eraser');
    Object.values(toolBtns).forEach(b => b.classList.remove('active'));
    Object.values(colorRows).forEach(row => {
      row.classList.remove('show');
      row.querySelectorAll('.wm-dot').forEach(d => d.classList.remove('active'));
    });
    updateCursor(null, null);
  }

  function selectTool(name: string) {
    if (name === 'clearAll') {
      if (state.annotations.length === 0) return;
      unwrapAll();
      storeClear();
      return;
    }
    if (state.tool === name) { deactivateTool(); return; }
    state.tool = name;
    state.color = null;
    document.body.classList.toggle('wm-eraser', name === 'eraser');
    Object.entries(toolBtns).forEach(([k, b]) => b.classList.toggle('active', k === name));
    Object.entries(colorRows).forEach(([k, row]) => {
      row.classList.toggle('show', k === name);
      row.querySelectorAll('.wm-dot').forEach(d => d.classList.remove('active'));
    });
    if (colorRows[name]) {
      const first = colorRows[name].querySelector('.wm-dot') as HTMLElement | null;
      if (first) { first.classList.add('active'); state.color = first.dataset.color!; }
    }
    updateCursor(state.tool, state.color);
  }

  Object.keys(toolBtns).forEach(name => {
    toolBtns[name].addEventListener('click', () => selectTool(name));
  });
  clearBtn.btn.addEventListener('click', () => selectTool('clearAll'));

  shadow.querySelectorAll('.wm-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const row = (dot as HTMLElement).parentElement!;
      row.querySelectorAll('.wm-dot').forEach(d => d.classList.remove('active'));
      (dot as HTMLElement).classList.add('active');
      state.color = (dot as HTMLElement).dataset.color!;
      updateCursor(state.tool, state.color);
    });
  });

  return { host, deactivate: deactivateTool };
}
