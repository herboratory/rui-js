/**
 * Rue I18n - 輕量級純 JS 國際化套件
 * 基於 data-i18n 屬性的簡單語言切換
 */
class RueI18n {
    constructor(options = {}) {
        this.currentLang = options.defaultLang || 'en';
        this.fallbackLang = options.fallbackLang || 'en';
        this.translations = {};
        this.storageKey = options.storageKey || 'rue_i18n_lang';
        this.autoSave = options.autoSave !== false; // 預設開啟
        
        // 載入儲存的語言設定（包在 try/catch 以防 Safari 無痕模式拋出 SecurityError）
        if (this.autoSave) {
            const saved = this._storageGet(this.storageKey);
            if (saved) this.currentLang = saved;
        }
    }

    /**
     * 安全讀取 localStorage（Safari 無痕模式會拋出 SecurityError）
     * @private
     */
    _storageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    /**
     * 安全寫入 localStorage
     * @private
     */
    _storageSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            // 無痕模式或儲存空間已滿時靜默失敗
        }
    }

    /**
     * 添加翻譯字典
     * @param {string} lang - 語言代碼 (如 'zh-TW', 'en')
     * @param {object} translations - 翻譯對象
     */
    addTranslations(lang, translations) {
        this.translations[lang] = { ...this.translations[lang], ...translations };
        return this;
    }

    /**
     * 批量添加多語言翻譯
     * @param {object} langPack - 語言包 { 'zh-TW': {...}, 'en': {...} }
     */
    addLanguagePack(langPack) {
        Object.keys(langPack).forEach(lang => {
            this.addTranslations(lang, langPack[lang]);
        });
        return this;
    }

    /**
     * 獲取翻譯文本
     * @param {string} key - 翻譯鍵值
     * @param {string} lang - 指定語言 (可選)
     * @returns {string} 翻譯後的文本
     */
    t(key, lang = null) {
        const targetLang = lang || this.currentLang;
        
        // 嘗試獲取目標語言翻譯
        if (this.translations[targetLang] && this.translations[targetLang][key]) {
            return this.translations[targetLang][key];
        }
        
        // 回退到預設語言
        if (targetLang !== this.fallbackLang && 
            this.translations[this.fallbackLang] && 
            this.translations[this.fallbackLang][key]) {
            return this.translations[this.fallbackLang][key];
        }
        
        // 都沒有就返回 key 本身
        return key;
    }

    /**
     * 切換語言
     * @param {string} lang - 目標語言代碼
     * @param {boolean} updateDOM - 是否自動更新 DOM (預設 true)
     */
    setLanguage(lang, updateDOM = true) {
        this.currentLang = lang;
        
        // 儲存到 localStorage
        if (this.autoSave) {
            this._storageSet(this.storageKey, lang);
        }
        
        // 自動更新 DOM - 延遲執行以確保動態內容也被翻譯
        if (updateDOM) {
            // 立即更新一次
            this.updateDOM();
            
            // 延遲更新以處理動態內容
            setTimeout(() => {
                this.updateDOM();
            }, 100);
            
            // 再次延遲更新以確保所有動態內容都被處理
            setTimeout(() => {
                this.updateDOM();
            }, 500);
        }
        
        // 觸發語言變更事件
        this.emit('languageChanged', { lang, translations: this.translations[lang] });
        
        return this;
    }

    /**
     * 更新 DOM 中所有帶 data-i18n 屬性的元素
     */
    updateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // 只有真正的表單輸入元素才寫入 placeholder
            const isFormInput = ['INPUT', 'TEXTAREA'].includes(el.tagName);
            if (isFormInput) {
                el.placeholder = translation;
            } else {
                // 支援 HTML 內容 (如 <strong>, <i> 標籤)
                el.innerHTML = translation;
            }
        });
        
        return this;
    }

    /**
     * 獲取當前語言
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * 獲取可用語言列表
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    /**
     * 檢查是否有某語言的翻譯
     */
    hasLanguage(lang) {
        return !!this.translations[lang];
    }

    /**
     * 簡單事件系統
     */
    on(event, callback) {
        if (!this.events) this.events = {};
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
        return this;
    }

    emit(event, data) {
        if (!this.events || !this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
        return this;
    }

    /**
     * 自動偵測瀏覽器語言
     */
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const availableLangs = this.getAvailableLanguages();
        
        // 精確匹配
        if (availableLangs.includes(browserLang)) {
            return browserLang;
        }
        
        // 語言前綴匹配 (如 zh-TW -> zh)
        const langPrefix = browserLang.split('-')[0];
        const match = availableLangs.find(lang => lang.startsWith(langPrefix));
        
        return match || this.fallbackLang;
    }

    /**
     * 自動初始化 - 偵測語言並更新 DOM
     */
    autoInit() {
        if (!this.autoSave || !this._storageGet(this.storageKey)) {
            const detected = this.detectBrowserLanguage();
            this.setLanguage(detected);
        } else {
            this.updateDOM();
        }
        return this;
    }
}

// 如果在瀏覽器環境，掛載到 window
if (typeof window !== 'undefined') {
    window.RueI18n = RueI18n;
}

// 如果在 Node.js 環境，導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RueI18n;
}