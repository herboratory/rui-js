/**
 * PaginationManager - 分頁管理模組
 * 
 * 功能：
 * - 將 entries 分割為多個頁面
 * - 計算總頁數
 * - 管理當前頁碼
 * - 處理頁面導航
 * - 與搜尋和篩選整合
 */

class PaginationManager {
    /**
     * 創建 PaginationManager 實例
     * @param {Object} config - 分頁配置
     * @param {boolean} config.enabled - 是否啟用分頁，預設 false
     * @param {number} config.perPage - 每頁顯示的項目數，預設 10
     * @param {number} config.maxPageButtons - 最多顯示的頁碼按鈕數，預設 5
     */
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled || false,
            perPage: config.perPage || 10,
            maxPageButtons: config.maxPageButtons || 5
        };
        
        // 當前分頁狀態
        this.state = {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            startIndex: 0,
            endIndex: 0
        };
    }

    /**
     * 將 entries 分割為頁面
     * @param {Array} entries - 要分頁的 entries
     * @param {number} page - 頁碼（從 1 開始）
     * @returns {Array} 當前頁的 entries
     */
    paginate(entries, page = 1) {
        if (!this.config.enabled || !entries || entries.length === 0) {
            return entries;
        }

        // 驗證頁碼
        const validPage = this.validatePage(page, entries.length);
        
        // 計算索引
        const startIndex = (validPage - 1) * this.config.perPage;
        const endIndex = Math.min(startIndex + this.config.perPage, entries.length);
        
        // 更新狀態
        this.state = {
            currentPage: validPage,
            totalPages: this.getTotalPages(entries.length),
            totalItems: entries.length,
            startIndex: startIndex,
            endIndex: endIndex
        };
        
        // 返回當前頁的 entries
        return entries.slice(startIndex, endIndex);
    }

    /**
     * 計算總頁數
     * @param {number} totalItems - 總項目數
     * @returns {number} 總頁數
     */
    getTotalPages(totalItems) {
        if (!this.config.enabled || totalItems === 0) {
            return 1;
        }
        
        return Math.ceil(totalItems / this.config.perPage);
    }

    /**
     * 驗證頁碼是否有效
     * @param {number} page - 要驗證的頁碼
     * @param {number} totalItems - 總項目數
     * @returns {number} 有效的頁碼
     */
    validatePage(page, totalItems) {
        const totalPages = this.getTotalPages(totalItems);
        
        // 確保頁碼在有效範圍內
        if (page < 1) {
            return 1;
        }
        
        if (page > totalPages) {
            return totalPages;
        }
        
        return page;
    }

    /**
     * 獲取當前分頁狀態
     * @returns {Object} 分頁狀態
     */
    getState() {
        return { ...this.state };
    }

    /**
     * 導航到指定頁面
     * @param {number} page - 目標頁碼
     * @param {Array} entries - 當前的 entries
     * @returns {Array} 目標頁面的 entries
     */
    goToPage(page, entries) {
        return this.paginate(entries, page);
    }

    /**
     * 導航到下一頁
     * @param {Array} entries - 當前的 entries
     * @returns {Array} 下一頁的 entries
     */
    nextPage(entries) {
        const nextPage = this.state.currentPage + 1;
        if (nextPage <= this.state.totalPages) {
            return this.paginate(entries, nextPage);
        }
        return this.paginate(entries, this.state.currentPage);
    }

    /**
     * 導航到上一頁
     * @param {Array} entries - 當前的 entries
     * @returns {Array} 上一頁的 entries
     */
    prevPage(entries) {
        const prevPage = this.state.currentPage - 1;
        if (prevPage >= 1) {
            return this.paginate(entries, prevPage);
        }
        return this.paginate(entries, this.state.currentPage);
    }

    /**
     * 導航到第一頁
     * @param {Array} entries - 當前的 entries
     * @returns {Array} 第一頁的 entries
     */
    firstPage(entries) {
        return this.paginate(entries, 1);
    }

    /**
     * 導航到最後一頁
     * @param {Array} entries - 當前的 entries
     * @returns {Array} 最後一頁的 entries
     */
    lastPage(entries) {
        return this.paginate(entries, this.state.totalPages);
    }

    /**
     * 檢查是否有上一頁
     * @returns {boolean}
     */
    hasPrevPage() {
        return this.state.currentPage > 1;
    }

    /**
     * 檢查是否有下一頁
     * @returns {boolean}
     */
    hasNextPage() {
        return this.state.currentPage < this.state.totalPages;
    }

    /**
     * 重置分頁到第一頁
     * @param {Array} entries - 當前的 entries
     * @returns {Array} 第一頁的 entries
     */
    reset(entries) {
        return this.paginate(entries, 1);
    }

    /**
     * 獲取頁碼按鈕列表（用於渲染分頁控制）
     * @returns {Array} 頁碼按鈕配置陣列
     */
    getPageButtons() {
        const buttons = [];
        const { currentPage, totalPages } = this.state;
        const { maxPageButtons } = this.config;
        
        if (totalPages <= maxPageButtons) {
            // 總頁數少於最大按鈕數，顯示所有頁碼
            for (let i = 1; i <= totalPages; i++) {
                buttons.push({
                    page: i,
                    label: String(i),
                    active: i === currentPage,
                    disabled: false
                });
            }
        } else {
            // 總頁數多於最大按鈕數，使用省略號
            const halfButtons = Math.floor(maxPageButtons / 2);
            let startPage = Math.max(1, currentPage - halfButtons);
            let endPage = Math.min(totalPages, currentPage + halfButtons);
            
            // 調整範圍以確保顯示 maxPageButtons 個按鈕
            if (endPage - startPage + 1 < maxPageButtons) {
                if (startPage === 1) {
                    endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
                } else {
                    startPage = Math.max(1, endPage - maxPageButtons + 1);
                }
            }
            
            // 添加第一頁
            if (startPage > 1) {
                buttons.push({
                    page: 1,
                    label: '1',
                    active: false,
                    disabled: false
                });
                
                if (startPage > 2) {
                    buttons.push({
                        page: null,
                        label: '...',
                        active: false,
                        disabled: true
                    });
                }
            }
            
            // 添加中間頁碼
            for (let i = startPage; i <= endPage; i++) {
                buttons.push({
                    page: i,
                    label: String(i),
                    active: i === currentPage,
                    disabled: false
                });
            }
            
            // 添加最後一頁
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    buttons.push({
                        page: null,
                        label: '...',
                        active: false,
                        disabled: true
                    });
                }
                
                buttons.push({
                    page: totalPages,
                    label: String(totalPages),
                    active: false,
                    disabled: false
                });
            }
        }
        
        return buttons;
    }

    /**
     * 渲染分頁控制 HTML
     * @returns {string} 分頁控制的 HTML
     */
    renderPaginationControls() {
        if (!this.config.enabled || this.state.totalPages <= 1) {
            return '';
        }
        
        const buttons = this.getPageButtons();
        const { currentPage, totalPages, totalItems, startIndex, endIndex } = this.state;
        
        let html = '<div class="rue-notes-pagination">';
        
        // 分頁信息
        html += `<div class="rue-notes-pagination-info">`;
        html += `Showing ${startIndex + 1}-${endIndex} of ${totalItems} entries`;
        html += `</div>`;
        
        // 分頁按鈕
        html += '<div class="rue-notes-pagination-controls">';
        
        // 上一頁按鈕
        html += `<button class="rue-notes-pagination-btn rue-notes-pagination-prev" 
                        data-page="${currentPage - 1}" 
                        ${!this.hasPrevPage() ? 'disabled' : ''}>
                    Previous
                 </button>`;
        
        // 頁碼按鈕
        buttons.forEach(btn => {
            if (btn.disabled) {
                html += `<span class="rue-notes-pagination-ellipsis">${btn.label}</span>`;
            } else {
                const activeClass = btn.active ? 'rue-notes-pagination-active' : '';
                html += `<button class="rue-notes-pagination-btn rue-notes-pagination-page ${activeClass}" 
                                data-page="${btn.page}">
                            ${btn.label}
                         </button>`;
            }
        });
        
        // 下一頁按鈕
        html += `<button class="rue-notes-pagination-btn rue-notes-pagination-next" 
                        data-page="${currentPage + 1}" 
                        ${!this.hasNextPage() ? 'disabled' : ''}>
                    Next
                 </button>`;
        
        html += '</div>'; // pagination-controls
        html += '</div>'; // pagination
        
        return html;
    }
}

// 瀏覽器環境
if (typeof window !== 'undefined') {
    window.PaginationManager = PaginationManager;
}

// Node.js 環境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaginationManager;
}
