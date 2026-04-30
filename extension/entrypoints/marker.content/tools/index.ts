import './highlight';
import './text-color';
import './underline';
import './brush-highlight';
import './eraser';

export { registerTool, getTool, getAllTools, getAnnotatorTools } from './registry';
export type { ToolDefinition, StyleOption } from './registry';
