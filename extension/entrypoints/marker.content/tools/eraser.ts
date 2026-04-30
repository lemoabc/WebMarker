import { registerTool } from './registry';
import { cursorEraser } from '../cursors';

registerTool({
  name: 'eraser',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7.5l-3.2-3.2a2 2 0 0 1 0-2.8L14.8 3.5a2 2 0 0 1 2.8 0l3.9 3.9a2 2 0 0 1 0 2.8L11 20"/><path d="M6 14l8-8"/></svg>',
  label: 'tool.eraser',
  isAnnotator: false,
  colors: [],
  defaultColor: '',
  cursor: () => cursorEraser(),
  apply: () => {},
});
