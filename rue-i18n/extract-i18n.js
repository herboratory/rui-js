#!/usr/bin/env node

/**
 * Rue I18n 提取工具
 * 自動掃描 HTML/JS 文件中的 data-i18n 和 i18n.t() 調用
 * 生成翻譯模板 JSON 文件，支援從 JSON 載入翻譯
 */

const fs = require('fs');
const path = require('path');

class I18nExtractor {
    constructor(options = {}) {
        this.options = {
            // 掃描的文件類型
            extensions: options.extensions || ['.html', '.js', '.ts', '.vue', '.jsx', '.tsx'],
            // 排除的目錄
            exclude: options.exclude || ['node_modules', '.git', 'dist', 'build'],
            // 輸出目錄
            outputDir: options.outputDir || './locales',
            // 預設語言
            defaultLang: options.defaultLang || 'en',
            // 支援的語言
            languages: options.languages || ['en', 'zh-TW', 'zh-CN'],
            // 是否保留現有翻譯
            preserveExisting: options.preserveExisting !== false,
            // 排序鍵值
            sortKeys: options.sortKeys !== false
        };
        
        this.extractedKeys = new Set();
        this.existingTranslations = {};
    }

    /**
     * 主要執行函數
     */
    async extract(targetDir = './') {
        console.log('🔍 開始掃描翻譯鍵值...');
        
        // 載入現有翻譯
        this.loadExistingTranslations();
        
        // 掃描文件
        await this.scanDirectory(targetDir);
        
        // 生成翻譯文件
        this.generateTranslationFiles();
        
        // 生成 JavaScript 載入器
        this.generateJavaScriptLoader();
        
        console.log(`✅ 完成！提取了 ${this.extractedKeys.size} 個翻譯鍵值`);
        console.log(`📁 翻譯文件已生成到: ${this.options.outputDir}`);
        console.log(`📜 JavaScript 載入器: ${this.options.outputDir}/rue-i18n-loader.js`);
    }

    /**
     * 載入現有翻譯文件
     */
    loadExistingTranslations() {
        if (!this.options.preserveExisting) return;
        
        this.options.languages.forEach(lang => {
            const filePath = path.join(this.options.outputDir, `${lang}.json`);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const parsed = JSON.parse(content);
                    // Flatten nested JSON to match extraction format
                    this.existingTranslations[lang] = this.flattenObject(parsed);
                    console.log(`📖 載入現有翻譯: ${lang}.json`);
                } catch (e) {
                    console.warn(`⚠️  無法載入 ${lang}.json:`, e.message);
                }
            }
        });
    }

    /**
     * 將巢狀物件扁平化為點記法鍵值
     */
    flattenObject(obj, prefix = '') {
        const flattened = {};
        
        for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(flattened, this.flattenObject(obj[key], fullKey));
            } else {
                flattened[fullKey] = obj[key];
            }
        }
        
        return flattened;
    }

    /**
     * 掃描目錄
     */
    async scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 跳過排除的目錄
                if (this.options.exclude.includes(item)) continue;
                await this.scanDirectory(fullPath);
            } else if (stat.isFile()) {
                // 檢查文件副檔名
                const ext = path.extname(item);
                if (this.options.extensions.includes(ext)) {
                    this.scanFile(fullPath);
                }
            }
        }
    }

    /**
     * 掃描單個文件
     */
    scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative('./', filePath);
            
            // 提取 data-i18n 屬性
            const dataI18nMatches = content.match(/data-i18n=["']([^"']+)["']/g);
            if (dataI18nMatches) {
                dataI18nMatches.forEach(match => {
                    const key = match.match(/data-i18n=["']([^"']+)["']/)[1];
                    this.extractedKeys.add(key);
                });
            }

            // 提取 i18n.t() 調用
            const tFunctionMatches = content.match(/i18n\.t\s*\(\s*["']([^"']+)["']/g);
            if (tFunctionMatches) {
                tFunctionMatches.forEach(match => {
                    const key = match.match(/i18n\.t\s*\(\s*["']([^"']+)["']/)[1];
                    this.extractedKeys.add(key);
                });
            }

            // 提取 t() 調用 (如果有全域 t 函數)
            const globalTMatches = content.match(/\bt\s*\(\s*["']([^"']+)["']/g);
            if (globalTMatches) {
                globalTMatches.forEach(match => {
                    const key = match.match(/\bt\s*\(\s*["']([^"']+)["']/)[1];
                    this.extractedKeys.add(key);
                });
            }

            if (dataI18nMatches || tFunctionMatches || globalTMatches) {
                console.log(`📄 掃描: ${relativePath}`);
            }
            
        } catch (e) {
            console.warn(`⚠️  無法讀取文件 ${filePath}:`, e.message);
        }
    }

    /**
     * 生成翻譯文件
     */
    generateTranslationFiles() {
        // 確保輸出目錄存在
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
        }

        // 轉換為排序的陣列
        const sortedKeys = this.options.sortKeys 
            ? Array.from(this.extractedKeys).sort()
            : Array.from(this.extractedKeys);

        this.options.languages.forEach(lang => {
            const filePath = path.join(this.options.outputDir, `${lang}.json`);
            const existing = this.existingTranslations[lang] || {};
            const translations = {};

            // 建立巢狀物件結構
            sortedKeys.forEach(key => {
                const value = existing[key] || (lang === this.options.defaultLang ? this.generateDefaultValue(key) : '');
                this.setNestedValue(translations, key, value);
            });

            // 寫入文件
            const jsonContent = JSON.stringify(translations, null, 2);
            fs.writeFileSync(filePath, jsonContent, 'utf8');
            
            console.log(`📝 生成: ${lang}.json (${sortedKeys.length} 個鍵值)`);
        });

        // 生成鍵值統計
        this.generateStats(sortedKeys);
    }

    /**
     * 設定巢狀物件值
     */
    setNestedValue(obj, key, value) {
        const keys = key.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const currentKey = keys[i];
            
            // 如果當前鍵值已存在且不是物件，跳過這個鍵值
            if (current[currentKey] && typeof current[currentKey] !== 'object') {
                console.warn(`⚠️  鍵值衝突: ${key} (${currentKey} 已存在為字串)`);
                return;
            }
            
            if (!(currentKey in current)) {
                current[currentKey] = {};
            }
            current = current[currentKey];
        }
        
        const finalKey = keys[keys.length - 1];
        
        // 如果最終鍵值已存在且是物件，也跳過
        if (current[finalKey] && typeof current[finalKey] === 'object') {
            console.warn(`⚠️  鍵值衝突: ${key} (${finalKey} 已存在為物件)`);
            return;
        }
        
        current[finalKey] = value;
    }

    /**
     * 生成預設值 (基於鍵值推測)
     */
    generateDefaultValue(key) {
        // 簡單的鍵值轉換邏輯
        const lastPart = key.split('.').pop();
        
        // 常見的按鈕文字
        const buttonMap = {
            'save': 'Save',
            'cancel': 'Cancel',
            'submit': 'Submit',
            'delete': 'Delete',
            'edit': 'Edit',
            'add': 'Add',
            'remove': 'Remove',
            'confirm': 'Confirm',
            'close': 'Close',
            'back': 'Back',
            'next': 'Next',
            'prev': 'Previous',
            'ok': 'OK',
            'yes': 'Yes',
            'no': 'No'
        };

        if (buttonMap[lastPart]) {
            return buttonMap[lastPart];
        }

        // 轉換駝峰命名或底線命名為標題格式
        return lastPart
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/^\w/, c => c.toUpperCase())
            .trim();
    }

    /**
     * 生成統計報告
     */
    generateStats(keys) {
        const statsPath = path.join(this.options.outputDir, 'extraction-stats.json');
        const stats = {
            timestamp: new Date().toISOString(),
            totalKeys: keys.length,
            languages: this.options.languages,
            keysByCategory: this.categorizeKeys(keys),
            missingTranslations: this.findMissingTranslations(keys)
        };

        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
        console.log(`📊 統計報告: extraction-stats.json`);
    }

    /**
     * 按類別分組鍵值
     */
    categorizeKeys(keys) {
        const categories = {};
        keys.forEach(key => {
            const category = key.split('.')[0];
            if (!categories[category]) categories[category] = 0;
            categories[category]++;
        });
        return categories;
    }

    /**
     * 找出缺少翻譯的鍵值
     */
    findMissingTranslations(keys) {
        const missing = {};
        this.options.languages.forEach(lang => {
            const existing = this.existingTranslations[lang] || {};
            // Use flattened keys for comparison
            missing[lang] = keys.filter(key => !existing[key] || existing[key] === '');
        });
        return missing;
    }

    /**
     * 生成 JavaScript 載入器
     * 用於動態載入 JSON 翻譯檔案
     */
    generateJavaScriptLoader() {
        const loaderPath = path.join(this.options.outputDir, 'rue-i18n-loader.js');
        
        const loaderCode = `/**
 * Rue I18n 動態載入器
 * 自動載入 JSON 翻譯檔案
 */
class RueI18nLoader {
    constructor(options = {}) {
        this.basePath = options.basePath || './locales/';
        this.languages = ${JSON.stringify(this.options.languages)};
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
            const response = await fetch(\`\${this.basePath}\${lang}.json\`);
            if (!response.ok) {
                throw new Error(\`Failed to load \${lang}.json\`);
            }
            
            const translations = await response.json();
            this.cache[lang] = this.flattenTranslations(translations);
            return this.cache[lang];
        } catch (error) {
            console.warn(\`Warning: Could not load translations for \${lang}\`, error);
            return {};
        }
    }

    /**
     * 將巢狀物件扁平化
     */
    flattenTranslations(obj, prefix = '') {
        const flattened = {};
        
        for (const key in obj) {
            const fullKey = prefix ? \`\${prefix}.\${key}\` : key;
            
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
`;

        fs.writeFileSync(loaderPath, loaderCode, 'utf8');
        console.log(`📜 生成載入器: rue-i18n-loader.js`);
    }

    /**
     * 匯出 HTML 內容為翻譯鍵值
     * 掃描 HTML 中的文字內容並生成翻譯鍵值
     */
    exportHtmlContent(htmlContent) {
        const extractedContent = {};
        
        // 使用簡單的正則表達式提取 HTML 標籤間的文字
        const textMatches = htmlContent.match(/>([^<]+)</g);
        
        if (textMatches) {
            textMatches.forEach((match, index) => {
                const text = match.replace(/^>|<$/g, '').trim();
                if (text && text.length > 1 && !/^\d+$/.test(text)) {
                    // 生成鍵值 (可以根據內容或位置生成)
                    const key = `content.text_${index + 1}`;
                    extractedContent[key] = text;
                }
            });
        }
        
        return extractedContent;
    }
}

// CLI 介面
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // 解析命令列參數
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i]?.replace(/^--/, '');
        const value = args[i + 1];
        
        switch (key) {
            case 'output':
            case 'o':
                options.outputDir = value;
                break;
            case 'languages':
            case 'l':
                options.languages = value.split(',');
                break;
            case 'default-lang':
                options.defaultLang = value;
                break;
            case 'exclude':
                options.exclude = value.split(',');
                break;
        }
    }

    const extractor = new I18nExtractor(options);
    extractor.extract().catch(console.error);
}

module.exports = I18nExtractor;