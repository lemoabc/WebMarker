import {
  HL_CLASS, ATTR_ID, CTX,
  injectPageCSS, findAnchorElement, charOffsetIn, getXPath,
  buildRanges, wrapRanges, unwrapById, resolveXPath,
} from './core';
import type { Annotation } from './core';
import { createUI } from './ui';
import type { UIRefs } from './ui';
import { createMiniToolbar } from './mini-toolbar';
import type { MiniToolbarRefs } from './mini-toolbar';
import { createState } from './state';
import type { ToolConfig } from './state';
import { loadAnnotations, saveAnnotations, clearAnnotations, loadPreferences, savePreferences } from './store';
import { getTool } from './tools';
import { getProStatus } from './pro';
import { setLocale, detectLocale } from './i18n';
import { storage } from 'wxt/utils/storage';

const enabledItem = storage.defineItem<boolean>('local:wm::enabled', {
  defaultValue: true,
});

export default defineContentScript({
  matches: ['*://*/*', 'file:///*'],
  runAt: 'document_idle',

  async main() {
    const enabled = await enabledItem.getValue();
    if (!enabled) return;

    const state = createState();
    state.prefs = await loadPreferences();
    setLocale(state.prefs.locale || detectLocale());
    await getProStatus();

    let uiRefs: UIRefs | null = null;
    let miniRefs: MiniToolbarRefs | null = null;

    injectPageCSS();

    uiRefs = createUI(
      state,
      async () => { await clearAnnotations(state); },
      (_toolName, _color) => { savePreferences(state.prefs); },
      (toolName, color, style) => { applyAnnotation(toolName, color, style); },
    );

    miniRefs = createMiniToolbar(
      state,
      (toolName: string, config: ToolConfig) => {
        applyAnnotation(toolName, config.color, config.style);
      },
      () => {
        uiRefs?.openPanel();
      },
    );

    await restore();

    document.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('click', onPageClick, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.tool) {
          e.preventDefault();
          uiRefs?.deactivate();
        } else if (state.open) {
          e.preventDefault();
          uiRefs?.closePanel();
        }
        if (miniRefs?.isVisible()) {
          miniRefs.hide();
        }
      }
    }, true);

    browser.runtime.onMessage.addListener((msg: any) => {
      if (msg?.type === 'wm:toggle') {
        if (msg.enabled === false) {
          if (uiRefs) {
            uiRefs.host.style.display = 'none';
            uiRefs.deactivate();
          }
          miniRefs?.hide();
        } else if (msg.enabled === true && uiRefs) {
          uiRefs.host.style.display = '';
        }
      }
    });

    function applyAnnotation(toolName: string, color: string, style?: string) {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      const text = sel.toString();
      if (!text.trim()) return;

      const anchor = findAnchorElement(range.commonAncestorContainer);
      const sOff = charOffsetIn(anchor, range.startContainer, range.startOffset);
      const eOff = charOffsetIn(anchor, range.endContainer, range.endOffset);
      if (sOff == null || eOff == null || sOff >= eOff) return;

      const full = anchor.textContent!;
      const id = 'wm' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

      const tool = getTool(toolName);
      const ann: Annotation = {
        id,
        type: toolName,
        color,
        style: style || undefined,
        xpath: getXPath(anchor),
        s: sOff,
        e: eOff,
        text,
        cb: full.substring(Math.max(0, sOff - CTX), sOff),
        ca: full.substring(eOff, eOff + CTX),
        ts: Date.now(),
      };

      const ranges = buildRanges(anchor, sOff, eOff);
      if (ranges.length === 0) return;

      wrapRanges(ranges, id, toolName, color, style, tool?.apply);
      state.annotations.push(ann);
      saveAnnotations(state);

      if (!state.prefs.firstAnnotationDone) {
        state.prefs.firstAnnotationDone = true;
        savePreferences(state.prefs);
      }

      sel.removeAllRanges();
    }

    function onMouseUp(e: MouseEvent) {
      const wmRoot = document.getElementById('wm-root');
      if (wmRoot && wmRoot.contains(e.target as Node)) return;
      const wmMini = document.getElementById('wm-mini-root');
      if (wmMini && wmMini.contains(e.target as Node)) return;

      if (state.annotateMode && state.tool && state.tool !== 'eraser' && state.color) {
        applyAnnotation(state.tool, state.color, state.style || undefined);
        return;
      }

      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          miniRefs?.hide();
          return;
        }

        const text = sel.toString().trim();
        if (!text) {
          miniRefs?.hide();
          return;
        }

        if (state.annotateMode) return;

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        miniRefs?.show(rect);
      }, 10);
    }

    function onMouseDown(e: MouseEvent) {
      const wmMini = document.getElementById('wm-mini-root');
      if (wmMini && wmMini.contains(e.target as Node)) return;

      if (miniRefs?.isVisible()) {
        miniRefs.hide();
      }
    }

    function onPageClick(e: MouseEvent) {
      if (state.tool !== 'eraser') return;

      const span = (e.target as Element).closest('.' + HL_CLASS);
      if (!span) return;

      e.preventDefault();
      e.stopPropagation();

      const id = span.getAttribute(ATTR_ID);
      if (!id) return;

      unwrapById(id);
      state.annotations = state.annotations.filter(a => a.id !== id);
      saveAnnotations(state);
    }

    async function restore() {
      const saved = await loadAnnotations();
      for (const ann of saved) {
        const el = resolveXPath(ann.xpath);
        if (!el) continue;

        let sOff = ann.s;
        let eOff = ann.e;
        const actual = el.textContent!.substring(sOff, eOff);

        if (actual !== ann.text) {
          const idx = el.textContent!.indexOf(ann.text);
          if (idx === -1) continue;
          sOff = idx;
          eOff = idx + ann.text.length;
        }

        const ranges = buildRanges(el, sOff, eOff);
        if (ranges.length > 0) {
          const tool = getTool(ann.type);
          wrapRanges(ranges, ann.id, ann.type, ann.color, ann.style, tool?.apply);
          state.annotations.push(ann);
        }
      }
    }
  },
});
