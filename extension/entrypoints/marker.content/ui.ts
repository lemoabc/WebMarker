import { ICONS, HL_CLASS, unwrapAll } from './core';
import { updateCursorCSS } from './cursors';
import { getAllTools, getTool } from './tools';
import type { ToolDefinition } from './tools';
import type { AppState } from './state';
import { createColorPicker } from './color-picker';
import { isProCached, isStyleLocked } from './pro';
import { loadFabPosition, saveFabPosition } from './store';
import type { FabPosition } from './store';
import { t } from './i18n';
import type { LocaleKey } from './i18n';

const UI_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :host{all:initial}

  .wm-wrap{
    position:fixed;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    z-index:2147483647;pointer-events:auto;cursor:default;
    display:flex;flex-direction:column;align-items:flex-end;gap:8px;
    transition:left .2s ease,right .2s ease;
  }
  .wm-wrap.dragging{transition:none}
  .wm-wrap.left{align-items:flex-start}
  .wm-wrap.left .wm-panel{flex-direction:row-reverse}

  /* Toggle FAB */
  .wm-btn{
    width:40px;height:40px;border-radius:50%;border:none;
    background:rgba(30,30,30,.85);color:#fff;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 10px rgba(0,0,0,.35);
    transition:background .2s,box-shadow .2s,transform .15s;
    padding:0;flex-shrink:0;
  }
  .wm-btn:hover{background:rgba(50,50,50,.95);box-shadow:0 3px 14px rgba(0,0,0,.45)}
  .wm-btn:active{transform:scale(.92)}
  .wm-btn svg{width:20px;height:20px}

  /* Panel container: horizontal layout, sub-panel left + tool column right */
  .wm-panel{
    display:flex;flex-direction:row;align-items:stretch;
    background:rgba(28,28,30,.92);
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    border-radius:14px;
    box-shadow:0 4px 20px rgba(0,0,0,.35);
    overflow:hidden;
    max-height:0;opacity:0;
    transition:max-height .25s ease,opacity .2s ease;
    pointer-events:none;
  }
  .wm-panel.open{
    max-height:600px;opacity:1;pointer-events:auto;
  }

  /* Panel expand direction: below FAB by default, above when near bottom */
  .wm-wrap.expand-up .wm-panel{
    position:absolute;bottom:calc(100% + 8px);right:0;
  }
  .wm-wrap.expand-up.left .wm-panel{
    right:auto;left:0;
  }

  /* Sub-panel area (left side, hidden by default) */
  .wm-sub-area{
    width:0;overflow:hidden;opacity:0;
    transition:width .2s ease,opacity .15s ease;
    display:flex;flex-direction:column;
    border-right:1px solid transparent;
  }
  .wm-sub-area.expanded{
    width:160px;opacity:1;
    border-right-color:rgba(255,255,255,.08);
  }

  .wm-sub-content{
    display:none;
    flex-direction:column;
    padding:10px 8px;
    gap:6px;
  }
  .wm-sub-content.active{
    display:flex;
  }

  .wm-sub-label{
    font-size:9px;color:rgba(255,255,255,.45);
    user-select:none;margin-bottom:2px;
  }

  .wm-colors{
    display:flex;flex-wrap:wrap;gap:5px;
  }
  .wm-dot{
    width:18px;height:18px;border-radius:50%;border:2px solid transparent;
    cursor:pointer;transition:transform .12s,border-color .12s;padding:0;
    outline:none;flex-shrink:0;
  }
  .wm-dot:hover{transform:scale(1.25)}
  .wm-dot.active{border-color:#fff;box-shadow:0 0 6px rgba(255,255,255,.5)}
  .wm-dot-plus{
    background:rgba(255,255,255,.1) !important;
    color:rgba(255,255,255,.6);font-size:14px;font-weight:bold;
    line-height:18px;text-align:center;
    border-color:rgba(255,255,255,.15);border-style:dashed;
  }
  .wm-dot-plus:hover{background:rgba(255,255,255,.2) !important;color:#fff}
  .wm-dot-plus.active{border-color:#64B5F6;border-style:solid}
  .wm-picker-wrap{margin-top:4px}

  /* Pro lock indicator */
  .wm-locked{position:relative;opacity:0.5}
  .wm-locked::after{
    content:'🔒';position:absolute;top:-4px;right:-6px;
    font-size:8px;line-height:1;pointer-events:none;
  }
  .wm-locked:hover{opacity:0.7}

  /* Style selector row */
  .wm-styles{
    display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;
  }
  .wm-style-btn{
    height:26px;min-width:26px;padding:0 6px;border-radius:6px;
    border:1.5px solid rgba(255,255,255,.12);
    background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);
    cursor:pointer;font-size:12px;line-height:26px;text-align:center;
    transition:all .12s;user-select:none;
  }
  .wm-style-btn:hover{background:rgba(255,255,255,.14);color:#fff}
  .wm-style-btn.active{
    border-color:#64B5F6;background:rgba(100,181,246,.18);color:#fff;
  }

  /* Tool column (right side) */
  .wm-tools{
    width:52px;flex-shrink:0;
    display:flex;flex-direction:column;align-items:center;
    padding:10px 0;
  }

  .wm-tool-wrap{
    display:flex;flex-direction:column;align-items:center;position:relative;
  }
  .wm-tool{
    width:38px;height:38px;border-radius:10px;border:2px solid transparent;
    background:rgba(255,255,255,.07);color:rgba(255,255,255,.75);
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    padding:0;transition:all .15s;margin:3px 0;
    user-select:none;
  }
  .wm-tool:hover{background:rgba(255,255,255,.14);color:#fff}
  .wm-tool.active{border-color:#64B5F6;background:rgba(100,181,246,.18);color:#fff}
  .wm-tool svg{width:18px;height:18px}

  .wm-badge{
    position:absolute;bottom:2px;right:-2px;
    width:10px;height:10px;border-radius:50%;
    border:1.5px solid rgba(28,28,30,.92);
    pointer-events:none;
  }

  .wm-label{
    font-size:9px;color:rgba(255,255,255,.45);text-align:center;
    margin-top:-2px;margin-bottom:2px;line-height:1;user-select:none;
  }
  .wm-sep{width:34px;height:1px;background:rgba(255,255,255,.12);margin:8px 0}
`;

function el(tag: string, props?: Record<string, any>): HTMLElement {
  const e = document.createElement(tag);
  if (props) Object.assign(e, props);
  return e;
}

export interface UIRefs {
  host: HTMLDivElement;
  deactivate: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

export function createUI(
  state: AppState,
  storeClear: () => Promise<void>,
  onToolChange?: (toolName: string | null, color: string | null) => void,
  onImmediateAnnotate?: (toolName: string, color: string, style?: string) => void,
): UIRefs {
  const host = document.createElement('div');
  host.id = 'wm-root';
  host.style.cssText = 'all:initial;position:fixed;top:0;right:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = UI_CSS;
  shadow.appendChild(style);

  const wrap = el('div', { className: 'wm-wrap' });
  shadow.appendChild(wrap);

  // --- FAB position & drag ---
  let fabSide: 'left' | 'right' = 'right';
  let fabY = 30; // percentage of viewport height

  function applyFabPosition(animate: boolean) {
    if (!animate) wrap.classList.add('dragging');
    else wrap.classList.remove('dragging');
    wrap.style.top = fabY + '%';
    if (fabSide === 'right') {
      wrap.style.right = '12px';
      wrap.style.left = 'auto';
      wrap.classList.remove('left');
    } else {
      wrap.style.left = '12px';
      wrap.style.right = 'auto';
      wrap.classList.add('left');
    }
  }

  loadFabPosition().then((pos: FabPosition) => {
    fabSide = pos.side;
    fabY = pos.y;
    applyFabPosition(false);
    requestAnimationFrame(() => wrap.classList.remove('dragging'));
  });
  applyFabPosition(false);

  let dragState: { startX: number; startY: number; moved: boolean } | null = null;

  function onFabPointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('.wm-panel')) return;
    dragState = { startX: e.clientX, startY: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onFabPointerMove(e: PointerEvent) {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    dragState.moved = true;
    if (state.open) closePanel();
    wrap.classList.add('dragging');

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const rawY = Math.max(20, Math.min(e.clientY, vh - 20));
    fabY = (rawY / vh) * 100;
    wrap.style.top = fabY + '%';

    if (e.clientX < vw / 2) {
      wrap.style.left = Math.max(0, e.clientX - 20) + 'px';
      wrap.style.right = 'auto';
    } else {
      wrap.style.right = Math.max(0, vw - e.clientX - 20) + 'px';
      wrap.style.left = 'auto';
    }
  }

  function onFabPointerUp(e: PointerEvent) {
    if (!dragState) return;
    const wasDrag = dragState.moved;
    dragState = null;

    if (!wasDrag) return;

    const vw = window.innerWidth;
    fabSide = e.clientX < vw / 2 ? 'left' : 'right';
    fabY = Math.max(5, Math.min(90, fabY));
    applyFabPosition(true);
    saveFabPosition({ side: fabSide, y: fabY });
  }

  const toggleBtn = el('button', { className: 'wm-btn', title: 'Web Marker' }) as HTMLButtonElement;
  toggleBtn.innerHTML = ICONS.pen;
  wrap.appendChild(toggleBtn);

  const panel = el('div', { className: 'wm-panel' });
  wrap.appendChild(panel);

  // Sub-panel area (left side of main panel)
  const subArea = el('div', { className: 'wm-sub-area' });
  panel.appendChild(subArea);

  // Tool column (right side of main panel)
  const toolCol = el('div', { className: 'wm-tools' });
  panel.appendChild(toolCol);

  const tools = getAllTools();
  const toolBtns: Record<string, HTMLButtonElement> = {};
  const toolBadges: Record<string, HTMLElement> = {};
  const subContents: Record<string, HTMLElement> = {};
  let openSubName: string | null = null;

  // Build sub-panel content for each annotator tool
  for (const tool of tools) {
    if (tool.isAnnotator && (tool.colors.length > 0 || (tool.styles && tool.styles.length > 0))) {
      const content = buildSubContent(
        tool,
        state,
        (color: string) => {
          if (toolBadges[tool.name]) toolBadges[tool.name].style.background = color;
          state.color = color;
          if (!state.prefs.toolConfigs[tool.name]) {
            state.prefs.toolConfigs[tool.name] = { color };
          } else {
            state.prefs.toolConfigs[tool.name].color = color;
          }
          applyCursor(state);
          onToolChange?.(state.tool, state.color);
        },
        (style: string) => {
          state.style = style;
          if (!state.prefs.toolConfigs[tool.name]) {
            state.prefs.toolConfigs[tool.name] = { color: tool.defaultColor, style };
          } else {
            state.prefs.toolConfigs[tool.name].style = style;
          }
          onToolChange?.(state.tool, state.color);
        },
      );
      subArea.appendChild(content);
      subContents[tool.name] = content;
    }
  }

  // Build tool buttons in the right column
  const annotatorTools = tools.filter(t => t.isAnnotator);
  const utilityTools = tools.filter(t => !t.isAnnotator);

  for (const tool of annotatorTools) {
    const { wrap: tw, btn } = buildToolButton(tool, state, toolBadges);
    toolCol.appendChild(tw);
    toolBtns[tool.name] = btn;
  }

  if (annotatorTools.length > 0 && utilityTools.length > 0) {
    toolCol.appendChild(el('div', { className: 'wm-sep' }));
  }

  for (const tool of utilityTools) {
    const { wrap: tw, btn } = buildToolButton(tool, state, toolBadges);
    toolCol.appendChild(tw);
    toolBtns[tool.name] = btn;
  }

  toolCol.appendChild(el('div', { className: 'wm-sep' }));

  const clearWrap = el('div', { className: 'wm-tool-wrap' });
  const clearBtn = el('button', { className: 'wm-tool' }) as HTMLButtonElement;
  clearBtn.innerHTML = ICONS.trash;
  clearBtn.title = t('ui.clearAllTitle');
  clearWrap.appendChild(clearBtn);
  const clearLbl = el('div', { className: 'wm-label' });
  clearLbl.textContent = t('tool.clearAll');
  clearWrap.appendChild(clearLbl);
  toolCol.appendChild(clearWrap);

  // === Panel open/close ===

  function openPanelFn() {
    state.open = true;
    state.annotateMode = true;
    panel.classList.add('open');
    toggleBtn.innerHTML = ICONS.close;

    const fabRect = toggleBtn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - fabRect.bottom;
    wrap.classList.toggle('expand-up', spaceBelow < 350);
  }

  function closePanel() {
    state.open = false;
    state.annotateMode = false;
    panel.classList.remove('open');
    toggleBtn.innerHTML = ICONS.pen;
    deactivateTool();
    closeAllSubs();
  }

  toggleBtn.addEventListener('pointerdown', onFabPointerDown);
  toggleBtn.addEventListener('pointermove', onFabPointerMove);
  toggleBtn.addEventListener('pointerup', (e: PointerEvent) => {
    const wasDrag = dragState?.moved;
    onFabPointerUp(e);
    if (!wasDrag) {
      if (state.open) closePanel();
      else openPanelFn();
    }
  });
  toggleBtn.style.touchAction = 'none';

  // === Sub-panel management ===

  function closeAllSubs() {
    openSubName = null;
    subArea.classList.remove('expanded');
    Object.values(subContents).forEach(sc => sc.classList.remove('active'));
  }

  function showSub(name: string) {
    if (openSubName === name) {
      closeAllSubs();
      return;
    }
    closeAllSubs();
    if (subContents[name]) {
      subContents[name].classList.add('active');
      subArea.classList.add('expanded');
      openSubName = name;
      syncSubSelection(name);
    }
  }

  function syncSubSelection(name: string) {
    const content = subContents[name];
    if (!content) return;
    content.querySelectorAll('.wm-dot').forEach(d => {
      d.classList.toggle('active', (d as HTMLElement).dataset.color === state.color);
    });
  }

  // === Tool activation ===

  function deactivateTool() {
    state.tool = null;
    state.color = null;
    state.style = null;
    document.body.classList.remove('wm-eraser');
    Object.values(toolBtns).forEach(b => b.classList.remove('active'));
    applyCursor(state);
    closeAllSubs();
    onToolChange?.(null, null);
  }

  function activateTool(name: string, withSub: boolean) {
    const tool = getTool(name);
    if (!tool) return;

    if (state.tool === name && !withSub) {
      deactivateTool();
      return;
    }

    state.tool = name;
    document.body.classList.toggle('wm-eraser', name === 'eraser');

    const savedConfig = state.prefs.toolConfigs[name];
    if (tool.isAnnotator && tool.colors.length > 0) {
      state.color = savedConfig?.color || tool.defaultColor;
      state.style = savedConfig?.style || tool.defaultStyle || null;
    } else {
      state.color = null;
      state.style = null;
    }

    Object.entries(toolBtns).forEach(([k, b]) => b.classList.toggle('active', k === name));

    if (withSub && subContents[name]) {
      showSub(name);
    } else {
      closeAllSubs();
    }

    applyCursor(state);
    onToolChange?.(state.tool, state.color);
  }

  // Single-click: activate + open sub-panel for configuration (no immediate annotate)
  Object.keys(toolBtns).forEach(name => {
    toolBtns[name].addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      activateTool(name, true);
    });

    // Right-click: quick activate with last config + immediate annotate on existing selection
    toolBtns[name].addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      activateTool(name, false);
      const tool = getTool(name);
      if (tool?.isAnnotator && state.color && onImmediateAnnotate) {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.rangeCount > 0 && sel.toString().trim()) {
          onImmediateAnnotate(name, state.color, state.style || undefined);
        }
      }
    });
  });

  clearBtn.addEventListener('click', () => {
    if (state.annotations.length === 0) return;
    unwrapAll();
    storeClear();
  });

  return { host, deactivate: deactivateTool, openPanel: openPanelFn, closePanel };
}

function buildToolButton(
  tool: ToolDefinition,
  state: AppState,
  badgesOut: Record<string, HTMLElement>,
): { wrap: HTMLElement; btn: HTMLButtonElement } {
  const wrap = el('div', { className: 'wm-tool-wrap' });
  const btn = el('button', { className: 'wm-tool' }) as HTMLButtonElement;
  btn.dataset.tool = tool.name;
  btn.innerHTML = tool.icon;
  btn.title = t(tool.label as LocaleKey);
  wrap.appendChild(btn);

  if (tool.isAnnotator && tool.colors.length > 0) {
    const badge = el('span', { className: 'wm-badge' });
    const savedConfig = state.prefs.toolConfigs[tool.name];
    badge.style.background = savedConfig?.color || tool.defaultColor;
    wrap.appendChild(badge);
    badgesOut[tool.name] = badge;
  }

  const lbl = el('div', { className: 'wm-label' });
  lbl.textContent = t(tool.label as LocaleKey);
  wrap.appendChild(lbl);

  return { wrap, btn };
}

function buildSubContent(
  tool: ToolDefinition,
  state: AppState,
  onColorSelect: (color: string) => void,
  onStyleSelect?: (style: string) => void,
): HTMLElement {
  const content = el('div', { className: 'wm-sub-content' });
  content.dataset.tool = tool.name;

  if (tool.styles && tool.styles.length > 0) {
    const styleLabel = el('div', { className: 'wm-sub-label' });
    styleLabel.textContent = t('ui.style');
    content.appendChild(styleLabel);

    const styleRow = el('div', { className: 'wm-styles' });
    const savedConfig = state.prefs.toolConfigs[tool.name];
    const activeStyle = savedConfig?.style || tool.defaultStyle || tool.styles[0].name;

    tool.styles.forEach(s => {
      const btn = el('button', { className: 'wm-style-btn' }) as HTMLButtonElement;
      btn.dataset.style = s.name;
      btn.title = t(s.label as LocaleKey);
      btn.textContent = s.icon || t(s.label as LocaleKey).charAt(0);
      if (s.name === activeStyle) btn.classList.add('active');

      const locked = isStyleLocked(tool.name, s.name, isProCached());
      if (locked) btn.classList.add('wm-locked');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (locked) return;
        styleRow.querySelectorAll('.wm-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onStyleSelect?.(s.name);
      });

      styleRow.appendChild(btn);
    });
    content.appendChild(styleRow);
  }

  const colorLabel = el('div', { className: 'wm-sub-label' });
  colorLabel.textContent = t('ui.color');
  content.appendChild(colorLabel);

  const colorRow = el('div', { className: 'wm-colors' });
  const savedConfig = state.prefs.toolConfigs[tool.name];
  const activeColor = savedConfig?.color || tool.defaultColor;

  tool.colors.forEach(c => {
    const dot = el('button', { className: 'wm-dot' }) as HTMLButtonElement;
    dot.style.background = c;
    dot.dataset.color = c;
    dot.title = c;
    if (c === activeColor) dot.classList.add('active');

    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      colorRow.querySelectorAll('.wm-dot').forEach(d => d.classList.remove('active'));
      pickerToggle.classList.remove('active');
      dot.classList.add('active');
      onColorSelect(c);
    });

    colorRow.appendChild(dot);
  });

  // "+" button for custom color picker (Pro only)
  const pickerToggle = el('button', { className: 'wm-dot wm-dot-plus' }) as HTMLButtonElement;
  pickerToggle.textContent = '+';
  pickerToggle.title = isProCached() ? t('ui.customColor') : t('ui.customColorPro');
  if (!isProCached()) pickerToggle.classList.add('wm-locked');
  colorRow.appendChild(pickerToggle);
  content.appendChild(colorRow);

  // Color picker (hidden by default)
  const pickerWrap = el('div', { className: 'wm-picker-wrap' });
  pickerWrap.style.display = 'none';
  const recentColors = (state.prefs as any).recentColors || [];
  const picker = createColorPicker(activeColor, recentColors, (hex) => {
    colorRow.querySelectorAll('.wm-dot:not(.wm-dot-plus)').forEach(d => d.classList.remove('active'));
    pickerToggle.classList.add('active');
    onColorSelect(hex);
  });
  pickerWrap.appendChild(picker.getStyleElement());
  pickerWrap.appendChild(picker.element);
  content.appendChild(pickerWrap);

  pickerToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isProCached()) return;
    const isOpen = pickerWrap.style.display !== 'none';
    pickerWrap.style.display = isOpen ? 'none' : 'block';
  });

  return content;
}

function applyCursor(state: AppState): void {
  if (!state.tool) {
    updateCursorCSS(null);
    return;
  }
  const tool = getTool(state.tool);
  if (!tool) {
    updateCursorCSS(null);
    return;
  }
  const cursorVal = tool.cursor(state.color || tool.defaultColor, state.style || undefined);
  updateCursorCSS(cursorVal);
}
