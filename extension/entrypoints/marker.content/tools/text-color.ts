import { registerTool } from './registry';
import { cursorQuill } from '../cursors';

const COLORS = ['#E53935', '#1E88E5', '#43A047', '#8E24AA', '#EF6C00'];

registerTool({
  name: 'textColor',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 20h12"/><path d="M12 4l-5 12h2.5l1.2-3h4.6l1.2 3H19L14 4h-4z" fill="currentColor" stroke="none"/></svg>',
  label: 'tool.textColor',
  isAnnotator: true,
  colors: COLORS,
  defaultColor: COLORS[0],
  cursor: (color) => cursorQuill(color),
  apply: (span, color) => {
    span.style.color = color;
  },
});
