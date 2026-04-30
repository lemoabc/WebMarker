let _svgHost: SVGSVGElement | null = null;
const _injectedFilters = new Set<string>();

function ensureSVGHost(): SVGSVGElement {
  if (_svgHost) return _svgHost;
  _svgHost = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  _svgHost.setAttribute('width', '0');
  _svgHost.setAttribute('height', '0');
  _svgHost.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
  document.body.appendChild(_svgHost);
  return _svgHost;
}

function colorToHex(color: string): string {
  return color.replace('#', '');
}

function filterID(texture: string, color: string): string {
  return `wm-${texture}-${colorToHex(color)}`;
}

function createFeltTipFilter(color: string): string {
  const id = filterID('felt', color);
  return `<filter id="${id}" x="-5%" y="-30%" width="110%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04 0.15" numOctaves="4" seed="2" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;
}

function createWatercolorFilter(color: string): string {
  const id = filterID('watercolor', color);
  return `<filter id="${id}" x="-10%" y="-40%" width="120%" height="180%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03 0.06" numOctaves="3" seed="5" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
    <feGaussianBlur in="displaced" stdDeviation="0.8" result="blurred"/>
    <feComposite in="blurred" in2="SourceGraphic" operator="atop"/>
  </filter>`;
}

function createCrayonFilter(color: string): string {
  const id = filterID('crayon', color);
  return `<filter id="${id}" x="-3%" y="-20%" width="106%" height="140%">
    <feTurbulence type="turbulence" baseFrequency="0.65 0.3" numOctaves="5" seed="8" result="noise"/>
    <feColorMatrix in="noise" type="luminanceToAlpha" result="alpha"/>
    <feComponentTransfer in="alpha" result="thresh">
      <feFuncA type="discrete" tableValues="0 0 0.5 1 1"/>
    </feComponentTransfer>
    <feComposite in="SourceGraphic" in2="thresh" operator="in"/>
  </filter>`;
}

const FILTER_BUILDERS: Record<string, (color: string) => string> = {
  felt: createFeltTipFilter,
  watercolor: createWatercolorFilter,
  crayon: createCrayonFilter,
};

export function ensureFilter(texture: string, color: string): string {
  if (texture === 'neon') return '';

  const id = filterID(texture, color);
  if (_injectedFilters.has(id)) return id;

  const builder = FILTER_BUILDERS[texture];
  if (!builder) return '';

  const host = ensureSVGHost();
  const filterSVG = builder(color);

  const temp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  temp.innerHTML = filterSVG;
  const filterEl = temp.firstElementChild;
  if (filterEl) {
    host.appendChild(filterEl);
  }

  _injectedFilters.add(id);
  return id;
}
