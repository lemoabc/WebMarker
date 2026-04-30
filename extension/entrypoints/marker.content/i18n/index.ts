import zh from './zh';
import en from './en';

type LocaleMap = typeof zh;
export type LocaleKey = keyof LocaleMap;

const locales: Record<string, LocaleMap> = { zh, en };

let currentLocale: string = 'zh';

export function setLocale(locale: string): void {
  if (locale.startsWith('zh')) currentLocale = 'zh';
  else if (locales[locale]) currentLocale = locale;
  else currentLocale = 'en';
}

export function getLocale(): string {
  return currentLocale;
}

export function detectLocale(): string {
  const lang = navigator.language || 'zh-CN';
  return lang.startsWith('zh') ? 'zh' : 'en';
}

export function t(key: LocaleKey): string {
  const map = locales[currentLocale] || locales.zh;
  return map[key] || locales.zh[key] || key;
}
