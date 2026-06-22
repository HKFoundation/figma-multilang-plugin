/// <reference types="@figma/plugin-typings" />
// Default supported languages (can be customized)
const LANGUAGES = [
    { code: 'zh', name: '中文' },
    { code: 'jp', name: '日本語' },
    { code: 'es', name: 'Español' },
];
// Store for the current translation data
let translations = {};
// ============================================
// UI HANDLERS
// ============================================
figma.showUI(__html__, { width: 400, height: 400 });
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'set-translations') {
        // Receive translations from the UI
        translations = msg.translations;
        figma.ui.postMessage({ type: 'translations-received', count: Object.keys(translations).length });
        // Auto start replacement after receiving translations
        await performTextReplacement();
    }
    if (msg.type === 'start-replace') {
        await performTextReplacement();
    }
    if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};
// ============================================
// TEXT REPLACEMENT LOGIC
// ============================================
async function performTextReplacement() {
    const currentPage = figma.currentPage;
    const sourceTextNodes = findTextNodes(currentPage);
    figma.ui.postMessage({
        type: 'progress',
        message: `当前页面找到 ${sourceTextNodes.length} 个文本节点`
    });
    // For each language, create a copy of the current page and replace text
    for (const lang of LANGUAGES) {
        if (!translations[lang.code]) {
            figma.ui.postMessage({
                type: 'progress',
                message: `跳过 ${lang.name}: 没有翻译数据`
            });
            continue;
        }
        figma.ui.postMessage({
            type: 'progress',
            message: `正在处理 ${lang.name}...`
        });
        // Create a new page for this language
        const newPage = figma.createPage();
        newPage.name = `${currentPage.name} - ${lang.name}`;
        // Clone all children from the current page to the new page
        for (const child of currentPage.children) {
            try {
                const cloned = child.clone();
                newPage.appendChild(cloned);
            }
            catch (error) {
                console.warn(`Failed to clone node: ${error}`);
            }
        }
        // Now find and replace text in the new page
        const pageTextNodes = findTextNodes(newPage);
        let replacedCount = 0;
        const langTranslations = Object.fromEntries(Object.entries(translations[lang.code])
            .map(([key, value]) => [key.trim(), value]));
        for (const textNode of pageTextNodes) {
            const originalText = textNode.characters.trim();
            const translatedText = langTranslations[originalText];
            if (!translatedText)
                continue;
            try {
                const fontName = textNode.fontName;
                if (fontName === figma.mixed) {
                    console.warn('Mixed fonts found, skipping');
                    continue;
                }
                await figma.loadFontAsync(fontName);
                textNode.characters = translatedText;
                replacedCount++;
            }
            catch (error) {
                console.warn(`Failed to replace text: ${error}`);
            }
        }
        figma.ui.postMessage({
            type: 'progress',
            message: `${lang.name}: 替换了 ${replacedCount} 个文本`
        });
    }
    figma.ui.postMessage({
        type: 'complete',
        message: '完成！已创建所有语言版本。'
    });
}
function findTextNodes(node) {
    const result = [];
    if ('characters' in node) {
        result.push(node);
    }
    if ('children' in node) {
        for (const child of node.children) {
            result.push(...findTextNodes(child));
        }
    }
    return result;
}
// ============================================
// INITIALIZATION
// ============================================
// Send initial message to UI
figma.ui.postMessage({
    type: 'init',
    message: '插件已加载，请在右侧输入翻译 JSON 数据'
});
