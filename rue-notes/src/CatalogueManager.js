/**
 * CatalogueManager - 巢狀分類目錄管理模組
 * 
 * 功能：
 * - 解析分類路徑（例如：'tech/frontend/react'）
 * - 構建分類樹狀結構
 * - 渲染分類導航 UI
 * - 處理分類展開和收合
 * - 與 FilterManager 整合進行分類篩選
 */

class CatalogueManager {
    /**
     * 創建 CatalogueManager 實例
     * @param {Object} config - 目錄配置
     * @param {boolean} config.enabled - 是否啟用目錄，預設 false
     * @param {boolean} config.nested - 是否支援巢狀分類，預設 false
     * @param {string} config.separator - 分類路徑分隔符，預設 '/'
     * @param {boolean} config.collapsible - 是否可展開/收合，預設 true
     * @param {boolean} config.showCount - 是否顯示每個分類的項目數，預設 true
     */
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled || false,
            nested: config.nested || false,
            separator: config.separator || '/',
            collapsible: config.collapsible !== false,
            showCount: config.showCount !== false
        };
        
        // 展開狀態（記錄哪些分類節點是展開的）
        this.expandedNodes = new Set();
    }

    /**
     * 解析分類路徑
     * @param {string} categoryPath - 分類路徑（例如：'tech/frontend/react'）
     * @returns {Array} 分類路徑陣列（例如：['tech', 'frontend', 'react']）
     */
    parseCategoryPath(categoryPath) {
        if (!categoryPath || typeof categoryPath !== 'string') {
            return [];
        }
        
        return categoryPath.split(this.config.separator).filter(part => part.trim() !== '');
    }

    /**
     * 構建分類樹狀結構
     * @param {Array} entries - Entry 列表
     * @returns {Object} 分類樹
     */
    buildCategoryTree(entries) {
        if (!entries || entries.length === 0) {
            return {};
        }

        const tree = {};

        entries.forEach(entry => {
            if (!entry.category) {
                // 沒有分類的項目放在根層級
                if (!tree['_uncategorized']) {
                    tree['_uncategorized'] = {
                        name: 'Uncategorized',
                        path: '_uncategorized',
                        entries: [],
                        children: {}
                    };
                }
                tree['_uncategorized'].entries.push(entry);
                return;
            }

            const pathParts = this.parseCategoryPath(entry.category);
            let currentLevel = tree;
            let currentPath = '';

            pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}${this.config.separator}${part}` : part;

                if (!currentLevel[part]) {
                    currentLevel[part] = {
                        name: part,
                        path: currentPath,
                        entries: [],
                        children: {}
                    };
                }

                // 如果是最後一層，添加 entry
                if (index === pathParts.length - 1) {
                    currentLevel[part].entries.push(entry);
                }

                currentLevel = currentLevel[part].children;
            });
        });

        return tree;
    }

    /**
     * 獲取分類的所有子分類路徑
     * @param {string} categoryPath - 父分類路徑
     * @param {Object} tree - 分類樹
     * @returns {Array} 子分類路徑陣列
     */
    getSubcategories(categoryPath, tree) {
        const subcategories = [];
        
        if (!categoryPath) {
            // 返回所有頂層分類
            Object.keys(tree).forEach(key => {
                if (key !== '_uncategorized') {
                    subcategories.push(tree[key].path);
                }
            });
            return subcategories;
        }

        // 找到指定分類節點
        const node = this.findNode(categoryPath, tree);
        if (!node || !node.children) {
            return [];
        }

        // 收集所有子分類
        Object.keys(node.children).forEach(key => {
            subcategories.push(node.children[key].path);
        });

        return subcategories;
    }

    /**
     * 在樹中找到指定路徑的節點
     * @param {string} categoryPath - 分類路徑
     * @param {Object} tree - 分類樹
     * @returns {Object|null} 節點或 null
     */
    findNode(categoryPath, tree) {
        if (!categoryPath) {
            return null;
        }

        const pathParts = this.parseCategoryPath(categoryPath);
        let currentLevel = tree;

        for (const part of pathParts) {
            if (!currentLevel[part]) {
                return null;
            }
            
            if (pathParts.indexOf(part) === pathParts.length - 1) {
                return currentLevel[part];
            }
            
            currentLevel = currentLevel[part].children;
        }

        return null;
    }

    /**
     * 計算分類及其子分類的總項目數
     * @param {Object} node - 分類節點
     * @returns {number} 總項目數
     */
    countEntries(node) {
        if (!node) {
            return 0;
        }

        let count = node.entries ? node.entries.length : 0;

        if (node.children) {
            Object.keys(node.children).forEach(key => {
                count += this.countEntries(node.children[key]);
            });
        }

        return count;
    }

    /**
     * 切換分類節點的展開/收合狀態
     * @param {string} categoryPath - 分類路徑
     */
    toggleNode(categoryPath) {
        if (this.expandedNodes.has(categoryPath)) {
            this.expandedNodes.delete(categoryPath);
        } else {
            this.expandedNodes.add(categoryPath);
        }
    }

    /**
     * 展開分類節點
     * @param {string} categoryPath - 分類路徑
     */
    expandNode(categoryPath) {
        this.expandedNodes.add(categoryPath);
    }

    /**
     * 收合分類節點
     * @param {string} categoryPath - 分類路徑
     */
    collapseNode(categoryPath) {
        this.expandedNodes.delete(categoryPath);
    }

    /**
     * 檢查分類節點是否展開
     * @param {string} categoryPath - 分類路徑
     * @returns {boolean}
     */
    isExpanded(categoryPath) {
        return this.expandedNodes.has(categoryPath);
    }

    /**
     * 展開所有分類節點
     * @param {Object} tree - 分類樹
     */
    expandAll(tree) {
        const expandRecursive = (node) => {
            if (node.path) {
                this.expandedNodes.add(node.path);
            }
            if (node.children) {
                Object.keys(node.children).forEach(key => {
                    expandRecursive(node.children[key]);
                });
            }
        };

        Object.keys(tree).forEach(key => {
            expandRecursive(tree[key]);
        });
    }

    /**
     * 收合所有分類節點
     */
    collapseAll() {
        this.expandedNodes.clear();
    }

    /**
     * 渲染分類樹 HTML
     * @param {Object} tree - 分類樹
     * @param {string} currentCategory - 當前選中的分類
     * @returns {string} 分類樹 HTML
     */
    renderCatalogueTree(tree, currentCategory = null) {
        if (!this.config.enabled || !tree || Object.keys(tree).length === 0) {
            return '';
        }

        let html = '<nav class="rue-notes-catalogue">';
        html += '<div class="rue-notes-catalogue-tree">';
        html += this.renderTreeLevel(tree, currentCategory, 0);
        html += '</div>';
        html += '</nav>';

        return html;
    }

    /**
     * 渲染樹的一個層級
     * @param {Object} level - 當前層級的節點
     * @param {string} currentCategory - 當前選中的分類
     * @param {number} depth - 當前深度
     * @returns {string} HTML
     */
    renderTreeLevel(level, currentCategory, depth) {
        let html = '<ul class="rue-notes-catalogue-list" data-depth="' + depth + '">';

        Object.keys(level).forEach(key => {
            const node = level[key];
            const isExpanded = this.isExpanded(node.path);
            const isActive = currentCategory === node.path;
            const hasChildren = node.children && Object.keys(node.children).length > 0;
            const entryCount = this.countEntries(node);

            html += '<li class="rue-notes-catalogue-item' + 
                    (isActive ? ' rue-notes-catalogue-active' : '') + 
                    (hasChildren ? ' rue-notes-catalogue-has-children' : '') + 
                    (isExpanded ? ' rue-notes-catalogue-expanded' : '') + 
                    '">';

            // 展開/收合按鈕
            if (hasChildren && this.config.collapsible) {
                html += `<button class="rue-notes-catalogue-toggle" data-path="${node.path}">
                            ${isExpanded ? '▼' : '▶'}
                         </button>`;
            } else if (hasChildren) {
                html += '<span class="rue-notes-catalogue-toggle">▼</span>';
            }

            // 分類連結
            html += `<a href="#notes?category=${encodeURIComponent(node.path)}" 
                        class="rue-notes-catalogue-link" 
                        data-path="${node.path}">
                        ${node.name}`;
            
            // 項目數
            if (this.config.showCount) {
                html += ` <span class="rue-notes-catalogue-count">(${entryCount})</span>`;
            }
            
            html += '</a>';

            // 子分類
            if (hasChildren && (isExpanded || !this.config.collapsible)) {
                html += this.renderTreeLevel(node.children, currentCategory, depth + 1);
            }

            html += '</li>';
        });

        html += '</ul>';
        return html;
    }

    /**
     * 渲染扁平分類列表（不使用樹狀結構）
     * @param {Array} entries - Entry 列表
     * @param {string} currentCategory - 當前選中的分類
     * @returns {string} 分類列表 HTML
     */
    renderFlatCatalogue(entries, currentCategory = null) {
        if (!this.config.enabled || !entries || entries.length === 0) {
            return '';
        }

        // 收集所有分類
        const categories = new Map();
        
        entries.forEach(entry => {
            if (entry.category) {
                const count = categories.get(entry.category) || 0;
                categories.set(entry.category, count + 1);
            }
        });

        // 排序分類
        const sortedCategories = Array.from(categories.entries()).sort((a, b) => {
            return a[0].localeCompare(b[0]);
        });

        let html = '<nav class="rue-notes-catalogue rue-notes-catalogue-flat">';
        html += '<ul class="rue-notes-catalogue-list">';

        sortedCategories.forEach(([category, count]) => {
            const isActive = currentCategory === category;
            
            html += `<li class="rue-notes-catalogue-item${isActive ? ' rue-notes-catalogue-active' : ''}">
                        <a href="#notes?category=${encodeURIComponent(category)}" 
                           class="rue-notes-catalogue-link" 
                           data-path="${category}">
                            ${category}`;
            
            if (this.config.showCount) {
                html += ` <span class="rue-notes-catalogue-count">(${count})</span>`;
            }
            
            html += `</a>
                     </li>`;
        });

        html += '</ul>';
        html += '</nav>';

        return html;
    }
}

// 瀏覽器環境
if (typeof window !== 'undefined') {
    window.CatalogueManager = CatalogueManager;
}

// Node.js 環境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CatalogueManager;
}
