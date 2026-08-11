/**
 * SyntaxHighlighter - Code syntax highlighting wrapper
 * Supports Prism.js and Highlight.js libraries
 * Part of rue-notes v0.2
 */
class SyntaxHighlighter {
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled !== false, // Default: true
            library: config.library || 'auto', // 'prism', 'highlight', or 'auto'
            theme: config.theme || '',
            languages: config.languages || [],
            lineNumbers: config.lineNumbers || false,
            copyButton: config.copyButton || false
        };
        
        this.library = null; // Will be 'prism', 'highlight', or null
        this.supportedLanguages = new Set([
            'javascript', 'js',
            'typescript', 'ts',
            'python', 'py',
            'html',
            'css',
            'json',
            'bash', 'sh',
            'markdown', 'md'
        ]);
        
        // Auto-detect loaded library
        this._detectLibrary();
    }

    /**
     * Detect which syntax highlighting library is loaded
     * @private
     */
    _detectLibrary() {
        if (!this.config.enabled) {
            this.library = null;
            return;
        }
        
        if (this.config.library === 'prism' || this.config.library === 'auto') {
            if (typeof window !== 'undefined' && window.Prism) {
                this.library = 'prism';
                return;
            }
        }
        
        if (this.config.library === 'highlight' || this.config.library === 'auto') {
            if (typeof window !== 'undefined' && window.hljs) {
                this.library = 'highlight';
                return;
            }
        }
        
        // No library loaded
        this.library = null;
    }

    /**
     * Check if a syntax highlighting library is loaded
     * @returns {boolean}
     */
    isLibraryLoaded() {
        return this.library !== null;
    }

    /**
     * Load syntax highlighting library dynamically
     * Note: This is a placeholder. In production, users should include
     * Prism.js or Highlight.js via CDN or npm package.
     * 
     * Example CDN links:
     * Prism.js: https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js
     * Highlight.js: https://cdn.jsdelivr.net/npm/highlight.js@11/lib/core.min.js
     * 
     * @returns {Promise<void>}
     */
    async loadLibrary() {
        if (this.isLibraryLoaded()) {
            return; // Library already loaded
        }
        
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            throw new Error('Dynamic library loading is only supported in browser environments.');
        }
        
        // Provide helpful error message
        const libraryName = this.config.library === 'prism' ? 'Prism.js' : 
                           this.config.library === 'highlight' ? 'Highlight.js' : 
                           'Prism.js or Highlight.js';
        
        throw new Error(
            `Syntax highlighting library not loaded. Please include ${libraryName} manually.\n` +
            `For Prism.js: <script src="https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js"></script>\n` +
            `For Highlight.js: <script src="https://cdn.jsdelivr.net/npm/highlight.js@11/lib/core.min.js"></script>`
        );
    }

    /**
     * Highlight code with syntax highlighting
     * @param {string} code - Code to highlight
     * @param {string} language - Programming language
     * @returns {string} Highlighted HTML
     */
    highlight(code, language) {
        if (!this.config.enabled || !this.isLibraryLoaded()) {
            return code; // Return plain code if highlighting is disabled or library not loaded
        }
        
        // Normalize language name
        const normalizedLang = this._normalizeLanguage(language);
        
        try {
            if (this.library === 'prism') {
                return this._highlightWithPrism(code, normalizedLang);
            } else if (this.library === 'highlight') {
                return this._highlightWithHighlightJs(code, normalizedLang);
            }
        } catch (error) {
            console.warn(`Syntax highlighting failed for ${language}:`, error);
            return code; // Graceful degradation
        }
        
        return code;
    }

    /**
     * Highlight an existing <code> DOM element in place
     * @param {HTMLElement} element
     */
    highlightElement(element) {
        if (!element || !this.config.enabled || !this.isLibraryLoaded()) {
            return;
        }

        if (this.library === 'prism') {
            if (typeof window !== 'undefined' && window.Prism && typeof window.Prism.highlightElement === 'function') {
                window.Prism.highlightElement(element);
            }
            return;
        }

        if (this.library === 'highlight') {
            if (typeof window !== 'undefined' && window.hljs && typeof window.hljs.highlightElement === 'function') {
                window.hljs.highlightElement(element);
            }
        }
    }

    /**
     * Highlight code using Prism.js
     * @private
     */
    _highlightWithPrism(code, language) {
        if (!window.Prism || !window.Prism.languages[language]) {
            return code;
        }
        
        const grammar = window.Prism.languages[language];
        return window.Prism.highlight(code, grammar, language);
    }

    /**
     * Highlight code using Highlight.js
     * @private
     */
    _highlightWithHighlightJs(code, language) {
        if (!window.hljs) {
            return code;
        }
        
        try {
            const result = window.hljs.highlight(code, { language });
            return result.value;
        } catch (error) {
            // Language not supported, try auto-detection
            const result = window.hljs.highlightAuto(code);
            return result.value;
        }
    }

    /**
     * Normalize language name to match library conventions
     * @private
     */
    _normalizeLanguage(language) {
        if (!language) return 'plaintext';
        
        const lang = language.toLowerCase();
        
        // Map common aliases
        const aliases = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'sh': 'bash',
            'md': 'markdown'
        };
        
        return aliases[lang] || lang;
    }

    /**
     * Detect programming language from code content
     * @param {string} code - Code to analyze
     * @returns {string|null} Detected language or null
     */
    detectLanguage(code) {
        if (!code || typeof code !== 'string') {
            return null;
        }
        
        const trimmedCode = code.trim();
        
        // HTML detection
        if (trimmedCode.includes('<html') || trimmedCode.includes('<!DOCTYPE') || 
            trimmedCode.includes('<div') || trimmedCode.includes('<body')) {
            return 'html';
        }
        
        // JSON detection
        if ((trimmedCode.startsWith('{') && trimmedCode.endsWith('}')) ||
            (trimmedCode.startsWith('[') && trimmedCode.endsWith(']'))) {
            try {
                JSON.parse(trimmedCode);
                return 'json';
            } catch (e) {
                // Not valid JSON
            }
        }
        
        // Python detection
        if (trimmedCode.includes('def ') || trimmedCode.includes('import ') ||
            trimmedCode.includes('class ') && trimmedCode.includes(':')) {
            return 'python';
        }
        
        // JavaScript/TypeScript detection
        if (trimmedCode.includes('function') || trimmedCode.includes('=>') ||
            trimmedCode.includes('const ') || trimmedCode.includes('let ') ||
            trimmedCode.includes('var ')) {
            if (trimmedCode.includes(': string') || trimmedCode.includes(': number') ||
                trimmedCode.includes('interface ') || trimmedCode.includes('type ')) {
                return 'typescript';
            }
            return 'javascript';
        }
        
        // CSS detection
        if (trimmedCode.includes('{') && trimmedCode.includes('}') && 
            (trimmedCode.includes(':') && trimmedCode.includes(';'))) {
            return 'css';
        }
        
        // Bash detection
        if (trimmedCode.startsWith('#!') || trimmedCode.includes('#!/bin/bash') ||
            trimmedCode.includes('echo ') || trimmedCode.includes('export ')) {
            return 'bash';
        }
        
        // Markdown detection
        if (trimmedCode.includes('# ') || trimmedCode.includes('## ') ||
            trimmedCode.includes('```') || trimmedCode.includes('[') && trimmedCode.includes('](')) {
            return 'markdown';
        }
        
        return null;
    }

    /**
     * Add line numbers to highlighted code
     * @param {string} html - Highlighted HTML
     * @returns {string} HTML with line numbers
     */
    addLineNumbers(html) {
        if (!this.config.lineNumbers) {
            return html;
        }
        
        const lines = html.split('\n');
        const numberedLines = lines.map((line, index) => {
            const lineNum = index + 1;
            return `<span class="line-number">${lineNum}</span>${line}`;
        });
        
        return numberedLines.join('\n');
    }

    /**
     * Add copy button to code block
     * @param {string} html - Highlighted HTML
     * @returns {string} HTML with copy button
     */
    addCopyButton(html) {
        if (!this.config.copyButton) {
            return html;
        }
        
        return `<div class="code-block-wrapper">
            <button class="copy-button" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent)">Copy</button>
            ${html}
        </div>`;
    }
}

// Browser environment
if (typeof window !== 'undefined') {
    window.SyntaxHighlighter = SyntaxHighlighter;
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyntaxHighlighter;
}
