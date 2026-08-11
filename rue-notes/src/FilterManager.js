/**
 * FilterManager - 管理類型和標籤篩選
 * 
 * 負責處理 Entry 的篩選邏輯，支援：
 * - 按 type 欄位篩選
 * - 按 tags 陣列篩選
 * - 按 category 欄位篩選（支援巢狀路徑）
 * - 多條件組合篩選（AND 邏輯）
 * 
 * @class FilterManager
 */
class FilterManager {
    /**
     * 創建 FilterManager 實例
     * 
     * @constructor
     */
    constructor() {
        /**
         * 可用的類型集合
         * @type {Set<string>}
         */
        this.availableTypes = new Set();

        /**
         * 可用的標籤集合
         * @type {Set<string>}
         */
        this.availableTags = new Set();

        /**
         * 當前啟用的篩選條件
         * @type {FilterCriteria}
         */
        this.currentFilters = {};
    }

    /**
     * 執行多條件篩選
     * 
     * 根據提供的篩選條件過濾 entries。支援同時設定多個條件（AND 邏輯）。
     * 
     * @param {Entry[]} entries - 要篩選的 Entry 陣列
     * @param {FilterCriteria} criteria - 篩選條件物件
     * @returns {Entry[]} 篩選後的 Entry 陣列
     * 
     * @example
     * // 按類型篩選
     * filter(entries, { type: 'blog' })
     * 
     * @example
     * // 按標籤篩選
     * filter(entries, { tag: 'javascript' })
     * 
     * @example
     * // 多條件篩選
     * filter(entries, { type: 'blog', tag: 'javascript' })
     */
    filter(entries, criteria) {
        if (!entries || entries.length === 0) {
            return [];
        }

        if (!criteria || Object.keys(criteria).length === 0) {
            return entries;
        }

        let filtered = entries;

        // 按類型篩選
        if (criteria.type) {
            filtered = this.filterByType(filtered, criteria.type);
        }

        // 按標籤篩選
        if (criteria.tag) {
            filtered = this.filterByTag(filtered, criteria.tag);
        }

        // 按多標籤篩選
        if (criteria.tags && Array.isArray(criteria.tags)) {
            for (const tag of criteria.tags) {
                filtered = this.filterByTag(filtered, tag);
            }
        }

        // 按分類篩選
        if (criteria.category) {
            filtered = this.filterByCategory(filtered, criteria.category);
        }

        return filtered;
    }

    /**
     * 按類型篩選 Entry
     * 
     * @param {Entry[]} entries - 要篩選的 Entry 陣列
     * @param {string} type - 要篩選的類型值
     * @returns {Entry[]} 符合類型的 Entry 陣列
     * 
     * @example
     * filterByType(entries, 'blog')
     */
    filterByType(entries, type) {
        if (!type || typeof type !== 'string') {
            return entries;
        }

        return entries.filter(entry => {
            // Entry 必須有 type 欄位且值匹配
            return entry.type && entry.type === type;
        });
    }

    /**
     * 按標籤篩選 Entry
     * 
     * @param {Entry[]} entries - 要篩選的 Entry 陣列
     * @param {string} tag - 要篩選的標籤值
     * @returns {Entry[]} 包含該標籤的 Entry 陣列
     * 
     * @example
     * filterByTag(entries, 'javascript')
     */
    filterByTag(entries, tag) {
        if (!tag || typeof tag !== 'string') {
            return entries;
        }

        return entries.filter(entry => {
            // Entry 必須有 tags 欄位且為陣列，並包含該標籤
            return entry.tags && 
                   Array.isArray(entry.tags) && 
                   entry.tags.includes(tag);
        });
    }

    /**
     * 按分類篩選 Entry（支援巢狀路徑）
     * 
     * 篩選該分類及其所有子分類的 entries。
     * 例如：篩選 'tech' 會包含 'tech/frontend' 和 'tech/backend'。
     * 
     * @param {Entry[]} entries - 要篩選的 Entry 陣列
     * @param {string} category - 要篩選的分類路徑
     * @returns {Entry[]} 屬於該分類或子分類的 Entry 陣列
     * 
     * @example
     * filterByCategory(entries, 'tech/frontend')
     */
    filterByCategory(entries, category) {
        if (!category || typeof category !== 'string') {
            return entries;
        }

        return entries.filter(entry => {
            // Entry 必須有 category 欄位
            if (!entry.category) {
                return false;
            }

            // 完全匹配或是子分類（以 category/ 開頭）
            return entry.category === category || 
                   entry.category.startsWith(category + '/');
        });
    }

    /**
     * 從 entries 中提取所有可用的類型
     * 
     * @param {Entry[]} entries - Entry 陣列
     * @returns {string[]} 可用類型的陣列（已排序）
     * 
     * @example
     * extractTypes(entries) // ['blog', 'news', 'update']
     */
    extractTypes(entries) {
        if (!entries || entries.length === 0) {
            return [];
        }

        const types = new Set();

        for (const entry of entries) {
            if (entry.type && typeof entry.type === 'string') {
                types.add(entry.type);
            }
        }

        this.availableTypes = types;
        return Array.from(types).sort();
    }

    /**
     * 從 entries 中提取所有可用的標籤
     * 
     * @param {Entry[]} entries - Entry 陣列
     * @returns {string[]} 可用標籤的陣列（已排序）
     * 
     * @example
     * extractTags(entries) // ['javascript', 'react', 'vue']
     */
    extractTags(entries) {
        if (!entries || entries.length === 0) {
            return [];
        }

        const tags = new Set();

        for (const entry of entries) {
            if (entry.tags && Array.isArray(entry.tags)) {
                for (const tag of entry.tags) {
                    if (typeof tag === 'string') {
                        tags.add(tag);
                    }
                }
            }
        }

        this.availableTags = tags;
        return Array.from(tags).sort();
    }

    /**
     * 設定單一篩選條件
     * 
     * @param {string} key - 篩選條件的鍵（type、tag、category 等）
     * @param {any} value - 篩選條件的值
     * 
     * @example
     * setFilter('type', 'blog')
     * setFilter('tag', 'javascript')
     */
    setFilter(key, value) {
        if (!key || typeof key !== 'string') {
            return;
        }

        if (value === null || value === undefined || value === '') {
            delete this.currentFilters[key];
        } else {
            this.currentFilters[key] = value;
        }
    }

    /**
     * 清除單一篩選條件
     * 
     * @param {string} key - 要清除的篩選條件鍵
     * 
     * @example
     * clearFilter('type')
     */
    clearFilter(key) {
        if (key && typeof key === 'string') {
            delete this.currentFilters[key];
        }
    }

    /**
     * 清除所有篩選條件
     * 
     * @example
     * clearAllFilters()
     */
    clearAllFilters() {
        this.currentFilters = {};
    }

    /**
     * 獲取當前啟用的篩選條件
     * 
     * @returns {FilterCriteria} 當前篩選條件的副本
     * 
     * @example
     * getActiveFilters() // { type: 'blog', tag: 'javascript' }
     */
    getActiveFilters() {
        // 返回副本以避免外部修改
        return { ...this.currentFilters };
    }
}

// 如果在 Node.js 環境中，導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FilterManager };
}

// 瀏覽器環境
if (typeof window !== 'undefined') {
    window.FilterManager = FilterManager;
}
