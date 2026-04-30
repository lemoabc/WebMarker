// =========================================================================
//  Constants
// =========================================================================

export const HL_CLASS = 'wm-hl';
export const ATTR_ID = 'data-wm-id';
export const CTX = 30;

const BLOCK_TAGS = new Set([
  'p', 'div', 'li', 'ol', 'ul', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'section', 'article', 'main', 'nav', 'aside',
  'header', 'footer', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
  'body', 'dd', 'dt', 'dl', 'figure', 'figcaption', 'details', 'summary',
]);

export const ICONS = {
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
};

// =========================================================================
//  Annotation type
// =========================================================================

export interface Annotation {
  id: string;
  type: string;
  color: string;
  style?: string;
  xpath: string;
  s: number;
  e: number;
  text: string;
  cb: string;
  ca: string;
  ts: number;
}

// =========================================================================
//  XPath helpers
// =========================================================================

export function getXPath(el: Node): string {
  if (!el) return '';
  if (el === document.body) return '/html/body';
  if (el === document.documentElement) return '/html';
  if (el === document) return '/';
  if (el.nodeType === Node.ELEMENT_NODE && (el as Element).classList.contains(HL_CLASS)) {
    return getXPath(el.parentElement!);
  }
  const parent = (el as Element).parentElement;
  if (!parent) return '';
  const tag = (el as Element).tagName.toLowerCase();
  const sameTag = Array.from(parent.children).filter(
    c => c.tagName && c.tagName.toLowerCase() === tag
  );
  return getXPath(parent) + '/' + tag + '[' + (sameTag.indexOf(el as Element) + 1) + ']';
}

export function resolveXPath(xpath: string): Element | null {
  try {
    return document.evaluate(xpath, document, null,
      XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element | null;
  } catch { return null; }
}

// =========================================================================
//  Anchor – character offsets within an element's textContent
// =========================================================================

export function charOffsetIn(element: Node, textNode: Node, localOffset: number): number | null {
  const tw = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let off = 0;
  let n: Node | null;
  while ((n = tw.nextNode())) {
    if (n === textNode) return off + localOffset;
    off += n.textContent!.length;
  }
  return null;
}

export function findAnchorElement(node: Node): Element {
  let el: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.nodeType === Node.ELEMENT_NODE &&
        !(el as Element).classList.contains(HL_CLASS) &&
        BLOCK_TAGS.has((el as Element).tagName.toLowerCase())) {
      return el as Element;
    }
    el = el.parentNode;
  }
  return document.body;
}

// =========================================================================
//  Highlight ranges – from char offsets to Range objects
// =========================================================================

export function buildRanges(anchorEl: Node, startOff: number, endOff: number): Range[] {
  const ranges: Range[] = [];
  const tw = document.createTreeWalker(anchorEl, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let n: Node | null;
  while ((n = tw.nextNode())) {
    const nStart = acc;
    const nEnd = acc + n.textContent!.length;
    if (nEnd > startOff && nStart < endOff) {
      const rS = Math.max(0, startOff - nStart);
      const rE = Math.min(n.textContent!.length, endOff - nStart);
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

export function wrapRanges(
  ranges: Range[],
  id: string,
  type: string,
  color: string,
  style?: string,
  applyFn?: (span: HTMLSpanElement, color: string, style?: string) => void,
): void {
  for (let i = ranges.length - 1; i >= 0; i--) {
    const span = document.createElement('span');
    span.className = HL_CLASS;
    span.setAttribute(ATTR_ID, id);
    if (applyFn) {
      applyFn(span, color, style);
    } else if (type === 'highlight') {
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

export function unwrapById(id: string): void {
  document.querySelectorAll('[' + ATTR_ID + '="' + id + '"]').forEach(span => {
    const p = span.parentNode!;
    while (span.firstChild) p.insertBefore(span.firstChild, span);
    p.removeChild(span);
    (p as Element).normalize?.();
  });
}

export function unwrapAll(): void {
  document.querySelectorAll('.' + HL_CLASS).forEach(span => {
    const p = span.parentNode!;
    while (span.firstChild) p.insertBefore(span.firstChild, span);
    p.removeChild(span);
    (p as Element).normalize?.();
  });
}

// =========================================================================
//  Page-level CSS (for highlight spans in the host page)
// =========================================================================

export function injectPageCSS(): void {
  const s = document.createElement('style');
  s.id = 'wm-page-css';
  s.textContent = [
    '.' + HL_CLASS + '{border-radius:2px;padding:0 1px;transition:opacity .15s}',
    'body.wm-eraser .' + HL_CLASS + '{outline:2px dashed rgba(255,82,82,.55);outline-offset:1px}',
    'body.wm-eraser .' + HL_CLASS + ':hover{outline:2px solid #ff5252;opacity:.65}',
  ].join('\n');
  document.head.appendChild(s);
}
