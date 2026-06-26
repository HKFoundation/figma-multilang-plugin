/// <reference types="@figma/plugin-typings" />
// Default supported languages (can be customized)
const LANGUAGES = [
    { code: 'zh', name: '中文' },
    { code: 'jp', name: '日本語' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
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
    const selection = currentPage.selection;
    if (selection.length !== 1) {
        figma.ui.postMessage({
            type: 'error',
            message: selection.length === 0
                ? '请先在画布上选中一个 Layer 后再开始替换'
                : `当前选中了 ${selection.length} 个节点，请只选中 1 个 Layer`
        });
        return;
    }
    const sourceLayer = selection[0];
    const parent = sourceLayer.parent;
    const GAP = 20; // horizontal gap between clones in pixels
    // The clone inherits the source layer's rotation, so we must place it
    // using the layer's intrinsic (un-rotated) x/y. After a -90° rotation,
    // stepping along the intrinsic +x axis corresponds to moving the visual
    // right edge forward by `height + GAP` for each language slot.
    const sourceX = sourceLayer.x;
    const sourceY = sourceLayer.y;
    const stepX = sourceLayer.height + GAP;
    figma.ui.postMessage({
        type: 'progress',
        message: `已选中 Layer: "${sourceLayer.name}"`
    });
    // For each language, clone the selected layer next to itself and replace text
    for (const lang of LANGUAGES) {
        if (lang.code === 'zh') continue; // keep original layer in Chinese
        if (!translations[lang.code]) {
            figma.ui.postMessage({
                type: 'progress',
                message: `跳过 ${lang.name}: 没有翻译数据`
            });
            continue;
        }
        let clonedLayer;
        try {
            clonedLayer = sourceLayer.clone();
            clonedLayer.name = `${sourceLayer.name} - ${lang.name}`;
            // Keep the source layer's rotation intact so the clone matches visually.
            parent.appendChild(clonedLayer);
            // Tile clones along the intrinsic +x axis so they appear visually
            // to the right of the source layer (one per language slot).
            const langIndex = LANGUAGES.indexOf(lang);
            clonedLayer.x = sourceX + stepX * langIndex;
            clonedLayer.y = sourceY;
        }
        catch (error) {
            console.warn(`Failed to clone layer: ${error}`);
            figma.ui.postMessage({
                type: 'progress',
                message: `${lang.name}: 克隆 Layer 失败 - ${error}`
            });
            continue;
        }
        figma.ui.postMessage({
            type: 'progress',
            message: `正在处理 ${lang.name}...`
        });
        const layerTextNodes = findTextNodes(clonedLayer);
        let replacedCount = 0;
        // Normalize translation keys (trim whitespace) without Object.fromEntries
        // (ES2019) so the plugin works in environments with older runtimes.
        const langTranslations = {};
        const rawTranslations = translations[lang.code];
        for (const key of Object.keys(rawTranslations))
            langTranslations[key.trim()] = rawTranslations[key];
        for (const textNode of layerTextNodes) {
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
                // Japanese uses Noto Sans JP (Google Fonts). Fall back to the
                // existing font if the requested style can't be loaded.
                if (lang.code === 'jp') {
                    const jpFontName = {
                        family: 'Noto Sans JP',
                        style: fontName.style,
                    };
                    try {
                        await figma.loadFontAsync(jpFontName);
                        textNode.fontName = jpFontName;
                    }
                    catch (fontErr) {
                        console.warn(`Noto Sans JP (${fontName.style}) unavailable, keeping original font`, fontErr);
                    }
                }
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
        message: '完成！已生成日语/西语/德语/法语/意大利语版本（中文原 Layer 保留）'
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
    message: '插件已加载，请在画布上选中一个 Layer，再输入翻译 JSON 后开始替换'
});
