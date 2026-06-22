#!/bin/bash
#
# Figma Multi-Language Tool 启动脚本
# 
# 此脚本会:
# 1. 检查 Figma 是否已安装
# 2. 打开 Figma 设计文件
# 3. 打开插件目录（方便用户加载插件）
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$SCRIPT_DIR/figma-multilang-plugin"
FIGMA_URL="https://www.figma.com/design/8TMudffxTVqcMe5BuSwlTk/Figma-%E8%87%AA%E5%8A%A8%E6%9B%BF%E6%8D%A2%E6%96%87%E6%A1%88?node-id=0-1&p=f&t=K0j59IsHR9F06TJM-0"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🎨 Figma 多语言自动替换工具                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 Python3${NC}"
    echo "请先安装 Python3: https://www.python.org/downloads/"
    exit 1
fi

# 检查 pandas 是否安装
if ! python3 -c "import pandas" &> /dev/null; then
    echo -e "${YELLOW}📦 正在安装所需依赖...${NC}"
    
    # 尝试使用虚拟环境
    VENV_DIR="$SCRIPT_DIR/venv"
    if [ -d "$VENV_DIR" ]; then
        PYTHON_BIN="$VENV_DIR/bin/python"
    else
        echo -e "${YELLOW}创建虚拟环境...${NC}"
        python3 -m venv "$VENV_DIR"
        PYTHON_BIN="$VENV_DIR/bin/python"
        "$PYTHON_BIN" -m pip install pandas openpyxl -q
    fi
else
    PYTHON_BIN="python3"
fi

# 生成翻译 JSON
echo -e "${BLUE}📖 正在读取翻译文档...${NC}"
"$PYTHON_BIN" "$SCRIPT_DIR/translate.py" > /tmp/figma_translate_output.txt 2>&1
TRANSLATE_RESULT=$?

if [ $TRANSLATE_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ 翻译数据准备完成${NC}"
else
    echo -e "${YELLOW}⚠️  翻译数据生成有警告，请查看上方输出${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 下一步操作:"
echo ""
echo "  1. 打开 Figma Desktop 应用"
echo ""
echo "  2. 在浏览器中打开设计文件:"
echo "     $FIGMA_URL"
echo ""
echo "  3. 在 Figma 中加载插件:"
echo "     Plugins → Development → Import plugin from manifest..."
echo "     选择文件夹: $PLUGIN_DIR"
echo ""
echo "  4. 运行插件后，直接导入 Excel，或粘贴 translations.json 的内容"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# 尝试打开 Figma（如果已安装）
if command -v open &> /dev/null; then
    # 尝试打开 Figma 应用
    open -a "Figma" 2>/dev/null || true
    
    # 打开浏览器（带设计链接）
    echo -e "${BLUE}🌐 正在打开浏览器...${NC}"
    open "$FIGMA_URL" 2>/dev/null || true
    
    # 打开 Finder 到插件目录
    echo -e "${BLUE}📁 正在打开插件目录...${NC}"
    open "$PLUGIN_DIR" 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}✨ 准备完成！请按照上述步骤操作。${NC}"
echo ""
