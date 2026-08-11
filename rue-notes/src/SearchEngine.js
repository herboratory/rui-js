/**
 * SearchEngine - 全文搜尋和結果排序引擎
 * 
 * 功能：
 * - 支援在 title、summary、tags、bodyText 欄位中搜尋
 * - 使用加權排序（title > tags > summary > body）
 * - 不區分大小寫的匹配
 * - 完全匹配優先於部分匹配
 * - 多欄位匹配累加分數
 */

class SearchEngine {
    /**
     * 創建 SearchEngine 實例
     * @param {Object} config - 搜尋配置
     * @param {boolean} config.enabled - 是否啟用搜尋
     * @param {string[]} config.fields - 要搜尋的欄位，預設 ['title', 'summary', 'tags']
     * @param {boolean} config.bodyText - 是否搜尋 content 欄位，預設 false
     * @param {Object} config.ranking - 欄位權重配置
     * @param {number} config.ranking.title - title 欄位權重，預設 4
     * @param {number} config.ranking.summary - summary 欄位權重，預設 2
     * @param {number} config.ranking.tags - tags 欄位權重，預設 3
     * @param {number} config.ranking.body - body 欄位權重，預設 1
     */
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled !== false,
            fields: config.fields || ['title', 'summary', 'tags'],
            bodyText: config.bodyText || false,
            ...config
        };

        // 定義欄位權重（title 權重最高）
        this.weights = {
            title: config.ranking?.title || 4,
            summary: config.ranking?.summary || 2,
            tags: config.ranking?.tags || 3,
            body: config.ranking?.body || 1
        };

        // LRU 快取，最多 50 個查詢
        this.cache = new Map();
        this.maxCacheSize = 50;
    }

    /**
     * 執行全文搜尋
     * @param {Array} entries - Entry 集合
     * @param {string} query - 搜尋查詢
     * @returns {Array} 搜尋結果（已排序的 SearchResult 陣列）
     */
    search(entries, query) {
        // 驗證輸入
        if (!entries || entries.length === 0) {
            return [];
        }

        if (typeof query !== 'string') {
            console.warn('Invalid search query type:', typeof query);
            return entries.map(entry => ({ entry, score: 0, matches: [] }));
        }

        // 標準化搜尋詞（移除前後空白，轉小寫）
        const normalizedQuery = this.normalizeQuery(query);

        // 空搜尋返回所有 entries
        if (normalizedQuery === '') {
            return entries.map(entry => ({ entry, score: 0, matches: [] }));
        }

        // 檢查快取
        const entrySignature = entries.map((entry, index) => {
            const identity = entry.id || entry.slug || entry.title || index;
            const language = entry.lang || entry.language || '';
            return `${identity}:${language}`;
        }).join('|');
        const cacheKey = `${normalizedQuery}:${entrySignature}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // 執行搜尋並計算分數
        const results = [];
        for (const entry of entries) {
            const score = this.calculateScore(entry, normalizedQuery);
            if (score > 0) {
                results.push({
                    entry,
                    score,
                    matches: this.getMatches(entry, normalizedQuery)
                });
            }
        }

        // 按分數降序排序
        const sortedResults = this.sortResults(results);

        // 更新快取
        this.updateCache(cacheKey, sortedResults);

        return sortedResults;
    }

    /**
     * 計算 Entry 的搜尋分數
     * @param {Object} entry - Entry 物件
     * @param {string} query - 標準化的搜尋查詢
     * @returns {number} 總分數
     */
    calculateScore(entry, query) {
        let totalScore = 0;

        // 搜尋 title 欄位
        if (entry.title) {
            const match = this.matchField(entry.title, query);
            if (match.exact) {
                totalScore += this.weights.title * 2; // 完全匹配加倍
            } else if (match.partial) {
                totalScore += this.weights.title;
            }
        }

        // 搜尋 summary 欄位
        if (entry.summary) {
            const match = this.matchField(entry.summary, query);
            if (match.exact) {
                totalScore += this.weights.summary * 2;
            } else if (match.partial) {
                totalScore += this.weights.summary;
            }
        }

        // 搜尋 tags 欄位
        if (entry.tags && Array.isArray(entry.tags)) {
            const match = this.matchTags(entry.tags, query);
            if (match.exact) {
                totalScore += this.weights.tags * 2;
            } else if (match.partial) {
                totalScore += this.weights.tags;
            }
        }

        // 搜尋 body/content 欄位（如果啟用）
        if (this.config.bodyText && entry.content) {
            const match = this.matchField(entry.content, query);
            if (match.exact) {
                totalScore += this.weights.body * 2;
            } else if (match.partial) {
                totalScore += this.weights.body;
            }
        }

        return totalScore;
    }

    /**
     * 匹配單一欄位
     * @param {string} fieldValue - 欄位值
     * @param {string} query - 搜尋查詢
     * @returns {Object} { exact: boolean, partial: boolean }
     */
    matchField(fieldValue, query) {
        if (!fieldValue || typeof fieldValue !== 'string') {
            return { exact: false, partial: false };
        }

        const normalizedField = fieldValue.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        // 完全匹配：欄位值等於搜尋詞
        const exact = normalizedField === normalizedQuery;

        // 部分匹配：欄位值包含搜尋詞
        const partial = !exact && normalizedField.includes(normalizedQuery);

        return { exact, partial };
    }

    /**
     * 匹配標籤陣列
     * @param {string[]} tags - 標籤陣列
     * @param {string} query - 搜尋查詢
     * @returns {Object} { exact: boolean, partial: boolean }
     */
    matchTags(tags, query) {
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return { exact: false, partial: false };
        }

        const normalizedQuery = query.toLowerCase();
        let exact = false;
        let partial = false;

        for (const tag of tags) {
            if (typeof tag === 'string') {
                const normalizedTag = tag.toLowerCase();
                if (normalizedTag === normalizedQuery) {
                    exact = true;
                    break;
                } else if (normalizedTag.includes(normalizedQuery)) {
                    partial = true;
                }
            }
        }

        return { exact, partial };
    }

    /**
     * 按分數降序排序搜尋結果
     * @param {Array} results - SearchResult 陣列
     * @returns {Array} 排序後的結果
     */
    sortResults(results) {
        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * 標準化搜尋查詢
     * @param {string} query - 原始搜尋查詢
     * @returns {string} 標準化的查詢（移除前後空白，轉小寫）
     */
    normalizeQuery(query) {
        return query.trim().toLowerCase();
    }

    /**
     * 獲取匹配的欄位資訊
     * @param {Object} entry - Entry 物件
     * @param {string} query - 搜尋查詢
     * @returns {Array} 匹配資訊陣列
     */
    getMatches(entry, query) {
        const matches = [];

        if (entry.title) {
            const match = this.matchField(entry.title, query);
            if (match.exact || match.partial) {
                matches.push({
                    field: 'title',
                    exact: match.exact,
                    partial: match.partial
                });
            }
        }

        if (entry.summary) {
            const match = this.matchField(entry.summary, query);
            if (match.exact || match.partial) {
                matches.push({
                    field: 'summary',
                    exact: match.exact,
                    partial: match.partial
                });
            }
        }

        if (entry.tags && Array.isArray(entry.tags)) {
            const match = this.matchTags(entry.tags, query);
            if (match.exact || match.partial) {
                matches.push({
                    field: 'tags',
                    exact: match.exact,
                    partial: match.partial
                });
            }
        }

        if (this.config.bodyText && entry.content) {
            const match = this.matchField(entry.content, query);
            if (match.exact || match.partial) {
                matches.push({
                    field: 'body',
                    exact: match.exact,
                    partial: match.partial
                });
            }
        }

        return matches;
    }

    /**
     * 更新 LRU 快取
     * @param {string} key - 快取鍵
     * @param {Array} value - 快取值
     */
    updateCache(key, value) {
        // 如果快取已滿，移除最舊的項目
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, value);
    }

    /**
     * 清除快取
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Highlight search query in text
     * @param {string} text - Text to highlight
     * @param {string} query - Search query
     * @param {string} className - CSS class for highlight (default: 'rue-notes-highlight')
     * @returns {string} Text with highlighted matches
     */
    highlightMatches(text, query, className = 'rue-notes-highlight') {
        if (!text || !query) {
            return text;
        }
        
        const normalizedQuery = this.normalizeQuery(query);
        if (normalizedQuery === '') {
            return text;
        }
        
        // Escape special regex characters in query
        const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Create case-insensitive regex
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        
        // Replace matches with highlighted version
        return text.replace(regex, `<mark class="${className}">$1</mark>`);
    }
    
    /**
     * Get highlighted excerpt from content
     * @param {string} content - Full content
     * @param {string} query - Search query
     * @param {number} contextLength - Characters before/after match (default: 100)
     * @returns {string} Highlighted excerpt
     */
    getHighlightedExcerpt(content, query, contextLength = 100) {
        if (!content || !query) {
            return content ? content.substring(0, contextLength * 2) + '...' : '';
        }
        
        const normalizedQuery = this.normalizeQuery(query);
        const normalizedContent = content.toLowerCase();
        const matchIndex = normalizedContent.indexOf(normalizedQuery);
        
        if (matchIndex === -1) {
            // No match, return beginning
            return content.substring(0, contextLength * 2) + '...';
        }
        
        // Calculate excerpt boundaries
        const start = Math.max(0, matchIndex - contextLength);
        const end = Math.min(content.length, matchIndex + normalizedQuery.length + contextLength);
        
        let excerpt = content.substring(start, end);
        
        // Add ellipsis
        if (start > 0) excerpt = '...' + excerpt;
        if (end < content.length) excerpt = excerpt + '...';
        
        // Highlight the match
        return this.highlightMatches(excerpt, query);
    }
}

// 支援 ES6 模組和 CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchEngine;
}

// 瀏覽器環境
if (typeof window !== 'undefined') {
    window.SearchEngine = SearchEngine;
}


