import { registerTool } from './registry';
import { cursorBrush } from '../cursors';

const COLORS = ['#FFF176', '#A5D6A7', '#F48FB1', '#81D4FA', '#FFCC80'];

registerTool({
  name: 'highlight',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  label: 'tool.highlight',
  isAnnotator: true,
  colors: COLORS,
  defaultColor: COLORS[0],
  cursor: (color) => cursorBrush(color),
  apply: (span, color) => {
    span.style.backgroundColor = color;
  },
});
