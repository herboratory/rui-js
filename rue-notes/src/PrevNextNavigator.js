/**
 * PrevNextNavigator - 上一篇/下一篇導航模組
 * 
 * 功能：
 * - 根據當前列表順序確定上一篇和下一篇
 * - 處理列表邊界情況（第一篇和最後一篇）
 * - 在篩選/搜尋結果中正確導航
 * - 渲染導航 UI
 */

class PrevNextNavigator {
    /**
     * 創建 PrevNextNavigator 實例
     * @param {Object} config - 導航配置
     * @param {boolean} config.enabled - 是否啟用上下篇導航，預設 false
     * @param {boolean} config.loop - 是否循環導航（最後一篇的下一篇是第一篇），預設 false
     * @param {string} config.sortBy - 排序欄位，預設 'date'
     * @param {string} config.sortOrder - 排序順序，'asc' 或 'desc'，預設 'desc'
     */
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled || false,
            loop: config.loop || false,
            sortBy: config.sortBy || 'date',
            sortOrder: config.sortOrder || 'desc'
        };
    }

    /**
     * 獲取上一篇和下一篇 Entry
     * @param {string} currentSlug - 當前 Entry 的 slug
     * @param {Array} entries - Entry 列表（已排序）
     * @returns {Object} { prev: Entry|null, next: Entry|null }
     */
    getPrevNext(currentSlug, entries) {
        if (!this.config.enabled || !entries || entries.length === 0) {
            return { prev: null, next: null };
        }

        // 找到當前 Entry 的索引
        const currentIndex = entries.findIndex(entry => entry.slug === currentSlug);
        
        if (currentIndex === -1) {
            // 當前 Entry 不在列表中
            return { prev: null, next: null };
        }

        // 獲取上一篇
        let prev = null;
        if (currentIndex > 0) {
            prev = entries[currentIndex - 1];
        } else if (this.config.loop && entries.length > 1) {
            // 循環模式：第一篇的上一篇是最後一篇
            prev = entries[entries.length - 1];
        }

        // 獲取下一篇
        let next = null;
        if (currentIndex < entries.length - 1) {
            next = entries[currentIndex + 1];
        } else if (this.config.loop && entries.length > 1) {
            // 循環模式：最後一篇的下一篇是第一篇
            next = entries[0];
        }

        return { prev, next };
    }

    /**
     * 檢查是否有上一篇
     * @param {string} currentSlug - 當前 Entry 的 slug
     * @param {Array} entries - Entry 列表
     * @returns {boolean}
     */
    hasPrev(currentSlug, entries) {
        const { prev } = this.getPrevNext(currentSlug, entries);
        return prev !== null;
    }

    /**
     * 檢查是否有下一篇
     * @param {string} currentSlug - 當前 Entry 的 slug
     * @param {Array} entries - Entry 列表
     * @returns {boolean}
     */
    hasNext(currentSlug, entries) {
        const { next } = this.getPrevNext(currentSlug, entries);
        return next !== null;
    }

    /**
     * 排序 entries（用於確定導航順序）
     * @param {Array} entries - 要排序的 entries
     * @returns {Array} 排序後的 entries
     */
    sortEntries(entries) {
        if (!entries || entries.length === 0) {
            return [];
        }

        const sorted = [...entries];
        const { sortBy, sortOrder } = this.config;

        sorted.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // 處理日期排序
            if (sortBy === 'date') {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            }

            // 處理字串排序
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            // 比較
            if (aValue < bValue) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }

    /**
     * 渲染上下篇導航 HTML
     * @param {string} currentSlug - 當前 Entry 的 slug
     * @param {Array} entries - Entry 列表
     * @returns {string} 導航 HTML
     */
    renderNavigation(currentSlug, entries) {
        if (!this.config.enabled) {
            return '';
        }

        const { prev, next } = this.getPrevNext(currentSlug, entries);

        let html = '<nav class="rue-notes-prevnext">';

        // 上一篇
        if (prev) {
            html += `<div class="rue-notes-prevnext-item rue-notes-prevnext-prev">
                        <span class="rue-notes-prevnext-label">← Previous</span>
                        <a href="#notes/${prev.slug}" class="rue-notes-prevnext-link" data-slug="${prev.slug}">
                            <span class="rue-notes-prevnext-title">${prev.title || prev.slug}</span>
                        </a>
                     </div>`;
        } else {
            html += `<div class="rue-notes-prevnext-item rue-notes-prevnext-prev rue-notes-prevnext-disabled">
                        <span class="rue-notes-prevnext-label">← Previous</span>
                        <span class="rue-notes-prevnext-title">No previous entry</span>
                     </div>`;
        }

        // 下一篇
        if (next) {
            html += `<div class="rue-notes-prevnext-item rue-notes-prevnext-next">
                        <span class="rue-notes-prevnext-label">Next →</span>
                        <a href="#notes/${next.slug}" class="rue-notes-prevnext-link" data-slug="${next.slug}">
                            <span class="rue-notes-prevnext-title">${next.title || next.slug}</span>
                        </a>
                     </div>`;
        } else {
            html += `<div class="rue-notes-prevnext-item rue-notes-prevnext-next rue-notes-prevnext-disabled">
                        <span class="rue-notes-prevnext-label">Next →</span>
                        <span class="rue-notes-prevnext-title">No next entry</span>
                     </div>`;
        }

        html += '</nav>';

        return html;
    }

    /**
     * 渲染簡化版導航（僅連結，無標題）
     * @param {string} currentSlug - 當前 Entry 的 slug
     * @param {Array} entries - Entry 列表
     * @returns {string} 導航 HTML
     */
    renderSimpleNavigation(currentSlug, entries) {
        if (!this.config.enabled) {
            return '';
        }

        const { prev, next } = this.getPrevNext(currentSlug, entries);

        let html = '<nav class="rue-notes-prevnext rue-notes-prevnext-simple">';

        // 上一篇
        if (prev) {
            html += `<a href="#notes/${prev.slug}" class="rue-notes-prevnext-btn rue-notes-prevnext-prev" data-slug="${prev.slug}">
                        ← Previous
                     </a>`;
        } else {
            html += `<span class="rue-notes-prevnext-btn rue-notes-prevnext-prev rue-notes-prevnext-disabled">
                        ← Previous
                     </span>`;
        }

        // 下一篇
        if (next) {
            html += `<a href="#notes/${next.slug}" class="rue-notes-prevnext-btn rue-notes-prevnext-next" data-slug="${next.slug}">
                        Next →
                     </a>`;
        } else {
            html += `<span class="rue-notes-prevnext-btn rue-notes-prevnext-next rue-notes-prevnext-disabled">
                        Next →
                     </span>`;
        }

        html += '</nav>';

        return html;
    }

    /**
     * 獲取導航信息（用於自訂渲染）
     * @param {string} currentSlug - 當前 Entry 的 slug
     * @param {Array} entries - Entry 列表
     * @returns {Object} 導航信息
     */
    getNavigationInfo(currentSlug, entries) {
        const { prev, next } = this.getPrevNext(currentSlug, entries);

        return {
            hasPrev: prev !== null,
            hasNext: next !== null,
            prev: prev ? {
                slug: prev.slug,
                title: prev.title,
                summary: prev.summary,
                date: prev.date
            } : null,
            next: next ? {
                slug: next.slug,
                title: next.title,
                summary: next.summary,
                date: next.date
            } : null
        };
    }
}

// 瀏覽器環境
if (typeof window !== 'undefined') {
    window.PrevNextNavigator = PrevNextNavigator;
}

// Node.js 環境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrevNextNavigator;
}
