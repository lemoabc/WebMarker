const zh: Record<string, string> = {
  'popup.pageAnnotations': '当前页面标注',
  'popup.enableAnnotation': '启用标注',
  'popup.export': '导出标注',
  'popup.import': '导入标注',
  'popup.noAnnotations': '无标注',
  'popup.exported': '已导出',
  'popup.formatError': '格式错误',
  'popup.importFailed': '导入失败',
  'popup.fileUrlHint': '提示：本地文件需在扩展详情页开启「允许访问文件网址」',
  'popup.freeVersion': '免费版',
  'popup.activatePro': '激活 Pro',
  'popup.emailPlaceholder': '邮箱',
  'popup.keyPlaceholder': '许可证密钥',
  'popup.verify': '验证',
  'popup.verifying': '验证中...',
  'popup.fillComplete': '请填写完整',
  'popup.language': '语言',
  'popup.exportPro': '导出标注 (Pro)',
  'popup.importPro': '导入标注 (Pro)',
  'popup.addedItems': '+{n} 条',
  'popup.shortcutsTitle': '快捷操作',
  'popup.escHint': '取消当前工具 / 再按折叠面板',
  'popup.rightClick': '右键',
  'popup.rightClickHint': '快速激活工具（用上次配置）',
  'popup.leftClick': '左键',
  'popup.leftClickHint': '打开工具配置面板',
  'popup.dragFab': '拖拽',
  'popup.dragFabHint': '移动悬浮按钮到任意位置',
};

const en: Record<string, string> = {
  'popup.pageAnnotations': 'Page Annotations',
  'popup.enableAnnotation': 'Enable',
  'popup.export': 'Export',
  'popup.import': 'Import',
  'popup.noAnnotations': 'None',
  'popup.exported': 'Exported',
  'popup.formatError': 'Bad format',
  'popup.importFailed': 'Failed',
  'popup.fileUrlHint': 'Tip: Enable "Allow access to file URLs" in extension details for local files',
  'popup.freeVersion': 'Free',
  'popup.activatePro': 'Activate Pro',
  'popup.emailPlaceholder': 'Email',
  'popup.keyPlaceholder': 'License Key',
  'popup.verify': 'Verify',
  'popup.verifying': 'Verifying...',
  'popup.fillComplete': 'Please fill all fields',
  'popup.language': 'Language',
  'popup.exportPro': 'Export (Pro)',
  'popup.importPro': 'Import (Pro)',
  'popup.addedItems': '+{n} items',
  'popup.shortcutsTitle': 'Shortcuts',
  'popup.escHint': 'Deactivate tool / Close panel',
  'popup.rightClick': 'Right-click',
  'popup.rightClickHint': 'Quick activate (last config)',
  'popup.leftClick': 'Left-click',
  'popup.leftClickHint': 'Open tool settings',
  'popup.dragFab': 'Drag',
  'popup.dragFabHint': 'Move the floating button',
};

const locales: Record<string, Record<string, string>> = { zh, en };
let current = 'zh';

export function setPopupLocale(locale: string): void {
  if (locale.startsWith('zh')) current = 'zh';
  else current = 'en';
}

export function getPopupLocale(): string {
  return current;
}

export function tp(key: string, params?: Record<string, string | number>): string {
  const map = locales[current] || locales.zh;
  let val = map[key] || locales.zh[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(`{${k}}`, String(v));
    }
  }
  return val;
}
