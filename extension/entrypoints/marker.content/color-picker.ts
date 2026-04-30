import { t } from './i18n';

const PICKER_CSS = `
  .wm-picker{
    display:flex;flex-direction:column;gap:6px;
    padding:6px 0 0;
  }
  .wm-picker-canvas-wrap{
    position:relative;width:144px;height:100px;
    border-radius:6px;overflow:hidden;cursor:crosshair;
  }
  .wm-picker-canvas{
    width:144px;height:100px;display:block;
  }
  .wm-picker-thumb{
    position:absolute;width:12px;height:12px;
    border:2px solid #fff;border-radius:50%;
    box-shadow:0 0 3px rgba(0,0,0,.5);
    pointer-events:none;transform:translate(-50%,-50%);
  }
  .wm-hue-wrap{
    position:relative;width:144px;height:14px;
    border-radius:7px;overflow:hidden;cursor:pointer;
  }
  .wm-hue-bar{
    width:100%;height:100%;
    background:linear-gradient(to right,
      hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),
      hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%)
    );
  }
  .wm-hue-thumb{
    position:absolute;top:0;width:4px;height:100%;
    background:#fff;border-radius:2px;
    box-shadow:0 0 3px rgba(0,0,0,.4);
    pointer-events:none;transform:translateX(-50%);
  }
  .wm-hex-row{
    display:flex;align-items:center;gap:4px;
  }
  .wm-hex-label{
    font-size:10px;color:rgba(255,255,255,.45);flex-shrink:0;
  }
  .wm-hex-input{
    width:80px;height:22px;border:1px solid rgba(255,255,255,.15);
    border-radius:4px;background:rgba(255,255,255,.08);
    color:#fff;font-size:11px;font-family:monospace;
    padding:0 4px;outline:none;
  }
  .wm-hex-input:focus{border-color:#64B5F6}
  .wm-picker-preview{
    width:22px;height:22px;border-radius:4px;
    border:1px solid rgba(255,255,255,.2);flex-shrink:0;
  }
  .wm-recent-row{
    display:flex;flex-wrap:wrap;gap:4px;
  }
  .wm-recent-dot{
    width:16px;height:16px;border-radius:50%;
    border:1.5px solid transparent;cursor:pointer;
    transition:transform .1s;
  }
  .wm-recent-dot:hover{transform:scale(1.2)}
`;

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function hexToHsv(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d + 6) % 6 / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
  }
  const sat = max === 0 ? 0 : d / max;
  return [hue, sat, max];
}

export interface ColorPickerRefs {
  element: HTMLElement;
  setColor: (hex: string) => void;
  getStyleElement: () => HTMLStyleElement;
}

export function createColorPicker(
  initialColor: string,
  recentColors: string[],
  onChange: (hex: string) => void,
): ColorPickerRefs {
  let [hue, sat, val] = hexToHsv(initialColor);

  const styleEl = document.createElement('style');
  styleEl.textContent = PICKER_CSS;

  const root = document.createElement('div');
  root.className = 'wm-picker';

  // SV canvas
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'wm-picker-canvas-wrap';
  const canvas = document.createElement('canvas');
  canvas.className = 'wm-picker-canvas';
  canvas.width = 144;
  canvas.height = 100;
  canvasWrap.appendChild(canvas);
  const svThumb = document.createElement('div');
  svThumb.className = 'wm-picker-thumb';
  canvasWrap.appendChild(svThumb);
  root.appendChild(canvasWrap);

  // Hue bar
  const hueWrap = document.createElement('div');
  hueWrap.className = 'wm-hue-wrap';
  const hueBar = document.createElement('div');
  hueBar.className = 'wm-hue-bar';
  hueWrap.appendChild(hueBar);
  const hueThumb = document.createElement('div');
  hueThumb.className = 'wm-hue-thumb';
  hueWrap.appendChild(hueThumb);
  root.appendChild(hueWrap);

  // Hex input + preview
  const hexRow = document.createElement('div');
  hexRow.className = 'wm-hex-row';
  const hexLabel = document.createElement('span');
  hexLabel.className = 'wm-hex-label';
  hexLabel.textContent = 'HEX';
  const hexInput = document.createElement('input');
  hexInput.className = 'wm-hex-input';
  hexInput.type = 'text';
  hexInput.maxLength = 7;
  const preview = document.createElement('div');
  preview.className = 'wm-picker-preview';
  hexRow.appendChild(hexLabel);
  hexRow.appendChild(hexInput);
  hexRow.appendChild(preview);
  root.appendChild(hexRow);

  // Recent colors
  if (recentColors.length > 0) {
    const recentLabel = document.createElement('div');
    recentLabel.className = 'wm-hex-label';
    recentLabel.textContent = t('ui.recentColors');
    recentLabel.style.marginTop = '2px';
    root.appendChild(recentLabel);
    const recentRow = document.createElement('div');
    recentRow.className = 'wm-recent-row';
    recentColors.forEach(c => {
      const dot = document.createElement('div');
      dot.className = 'wm-recent-dot';
      dot.style.background = c;
      dot.title = c;
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        setColor(c);
        onChange(c);
      });
      recentRow.appendChild(dot);
    });
    root.appendChild(recentRow);
  }

  function drawSV() {
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width, h = canvas.height;

    const baseColor = hsvToRgb(hue, 1, 1);
    const bgGrad = ctx.createLinearGradient(0, 0, w, 0);
    bgGrad.addColorStop(0, '#FFFFFF');
    bgGrad.addColorStop(1, `rgb(${baseColor[0]},${baseColor[1]},${baseColor[2]})`);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
    blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, w, h);
  }

  function update() {
    drawSV();
    svThumb.style.left = (sat * 144) + 'px';
    svThumb.style.top = ((1 - val) * 100) + 'px';
    hueThumb.style.left = (hue * 144) + 'px';

    const [r, g, b] = hsvToRgb(hue, sat, val);
    const hex = rgbToHex(r, g, b);
    hexInput.value = hex;
    preview.style.background = hex;
  }

  function setColor(hex: string) {
    [hue, sat, val] = hexToHsv(hex);
    update();
  }

  function emitChange() {
    const [r, g, b] = hsvToRgb(hue, sat, val);
    onChange(rgbToHex(r, g, b));
  }

  // SV drag
  let svDragging = false;
  function handleSV(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    sat = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    val = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    update();
    emitChange();
  }
  canvasWrap.addEventListener('mousedown', (e) => { svDragging = true; handleSV(e); });
  document.addEventListener('mousemove', (e) => { if (svDragging) handleSV(e); });
  document.addEventListener('mouseup', () => { svDragging = false; });

  // Hue drag
  let hueDragging = false;
  function handleHue(e: MouseEvent) {
    const rect = hueWrap.getBoundingClientRect();
    hue = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    update();
    emitChange();
  }
  hueWrap.addEventListener('mousedown', (e) => { hueDragging = true; handleHue(e); });
  document.addEventListener('mousemove', (e) => { if (hueDragging) handleHue(e); });
  document.addEventListener('mouseup', () => { hueDragging = false; });

  // Hex input
  hexInput.addEventListener('change', () => {
    let v = hexInput.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      setColor(v);
      emitChange();
    }
  });

  update();

  return {
    element: root,
    setColor,
    getStyleElement: () => styleEl,
  };
}
