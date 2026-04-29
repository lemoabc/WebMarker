import { HIGHLIGHT_COLORS, TEXT_COLORS } from './core';

function svgCursor(svg: string, hx: number, hy: number): string {
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") ' + hx + ' ' + hy + ', crosshair';
}

export function cursorBrush(color: string): string {
  return svgCursor(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<path d="M20 2L27 9L12 24L5 17Z" fill="#546E7A"/>' +
    '<path d="M22 4L27 9L25 11L20 6Z" fill="#78909C"/>' +
    '<path d="M12 24L5 17L2 27L4 30Z" fill="' + color + '"/>' +
    '<path d="M5 17L12 24L10 26L3 19Z" fill="' + color + '" opacity="0.6"/>' +
    '</svg>', 2, 30);
}

export function cursorQuill(color: string): string {
  return svgCursor(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<path d="M28 1C21 5 13 13 8 23L10 25C15 15 21 7 28 1Z" fill="#A1887F" opacity="0.85"/>' +
    '<path d="M28 1C25 3 22 7 20 11L24 7Z" fill="#BCAAA4"/>' +
    '<path d="M8 23L4 31L6 31L10 25Z" fill="' + color + '"/>' +
    '<circle cx="4" cy="31" r="1.2" fill="' + color + '"/>' +
    '</svg>', 4, 31);
}

export function cursorEraser(): string {
  return svgCursor(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<path d="M4 11L26 5L30 17L8 23Z" fill="#F5F5F5" stroke="#B0BEC5" stroke-width="1" stroke-linejoin="round"/>' +
    '<path d="M8 23L30 17L29 21L7 27Z" fill="#FF8A80" stroke="#EF9A9A" stroke-width="0.5" stroke-linejoin="round"/>' +
    '<path d="M6 17L28 11" stroke="#CFD8DC" stroke-width="0.8"/>' +
    '</svg>', 5, 27);
}

let _cursorStyleEl: HTMLStyleElement | null = null;

export function updateCursor(tool: string | null, color: string | null): void {
  if (!_cursorStyleEl) {
    _cursorStyleEl = document.createElement('style');
    _cursorStyleEl.id = 'wm-cursor-css';
    document.head.appendChild(_cursorStyleEl);
  }
  if (!tool) {
    _cursorStyleEl.textContent = '';
    document.body.classList.remove('wm-active');
    return;
  }
  document.body.classList.add('wm-active');
  let cur: string | undefined;
  if (tool === 'highlight') cur = cursorBrush(color || HIGHLIGHT_COLORS[0]);
  else if (tool === 'textColor') cur = cursorQuill(color || TEXT_COLORS[0]);
  else if (tool === 'eraser') cur = cursorEraser();
  if (cur) {
    _cursorStyleEl.textContent =
      'body.wm-active,body.wm-active *{cursor:' + cur + ' !important}';
  }
}
