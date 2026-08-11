/**
 * Rue I18n 提取工具配置文件
 */
module.exports = {
    // 掃描的文件類型
    extensions: ['.html', '.js', '.ts', '.vue', '.jsx', '.tsx'],
    
    // 排除的目錄
    exclude: ['node_modules', '.git', 'dist', 'build', 'locales'],
    
    // 翻譯文件輸出目錄
    outputDir: './locales',
    
    // 預設語言 (會自動生成預設值)
    defaultLang: 'en',
    
    // 支援的語言列表
    languages: ['en', 'zh-TW', 'zh-CN', 'ja'],
    
    // 是否保留現有翻譯 (不會覆蓋已有的翻譯)
    preserveExisting: true,
    
    // 是否排序鍵值
    sortKeys: true,
    
    // 自定義鍵值轉預設值的映射
    defaultValueMap: {
        // 按鈕相關
        'btn.save': 'Save',
        'btn.cancel': 'Cancel',
        'btn.submit': 'Submit',
        'btn.delete': 'Delete',
        'btn.edit': 'Edit',
        'btn.add': 'Add',
        'btn.remove': 'Remove',
        'btn.confirm': 'Confirm',
        'btn.close': 'Close',
        'btn.back': 'Back',
        'btn.next': 'Next',
        'btn.previous': 'Previous',
        
        // 表單相關
        'form.name': 'Name',
        'form.email': 'Email',
        'form.password': 'Password',
        'form.message': 'Message',
        'form.required': 'Required',
        'form.optional': 'Optional',
        
        // 狀態相關
        'status.loading': 'Loading...',
        'status.success': 'Success',
        'status.error': 'Error',
        'status.warning': 'Warning',
        
        // 通用
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.ok': 'OK',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.sort': 'Sort'
    }
};