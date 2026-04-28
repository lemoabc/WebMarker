// ==UserScript==
// @name         Web Marker - 网页高亮标注
// @namespace    https://github.com/user/web-marker
// @version      0.1.1
// @description  在本地 HTML 文件上选中文字进行高亮/变色标注，刷新后自动恢复
// @match        file:///*
// @include      file://*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  // =========================================================================
  //  Constants
  // =========================================================================

  const HL_CLASS = 'wm-hl';
  const ATTR_ID = 'data-wm-id';
  const CTX = 30;

  const HIGHLIGHT_COLORS = ['#FFF176', '#A5D6A7', '#F48FB1', '#81D4FA', '#FFCC80'];
  const TEXT_COLORS = ['#E53935', '#1E88E5', '#43A047', '#8E24AA', '#EF6C00'];

  const BLOCK_TAGS = new Set([
    'p', 'div', 'li', 'ol', 'ul', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'section', 'article', 'main', 'nav', 'aside',
    'header', 'footer', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
    'body', 'dd', 'dt', 'dl', 'figure', 'figcaption', 'details', 'summary',
  ]);

  const ICONS = {
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    highlight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    textColor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 20h12"/><path d="M12 4l-5 12h2.5l1.2-3h4.6l1.2 3H19L14 4h-4z" fill="currentColor" stroke="none"/></svg>',
    eraser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7.5l-3.2-3.2a2 2 0 0 1 0-2.8L14.8 3.5a2 2 0 0 1 2.8 0l3.9 3.9a2 2 0 0 1 0 2.8L11 20"/><path d="M6 14l8-8"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>',
  };

  // =========================================================================
  //  Cursors – dynamic SVG cursors that change color with the active tool
  // =========================================================================

  function svgCursor(svg, hx, hy) {
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") ' + hx + ' ' + hy + ', crosshair';
  }

  function cursorBrush(color) {
    return svgCursor(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
      '<path d="M20 2L27 9L12 24L5 17Z" fill="#546E7A"/>' +
      '<path d="M22 4L27 9L25 11L20 6Z" fill="#78909C"/>' +
      '<path d="M12 24L5 17L2 27L4 30Z" fill="' + color + '"/>' +
      '<path d="M5 17L12 24L10 26L3 19Z" fill="' + color + '" opacity="0.6"/>' +
      '</svg>', 2, 30);
  }

  function cursorQuill(color) {
    return svgCursor(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
      '<path d="M28 1C21 5 13 13 8 23L10 25C15 15 21 7 28 1Z" fill="#A1887F" opacity="0.85"/>' +
      '<path d="M28 1C25 3 22 7 20 11L24 7Z" fill="#BCAAA4"/>' +
      '<path d="M8 23L4 31L6 31L10 25Z" fill="' + color + '"/>' +
      '<circle cx="4" cy="31" r="1.2" fill="' + color + '"/>' +
      '</svg>', 4, 31);
  }

  function cursorEraser() {
    return svgCursor(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
      '<path d="M4 11L26 5L30 17L8 23Z" fill="#F5F5F5" stroke="#B0BEC5" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M8 23L30 17L29 21L7 27Z" fill="#FF8A80" stroke="#EF9A9A" stroke-width="0.5" stroke-linejoin="round"/>' +
      '<path d="M6 17L28 11" stroke="#CFD8DC" stroke-width="0.8"/>' +
      '</svg>', 5, 27);
  }

  let _cursorStyleEl = null;

  function updateCursor() {
    if (!_cursorStyleEl) {
      _cursorStyleEl = document.createElement('style');
      _cursorStyleEl.id = 'wm-cursor-css';
      document.head.appendChild(_cursorStyleEl);
    }
    if (!state.tool) {
      _cursorStyleEl.textContent = '';
      document.body.classList.remove('wm-active');
      return;
    }
    document.body.classList.add('wm-active');
    let cur;
    if (state.tool === 'highlight') cur = cursorBrush(state.color || HIGHLIGHT_COLORS[0]);
    else if (state.tool === 'textColor') cur = cursorQuill(state.color || TEXT_COLORS[0]);
    else if (state.tool === 'eraser') cur = cursorEraser();
    if (cur) {
      _cursorStyleEl.textContent =
        'body.wm-active,body.wm-active *{cursor:' + cur + ' !important}';
    }
  }

  // =========================================================================
  //  State
  // =========================================================================

  const state = {
    open: false,
    tool: null,
    color: null,
    annotations: [],
  };

  let uiRefs = null;

  // =========================================================================
  //  Storage
  // =========================================================================

  const store = {
    _key: () => 'wm::' + location.href,

    load() {
      const raw = GM_getValue(this._key(), null);
      if (!raw) return [];
      try {
        const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(d.annotations) ? d.annotations : [];
      } catch { return []; }
    },

    save() {
      GM_setValue(this._key(), JSON.stringify({
        v: 1,
        url: location.href,
        annotations: state.annotations,
      }));
    },

    clear() {
      state.annotations = [];
      this.save();
    },
  };

  // =========================================================================
  //  XPath helpers
  // =========================================================================

  function getXPath(el) {
    if (!el) return '';
    if (el === document.body) return '/html/body';
    if (el === document.documentElement) return '/html';
    if (el === document) return '/';
    if (el.nodeType === Node.ELEMENT_NODE && el.classList.contains(HL_CLASS)) {
      return getXPath(el.parentElement);
    }
    const parent = el.parentElement;
    if (!parent) return '';
    const tag = el.tagName.toLowerCase();
    const sameTag = Array.from(parent.children).filter(
      c => c.tagName && c.tagName.toLowerCase() === tag
    );
    return getXPath(parent) + '/' + tag + '[' + (sameTag.indexOf(el) + 1) + ']';
  }

  function resolveXPath(xpath) {
    try {
      return document.evaluate(xpath, document, null,
        XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch { return null; }
  }

  // =========================================================================
  //  Anchor – character offsets within an element's textContent
  // =========================================================================

  function charOffsetIn(element, textNode, localOffset) {
    const tw = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let off = 0, n;
    while ((n = tw.nextNode())) {
      if (n === textNode) return off + localOffset;
      off += n.textContent.length;
    }
    return null;
  }

  function findAnchorElement(node) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.nodeType === Node.ELEMENT_NODE &&
          !el.classList.contains(HL_CLASS) &&
          BLOCK_TAGS.has(el.tagName.toLowerCase())) {
        return el;
      }
      el = el.parentNode;
    }
    return document.body;
  }

  // =========================================================================
  //  Highlight ranges – from char offsets to Range objects
  // =========================================================================

  function buildRanges(anchorEl, startOff, endOff) {
    const ranges = [];
    const tw = document.createTreeWalker(anchorEl, NodeFilter.SHOW_TEXT);
    let acc = 0, n;
    while ((n = tw.nextNode())) {
      const nStart = acc;
      const nEnd = acc + n.textContent.length;
      if (nEnd > startOff && nStart < endOff) {
        const rS = Math.max(0, startOff - nStart);
        const rE = Math.min(n.textContent.length, endOff - nStart);
        if (rS < rE) {
          const r = document.createRange();
          r.setStart(n, rS);
          r.setEnd(n, rE);
          ranges.push(r);
        }
      }
      acc = nEnd;
      if (acc >= endOff) break;
    }
    return ranges;
  }

  // =========================================================================
  //  Highlight DOM manipulation
  // =========================================================================

  function wrapRanges(ranges, id, type, color) {
    for (let i = ranges.length - 1; i >= 0; i--) {
      const span = document.createElement('span');
      span.className = HL_CLASS;
      span.setAttribute(ATTR_ID, id);
      if (type === 'highlight') {
        span.style.backgroundColor = color;
      } else {
        span.style.color = color;
      }
      try {
        ranges[i].surroundContents(span);
      } catch {
        const frag = ranges[i].extractContents();
        span.appendChild(frag);
        ranges[i].insertNode(span);
      }
    }
  }

  function unwrapById(id) {
    document.querySelectorAll('[' + ATTR_ID + '="' + id + '"]').forEach(span => {
      const p = span.parentNode;
      while (span.firstChild) p.insertBefore(span.firstChild, span);
      p.removeChild(span);
      p.normalize();
    });
  }

  function unwrapAll() {
    document.querySelectorAll('.' + HL_CLASS).forEach(span => {
      const p = span.parentNode;
      while (span.firstChild) p.insertBefore(span.firstChild, span);
      p.removeChild(span);
      p.normalize();
    });
  }

  // =========================================================================
  //  Page-level CSS (for highlight spans in the host page)
  // =========================================================================

  function injectPageCSS() {
    const s = document.createElement('style');
    s.id = 'wm-page-css';
    s.textContent = [
      '.' + HL_CLASS + '{border-radius:2px;padding:0 1px;transition:opacity .15s}',
      'body.wm-eraser .' + HL_CLASS + '{outline:2px dashed rgba(255,82,82,.55);outline-offset:1px}',
      'body.wm-eraser .' + HL_CLASS + ':hover{outline:2px solid #ff5252;opacity:.65}',
    ].join('\n');
    document.head.appendChild(s);
  }

  // =========================================================================
  //  Shadow-DOM UI
  // =========================================================================

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

  function createUI() {
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

    const toolBtns = { highlight: hlBtn.btn, textColor: tcBtn.btn, eraser: eraserBtn.btn };
    const colorRows = { highlight: hlColors, textColor: tcColors };

    function deactivateTool() {
      state.tool = null;
      state.color = null;
      document.body.classList.remove('wm-eraser');
      Object.values(toolBtns).forEach(b => b.classList.remove('active'));
      Object.values(colorRows).forEach(row => {
        row.classList.remove('show');
        row.querySelectorAll('.wm-dot').forEach(d => d.classList.remove('active'));
      });
      updateCursor();
    }

    function selectTool(name) {
      if (name === 'clearAll') {
        if (state.annotations.length === 0) return;
        unwrapAll();
        store.clear();
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
        const first = colorRows[name].querySelector('.wm-dot');
        if (first) { first.classList.add('active'); state.color = first.dataset.color; }
      }
      updateCursor();
    }

    Object.keys(toolBtns).forEach(name => {
      toolBtns[name].addEventListener('click', () => selectTool(name));
    });
    clearBtn.btn.addEventListener('click', () => selectTool('clearAll'));

    shadow.querySelectorAll('.wm-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const row = dot.parentElement;
        row.querySelectorAll('.wm-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        state.color = dot.dataset.color;
        updateCursor();
      });
    });

    uiRefs = { host, shadow, wrap, toggleBtn, panel, toolBtns, colorRows, deactivate: deactivateTool };
    return uiRefs;
  }

  function el(tag, props) {
    const e = document.createElement(tag);
    if (props) Object.assign(e, props);
    return e;
  }

  function toolBtn(name, icon, label) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;';
    const btn = el('button', { className: 'wm-tool' });
    btn.dataset.tool = name;
    btn.innerHTML = icon;
    btn.title = label;
    wrap.appendChild(btn);
    const lbl = el('div', { className: 'wm-label' });
    lbl.textContent = label;
    wrap.appendChild(lbl);
    return { wrap, btn };
  }

  function colorRow(colors, group) {
    const row = el('div', { className: 'wm-colors' });
    row.dataset.group = group;
    colors.forEach(c => {
      const dot = el('button', { className: 'wm-dot' });
      dot.style.background = c;
      dot.dataset.color = c;
      dot.title = c;
      row.appendChild(dot);
    });
    return row;
  }

  // =========================================================================
  //  Selection → annotation
  // =========================================================================

  function onMouseUp(e) {
    if (!state.tool || state.tool === 'eraser') return;
    if (!state.color) return;

    const wmRoot = document.getElementById('wm-root');
    if (wmRoot && wmRoot.contains(e.target)) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const text = sel.toString();
    if (!text.trim()) return;

    let anchor = range.commonAncestorContainer;
    anchor = findAnchorElement(anchor);

    const sOff = charOffsetIn(anchor, range.startContainer, range.startOffset);
    const eOff = charOffsetIn(anchor, range.endContainer, range.endOffset);
    if (sOff == null || eOff == null || sOff >= eOff) return;

    const full = anchor.textContent;
    const id = 'wm' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
    const ann = {
      id,
      type: state.tool,
      color: state.color,
      xpath: getXPath(anchor),
      s: sOff,
      e: eOff,
      text: text,
      cb: full.substring(Math.max(0, sOff - CTX), sOff),
      ca: full.substring(eOff, eOff + CTX),
      ts: Date.now(),
    };

    const ranges = buildRanges(anchor, sOff, eOff);
    if (ranges.length === 0) return;

    wrapRanges(ranges, id, state.tool, state.color);
    state.annotations.push(ann);
    store.save();

    sel.removeAllRanges();
  }

  // =========================================================================
  //  Eraser click
  // =========================================================================

  function onPageClick(e) {
    if (state.tool !== 'eraser') return;

    const span = e.target.closest('.' + HL_CLASS);
    if (!span) return;

    e.preventDefault();
    e.stopPropagation();

    const id = span.getAttribute(ATTR_ID);
    if (!id) return;

    unwrapById(id);
    state.annotations = state.annotations.filter(a => a.id !== id);
    store.save();
  }

  // =========================================================================
  //  Restore on load
  // =========================================================================

  function restore() {
    const saved = store.load();
    for (const ann of saved) {
      const el = resolveXPath(ann.xpath);
      if (!el) continue;

      let sOff = ann.s;
      let eOff = ann.e;
      const actual = el.textContent.substring(sOff, eOff);

      if (actual !== ann.text) {
        const idx = el.textContent.indexOf(ann.text);
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

  // =========================================================================
  //  Init
  // =========================================================================

  function init() {
    injectPageCSS();
    createUI();
    restore();
    document.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('click', onPageClick, true);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.tool) {
        e.preventDefault();
        if (uiRefs) uiRefs.deactivate();
      }
    }, true);
  }

  init();
})();
