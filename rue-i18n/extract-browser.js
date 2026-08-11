/**
 * Rue I18n 瀏覽器端提取工具
 * 在瀏覽器 Console 中執行，自動提取頁面中需要翻譯的文字
 * 
 * 使用方式：
 * 1. 在瀏覽器中開啟你的網頁
 * 2. 打開開發者工具 (F12)
 * 3. 在 Console 中貼上這個檔案的內容並執行
 * 4. 或者載入這個檔案：<script src="extract-browser.js"></script>
 * 5. 執行 RueI18nExtractor.extract()
 */

(function() {
    'use strict';
    
    const RueI18nExtractor = {
        /**
         * 提取頁面中所有需要翻譯的文字
         * @param {Object} options - 選項
         * @param {boolean} options.copyToClipboard - 是否複製到剪貼簿 (預設: true)
         * @param {boolean} options.includeEmpty - 是否包含空白文字 (預設: false)
         * @param {boolean} options.nested - 是否使用巢狀結構 (預設: true)
         * @returns {Object} 提取的翻譯鍵值
         */
        extract: function(options = {}) {
            const settings = {
                copyToClipboard: options.copyToClipboard !== false,
                includeEmpty: options.includeEmpty || false,
                nested: options.nested !== false
            };
            
            console.log('🔍 開始提取翻譯鍵值...');
            console.log('設定:', settings);
            
            const keys = {};
            let count = 0;
            
            // 找出所有有 data-i18n 屬性的元素
            const elements = document.querySelectorAll('[data-i18n]');
            
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                let text = '';
                
                // 取得文字內容
                if (el.placeholder !== undefined && el.tagName !== 'SPAN') {
                    // 如果是 input 等表單元素，取 placeholder
                    text = el.placeholder;
                } else {
                    // 否則取 textContent
                    text = el.textContent.trim();
                }
                
                // 過濾空白文字
                if (!settings.includeEmpty && !text) {
                    return;
                }
                
                keys[key] = text;
                count++;
            });
            
            console.log(`✅ 找到 ${count} 個翻譯鍵值`);
            
            // 轉換為巢狀結構
            let result;
            if (settings.nested) {
                result = this.toNested(keys);
                console.log('📦 已轉換為巢狀結構');
            } else {
                result = keys;
            }
            
            // 輸出 JSON
            const json = JSON.stringify(result, null, 2);
            console.log('\n=== 翻譯鍵值 JSON ===');
            console.log(json);
            
            // 複製到剪貼簿
            if (settings.copyToClipboard && navigator.clipboard) {
                navigator.clipboard.writeText(json).then(() => {
                    console.log('\n✅ 已複製到剪貼簿！');
                    console.log('💡 你可以直接貼到你的程式碼中');
                }).catch(err => {
                    console.warn('⚠️  無法複製到剪貼簿:', err);
                });
            }
            
            // 顯示統計
            this.showStats(keys);
            
            return result;
        },
        
        /**
         * 將扁平的鍵值轉換為巢狀結構
         * @param {Object} flat - 扁平的鍵值物件
         * @returns {Object} 巢狀結構的物件
         */
        toNested: function(flat) {
            const nested = {};
            
            for (const key in flat) {
                const parts = key.split('.');
                let current = nested;
                
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
                
                const lastPart = parts[parts.length - 1];
                current[lastPart] = flat[key];
            }
            
            return nested;
        },
        
        /**
         * 顯示統計資訊
         * @param {Object} keys - 鍵值物件
         */
        showStats: function(keys) {
            const categories = {};
            
            // 按類別分組
            for (const key in keys) {
                const category = key.split('.')[0];
                if (!categories[category]) {
                    categories[category] = 0;
                }
                categories[category]++;
            }
            
            console.log('\n📊 統計資訊:');
            console.log('總數:', Object.keys(keys).length);
            console.log('\n按類別分組:');
            for (const category in categories) {
                console.log(`  ${category}: ${categories[category]} 個`);
            }
        },
        
        /**
         * 產生翻譯模板
         * @param {Array<string>} languages - 語言列表
         * @returns {Object} 多語言模板
         */
        generateTemplate: function(languages = ['en', 'zh-Hant', 'zh-Hans']) {
            console.log('🔧 產生多語言模板...');
            
            const keys = {};
            const elements = document.querySelectorAll('[data-i18n]');
            
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                let text = '';
                
                if (el.placeholder !== undefined && el.tagName !== 'SPAN') {
                    text = el.placeholder;
                } else {
                    text = el.textContent.trim();
                }
                
                keys[key] = text;
            });
            
            // 產生多語言模板
            const template = {};
            languages.forEach(lang => {
                template[lang] = {};
                for (const key in keys) {
                    template[lang][key] = lang === 'en' ? keys[key] : `[${lang}] ${keys[key]}`;
                }
            });
            
            const json = JSON.stringify(template, null, 2);
            console.log('\n=== 多語言模板 ===');
            console.log(json);
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(json).then(() => {
                    console.log('\n✅ 已複製到剪貼簿！');
                });
            }
            
            return template;
        },
        
        /**
         * 匯出為可下載的 JSON 檔案
         * @param {string} filename - 檔案名稱
         */
        exportToFile: function(filename = 'translations.json') {
            const keys = {};
            const elements = document.querySelectorAll('[data-i18n]');
            
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                let text = '';
                
                if (el.placeholder !== undefined && el.tagName !== 'SPAN') {
                    text = el.placeholder;
                } else {
                    text = el.textContent.trim();
                }
                
                if (text) {
                    keys[key] = text;
                }
            });
            
            const nested = this.toNested(keys);
            const json = JSON.stringify(nested, null, 2);
            
            // 建立下載連結
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log(`✅ 已下載檔案: ${filename}`);
        },
        
        /**
         * 顯示幫助資訊
         */
        help: function() {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║           Rue I18n 瀏覽器端提取工具                        ║
╚════════════════════════════════════════════════════════════╝

📖 使用方式：

1. 基本提取（自動複製到剪貼簿）
   RueI18nExtractor.extract()

2. 提取但不複製到剪貼簿
   RueI18nExtractor.extract({ copyToClipboard: false })

3. 提取扁平結構（不使用巢狀）
   RueI18nExtractor.extract({ nested: false })

4. 產生多語言模板
   RueI18nExtractor.generateTemplate(['en', 'zh-Hant', 'zh-Hans'])

5. 匯出為 JSON 檔案
   RueI18nExtractor.exportToFile('my-translations.json')

6. 顯示這個幫助訊息
   RueI18nExtractor.help()

💡 提示：
- 確保你的 HTML 元素有 data-i18n 屬性
- 提取結果會自動複製到剪貼簿
- 可以直接貼到你的 i18n.addLanguagePack() 中

📚 更多資訊：
https://github.com/herboratory/rue
            `);
        }
    };
    
    // 掛載到 window
    if (typeof window !== 'undefined') {
        window.RueI18nExtractor = RueI18nExtractor;
        
        // 自動顯示幫助
        console.log('✅ Rue I18n 提取工具已載入');
        console.log('💡 執行 RueI18nExtractor.help() 查看使用說明');
        console.log('🚀 執行 RueI18nExtractor.extract() 開始提取');
    }
    
    // 如果是 Node.js 環境
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RueI18nExtractor;
    }
})();
