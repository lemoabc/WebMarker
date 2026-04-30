export interface StyleOption {
  name: string;
  label: string;
  icon?: string;
}

export interface ToolDefinition {
  name: string;
  icon: string;
  label: string;
  /** Tools that annotate text (not eraser/clear) */
  isAnnotator: boolean;
  styles?: StyleOption[];
  colors: string[];
  defaultColor: string;
  defaultStyle?: string;
  cursor: (color: string, style?: string) => string;
  apply: (span: HTMLSpanElement, color: string, style?: string) => void;
}

const tools = new Map<string, ToolDefinition>();

export function registerTool(def: ToolDefinition): void {
  tools.set(def.name, def);
}

export function getTool(name: string): ToolDefinition | undefined {
  return tools.get(name);
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(tools.values());
}

export function getAnnotatorTools(): ToolDefinition[] {
  return getAllTools().filter(t => t.isAnnotator);
}
