import { registerTool } from './registry';
import type { StyleOption } from './registry';
import { cursorBrushHighlight } from '../cursors';
import { ensureFilter } from '../filters';

const COLORS = ['#FFF176', '#A5D6A7', '#F48FB1', '#81D4FA', '#FFCC80'];

const STYLES: StyleOption[] = [
  { name: 'felt', label: 'texture.felt', icon: '🖍' },
  { name: 'watercolor', label: 'texture.watercolor', icon: '💧' },
  { name: 'crayon', label: 'texture.crayon', icon: '🖊' },
  { name: 'neon', label: 'texture.neon', icon: '✦' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

registerTool({
  name: 'brushHighlight',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63a2.12 2.12 0 0 1 3 3L14 13l-4 1 1-4 7.37-7.37z"/><path d="M9 15H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4"/><path d="M15 9l3 3"/></svg>',
  label: 'tool.brushHighlight',
  isAnnotator: true,
  styles: STYLES,
  colors: COLORS,
  defaultColor: COLORS[0],
  defaultStyle: 'felt',
  cursor: (color) => cursorBrushHighlight(color),
  apply: (span, color, style) => {
    const s = style || 'felt';

    if (s === 'neon') {
      const rgb = hexToRgb(color);
      span.style.backgroundColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;
      span.style.boxShadow = `0 0 4px rgba(${rgb.r},${rgb.g},${rgb.b},0.4), 0 0 8px rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`;
      span.style.borderRadius = '3px';
      span.style.padding = '1px 2px';
      return;
    }

    span.style.backgroundColor = color;
    span.style.borderRadius = '2px';
    span.style.padding = '1px 2px';

    const filterId = ensureFilter(s, color);
    if (filterId) {
      span.style.filter = `url(#${filterId})`;
    }
  },
});
