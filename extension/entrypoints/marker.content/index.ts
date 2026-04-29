import {
  HL_CLASS, ATTR_ID, CTX,
  injectPageCSS, findAnchorElement, charOffsetIn, getXPath,
  buildRanges, wrapRanges, unwrapById, resolveXPath,
} from './core';
import type { Annotation } from './core';
import { createUI } from './ui';
import type { UIRefs } from './ui';
import { createState } from './state';
import { loadAnnotations, saveAnnotations, clearAnnotations } from './store';
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
    let uiRefs: UIRefs | null = null;

    injectPageCSS();

    uiRefs = createUI(state, async () => {
      await clearAnnotations(state);
    });

    await restore();

    document.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('click', onPageClick, true);
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.tool) {
        e.preventDefault();
        uiRefs?.deactivate();
      }
    }, true);

    browser.runtime.onMessage.addListener((msg: any) => {
      if (msg?.type === 'wm:toggle') {
        if (msg.enabled === false && uiRefs) {
          uiRefs.host.style.display = 'none';
          uiRefs.deactivate();
        } else if (msg.enabled === true && uiRefs) {
          uiRefs.host.style.display = '';
        }
      }
    });

    // =====================================================================
    //  Selection → annotation
    // =====================================================================

    function onMouseUp(e: MouseEvent) {
      if (!state.tool || state.tool === 'eraser') return;
      if (!state.color) return;

      const wmRoot = document.getElementById('wm-root');
      if (wmRoot && wmRoot.contains(e.target as Node)) return;

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
      const ann: Annotation = {
        id,
        type: state.tool,
        color: state.color,
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

      wrapRanges(ranges, id, state.tool, state.color);
      state.annotations.push(ann);
      saveAnnotations(state);

      sel.removeAllRanges();
    }

    // =====================================================================
    //  Eraser click
    // =====================================================================

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

    // =====================================================================
    //  Restore on load
    // =====================================================================

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
          wrapRanges(ranges, ann.id, ann.type, ann.color);
          state.annotations.push(ann);
        }
      }
    }
  },
});
