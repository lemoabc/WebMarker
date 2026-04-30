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

export function cursorBrushHighlight(color: string): string {
  return svgCursor(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<rect x="8" y="2" width="14" height="22" rx="2" fill="#78909C" opacity="0.9"/>' +
    '<rect x="10" y="0" width="10" height="6" rx="1" fill="#90A4AE"/>' +
    '<rect x="7" y="22" width="16" height="8" rx="1" fill="' + color + '" opacity="0.8"/>' +
    '<rect x="9" y="24" width="12" height="4" rx="0.5" fill="' + color + '" opacity="0.5"/>' +
    '</svg>', 15, 31);
}

export function cursorUnderline(color: string): string {
  return svgCursor(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<path d="M6 4L6 20" stroke="#78909C" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M5 28L27 28" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round"/>' +
    '<path d="M4 4L8 4" stroke="#90A4AE" stroke-width="1" stroke-linecap="round"/>' +
    '<circle cx="6" cy="2" r="1.2" fill="#B0BEC5"/>' +
    '</svg>', 6, 30);
}

let _cursorStyleEl: HTMLStyleElement | null = null;

export function updateCursorCSS(cursorValue: string | null): void {
  if (!_cursorStyleEl) {
    _cursorStyleEl = document.createElement('style');
    _cursorStyleEl.id = 'wm-cursor-css';
    document.head.appendChild(_cursorStyleEl);
  }
  if (!cursorValue) {
    _cursorStyleEl.textContent = '';
    document.body.classList.remove('wm-active');
    return;
  }
  document.body.classList.add('wm-active');
  _cursorStyleEl.textContent =
    'body.wm-active,body.wm-active *{cursor:' + cursorValue + ' !important}';
}
