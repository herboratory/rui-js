/**
 * Rue I18n 動態載入器
 * 自動載入 JSON 翻譯檔案
 */
class RueI18nLoader {
    constructor(options = {}) {
        this.basePath = options.basePath || './locales/';
        this.languages = options.languages || ["en","zh-TW","zh-CN"];
        this.cache = {};
    }

    /**
     * 載入指定語言的翻譯
     */
    async loadLanguage(lang) {
        if (this.cache[lang]) {
            return this.cache[lang];
        }

        try {
            const response = await fetch(`${this.basePath}${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang}.json`);
            }
            
            const translations = await response.json();
            this.cache[lang] = this.flattenTranslations(translations);
            return this.cache[lang];
        } catch (error) {
            console.warn(`Warning: Could not load translations for ${lang}`, error);
            return {};
        }
    }

    /**
     * 將巢狀物件扁平化
     */
    flattenTranslations(obj, prefix = '') {
        const flattened = {};
        
        for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                Object.assign(flattened, this.flattenTranslations(obj[key], fullKey));
            } else {
                flattened[fullKey] = obj[key];
            }
        }
        
        return flattened;
    }

    /**
     * 初始化 RueI18n 並載入翻譯
     */
    async initializeI18n(options = {}) {
        const i18n = new RueI18n(options);
        
        // 載入所有語言的翻譯
        for (const lang of this.languages) {
            const translations = await this.loadLanguage(lang);
            i18n.addTranslations(lang, translations);
        }
        
        return i18n;
    }
}

// 如果在瀏覽器環境，掛載到 window
if (typeof window !== 'undefined') {
    window.RueI18nLoader = RueI18nLoader;
}

// 如果在 Node.js 環境，導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RueI18nLoader;
}
