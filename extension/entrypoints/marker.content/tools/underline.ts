import { registerTool } from './registry';
import type { StyleOption } from './registry';
import { cursorUnderline } from '../cursors';

const COLORS = ['#E53935', '#1E88E5', '#43A047', '#8E24AA', '#EF6C00'];

const STYLES: StyleOption[] = [
  { name: 'solid', label: 'style.solid', icon: '─' },
  { name: 'dashed', label: 'style.dashed', icon: '┅' },
  { name: 'wavy', label: 'style.wavy', icon: '∿' },
  { name: 'double', label: 'style.double', icon: '═' },
  { name: 'sketch', label: 'style.sketch', icon: '〰' },
  { name: 'marker', label: 'style.marker', icon: '▬' },
];

function sketchSVG(color: string): string {
  const w = 200;
  const h = 8;
  const points: string[] = [`M0,${h / 2}`];
  for (let x = 4; x <= w; x += 4) {
    const y = h / 2 + (Math.random() - 0.5) * 3;
    points.push(`L${x},${y.toFixed(1)}`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<path d="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>` +
    `</svg>`;
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}

function markerSVG(color: string): string {
  const w = 200;
  const h = 10;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<rect x="0" y="1" width="${w}" height="6" rx="3" fill="${color}" opacity="0.55"/>` +
    `<rect x="2" y="2.5" width="${w - 4}" height="3" rx="1.5" fill="${color}" opacity="0.35"/>` +
    `</svg>`;
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}

registerTool({
  name: 'underline',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><path d="M4 21h16"/></svg>',
  label: 'tool.underline',
  isAnnotator: true,
  styles: STYLES,
  colors: COLORS,
  defaultColor: COLORS[0],
  defaultStyle: 'solid',
  cursor: (color) => cursorUnderline(color),
  apply: (span, color, style) => {
    const s = style || 'solid';

    if (s === 'sketch') {
      span.style.backgroundImage = sketchSVG(color);
      span.style.backgroundRepeat = 'repeat-x';
      span.style.backgroundPosition = 'bottom left';
      span.style.backgroundSize = 'auto 6px';
      span.style.paddingBottom = '3px';
      return;
    }

    if (s === 'marker') {
      span.style.backgroundImage = markerSVG(color);
      span.style.backgroundRepeat = 'repeat-x';
      span.style.backgroundPosition = 'bottom left';
      span.style.backgroundSize = 'auto 8px';
      span.style.paddingBottom = '4px';
      return;
    }

    span.style.textDecoration = `underline ${s}`;
    span.style.textDecorationColor = color;
    span.style.textDecorationThickness = s === 'double' ? '1px' : '2px';
    span.style.textUnderlineOffset = '3px';
  },
});
