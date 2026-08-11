/**
 * Rue Notes - Markdown-based content module for blogs, newsrooms, changelogs
 * Part of the Rue toolkit for static sites
 */
class RueNotes {
    constructor(options = {}) {
        // v0.1 properties
        this.container = typeof options.container === 'string'
            ? document.querySelector(options.container)
            : options.container;
        
        if (!this.container) {
            throw new Error('RueNotes: container not found');
        }

        this.contentPath = options.contentPath || '/content/';
        this.lang = options.lang || document.documentElement.lang || 'en';
        this.fallback = options.fallback || this.getDefaultFallbackChain(this.lang);
        this.entries = options.entries || [];
        this.noteMap = {};
        this.template = options.template || this.defaultTemplate.bind(this);
        this.detailTemplate = options.detailTemplate || this.defaultDetailTemplate.bind(this);
        this.view = options.view || 'list'; // 'list' or 'detail'
        this.onEntryClick = options.onEntryClick || null;
        
        // v0.2: Full configuration
        this.config = {
            routing: options.routing || { enabled: false, base: '#notes' },
            search: options.search || { enabled: false },
            filters: options.filters || { type: false, tag: false },
            pagination: options.pagination || { enabled: false, perPage: 10 },
            prevNext: options.prevNext || false,
            catalogue: options.catalogue || { enabled: false, nested: false },
            seo: options.seo || { enabled: true },
            markdown: options.markdown || { extended: true },
            syntaxHighlight: options.syntaxHighlight || { enabled: true },
            showDrafts: options.showDrafts || false
        };
        
        // Validate configuration
        this.validateConfiguration(this.config);
        
        // v0.2: Module instances
        this.router = null;
        this.searchEngine = null;
        this.filterManager = null;
        this.paginationManager = null;
        this.prevNextNavigator = null;
        this.seoManager = null;
        this.markdownRenderer = null;
        this.syntaxHighlighter = null;
        this.contentSchema = null;
        this.catalogueManager = null;
        
        // v0.2: Application state
        this.state = {
            view: this.view,
            currentSlug: null,
            currentCategory: null,
            searchQuery: '',
            filters: {},
            pagination: null,
            language: this.lang,
            entries: [],
            filteredEntries: [],
            displayedEntries: []
        };
        
        // v0.2: Event system
        this.eventBus = {
            listeners: {},
            on: (event, handler) => {
                if (!this.eventBus.listeners[event]) {
                    this.eventBus.listeners[event] = [];
                }
                this.eventBus.listeners[event].push(handler);
            },
            off: (event, handler) => {
                if (!this.eventBus.listeners[event]) return;
                this.eventBus.listeners[event] = this.eventBus.listeners[event].filter(h => h !== handler);
            },
            emit: (event, data) => {
                if (!this.eventBus.listeners[event]) return;
                this.eventBus.listeners[event].forEach(handler => handler(data));
            }
        };
        
        // Initialize all modules
        this.initializeModules();
        
        // Build note map from entries
        if (this.entries.length) {
            this.buildNoteMap();
            this.state.entries = this.getAllEntries();
        }
    }

    /**
     * Get default fallback chain based on current language
     * v0.2: Enhanced with more comprehensive language fallback rules
     */
    getDefaultFallbackChain(lang) {
        // Normalize language code
        const normalized = this._normalizeLangCode(lang);
        
        // Define fallback chains for common languages
        const fallbackChains = {
            // Chinese variants
            'zh-Hans': ['zh-Hans', 'zh-CN', 'zh-Hant', 'zh-TW', 'zh', 'en'],
            'zh-CN': ['zh-CN', 'zh-Hans', 'zh-Hant', 'zh-TW', 'zh', 'en'],
            'zh-Hant': ['zh-Hant', 'zh-TW', 'zh-Hans', 'zh-CN', 'zh', 'en'],
            'zh-TW': ['zh-TW', 'zh-Hant', 'zh-Hans', 'zh-CN', 'zh', 'en'],
            'zh': ['zh', 'zh-Hant', 'zh-Hans', 'en'],
            
            // English variants
            'en': ['en', 'en-US', 'en-GB'],
            'en-US': ['en-US', 'en', 'en-GB'],
            'en-GB': ['en-GB', 'en', 'en-US'],
            
            // Japanese
            'ja': ['ja', 'ja-JP', 'en'],
            'ja-JP': ['ja-JP', 'ja', 'en'],
            
            // Korean
            'ko': ['ko', 'ko-KR', 'en'],
            'ko-KR': ['ko-KR', 'ko', 'en'],
            
            // French
            'fr': ['fr', 'fr-FR', 'en'],
            'fr-FR': ['fr-FR', 'fr', 'en'],
            
            // German
            'de': ['de', 'de-DE', 'en'],
            'de-DE': ['de-DE', 'de', 'en'],
            
            // Spanish
            'es': ['es', 'es-ES', 'en'],
            'es-ES': ['es-ES', 'es', 'en']
        };
        
        // Return predefined chain or default to [lang, 'en']
        return fallbackChains[normalized] || [normalized, 'en'];
    }
    
    /**
     * Normalize language code to standard format
     * @private
     */
    _normalizeLangCode(lang) {
        if (!lang) return 'en';
        
        // Convert to lowercase for comparison
        const lower = lang.toLowerCase();
        
        // Map common variations to standard codes
        const mappings = {
            'zh-cn': 'zh-Hans',
            'zh-sg': 'zh-Hans',
            'zh-tw': 'zh-Hant',
            'zh-hk': 'zh-Hant',
            'zh-mo': 'zh-Hant'
        };
        
        return mappings[lower] || lang;
    }

    /**
     * v0.2: Validate configuration
     * @param {Object} config - Configuration object to validate
     * @throws {Error} If configuration is invalid
     */
    validateConfiguration(config) {
        // Validate pagination.perPage
        if (config.pagination && config.pagination.enabled) {
            if (config.pagination.perPage !== undefined) {
                if (typeof config.pagination.perPage !== 'number' || config.pagination.perPage <= 0) {
                    throw new Error('RueNotes Configuration Error: pagination.perPage must be a positive number');
                }
            }
        }
        
        // Validate routing.base
        if (config.routing && config.routing.enabled) {
            if (config.routing.base && typeof config.routing.base !== 'string') {
                throw new Error('RueNotes Configuration Error: routing.base must be a string');
            }
        }
        
        // Validate search.fields
        if (config.search && config.search.enabled) {
            if (config.search.fields && !Array.isArray(config.search.fields)) {
                throw new Error('RueNotes Configuration Error: search.fields must be an array');
            }
        }
        
        // Validate prevNext configuration
        if (config.prevNext && typeof config.prevNext === 'object') {
            if (config.prevNext.sortOrder && !['asc', 'desc'].includes(config.prevNext.sortOrder)) {
                throw new Error('RueNotes Configuration Error: prevNext.sortOrder must be "asc" or "desc"');
            }
        }
        
        // Warn about deprecated or unknown options
        const knownOptions = ['routing', 'search', 'filters', 'pagination', 'prevNext', 'catalogue', 'seo', 'markdown', 'syntaxHighlight', 'showDrafts'];
        Object.keys(config).forEach(key => {
            if (!knownOptions.includes(key)) {
                console.warn(`RueNotes: Unknown configuration option "${key}" will be ignored`);
            }
        });
    }

    /**
     * v0.2: Initialize all modules based on configuration
     * Unified module lifecycle with clear initialization order
     */
    initializeModules() {
        console.log('RueNotes: Initializing modules...');
        
        // Phase 0: Schema and validation
        this._initializeContentSchema();
        
        // Phase 1: Core rendering modules (no dependencies)
        this._initializeSyntaxHighlighter();
        this._initializeMarkdownRenderer();
        
        // Phase 2: Data processing modules (no dependencies)
        this._initializeSearchEngine();
        this._initializeFilterManager();
        
        // Phase 3: UI enhancement modules (no dependencies)
        this._initializePaginationManager();
        this._initializePrevNextNavigator();
        this._initializeSEOManager();
        this._initializeCatalogueManager();
        
        // Phase 4: Router (must be last as it may trigger navigation)
        this._initializeRouter();
        
        console.log('RueNotes: Module initialization complete', {
            contentSchema: !!this.contentSchema,
            syntaxHighlighter: !!this.syntaxHighlighter,
            markdownRenderer: !!this.markdownRenderer,
            searchEngine: !!this.searchEngine,
            filterManager: !!this.filterManager,
            paginationManager: !!this.paginationManager,
            prevNextNavigator: !!this.prevNextNavigator,
            seoManager: !!this.seoManager,
            router: !!this.router
        });
    }
    
    /**
     * Initialize ContentSchema module
     * @private
     */
    _initializeContentSchema() {
        if (typeof ContentSchema === 'undefined') {
            console.warn('RueNotes: ContentSchema not loaded. Schema validation disabled.');
            return;
        }
        
        try {
            this.contentSchema = ContentSchema;
            console.log('RueNotes: ContentSchema initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize ContentSchema', error);
        }
    }
    
    /**
     * Initialize SyntaxHighlighter module
     * @private
     */
    _initializeSyntaxHighlighter() {
        if (!this.config.syntaxHighlight.enabled) {
            return;
        }
        
        if (typeof SyntaxHighlighter === 'undefined') {
            console.warn('RueNotes: SyntaxHighlighter not loaded. Syntax highlighting disabled.');
            return;
        }
        
        try {
            this.syntaxHighlighter = new SyntaxHighlighter(this.config.syntaxHighlight);
            console.log('RueNotes: SyntaxHighlighter initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize SyntaxHighlighter', error);
        }
    }
    
    /**
     * Initialize MarkdownRenderer module
     * @private
     */
    _initializeMarkdownRenderer() {
        if (typeof MarkdownRenderer === 'undefined') {
            console.warn('RueNotes: MarkdownRenderer not loaded. Using basic markdown rendering.');
            return;
        }
        
        try {
            this.markdownRenderer = new MarkdownRenderer({
                ...this.config.markdown,
                syntaxHighlighter: this.syntaxHighlighter
            });
            console.log('RueNotes: MarkdownRenderer initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize MarkdownRenderer', error);
        }
    }
    
    /**
     * Initialize SearchEngine module
     * @private
     */
    _initializeSearchEngine() {
        if (!this.config.search.enabled) {
            return;
        }
        
        if (typeof SearchEngine === 'undefined') {
            console.warn('RueNotes: SearchEngine not loaded. Search functionality disabled.');
            return;
        }
        
        try {
            this.searchEngine = new SearchEngine(this.config.search);
            console.log('RueNotes: SearchEngine initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize SearchEngine', error);
        }
    }
    
    /**
     * Initialize FilterManager module
     * @private
     */
    _initializeFilterManager() {
        const f = this.config.filters || {};
        if (!f.type && !f.tag && !f.tags && !f.category) {
            return;
        }
        
        if (typeof FilterManager === 'undefined') {
            console.warn('RueNotes: FilterManager not loaded. Filter functionality disabled.');
            return;
        }
        
        try {
            this.filterManager = new FilterManager();
            console.log('RueNotes: FilterManager initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize FilterManager', error);
        }
    }
    
    /**
     * Initialize PaginationManager module
     * @private
     */
    _initializePaginationManager() {
        if (!this.config.pagination.enabled) {
            return;
        }
        
        if (typeof PaginationManager === 'undefined') {
            console.warn('RueNotes: PaginationManager not loaded. Pagination functionality disabled.');
            return;
        }
        
        try {
            this.paginationManager = new PaginationManager(this.config.pagination);
            console.log('RueNotes: PaginationManager initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize PaginationManager', error);
        }
    }
    
    /**
     * Initialize PrevNextNavigator module
     * @private
     */
    _initializePrevNextNavigator() {
        if (!this.config.prevNext) {
            return;
        }
        
        if (typeof PrevNextNavigator === 'undefined') {
            console.warn('RueNotes: PrevNextNavigator not loaded. Previous/Next navigation disabled.');
            return;
        }
        
        try {
            // Convert boolean to config object if needed
            const prevNextConfig = typeof this.config.prevNext === 'boolean' 
                ? { enabled: this.config.prevNext }
                : this.config.prevNext;
            this.prevNextNavigator = new PrevNextNavigator(prevNextConfig);
            console.log('RueNotes: PrevNextNavigator initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize PrevNextNavigator', error);
        }
    }
    
    /**
     * Initialize SEOManager module
     * @private
     */
    _initializeSEOManager() {
        if (!this.config.seo.enabled) {
            return;
        }
        
        if (typeof SEOManager === 'undefined') {
            console.warn('RueNotes: SEOManager not loaded. SEO functionality disabled.');
            return;
        }
        
        try {
            this.seoManager = new SEOManager(this.config.seo);
            console.log('RueNotes: SEOManager initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize SEOManager', error);
        }
    }
    
    /**
     * Initialize CatalogueManager module
     * @private
     */
    _initializeCatalogueManager() {
        if (!this.config.catalogue.enabled) {
            return;
        }
        
        if (typeof CatalogueManager === 'undefined') {
            console.warn('RueNotes: CatalogueManager not loaded. Catalogue functionality disabled.');
            return;
        }
        
        try {
            this.catalogueManager = new CatalogueManager(this.config.catalogue);
            console.log('RueNotes: CatalogueManager initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize CatalogueManager', error);
        }
    }
    
    /**
     * Initialize Router module (must be last)
     * @private
     */
    _initializeRouter() {
        if (!this.config.routing.enabled) {
            return;
        }
        
        if (typeof Router === 'undefined') {
            console.warn('RueNotes: Router not loaded. Routing functionality disabled.');
            return;
        }
        
        try {
            this.router = new Router(this, this.config.routing);
            this.router.init();
            console.log('RueNotes: Router initialized');
        } catch (error) {
            console.error('RueNotes: Failed to initialize Router', error);
        }
    }

    /**
     * v0.2: Update application state
     * @param {Object} newState - Partial state to update
     */
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        // Emit state change event
        this.emit('stateChange', { oldState, newState: this.state });
        
        // Emit specific events
        if (newState.searchQuery !== undefined && newState.searchQuery !== oldState.searchQuery) {
            this.emit('searchChange', newState.searchQuery);
        }
        if (newState.filters !== undefined && JSON.stringify(newState.filters) !== JSON.stringify(oldState.filters)) {
            this.emit('filterChange', newState.filters);
        }
        if (newState.view !== undefined && newState.view !== oldState.view) {
            this.emit('viewChange', newState.view);
        }
        if (newState.language !== undefined && newState.language !== oldState.language) {
            this.emit('languageChange', newState.language);
        }
    }

    /**
     * v0.2: Register event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        this.eventBus.on(event, handler);
    }

    /**
     * v0.2: Remove event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off(event, handler) {
        this.eventBus.off(event, handler);
    }

    /**
     * v0.2: Emit event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        this.eventBus.emit(event, data);
    }

    /**
     * Build note map from entries array
     * Supports both single-language (slug) and multi-language (slug.lang) formats
     */
    buildNoteMap() {
        this.noteMap = {};
        this.entries.forEach(entry => {
            if (entry.slug && entry.lang) {
                // Multi-language format: slug.lang
                const key = `${entry.slug}.${entry.lang}`;
                this.noteMap[key] = entry;
            } else if (entry.slug) {
                // Single-language format: slug only
                this.noteMap[entry.slug] = entry;
            }
        });
    }

    /**
     * Resolve note entry by slug and language
     * v0.2: Enhanced with better fallback logic and caching
     * Tries multi-language versions first, then falls back to single-language
     */
    resolveNote(slug, lang = this.lang, fallbackChain = this.fallback) {
        // Try exact match first (most common case)
        const exactKey = `${slug}.${lang}`;
        if (this.noteMap[exactKey]) {
            return { ...this.noteMap[exactKey], _fallbackLang: null };
        }
        
        // Try fallback chain
        const chain = fallbackChain || this.getDefaultFallbackChain(lang);
        
        for (const fallbackLang of chain) {
            // Skip the original language (already tried)
            if (fallbackLang === lang) continue;
            
            const key = `${slug}.${fallbackLang}`;
            if (this.noteMap[key]) {
                return { 
                    ...this.noteMap[key], 
                    _fallbackLang: fallbackLang,
                    _requestedLang: lang
                };
            }
        }
        
        // Try single-language version (no language suffix)
        if (this.noteMap[slug]) {
            return { 
                ...this.noteMap[slug], 
                _fallbackLang: null,
                _requestedLang: lang
            };
        }
        
        // Try normalized language codes
        const normalized = this._normalizeLangCode(lang);
        if (normalized !== lang) {
            return this.resolveNote(slug, normalized, fallbackChain);
        }
        
        return null;
    }

    /**
     * Get all entries for current language
     * v0.2: Enhanced with better deduplication and fallback handling
     */
    getAllEntries(lang = this.lang) {
        const entries = [];
        const processedSlugs = new Set();
        
        // First pass: collect all unique slugs
        Object.keys(this.noteMap).forEach(key => {
            // Split on the last dot only: "v2.0-release.zh-Hant" → "v2.0-release"
            const lastDot = key.lastIndexOf('.');
            const slug = lastDot > 0 ? key.substring(0, lastDot) : key;
            processedSlugs.add(slug);
        });
        
        // Second pass: resolve each slug with fallback
        processedSlugs.forEach(slug => {
            const entry = this.resolveNote(slug, lang);
            if (entry) {
                // Filter out drafts unless explicitly requested
                if (entry.draft && !this.config.showDrafts) {
                    return;
                }
                entries.push(entry);
            }
        });
        
        return entries;
    }

    /**
     * Parse frontmatter from markdown content
     */
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return { frontmatter: {}, content: content };
        }
        
        const frontmatterText = match[1];
        const bodyContent = match[2];
        const frontmatter = {};
        
        // YAML-like parser: supports inline arrays [a, b] and block arrays (- item per line)
        const lines = frontmatterText.split('\n');
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const colonIndex = line.indexOf(':');

            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();

                // Peek ahead: block-style array (next lines start with "  - " or "- ")
                if (value === '') {
                    const items = [];
                    let j = i + 1;
                    while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
                        items.push(lines[j].replace(/^\s*-\s+/, '').trim().replace(/^['"]|['"]$/g, ''));
                        j++;
                    }
                    if (items.length > 0) {
                        frontmatter[key] = items;
                        i = j;
                        continue;
                    }
                    // Empty value with no list items → empty string
                    frontmatter[key] = '';
                    i++;
                    continue;
                }

                // Remove surrounding quotes
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                // Inline array: [a, b, c]
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, '')).filter(v => v !== '');
                }

                frontmatter[key] = value;
            }
            i++;
        }
        
        return { frontmatter, content: bodyContent };
    }

    /**
     * Simple markdown to HTML converter (basic support)
     * Uses MarkdownRenderer if available, otherwise falls back to basic rendering
     */
    markdownToHtml(markdown) {
        // Use MarkdownRenderer if available
        if (this.markdownRenderer) {
            return this.markdownRenderer.render(markdown);
        }
        
        // Fallback to basic rendering (v0.1 compatibility)
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Inline code (must come before links to avoid `[code](url)` conflicts)
        html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Lists: group consecutive list lines into <ul> or <ol> blocks
        const lines = html.split('\n');
        const listOut = [];
        let i = 0;
        while (i < lines.length) {
            if (/^\* .+/.test(lines[i])) {
                const items = [];
                while (i < lines.length && /^\* .+/.test(lines[i])) {
                    items.push(`<li>${lines[i].replace(/^\* /, '')}</li>`);
                    i++;
                }
                listOut.push(`<ul>${items.join('')}</ul>`);
                continue;
            }
            if (/^\d+\. .+/.test(lines[i])) {
                const items = [];
                while (i < lines.length && /^\d+\. .+/.test(lines[i])) {
                    items.push(`<li>${lines[i].replace(/^\d+\. /, '')}</li>`);
                    i++;
                }
                listOut.push(`<ol>${items.join('')}</ol>`);
                continue;
            }
            listOut.push(lines[i]);
            i++;
        }
        html = listOut.join('\n');
        
        // Paragraphs
        html = html.split('\n\n').map(para => {
            if (!para.match(/^<[h|u|o|l]/)) {
                return `<p>${para}</p>`;
            }
            return para;
        }).join('\n');
        
        return html;
    }

    /**
     * Load entry from file
     */
    async loadEntry(slug, lang = this.lang) {
        const chain = [...new Set([lang, ...this.fallback])];
        
        for (const l of chain) {
            try {
                const url = `${this.contentPath}${slug}.${l}.md`;
                const response = await fetch(url);
                
                if (response.ok) {
                    const content = await response.text();
                    const { frontmatter, content: body } = this.parseFrontmatter(content);
                    
                    return {
                        slug,
                        lang: l,
                        ...frontmatter,
                        content: body,
                        html: this.markdownToHtml(body),
                        _fallbackLang: l !== lang ? l : null
                    };
                }
            } catch (e) {
                // Continue to next language
            }
        }
        
        // Try single-language version
        try {
            const url = `${this.contentPath}${slug}.md`;
            const response = await fetch(url);
            
            if (response.ok) {
                const content = await response.text();
                const { frontmatter, content: body } = this.parseFrontmatter(content);
                
                return {
                    slug,
                    ...frontmatter,
                    content: body,
                    html: this.markdownToHtml(body),
                    _fallbackLang: null
                };
            }
        } catch (e) {
            // Entry not found
        }
        
        return null;
    }

    /**
     * Default list template
     */
    /**
     * Escape HTML special characters for safe insertion into HTML attributes and text.
     * Used by default templates to sanitise frontmatter values (N3 XSS fix).
     * @param {*} value - Value to escape (non-strings are coerced)
     * @returns {string}
     */
    _esc(value) {
        if (value == null) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Default list template
     */
    defaultTemplate(entry) {
        const e = this._esc.bind(this);
        const fallbackBadge = entry._fallbackLang
            ? `<span class="rue-notes-fallback-badge">${e(entry._fallbackLang)}${entry._isFallbackSearch ? ' (search)' : ''}</span>`
            : '';

        return `
            <article class="rue-notes-entry" data-slug="${e(entry.slug)}">
                <div class="rue-notes-meta">
                    ${entry.date ? `<time class="rue-notes-date">${e(entry.date)}</time>` : ''}
                    ${entry.type ? `<span class="rue-notes-type">${e(entry.type)}</span>` : ''}
                    ${fallbackBadge}
                </div>
                ${entry.title ? `<h3 class="rue-notes-title">${e(entry.title)}</h3>` : ''}
                ${entry.summary ? `<p class="rue-notes-summary">${e(entry.summary)}</p>` : ''}
                ${entry.tags && Array.isArray(entry.tags) ? `
                    <div class="rue-notes-tags">
                        ${entry.tags.map(tag => `<span class="rue-notes-tag">${e(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </article>
        `;
    }

    /**
     * Default detail template
     * v0.2: Added reading time and TOC support
     */
    defaultDetailTemplate(entry) {
        const e = this._esc.bind(this);
        const fallbackBadge = entry._fallbackLang
            ? `<div class="rue-notes-fallback-notice">This entry is currently shown in ${e(entry._fallbackLang)}</div>`
            : '';

        return `
            <article class="rue-notes-detail" data-slug="${e(entry.slug)}">
                ${fallbackBadge}
                <div class="rue-notes-meta">
                    ${entry.date ? `<time class="rue-notes-date">${e(entry.date)}</time>` : ''}
                    ${entry.type ? `<span class="rue-notes-type">${e(entry.type)}</span>` : ''}
                    ${entry.readingTime ? `<span class="rue-notes-reading-time">${e(entry.readingTime.text)}</span>` : ''}
                </div>
                ${entry.title ? `<h1 class="rue-notes-title">${e(entry.title)}</h1>` : ''}
                ${entry.summary ? `<p class="rue-notes-summary">${e(entry.summary)}</p>` : ''}
                ${entry.tocHtml && entry.toc?.length > 0 ? entry.tocHtml : ''}
                <div class="rue-notes-content">
                    ${entry.html || ''}
                </div>
                ${entry.tags && Array.isArray(entry.tags) ? `
                    <div class="rue-notes-tags">
                        ${entry.tags.map(tag => `<span class="rue-notes-tag">${e(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </article>
        `;
    }

    /**
     * Render list view
     * v0.2: Complete rendering pipeline with all modules integrated
     * Pipeline: getAllEntries → resolveLocale → search → filter → sort → pagination → render
     */
    renderList() {
        // Step 1: Get all entries with locale resolution
        let entries = this.getAllEntries(this.lang);
        
        if (!entries.length) {
            this.container.innerHTML = '<p class="rue-notes-empty">No entries to display</p>';
            return;
        }
        
        // Step 2: Apply search if query exists
        if (this.state.searchQuery && this.state.searchQuery.trim() !== '' && this.searchEngine) {
            const results = this.searchEngine.search(entries, this.state.searchQuery);
            entries = results.map(result => result.entry);
            
            // If no results and fallback enabled, search in fallback languages
            if (entries.length === 0) {
                const fallbackResults = this.searchFallbackLanguages(this.state.searchQuery);
                entries = fallbackResults.map(result => result.entry);
            }
        }
        
        // Step 3: Apply filters if criteria exists
        if (this.state.filters && Object.keys(this.state.filters).length > 0 && this.filterManager) {
            entries = this.filterManager.filter(entries, this.state.filters);
        }
        
        // Step 4: Sort entries by date (newest first)
        entries = this.sortEntries(entries);
        
        // Update state with processed entries
        this.state.displayedEntries = entries;
        
        // Build chrome (search bar + tag pills) — always shown so user can clear query
        let chrome = '';
        if (this.searchEngine && this.config.search.enabled) {
            // External input: just attach events, don't inject HTML
        }
        if (this.config.filters.tag && this.filterManager) {
            chrome = this.renderTagFilterUI(this.getAllEntries(this.lang));
        }

        if (!entries.length) {
            this.container.innerHTML = chrome + '<p class="rue-notes-empty">No entries match your criteria</p>';
            this.attachSearchEvents();
            this.attachTagFilterEvents();
            return;
        }
        
        // Step 5: Apply pagination if enabled
        let displayEntries = entries;
        let currentPage = 1;
        
        if (this.paginationManager && this.config.pagination.enabled) {
            // Get page from URL or default to 1
            if (this.router) {
                const routeState = this.router.parseHash(window.location.hash);
                currentPage = parseInt(routeState.params.page) || 1;
            }
            
            displayEntries = this.paginate(entries, currentPage);
        }
        
        // Step 6: Render entries
        const html = displayEntries.map(entry => this.template(entry)).join('');
        let listHtml = chrome + `<div class="rue-notes-list">${html}</div>`;
        
        // Add pagination controls if enabled
        if (this.paginationManager && this.config.pagination.enabled) {
            listHtml += this.paginationManager.renderPaginationControls();
        }
        
        this.container.innerHTML = listHtml;
        
        // Attach event listeners
        this.attachListEvents();
        this.attachPaginationEvents();
        this.attachSearchEvents();
        this.attachFilterEvents();
        this.attachTagFilterEvents();
        
        // Restore default SEO meta tags when in list view
        if (this.seoManager) {
            this.seoManager.restoreDefaultMeta();
        }
    }
    
    /**
     * Render tag filter UI (tag pills)
     * @param {Array} entries - All entries to extract tags from
     * @returns {string} HTML for tag filter UI
     */
    renderTagFilterUI(entries) {
        // Extract all unique tags
        const allTags = new Set();
        entries.forEach(entry => {
            if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        if (allTags.size === 0) {
            return '';
        }
        
        // Get active tag from state
        const activeTag = this.state.filters.tag || this.state.filters.tags;
        
        let html = '<div class="rue-notes-tag-filter">';
        html += '<div class="rue-notes-tag-pills">';
        
        // All tags pill
        const allActive = !activeTag ? 'active' : '';
        html += `<button class="rue-notes-tag-pill ${allActive}" data-tag="">All</button>`;
        
        // Individual tag pills
        Array.from(allTags).sort().forEach(tag => {
            const isActive = activeTag === tag ? 'active' : '';
            html += `<button class="rue-notes-tag-pill ${isActive}" data-tag="${tag}">${tag}</button>`;
        });
        
        html += '</div>';
        html += '</div>';
        
        return html;
    }
    
    /**
     * Attach tag filter event listeners
     */
    attachTagFilterEvents() {
        if (!this.filterManager || !this.config.filters.tag) {
            return;
        }

        const tagPills = this.container.querySelectorAll('.rue-notes-tag-pill');
        tagPills.forEach(pill => {
            if (pill.dataset.rueBoundTag === 'true') return;
            pill.dataset.rueBoundTag = 'true';

            pill.addEventListener('click', () => {
                const tag = pill.dataset.tag;

                if (tag) {
                    this.performFilter({ tag: tag });
                } else {
                    const newFilters = { ...this.state.filters };
                    delete newFilters.tag;
                    delete newFilters.tags;
                    this.setState({ filters: newFilters });

                    if (this.router) {
                        this.router.updateRoute({ tag: undefined, tags: undefined });
                    } else {
                        this.render();
                    }
                }
            });
        });
    }
    
    /**
     * Sort entries by date (newest first)
     * @param {Array} entries - Entries to sort
     * @returns {Array} Sorted entries
     */
    sortEntries(entries) {
        return [...entries].sort((a, b) => {
            if (!a.date || !b.date) return 0;
            return new Date(b.date) - new Date(a.date);
        });
    }
    
    /**
     * Attach search event listeners
     */
    attachSearchEvents() {
        if (!this.searchEngine || !this.config.search.enabled) {
            return;
        }

        const searchInput = document.querySelector('[data-rue-search]');
        if (!searchInput) return;

        // Only bind once — reuse the same external DOM element
        if (this._searchInputEl === searchInput) return;
        this._searchInputEl = searchInput;

        searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
    }
    
    /**
     * Attach filter event listeners
     */
    attachFilterEvents() {
        if (!this.filterManager) {
            return;
        }

        const filterButtons = document.querySelectorAll('.news-filter-btn, [data-rue-filter]');
        filterButtons.forEach(btn => {
            if (btn.dataset.rueBoundFilter === 'true') return;
            btn.dataset.rueBoundFilter = 'true';

            btn.addEventListener('click', () => {
                const filterType = btn.dataset.filterType || 'type';
                const filterValue = btn.dataset.filterValue;

                if (filterValue) {
                    this.performFilter({ [filterType]: filterValue });
                }
            });
        });
    }
    
    /**
     * Perform search and update view
     * @param {string} query - Search query
     */
    performSearch(query) {
        // Update state
        this.setState({ searchQuery: query });
        
        // Update URL if router is enabled (suppress the resulting hashchange render
        // since we render immediately below)
        if (this.router) {
            this.router._suppressNextRender = true;
            this.router.updateRoute({ q: query || undefined });
        }
        
        // Always re-render immediately
        this.render();
    }
    
    /**
     * Perform filter and update view
     * @param {Object} filters - Filter criteria
     */
    performFilter(filters) {
        // Merge with existing filters
        const newFilters = { ...this.state.filters, ...filters };
        
        // Update state
        this.setState({ filters: newFilters });
        
        // Update URL if router is enabled
        if (this.router) {
            this.router.updateRoute(newFilters);
        } else {
            // Re-render without router
            this.render();
        }
    }

    /**
     * Attach pagination event listeners
     */
    attachPaginationEvents() {
        if (!this.paginationManager || !this.config.pagination.enabled) {
            return;
        }

        if (this.container.dataset.rueBoundPagination === 'true') return;
        this.container.dataset.rueBoundPagination = 'true';

        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.rue-notes-pagination-btn');
            if (btn && !btn.disabled) {
                const page = parseInt(btn.dataset.page);
                if (page && page > 0) {
                    this.goToPage(page);
                }
            }
        });
    }

    /**
     * Attach prev/next navigation event listeners
     */
    attachPrevNextEvents() {
        if (!this.prevNextNavigator || !this.config.prevNext) {
            return;
        }

        if (this.container.dataset.rueBoundPrevNext === 'true') return;
        this.container.dataset.rueBoundPrevNext = 'true';

        this.container.addEventListener('click', (e) => {
            const link = e.target.closest('.rue-notes-prevnext-link');
            if (link) {
                e.preventDefault();
                const slug = link.dataset.slug;
                if (slug) {
                    if (this.router) {
                        this.router.navigate(`${slug}`, {});
                    } else {
                        this.renderDetail(slug);
                    }
                }
            }
        });
    }

    /**
     * Calculate reading time for content
     * @param {string} content - Markdown or text content
     * @param {number} wordsPerMinute - Reading speed (default: 200 for English, 300 for Chinese)
     * @returns {Object} { minutes, text }
     */
    calculateReadingTime(content, wordsPerMinute = null) {
        if (!content) {
            return { minutes: 0, text: '0 min read' };
        }
        
        // Auto-detect language and set appropriate WPM
        if (!wordsPerMinute) {
            // Check if content contains Chinese characters
            const hasChinese = /[\u4e00-\u9fa5]/.test(content);
            wordsPerMinute = hasChinese ? 300 : 200;
        }
        
        // Remove markdown syntax
        let text = content
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`[^`]+`/g, '') // Remove inline code
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text only
            .replace(/[#*_~`]/g, '') // Remove markdown symbols
            .replace(/<[^>]+>/g, ''); // Remove HTML tags
        
        // Count words
        let wordCount;
        const hasChinese = /[\u4e00-\u9fa5]/.test(text);
        
        if (hasChinese) {
            // For Chinese: count characters (excluding spaces)
            wordCount = text.replace(/\s/g, '').length;
        } else {
            // For English: count words
            wordCount = text.trim().split(/\s+/).length;
        }
        
        // Calculate minutes
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        
        // Generate text
        const text_output = minutes === 1 ? '1 min read' : `${minutes} min read`;
        
        return {
            minutes,
            text: text_output,
            wordCount
        };
    }
    
    /**
     * Render detail view
     * v0.2: Complete integration with all modules (Markdown, Syntax, SEO, PrevNext, TOC, Reading Time)
     */
    async renderDetail(slug) {
        const entry = await this.loadEntry(slug);
        
        if (!entry) {
            this.container.innerHTML = '<p class="rue-notes-error">Entry not found</p>';
            
            // Update SEO for error page
            if (this.seoManager) {
                this.seoManager.restoreDefaultMeta();
            }
            return;
        }
        
        // Calculate reading time
        const readingTime = this.calculateReadingTime(entry.content);
        entry.readingTime = readingTime;
        
        // Re-render markdown with syntax highlighting and TOC if needed
        if (this.markdownRenderer && entry.content) {
            // Enable TOC generation for detail view
            const originalTOCConfig = this.markdownRenderer.config.generateTOC;
            this.markdownRenderer.config.generateTOC = true;
            
            entry.html = this.markdownRenderer.render(entry.content);
            
            // Get TOC
            entry.toc = this.markdownRenderer.getTOC();
            entry.tocHtml = this.markdownRenderer.renderTOC();
            
            // Restore original config
            this.markdownRenderer.config.generateTOC = originalTOCConfig;
        }
        
        // Apply syntax highlighting to code blocks
        if (this.syntaxHighlighter && entry.html) {
            // Syntax highlighting is already applied by MarkdownRenderer
            // This is a fallback for cases where it wasn't applied
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = entry.html;
            const codeBlocks = tempDiv.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                if (!block.classList.contains('hljs')) {
                    this.syntaxHighlighter.highlightElement(block);
                }
            });
            entry.html = tempDiv.innerHTML;
        }
        
        // Highlight search query in content if present
        if (this.state.searchQuery && this.searchEngine) {
            entry.html = this.searchEngine.highlightMatches(entry.html, this.state.searchQuery);
        }
        
        // Render detail template
        let detailHtml = this.detailTemplate(entry);
        
        // Add prev/next navigation if enabled
        if (this.prevNextNavigator && this.config.prevNext) {
            // Get the current list of entries (respecting filters/search)
            let entries = this.state.displayedEntries.length > 0 
                ? this.state.displayedEntries 
                : this.getAllEntries();
            
            // Sort entries to match list order
            entries = this.prevNextNavigator.sortEntries(entries);
            
            // Render navigation
            const navHtml = this.prevNextNavigator.renderNavigation(slug, entries);
            detailHtml += navHtml;
        }
        
        this.container.innerHTML = detailHtml;
        
        // Attach prev/next navigation event listeners
        this.attachPrevNextEvents();
        
        // Update SEO meta tags for detail view
        if (this.seoManager) {
            this.seoManager.injectMeta({
                title: entry.title,
                description: entry.summary || entry.content?.substring(0, 160),
                slug: entry.slug,
                type: entry.type,
                date: entry.date,
                tags: entry.tags,
                lang: entry.lang || this.lang
            });
        }
        
        // Update state
        this.setState({ 
            view: 'detail', 
            currentSlug: slug 
        });
    }

    /**
     * Attach event listeners for list view
     * v0.2: Integrated with Router for navigation
     */
    attachListEvents() {
        if (this.container.dataset.rueBoundList === 'true') return;
        this.container.dataset.rueBoundList = 'true';

        this.container.addEventListener('click', (e) => {
            const entry = e.target.closest('.rue-notes-entry');
            if (entry) {
                e.preventDefault();
                const slug = entry.dataset.slug;

                if (this.router && this.config.routing.enabled) {
                    this.router.navigate(slug, {});
                } else if (this.onEntryClick) {
                    this.onEntryClick(slug, e);
                } else {
                    this.renderDetail(slug);
                }
            }
        });
    }

    /**
     * Render based on current view
     * v0.2: Supports Router state and category view
     */
    render() {
        if (this.state.view === 'detail' && this.state.currentSlug) {
            this.renderDetail(this.state.currentSlug);
        } else if (this.state.view === 'category' && this.state.currentCategory) {
            this.renderCategory(this.state.currentCategory);
        } else {
            this.renderList();
        }
    }
    
    /**
     * Render category view
     * @param {string} category - Category path (e.g., 'frontend' or 'frontend/react')
     */
    renderCategory(category) {
        // Get all entries
        let entries = this.getAllEntries();
        
        // Filter by category
        if (this.catalogueManager) {
            entries = entries.filter(entry => {
                if (!entry.category) return false;
                // Support nested categories
                return entry.category === category || entry.category.startsWith(category + '/');
            });
        } else {
            // Fallback: simple category filter
            entries = entries.filter(entry => entry.category === category);
        }
        
        if (!entries.length) {
            this.container.innerHTML = `<p class="rue-notes-empty">No entries in category &ldquo;${this._esc(category)}&rdquo;</p>`;
            return;
        }
        
        // Sort entries
        entries = this.sortEntries(entries);
        
        // Update state
        this.state.displayedEntries = entries;
        
        // Render category header
        let html = `<div class="rue-notes-category-header">`;
        html += `<h2 class="rue-notes-category-title">${this._esc(category)}</h2>`;
        
        // Render subcategories if CatalogueManager is available
        if (this.catalogueManager) {
            const tree = this.catalogueManager.buildCategoryTree(this.getAllEntries());
            const subcategories = this.catalogueManager.getSubcategories(category, tree);

            if (subcategories && subcategories.length > 0) {
                html += `<div class="rue-notes-subcategories">`;
                subcategories.forEach(subPath => {
                    const subName = this._esc(subPath.split('/').pop());
                    const safeSubPath = encodeURIComponent(subPath);
                    html += `<a href="#notes/category/${safeSubPath}" class="rue-notes-subcategory-link">${subName}</a>`;
                });
                html += `</div>`;
            }
        }
        
        html += `</div>`;
        
        // Render entries
        const entriesHtml = entries.map(entry => this.template(entry)).join('');
        html += `<div class="rue-notes-list">${entriesHtml}</div>`;
        
        this.container.innerHTML = html;
        
        // Attach events
        this.attachListEvents();
        
        // Update SEO
        if (this.seoManager) {
            this.seoManager.injectMeta({
                title: `${category} - Articles`,
                description: `Browse articles in ${category} category`,
                slug: `category/${category}`
            });
        }
    }

    /**
     * Update language and re-render
     * v0.2: Updates state and emits language change event
     */
    setLanguage(lang, fallbackChain = null) {
        this.lang = lang;
        if (fallbackChain) {
            this.fallback = fallbackChain;
        } else {
            this.fallback = this.getDefaultFallbackChain(lang);
        }
        
        // Update state
        this.setState({ language: lang });
        
        // Update SEO html lang attribute
        if (this.seoManager) {
            this.seoManager.updateHtmlLang(lang);
        }
        
        // Update URL with language parameter if router is enabled
        if (this.router) {
            const currentRoute = this.router.parseHash(window.location.hash);
            currentRoute.params.lang = lang;
            const newHash = this.router.serializeHash(currentRoute);
            // Only update if hash actually changed
            if (window.location.hash !== newHash) {
                window.location.hash = newHash;
                // Return early as hashchange will trigger render
                return;
            }
        }
        
        // Re-execute search and filters on new language entries
        if (this.state.searchQuery || Object.keys(this.state.filters).length > 0) {
            const entries = this.filterAndSearch(this.state.filters, this.state.searchQuery);
            this.setState({ displayedEntries: entries });
        }
        
        this.render();
    }

    /**
     * Set entries and rebuild map
     * v0.2: Validates entries against schema if available
     */
    setEntries(entries) {
        // Validate entries if ContentSchema is available
        if (this.contentSchema) {
            const validatedEntries = [];

            entries.forEach((entry, index) => {
                const validation = this.contentSchema.validate(entry, { strict: false });

                if (!validation.valid) {
                    console.warn(`Entry ${index} validation errors:`, validation.errors);
                }

                if (validation.warnings.length > 0) {
                    console.info(`Entry ${index} validation warnings:`, validation.warnings);
                }

                validatedEntries.push(this.contentSchema.applyDefaults(entry));
            });

            this.entries = validatedEntries;
        } else {
            this.entries = entries;
        }

        this.buildNoteMap();
        this.state.entries = this.getAllEntries(this.state.language);
        this.render();
    }

    /**
     * Filter entries by predicate
     */
    filter(predicate) {
        const entries = this.getAllEntries();
        return entries.filter(predicate);
    }

    /**
     * v0.2: Apply filters to entries
     * @param {Object} criteria - Filter criteria { type, tag, tags, category }
     * @returns {Array} Filtered entries
     */
    applyFilters(criteria) {
        if (!this.filterManager) {
            console.warn('RueNotes: FilterManager not initialized');
            return this.getAllEntries();
        }
        
        const entries = this.getAllEntries();
        const filtered = this.filterManager.filter(entries, criteria);
        
        // Update state
        this.state.filters = criteria;
        this.state.filteredEntries = filtered;
        
        return filtered;
    }

    /**
     * v0.2: Search entries
     * @param {string} query - Search query
     * @param {Array} entries - Optional entries to search (defaults to all entries)
     * @param {boolean} includeFallback - Whether to search fallback languages if no results (default: true)
     * @returns {Array} Search results with scores
     */
    search(query, entries = null, includeFallback = true) {
        if (!this.searchEngine) {
            console.warn('RueNotes: SearchEngine not initialized');
            return entries || this.getAllEntries();
        }
        
        const entriesToSearch = entries || this.getAllEntries();
        let results = this.searchEngine.search(entriesToSearch, query);
        
        // If no results and fallback is enabled, search in fallback languages
        if (results.length === 0 && includeFallback && query && query.trim() !== '') {
            const fallbackResults = this.searchFallbackLanguages(query);
            results = fallbackResults;
        }
        
        // Update state
        this.state.searchQuery = query;
        
        // Return just the entries (without scores) for backward compatibility
        return results.map(result => result.entry);
    }

    /**
     * v0.2: Search in fallback languages when current language has no results
     * @param {string} query - Search query
     * @returns {Array} Search results from fallback languages
     */
    searchFallbackLanguages(query) {
        if (!this.fallback || this.fallback.length === 0) {
            return [];
        }
        
        const allResults = [];
        
        // Try each fallback language
        for (const fallbackLang of this.fallback) {
            // Get entries for this fallback language
            const fallbackEntries = this.getAllEntries(fallbackLang);
            
            if (fallbackEntries.length > 0) {
                // Search in fallback language entries
                const results = this.searchEngine.search(fallbackEntries, query);
                
                // Mark entries with fallback language indicator
                results.forEach(result => {
                    result.entry._fallbackLang = fallbackLang;
                    result.entry._isFallbackSearch = true;
                });
                
                allResults.push(...results);
                
                // If we found results, we can stop searching further fallback languages
                if (results.length > 0) {
                    break;
                }
            }
        }
        
        return allResults;
    }

    /**
     * v0.2: Apply filters and search (filter first, then search)
     * @param {Object} criteria - Filter criteria
     * @param {string} query - Search query
     * @returns {Array} Filtered and searched entries
     */
    filterAndSearch(criteria, query) {
        // Step 1: Apply filters
        let entries = this.getAllEntries();
        
        if (criteria && Object.keys(criteria).length > 0 && this.filterManager) {
            entries = this.filterManager.filter(entries, criteria);
            this.state.filters = criteria;
            this.state.filteredEntries = entries;
        }
        
        // Step 2: Apply search on filtered results
        if (query && query.trim() !== '' && this.searchEngine) {
            const results = this.searchEngine.search(entries, query);
            entries = results.map(result => result.entry);
            this.state.searchQuery = query;
        }
        
        this.state.displayedEntries = entries;
        
        // Step 3: Reset pagination to first page when search/filter changes
        if (this.paginationManager && this.config.pagination.enabled) {
            this.resetPagination();
        }
        
        return entries;
    }

    /**
     * v0.2: Paginate entries
     * @param {Array} entries - Entries to paginate
     * @param {number} page - Page number (1-indexed)
     * @returns {Array} Paginated entries
     */
    paginate(entries, page = 1) {
        if (!this.paginationManager || !this.config.pagination.enabled) {
            return entries;
        }
        
        const paginatedEntries = this.paginationManager.paginate(entries, page);
        
        // Update state with pagination info
        this.state.pagination = this.paginationManager.getState();
        
        return paginatedEntries;
    }

    /**
     * v0.2: Get total pages for given entries
     * @param {number} totalItems - Total number of items
     * @returns {number} Total number of pages
     */
    getTotalPages(totalItems) {
        if (!this.paginationManager || !this.config.pagination.enabled) {
            return 1;
        }
        
        return this.paginationManager.getTotalPages(totalItems);
    }

    /**
     * v0.2: Navigate to specific page
     * @param {number} page - Page number to navigate to
     */
    goToPage(page) {
        if (!this.paginationManager || !this.config.pagination.enabled) {
            return;
        }
        
        // Validate page number
        const entries = this.state.displayedEntries.length > 0 
            ? this.state.displayedEntries 
            : this.getAllEntries();
        const totalPages = this.getTotalPages(entries.length);
        
        if (page < 1 || page > totalPages) {
            console.warn(`RueNotes: Invalid page number ${page}. Valid range: 1-${totalPages}`);
            return;
        }
        
        // Update URL if router is enabled
        if (this.router && this.config.routing.enabled) {
            this.router.updateRoute({ page: page });
        } else {
            // Direct render without router
            this.render();
        }
    }

    /**
     * v0.2: Reset pagination to first page
     */
    resetPagination() {
        if (!this.paginationManager || !this.config.pagination.enabled) {
            return;
        }
        
        // Update URL to remove page parameter or set to 1
        if (this.router && this.config.routing.enabled) {
            this.router.updateRoute({ page: undefined });
        }
    }

    /**
     * v0.2: Get previous and next entries for navigation
     * @param {string} slug - Current entry slug
     * @param {Array} entries - Optional entries list (defaults to displayed entries)
     * @returns {Object} { prev: Entry|null, next: Entry|null }
     */
    getPrevNext(slug, entries = null) {
        if (!this.prevNextNavigator || !this.config.prevNext) {
            return { prev: null, next: null };
        }
        
        // Use provided entries or fall back to displayed/all entries
        const entriesToUse = entries || 
            (this.state.displayedEntries.length > 0 
                ? this.state.displayedEntries 
                : this.getAllEntries());
        
        // Sort entries to match list order
        const sortedEntries = this.prevNextNavigator.sortEntries(entriesToUse);
        
        return this.prevNextNavigator.getPrevNext(slug, sortedEntries);
    }

    /**
     * v0.2: Clear search query
     */
    clearSearch() {
        this.state.searchQuery = '';
        
        // Re-apply filters if any
        if (Object.keys(this.state.filters).length > 0) {
            this.state.displayedEntries = this.state.filteredEntries;
        } else {
            this.state.displayedEntries = this.getAllEntries();
        }
    }

    /**
     * v0.2: Clear all filters
     */
    clearFilters() {
        this.state.filters = {};
        this.state.filteredEntries = [];
        
        if (this.filterManager) {
            this.filterManager.clearAllFilters();
        }
        
        // Re-apply search if any
        if (this.state.searchQuery && this.state.searchQuery.trim() !== '') {
            const entries = this.getAllEntries();
            this.state.displayedEntries = this.search(this.state.searchQuery, entries);
        } else {
            this.state.displayedEntries = this.getAllEntries();
        }
    }

    /**
     * v0.2: Get current application state
     * @returns {Object} Current state
     */
    getState() {
        return {
            view: this.state.view,
            currentSlug: this.state.currentSlug,
            currentCategory: this.state.currentCategory,
            searchQuery: this.state.searchQuery,
            filters: { ...this.state.filters },
            pagination: this.state.pagination ? { ...this.state.pagination } : null,
            language: this.state.language,
            entries: [...this.state.entries],
            filteredEntries: [...this.state.filteredEntries],
            displayedEntries: [...this.state.displayedEntries]
        };
    }

    /**
     * v0.2: Wrap method with error handler
     * @param {Function} fn - Function to wrap
     * @param {string} context - Context name for error reporting
     * @returns {Function} Wrapped function
     */
    wrapWithErrorHandler(fn, context) {
        return (...args) => {
            try {
                return fn.apply(this, args);
            } catch (error) {
                this.handleError(error, context);
                return this.getErrorFallback(context);
            }
        };
    }

    /**
     * v0.2: Handle errors
     * @param {Error} error - The error object
     * @param {string} context - Context where error occurred
     */
    handleError(error, context) {
        console.error(`RueNotes error in ${context}:`, error);
        
        // Emit error event for external handling
        this.emit('error', { error, context });
    }

    /**
     * v0.2: Get fallback value for error scenarios
     * @param {string} context - Context name
     * @returns {*} Fallback value
     */
    getErrorFallback(context) {
        const fallbacks = {
            'search': [],
            'filter': [],
            'render': null,
            'loadEntry': null
        };
        return fallbacks[context] !== undefined ? fallbacks[context] : null;
    }

    /**
     * Destroy notes and clean up all resources
     * v0.2: Cleans up all modules and event listeners
     */
    destroy() {
        // Destroy router
        if (this.router) {
            this.router.destroy();
        }
        
        // Restore default SEO meta tags
        if (this.seoManager) {
            this.seoManager.restoreDefaultMeta();
        }
        
        // Clear all event listeners
        this.eventBus.listeners = {};
        
        // Clear container
        this.container.innerHTML = '';
        
        // Clear state
        this.state = {
            view: 'list',
            currentSlug: null,
            searchQuery: '',
            filters: {},
            pagination: null,
            language: this.lang,
            entries: [],
            filteredEntries: [],
            displayedEntries: []
        };
    }

    /**
     * Static factory method
     */
    static create(options) {
        return new RueNotes(options);
    }
}

// Browser environment
if (typeof window !== 'undefined') {
    window.RueNotes = RueNotes;
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RueNotes;
}
