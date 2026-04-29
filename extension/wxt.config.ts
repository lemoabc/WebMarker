import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Web Marker - 网页高亮标注',
    description: '在任意网页上高亮、标注文字，刷新不丢失',
    permissions: ['storage', 'activeTab'],
    icons: {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
});
