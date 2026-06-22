# Figma 多语言自动替换工具

一个用于自动替换 Figma 设计稿中文字为多语言版本的工具。

## 功能特点

- 📖 自动读取 Excel 翻译文档
- 📥 支持在插件界面直接导入 `.xlsx/.xls/.csv`
- 🔄 使用英文原文作为 KEY 进行匹配替换
- 🌐 支持中文、日语、西班牙语等多种语言
- 📑 为每种语言创建独立的设计页面副本
- ⚡ 保留原始设计元素不变

## 文件结构

```
Figma脚本/
├── Figma 文案翻译.xlsx      # 翻译文档（你需要准备）
├── translations.json        # 生成的翻译数据
├── translate.py            # Python 转换脚本
├── Figma多语言替换.command  # 一键启动脚本
└── figma-multilang-plugin/
    ├── manifest.json        # 插件配置文件
    ├── code.js              # 插件主代码
    ├── ui.html              # 插件界面（已内联 Excel 解析库）
    └── release/             # 发布包
```

## 翻译文档格式

你的 Excel 文件需要包含以下列：

| en | zh | jp | es |
|---|---|---|---|
| Hello | 你好 | こんにちは | Hola |
| World | 世界 | 世界 | Mundo |

- `en` 列：英文原文（作为 KEY）
- `zh` 列：中文翻译
- `jp` 列：日语翻译
- `es` 列：西班牙语翻译

## 使用方法

### 方法一：一键启动（推荐）

1. 双击 `Figma多语言替换.command`
2. 脚本会自动：
   - 检查并安装依赖
   - 读取翻译文档
   - 生成 JSON 文件
   - 打开 Figma 和浏览器

### 方法二：手动操作

1. 安装 Python 依赖：
   ```bash
   pip install pandas openpyxl
   ```

2. 生成翻译 JSON：
   ```bash
   python3 translate.py
   ```

3. 在 Figma 中加载插件：
   - 打开 Figma Desktop 应用
   - 进入 Plugins → Development → Import plugin from manifest
   - 选择 `figma-multilang-plugin/release` 文件夹

4. 运行插件：
   - 在 Figma 中打开设计文件
   - 运行 "Figma Multi-Lang Text Replace" 插件
   - 点击「导入表格」选择 Excel，或复制 `translations.json` 的内容到插件输入框
   - 点击「开始替换」

## 工作原理

1. **读取当前页面**：插件会遍历当前页面的所有文本节点
2. **匹配替换**：用英文原文匹配翻译数据，替换为目标语言
3. **创建副本**：为每种语言创建一个新页面
4. **保留原文**：原文页面保持不变

## 注意事项

- ⚠️ 需要 Figma Desktop 应用（不支持浏览器版本）
- ⚠️ 首次使用需要在 Figma 中加载插件
- ⚠️ 确保 Figma 已登录且有文件访问权限
- ⚠️ 复杂组件可能无法完整克隆

## 常见问题

### Q: 插件加载失败？
确保 `manifest.json` 的 `main` 和 `ui` 路径正确指向已编译的文件。

### Q: 文本没有被替换？
检查翻译文档中的英文原文是否与 Figma 中的文字完全匹配（包括空格和标点）。

### Q: 如何添加更多语言？
修改 `translate.py` 中的列名映射、`ui.html` 中的 `languageColumns`，以及 `code.js` 中的 `LANGUAGES` 数组。

## 技术栈

- Python 3：数据转换
- Figma Plugin API：设计稿操作
- TypeScript：插件开发

## License

MIT
