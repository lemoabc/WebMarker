# Web Marker 产品路线图

## 项目定位

**一句话定位**：把任意网页（本地或在线）变成可高亮、可标注、可演示的交互画布。

**核心差异化**：不做"又一个网页高亮工具"，而是瞄准三个被现有产品忽视的场景——
1. AI 生成的本地 HTML 文件的阅读标注
2. 任意网页上的实时演示标注（类似 PPT 激光笔/画笔）
3. 标注结果的分享与协作

---

## 项目技术栈

| 组件 | 技术 |
|------|------|
| 扩展框架 | WXT 0.20（基于 Vite 8，TypeScript） |
| 构建目标 | Chrome Manifest V3 |
| 内容脚本 | `defineContentScript`，`matches: ['*://*/*', 'file:///*']` |
| UI 隔离 | Shadow DOM（`mode: 'closed'`） |
| 存储 | `wxt/utils/storage`（封装 `chrome.storage.local`） |
| 文本锚定 | XPath + 字符偏移 + 上下文验证 |

### 项目结构

```
extension/
├── wxt.config.ts                    # WXT 配置
├── entrypoints/
│   ├── background.ts                # Service Worker
│   ├── popup/                       # 扩展弹窗
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── main.ts
│   │   └── i18n.ts                  # Popup 独立 i18n
│   └── marker.content/              # 内容脚本（核心）
│       ├── index.ts                 # 主入口，事件编排
│       ├── core.ts                  # 常量、XPath、DOM 操作
│       ├── state.ts                 # AppState、UserPreferences
│       ├── store.ts                 # 存储层（标注、偏好、FAB 位置）
│       ├── ui.ts                    # 侧边面板 + FAB + 拖拽
│       ├── mini-toolbar.ts          # 选中文字后的迷你工具条
│       ├── cursors.ts               # 动态 SVG 光标
│       ├── color-picker.ts          # 自定义 HSV 颜色选择器
│       ├── filters.ts               # SVG 滤镜（刷痕纹理）
│       ├── pro.ts                   # Pro 许可证管理 & 功能门控
│       ├── i18n/                    # 国际化
│       │   ├── index.ts             # t() 函数、setLocale/getLocale
│       │   ├── zh.ts                # 中文翻译
│       │   └── en.ts                # 英文翻译
│       └── tools/                   # 可扩展的工具注册系统
│           ├── registry.ts          # ToolDefinition 接口 & 注册 API
│           ├── index.ts             # 导出桶文件
│           ├── highlight.ts         # 背景高亮
│           ├── text-color.ts        # 文字变色
│           ├── underline.ts         # 下划线（6 种线型）
│           ├── brush-highlight.ts   # 刷痕高亮（4 种纹理）
│           └── eraser.ts            # 橡皮擦
└── public/icons/                    # 扩展图标
```

---

## 演进路线

### Phase 0：油猴脚本 MVP ✅ 已完成

> 验证核心交互，积累早期用户反馈。

- ✅ 侧边栏工具面板（Shadow DOM 隔离）
- ✅ 背景高亮（5 色）、文字变色（5 色）
- ✅ 橡皮擦 / 清除全部
- ✅ XPath + 字符偏移锚定，刷新恢复
- ✅ 本地 `file://` 文件支持
- ✅ 自定义光标（刷子/鹅毛笔/橡皮擦），颜色动态变化
- ✅ ESC 快捷键一键失活当前工具

---

### Phase 1：Chrome 扩展迁移 ✅ 已完成

> 从油猴脚本升级为独立 Chrome 扩展，覆盖在线网页场景。

- ✅ WXT 框架 + Manifest V3 架构
- ✅ Content Script 注入所有页面（`*://*/*` + `file:///*`）
- ✅ `chrome.storage.local` 替换 GM API
- ✅ Popup 面板（开关、标注计数）
- ✅ Background Service Worker（`onInstalled` 事件）
- ✅ 在线网页 + 本地文件双重支持
- ✅ 构建产物可直接以"解压扩展"加载

---

### Phase 2：扩展标注工具 ✅ 已完成

> 丰富标注手段，建立产品差异化。

#### 2.1 工具注册系统
- ✅ `ToolDefinition` 接口 + `registerTool` 注册 API
- ✅ 工具与 UI 解耦，新增工具只需写一个文件
- ✅ 每个工具独立定义：图标、颜色盘、光标、样式选项、应用逻辑

#### 2.2 下划线工具
- ✅ 6 种线型：实线、虚线、波浪、双线、手绘（SVG）、马克笔（SVG）
- ✅ 自定义颜色，CSS `text-decoration` + SVG `background-image` 双引擎

#### 2.3 刷痕高亮工具
- ✅ 4 种纹理：马克笔（SVG 滤镜）、水彩（SVG 滤镜）、蜡笔（SVG 滤镜）、霓虹（CSS box-shadow）
- ✅ SVG 滤镜懒注入机制（`filters.ts`）

#### 2.4 自定义颜色选择器
- ✅ HSV 色盘 + 色相滑块 + HEX 输入
- ✅ 最近使用颜色记忆

---

### Phase 3：UI/UX 打磨 + 商业化基础 ✅ 已完成

> 优化交互细节，建立付费基础。

#### 3.1 侧边面板
- ✅ "连接式展开"面板：主面板右侧对齐，子面板向左展开
- ✅ 单击工具按钮 → 打开配置子面板；右键 → 快速激活上次配置
- ✅ 工具配置持久化（`UserPreferences.toolConfigs`）

#### 3.2 迷你工具条
- ✅ 选中文字后弹出 3 个快捷工具槽 + 展开按钮
- ✅ 颜色徽标 + 智能定位避免超出屏幕
- ✅ 首次使用"点击即可标注"引导提示

#### 3.3 FAB 悬浮按钮
- ✅ 自由拖拽 + 3px 死区区分点击/拖拽
- ✅ 松手自动吸附到最近屏幕边缘（200ms ease 动画）
- ✅ 吸附左侧时面板方向翻转（`flex-direction: row-reverse`）
- ✅ 位置记忆（`chrome.storage.local`），页面加载时恢复
- ✅ 拖拽时自动收起面板
- ✅ 面板展开方向自适应：FAB 靠近底部时面板向上展开（绝对定位，FAB 位置不变）

#### 3.4 交互优化
- ✅ 修复迷你工具条展开按钮不生效的 bug（`openPanelFn` 幂等化）
- ✅ 左键点击工具 → 打开配置子面板（不立即标注，让用户先选颜色/样式）
- ✅ 右键点击工具 → 用上次配置快速激活 + 对已有选区立即标注
- ✅ 工具激活后保持活跃，连续选中即连续标注
- ✅ ESC 链式行为：第一次取消工具，第二次折叠面板（回到迷你工具条模式）
- ✅ Popup 面板新增「快捷操作」说明区域（Esc / 右键 / 左键 / 拖拽）

#### 3.5 导出/导入
- ✅ 当前页面标注导出为 JSON
- ✅ JSON 导入合并，自动去重

#### 3.6 买断制 Pro
- ✅ 本地 `LicenseState` 存储 + UI 功能门控
- ✅ Popup 中的 Pro 激活入口（邮箱 + 许可证密钥）
- ✅ 免费/Pro 功能边界：下划线手绘/马克笔 Pro、刷痕水彩/蜡笔/霓虹 Pro、自定义颜色 Pro

#### 3.7 国际化（i18n）
- ✅ `t(key)` 同步翻译函数 + `setLocale/getLocale/detectLocale`
- ✅ 中文（zh）/ 英文（en）双语言包
- ✅ 语言优先级：用户手动选择 > 浏览器语言 > 降级中文
- ✅ 内容脚本全量替换：工具标签、样式标签、UI 文案、hover title
- ✅ Popup 全量替换 + 语言切换下拉框 + 快捷操作说明
- ✅ 语言偏好持久化（`UserPreferences.locale`）
- ✅ 切换语言后自动刷新页面使内容脚本生效

---

### Phase 4：体验增强（下一步计划）🔜

> 目标：完善细节，准备上架 Chrome Web Store。

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 快捷键绑定 | P0 | `Alt+H` 高亮、`Alt+E` 擦除等 |
| 标注数量角标 | P1 | `chrome.action.setBadgeText` 显示在扩展图标 |
| 动态页面锚定增强 | P1 | MutationObserver + 文本指纹双重验证 |
| 标注管理列表 | P2 | 侧边栏宽模式展示所有标注，点击跳转 |
| Chrome Web Store 上架 | P2 | 图标/截图/描述/隐私政策 |
| Edge Add-ons 同步上架 | P3 | WXT 天然支持多浏览器 |

---

### Phase 5：演示模式（核心差异化能力）

> 把网页变成演示画布——竞品几乎没有做好的场景。

| 工具 | 说明 |
|------|------|
| 画笔 | 自由手绘，Canvas overlay |
| 直线 / 箭头 | 指示关系或方向 |
| 矩形 / 椭圆框选 | 圈出重点区域 |
| 激光笔 | 红色光点跟随鼠标，2 秒消失 |
| 聚焦灯 | 页面变暗，鼠标周围高亮 |
| 文字标签 | 任意位置放置便签 |

技术方案：Canvas 层（绘制）+ SVG 层（可交互标注）+ 原始网页层（文本标注）

---

### Phase 6：批注与协作

- 在标注上添加 Markdown 批注
- 快照导出（PNG / PDF）
- 链接分享（标注数据编码到 URL fragment 或轻量后端）
- 多人实时协作（WebSocket / WebRTC）
- 云同步 + 用户账号系统

---

### Phase 7：AI 增强（远期愿景）

- 智能高亮：一键标注页面关键信息
- 摘要生成：基于标注自动生成结构化笔记
- 标注建议：阅读时推荐可标注段落
- 多语言翻译：标注区域一键翻译

---

## 商业模式

**定价策略：一次性买断制**

### 免费层（永久免费）

- 背景高亮（5 色）+ 文字变色（5 色）
- 下划线基础样式（实线、虚线、波浪）
- 刷痕基础样式（马克笔）
- 橡皮擦 / 清除
- 本地文件 + 在线网页
- 本地持久化存储
- 迷你工具条 + 侧边面板
- 中英文双语

### Pro 层（一次性买断 ¥68）

- 下划线进阶样式（双线、手绘、马克笔）
- 刷痕进阶纹理（水彩、蜡笔、霓虹）
- 自定义 HSV 颜色选择器
- 标注导出/导入
- 未来所有 Pro 功能免费升级

### Team 层（远期规划）

- Pro 全部功能
- 多人实时协作
- 云同步 + 团队空间

---

## 竞争策略

### 切入缝隙市场

1. **AI 内容阅读者**：ChatGPT / Claude 生成的 HTML 报告需要标注——现有工具几乎不支持本地文件
2. **在线授课/演示**：在任意网页上实时标注——没有轻量解决方案
3. **内容创作者**：在参考网页做标注、截图分享

### 增长飞轮

```
免费扩展 → 口碑传播 → 用户量
   ↓                      ↓
GitHub 开源社区    付费转化（Pro 买断）
   ↓                      ↓
开发者贡献       →  收入 → 持续投入
```

---

## 当前版本

**v0.3.1** — Chrome 扩展 + 扩展工具 + UI/UX 打磨 + i18n + 快捷操作说明

**构建方式**：

```bash
cd extension
pnpm install
pnpm run build
# 产物在 extension/.output/chrome-mv3/
# 在 Chrome/Edge 扩展管理页加载"解压缩的扩展"即可
```
