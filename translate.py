#!/usr/bin/env python3
"""
Figma Multi-Language Translation Converter
将 Excel 翻译文档转换为 Figma Plugin 所需的 JSON 格式

用法:
    python3 translate.py [xlsx_file] [output_json]
    
示例:
    python3 translate.py "Figma 文案翻译.xlsx" "translations.json"
"""

import sys
import json
import pandas as pd
from pathlib import Path


def read_translation_excel(xlsx_path: str) -> dict:
    """
    读取 Excel 翻译文件并转换为 JSON 格式
    
    Excel 格式:
    - 第一列 (Unnamed: 0): 留空
    - en 列: 英文原文 (KEY)
    - zh 列: 中文翻译
    - jp 列: 日语翻译
    - es 列: 西班牙语翻译
    """
    df = pd.read_excel(xlsx_path)
    
    # 清理数据：移除全是 NaN 的行
    df = df.dropna(how='all')
    
    # 构建翻译数据结构
    translations = {
        'zh': {},
        'jp': {},
        'es': {}
    }
    
    for _, row in df.iterrows():
        # 使用英文原文作为 KEY
        en_key = row['en']
        
        # 跳过无效行
        if pd.isna(en_key) or not isinstance(en_key, str):
            continue
            
        en_key = en_key.strip()
        
        # 添加翻译（只添加非空翻译）
        if 'zh' in df.columns and not pd.isna(row.get('zh')):
            translations['zh'][en_key] = str(row['zh']).strip()
        
        if 'jp' in df.columns and not pd.isna(row.get('jp')):
            translations['jp'][en_key] = str(row['jp']).strip()
        
        if 'es' in df.columns and not pd.isna(row.get('es')):
            translations['es'][en_key] = str(row['es']).strip()
    
    return translations


def print_preview(translations: dict):
    """打印翻译预览"""
    print("\n" + "=" * 60)
    print("📋 翻译数据预览")
    print("=" * 60)
    
    for lang, trans in translations.items():
        lang_name = {'zh': '中文', 'jp': '日本語', 'es': 'Español'}.get(lang, lang)
        print(f"\n🌐 {lang_name} ({lang}): {len(trans)} 条翻译")
        
        # 只显示前5条预览
        items = list(trans.items())[:5]
        for key, value in items:
            # 截断过长的文本
            key_display = key[:30] + '...' if len(key) > 30 else key
            value_display = value[:30] + '...' if len(value) > 30 else value
            print(f"  • {key_display} → {value_display}")
        
        if len(trans) > 5:
            print(f"  ... 还有 {len(trans) - 5} 条")
    
    print("\n" + "=" * 60)


def main():
    # 默认路径 - 使用相对路径
    script_dir = Path(__file__).parent.resolve()
    default_xlsx = script_dir / "Figma 文案翻译.xlsx"
    default_output = script_dir / "translations.json"
    
    # 解析命令行参数
    if len(sys.argv) >= 2:
        xlsx_path = sys.argv[1]
    else:
        xlsx_path = str(default_xlsx)
    
    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        output_path = str(default_output)
    
    xlsx_path = Path(xlsx_path)
    output_path = Path(output_path)
    
    # 检查文件是否存在
    if not xlsx_path.exists():
        print(f"❌ 错误: 找不到文件 '{xlsx_path}'")
        print(f"\n请确保 Excel 文件存在，或指定正确路径:")
        print(f"  python3 translate.py \"path/to/your/file.xlsx\"")
        sys.exit(1)
    
    try:
        print(f"📖 正在读取: {xlsx_path}")
        translations = read_translation_excel(xlsx_path)
        
        # 统计
        total_keys = len(translations.get('zh', {}))
        total_langs = sum(1 for lang, trans in translations.items() if trans)
        
        print(f"✅ 成功读取 {total_langs} 种语言，共 {total_keys} 个翻译 KEY")
        
        # 打印预览
        print_preview(translations)
        
        # 写入 JSON 文件
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(translations, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 JSON 文件已保存: {output_path}")
        print(f"\n📝 使用方法:")
        print(f"  1. 在 Figma 中打开你的设计文件")
        print(f"  2. 运行 Figma Multi-Lang Plugin")
        print(f"  3. 复制 translations.json 的内容到插件的 JSON 输入框")
        print(f"  4. 点击「开始替换」")
        
        # 输出 JSON 内容供复制
        print("\n" + "-" * 60)
        print("📋 JSON 内容 (可直接复制):")
        print("-" * 60)
        print(json.dumps(translations, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
