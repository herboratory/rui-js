/**
 * SEOManager - SEO Meta Tags 管理模組
 * 
 * 功能：
 * - 注入和更新 SEO meta tags（title、description、keywords、og:*、twitter:*）
 * - 支援從 Entry frontmatter 提取 SEO 資訊
 * - 支援 fallback 機制（title → entry.title，description → entry.summary）
 * - 清理和驗證 meta content
 * - 更新 document.title 和 html lang 屬性
 */

class SEOManager {
    /**
     * 創建 SEOManager 實例
     * @param {Object} config - SEO 配置
     * @param {boolean} config.enabled - 是否啟用 SEO 功能，預設 true
     * @param {Object} config.defaultMeta - 預設的 meta tags
     * @param {Function} config.template - 自訂 meta tags 模板函數
     */
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled !== false,
            defaultMeta: config.defaultMeta || {},
            template: config.template || null
        };

        // 預設 meta tags
        this.defaultMeta = {
            title: config.defaultMeta?.title || '',
            description: config.defaultMeta?.description || '',
            keywords: config.defaultMeta?.keywords || '',
            ogTitle: config.defaultMeta?.ogTitle || '',
            ogDescription: config.defaultMeta?.ogDescription || '',
            ogImage: config.defaultMeta?.ogImage || '',
            ogType: config.defaultMeta?.ogType || 'website',
            ogUrl: config.defaultMeta?.ogUrl || '',
            twitterCard: config.defaultMeta?.twitterCard || 'summary',
            twitterTitle: config.defaultMeta?.twitterTitle || '',
            twitterDescription: config.defaultMeta?.twitterDescription || '',
            twitterImage: config.defaultMeta?.twitterImage || '',
            canonical: config.defaultMeta?.canonical || ''
        };

        // 當前 meta tags
        this.currentMeta = { ...this.defaultMeta };

        // 存儲已創建的 meta 元素引用
        this.metaElements = new Map();
    }

    /**
     * 從 Entry 注入 SEO meta tags
     * @param {Object} entry - Entry 物件
     */
    injectMeta(entry) {
        if (!this.config.enabled) {
            return;
        }

        // 提取 Entry 的 SEO 資訊
        const metaTags = this.extractMetaFromEntry(entry);

        // 更新 meta tags
        this.updateMeta(metaTags);
    }

    /**
     * 更新 meta tags
     * @param {Object} tags - Meta tags 物件
     */
    updateMeta(tags) {
        if (!this.config.enabled) {
            return;
        }

        // 更新當前 meta
        this.currentMeta = { ...this.currentMeta, ...tags };

        // 更新 document.title
        if (tags.title) {
            this.updateDocumentTitle(tags.title);
        }

        // 更新標準 meta tags
        if (tags.description) {
            this.createOrUpdateMetaTag('description', tags.description);
        }

        if (tags.keywords) {
            this.createOrUpdateMetaTag('keywords', tags.keywords);
        }

        // 更新 Open Graph tags
        if (tags.ogTitle) {
            this.createOrUpdateMetaTag('og:title', tags.ogTitle, 'property');
        }

        if (tags.ogDescription) {
            this.createOrUpdateMetaTag('og:description', tags.ogDescription, 'property');
        }

        if (tags.ogImage) {
            this.createOrUpdateMetaTag('og:image', tags.ogImage, 'property');
        }

        if (tags.ogType) {
            this.createOrUpdateMetaTag('og:type', tags.ogType, 'property');
        }

        if (tags.ogUrl) {
            this.createOrUpdateMetaTag('og:url', tags.ogUrl, 'property');
        }

        // 更新 Twitter Card tags
        if (tags.twitterCard) {
            this.createOrUpdateMetaTag('twitter:card', tags.twitterCard);
        }

        if (tags.twitterTitle) {
            this.createOrUpdateMetaTag('twitter:title', tags.twitterTitle);
        }

        if (tags.twitterDescription) {
            this.createOrUpdateMetaTag('twitter:description', tags.twitterDescription);
        }

        if (tags.twitterImage) {
            this.createOrUpdateMetaTag('twitter:image', tags.twitterImage);
        }

        // 更新 canonical link
        if (tags.canonical) {
            this.createOrUpdateCanonicalLink(tags.canonical);
        }
    }

    /**
     * 創建或更新單一 meta tag
     * @param {string} name - Meta tag 名稱
     * @param {string} content - Meta tag 內容
     * @param {string} attribute - 使用的屬性名稱（'name' 或 'property'），預設 'name'
     */
    createOrUpdateMetaTag(name, content, attribute = 'name') {
        if (!name || !content) {
            return;
        }

        // 清理內容
        const sanitizedContent = this.sanitizeMetaContent(content);

        // 查找現有的 meta 元素
        let metaElement = this.metaElements.get(name);

        if (!metaElement) {
            // 嘗試從 DOM 中查找
            metaElement = document.querySelector(`meta[${attribute}="${name}"]`);

            if (!metaElement) {
                // 創建新的 meta 元素
                metaElement = document.createElement('meta');
                metaElement.setAttribute(attribute, name);
                document.head.appendChild(metaElement);
            }

            // 存儲引用
            this.metaElements.set(name, metaElement);
        }

        // 更新內容
        metaElement.setAttribute('content', sanitizedContent);
    }

    /**
     * 創建或更新 canonical link
     * @param {string} url - Canonical URL
     */
    createOrUpdateCanonicalLink(url) {
        if (!url) {
            return;
        }

        let linkElement = this.metaElements.get('canonical');

        if (!linkElement) {
            // 嘗試從 DOM 中查找
            linkElement = document.querySelector('link[rel="canonical"]');

            if (!linkElement) {
                // 創建新的 link 元素
                linkElement = document.createElement('link');
                linkElement.setAttribute('rel', 'canonical');
                document.head.appendChild(linkElement);
            }

            // 存儲引用
            this.metaElements.set('canonical', linkElement);
        }

        // 更新 href
        linkElement.setAttribute('href', url);
    }

    /**
     * 移除 meta tag
     * @param {string} name - Meta tag 名稱
     */
    removeMetaTag(name) {
        const metaElement = this.metaElements.get(name);

        if (metaElement && metaElement.parentNode) {
            metaElement.parentNode.removeChild(metaElement);
            this.metaElements.delete(name);
        }
    }

    /**
     * 恢復預設 meta tags
     */
    restoreDefaultMeta() {
        if (!this.config.enabled) {
            return;
        }

        this.updateMeta(this.defaultMeta);
    }

    /**
     * 從 Entry 提取 SEO 資訊
     * @param {Object} entry - Entry 物件
     * @returns {Object} Meta tags 物件
     */
    extractMetaFromEntry(entry) {
        if (!entry) {
            return {};
        }

        // 如果有自訂模板函數，使用它
        if (this.config.template && typeof this.config.template === 'function') {
            return this.config.template(entry);
        }

        const meta = {};

        // 從 entry.seo 欄位提取（優先）
        if (entry.seo && typeof entry.seo === 'object') {
            meta.title = entry.seo.title || entry.title || this.defaultMeta.title;
            meta.description = entry.seo.description || entry.summary || this.defaultMeta.description;
            meta.keywords = entry.seo.keywords || this.defaultMeta.keywords;
            meta.ogTitle = entry.seo.ogTitle || entry.seo.title || entry.title || this.defaultMeta.ogTitle;
            meta.ogDescription = entry.seo.ogDescription || entry.seo.description || entry.summary || this.defaultMeta.ogDescription;
            meta.ogImage = entry.seo.ogImage || this.defaultMeta.ogImage;
            meta.ogType = entry.seo.ogType || this.defaultMeta.ogType;
            meta.ogUrl = entry.seo.ogUrl || this.defaultMeta.ogUrl;
            meta.twitterCard = entry.seo.twitterCard || this.defaultMeta.twitterCard;
            meta.twitterTitle = entry.seo.twitterTitle || entry.seo.title || entry.title || this.defaultMeta.twitterTitle;
            meta.twitterDescription = entry.seo.twitterDescription || entry.seo.description || entry.summary || this.defaultMeta.twitterDescription;
            meta.twitterImage = entry.seo.twitterImage || entry.seo.ogImage || this.defaultMeta.twitterImage;
            meta.canonical = entry.seo.canonical || this.defaultMeta.canonical;
        } else {
            // Fallback：使用 entry 的基本欄位
            meta.title = entry.title || this.defaultMeta.title;
            meta.description = entry.summary || this.defaultMeta.description;
            meta.keywords = this.defaultMeta.keywords;
            meta.ogTitle = entry.title || this.defaultMeta.ogTitle;
            meta.ogDescription = entry.summary || this.defaultMeta.ogDescription;
            meta.ogImage = this.defaultMeta.ogImage;
            meta.ogType = this.defaultMeta.ogType;
            meta.ogUrl = this.defaultMeta.ogUrl;
            meta.twitterCard = this.defaultMeta.twitterCard;
            meta.twitterTitle = entry.title || this.defaultMeta.twitterTitle;
            meta.twitterDescription = entry.summary || this.defaultMeta.twitterDescription;
            meta.twitterImage = this.defaultMeta.twitterImage;
            meta.canonical = this.defaultMeta.canonical;
        }

        return meta;
    }

    /**
     * 清理 meta content（移除 HTML 標籤，截斷過長內容）
     * @param {string} content - 原始內容
     * @returns {string} 清理後的內容
     */
    sanitizeMetaContent(content) {
        if (typeof content !== 'string') {
            return '';
        }

        // 移除 HTML 標籤
        let sanitized = content.replace(/<[^>]*>/g, '');

        // 轉義 HTML 特殊字元
        sanitized = this.escapeHTML(sanitized);

        // 移除多餘的空白
        sanitized = sanitized.replace(/\s+/g, ' ').trim();

        // 截斷過長的內容（description 建議不超過 160 字元）
        const maxLength = 160;
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength) + '...';
        }

        return sanitized;
    }

    /**
     * 轉義 HTML 特殊字元
     * @param {string} text - 原始文字
     * @returns {string} 轉義後的文字
     */
    escapeHTML(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return text.replace(/[&<>"']/g, (char) => map[char]);
    }

    /**
     * 更新 document.title
     * @param {string} title - 頁面標題
     */
    updateDocumentTitle(title) {
        if (title && typeof title === 'string') {
            document.title = this.sanitizeMetaContent(title);
        }
    }

    /**
     * 更新 html lang 屬性
     * @param {string} lang - 語言代碼（例如：'en'、'zh-Hant'）
     */
    updateHtmlLang(lang) {
        if (lang && typeof lang === 'string') {
            const htmlElement = document.documentElement;
            if (htmlElement) {
                htmlElement.setAttribute('lang', lang);
            }
        }
    }

    /**
     * 獲取當前 meta tags
     * @returns {Object} 當前的 meta tags
     */
    getCurrentMeta() {
        return { ...this.currentMeta };
    }

    /**
     * 清理所有 meta tags（移除所有創建的元素）
     */
    cleanup() {
        this.metaElements.forEach((element, name) => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });

        this.metaElements.clear();
        this.currentMeta = { ...this.defaultMeta };
    }
}

// 支援 ES6 模組和 CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOManager;
}

// 瀏覽器環境
if (typeof window !== 'undefined') {
    window.SEOManager = SEOManager;
}


