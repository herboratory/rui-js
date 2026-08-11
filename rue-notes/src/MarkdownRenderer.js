/**
 * MarkdownRenderer - Extended Markdown rendering engine
 * Supports GFM tables, footnotes, task lists, and XSS protection
 * Part of rue-notes v0.2
 */
class MarkdownRenderer {
    constructor(config = {}) {
        this.config = {
            extended: config.extended !== false, // Default: true
            tables: config.tables !== false,
            footnotes: config.footnotes !== false,
            taskLists: config.taskLists !== false,
            strikethrough: config.strikethrough !== false,
            autoLinks: config.autoLinks !== false,
            definitionLists: config.definitionLists !== false,
            allowHTML: config.allowHTML || false,
            sanitize: config.sanitize !== false, // Default: true
            generateTOC: config.generateTOC || false, // Generate table of contents
            tocLevels: config.tocLevels || [2, 3] // Which heading levels to include in TOC
        };
        
        this.syntaxHighlighter = config.syntaxHighlighter || null;
        this.footnotes = [];
        this.footnoteIndex = 0;
        this.toc = []; // Table of contents
    }

    /**
     * Main render method - converts markdown to HTML
     * @param {string} markdown - Markdown text to render
     * @returns {string} HTML output
     */
    render(markdown) {
        if (!markdown || typeof markdown !== 'string') {
            return '';
        }

        let html = markdown;

        // Reset footnotes and TOC for each render
        this.footnotes = [];
        this.footnoteIndex = 0;
        this.toc = [];

        // ── Phase 0: Extract fenced code blocks into placeholders ──────────────
        // Prevents all subsequent regex passes from touching code content.
        // Fixes N1: renderInlineCode was corrupting backticks inside pre/code.
        const codeBlockStore = [];
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const placeholder = `\x02CODEBLOCK_${codeBlockStore.length}\x02`;
            const escapedCode = this.escapeHTML(code.trim());

            let codeHtml;
            if (this.syntaxHighlighter && language) {
                try {
                    const highlighted = this.syntaxHighlighter.highlight(escapedCode, language);
                    let finalHtml = highlighted;
                    if (this.syntaxHighlighter.config.lineNumbers) {
                        finalHtml = this.syntaxHighlighter.addLineNumbers(finalHtml);
                    }
                    const langClass = ` class="language-${language}"`;
                    codeHtml = `<pre><code${langClass}>${finalHtml}</code></pre>`;
                    if (this.syntaxHighlighter.config.copyButton) {
                        codeHtml = this.syntaxHighlighter.addCopyButton(codeHtml);
                    }
                } catch (e) {
                    console.warn('Syntax highlighting failed:', e);
                    const langClass = language ? ` class="language-${language}"` : '';
                    codeHtml = `<pre><code${langClass}>${escapedCode}</code></pre>`;
                }
            } else {
                const langClass = language ? ` class="language-${language}"` : '';
                codeHtml = `<pre><code${langClass}>${escapedCode}</code></pre>`;
            }

            codeBlockStore.push(codeHtml);
            return placeholder;
        });

        // ── Phase 1: Block-level extended features ─────────────────────────────
        if (this.config.extended) {
            if (this.config.tables) {
                html = this.renderTables(html);
            }
            if (this.config.footnotes) {
                html = this.renderFootnotes(html);
            }
            if (this.config.taskLists) {
                html = this.renderTaskLists(html);
            }
            if (this.config.strikethrough) {
                html = this.renderStrikethrough(html);
            }
            if (this.config.definitionLists) {
                html = this.renderDefinitionLists(html);
            }
        }

        // ── Phase 2: Inline processing (safe — code blocks extracted) ──────────
        html = this.renderHeaders(html);
        html = this.renderBoldItalic(html);
        html = this.renderBold(html);
        html = this.renderItalic(html);
        html = this.renderLinks(html);

        if (this.config.extended && this.config.autoLinks) {
            html = this.renderAutoLinks(html);
        }

        html = this.renderLists(html);
        html = this.renderInlineCode(html);
        html = this.renderParagraphs(html);

        // ── Phase 3: Restore code block placeholders ───────────────────────────
        html = html.replace(/\x02CODEBLOCK_(\d+)\x02/g, (_, i) => codeBlockStore[parseInt(i, 10)]);

        // Append footnotes if any
        if (this.footnotes.length > 0) {
            html += this.renderFootnotesList();
        }

        // Sanitize HTML if enabled
        if (this.config.sanitize) {
            html = this.sanitizeHTML(html);
        }

        return html;
    }
    
    /**
     * Get generated table of contents
     * @returns {Array} TOC items with { level, text, id }
     */
    getTOC() {
        return this.toc;
    }
    
    /**
     * Render table of contents as HTML
     * @returns {string} TOC HTML
     */
    renderTOC() {
        if (this.toc.length === 0) {
            return '';
        }
        
        let html = '<nav class="rue-notes-toc">\n';
        html += '<h2 class="rue-notes-toc-title">Table of Contents</h2>\n';
        html += '<ul class="rue-notes-toc-list">\n';
        
        this.toc.forEach(item => {
            const indent = item.level === 3 ? ' class="rue-notes-toc-sub"' : '';
            html += `<li${indent}><a href="#${item.id}">${item.text}</a></li>\n`;
        });
        
        html += '</ul>\n';
        html += '</nav>\n';
        
        return html;
    }

    /**
     * Render headers (h1-h6)
     * v0.2: Generates TOC if enabled
     * Fixed N4: generateSlug now preserves Unicode/CJK characters so Chinese
     * headings produce valid, unique anchor IDs instead of empty strings.
     */
    renderHeaders(text) {
        const generateTOC = this.config.generateTOC;
        const tocLevels = this.config.tocLevels;
        const usedIds = {};

        // Generate a URL-safe slug from any language text
        const generateSlug = (text) => {
            // Normalise: lowercase, collapse whitespace, strip control chars
            let slug = text
                .toLowerCase()
                .trim()
                .replace(/[\s\u3000]+/g, '-')      // spaces + ideographic space → hyphen
                .replace(/[^\p{L}\p{N}\-]/gu, '')  // keep Unicode letters, digits, hyphens
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            // Fallback for pure-symbol or empty slugs
            if (!slug) slug = 'section';

            // Guarantee uniqueness within this render pass
            if (usedIds[slug] !== undefined) {
                usedIds[slug]++;
                slug = `${slug}-${usedIds[slug]}`;
            } else {
                usedIds[slug] = 0;
            }

            return slug;
        };

        // Process each heading level
        const processHeading = (level, match, content) => {
            const slug = generateSlug(content);
            const id = `heading-${slug}`;

            // Add to TOC if enabled and level is included
            if (generateTOC && tocLevels.includes(level)) {
                this.toc.push({
                    level,
                    text: content,
                    id
                });
            }

            return `<h${level} id="${id}">${content}</h${level}>`;
        };

        text = text.replace(/^###### (.*$)/gim, (match, content) => processHeading(6, match, content));
        text = text.replace(/^##### (.*$)/gim, (match, content) => processHeading(5, match, content));
        text = text.replace(/^#### (.*$)/gim, (match, content) => processHeading(4, match, content));
        text = text.replace(/^### (.*$)/gim, (match, content) => processHeading(3, match, content));
        text = text.replace(/^## (.*$)/gim, (match, content) => processHeading(2, match, content));
        text = text.replace(/^# (.*$)/gim, (match, content) => processHeading(1, match, content));

        return text;
    }

    /**
     * Render bold-italic combined (***text*** or ___text___)
     * Must run before renderBold and renderItalic to avoid broken nesting.
     */
    renderBoldItalic(text) {
        return text.replace(/\*{3}(.*?)\*{3}/g, '<strong><em>$1</em></strong>');
    }

    /**
     * Render bold text
     */
    renderBold(text) {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    /**
     * Render italic text
     */
    renderItalic(text) {
        return text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    /**
     * Render links
     */
    renderLinks(text) {
        return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    }

    /**
     * Render inline code (backtick)
     * Must run after renderCodeBlocks to avoid double-processing fenced blocks.
     */
    renderInlineCode(text) {
        return text.replace(/`([^`\n]+)`/g, (match, code) => {
            return `<code>${this.escapeHTML(code)}</code>`;
        });
    }

    /**
     * Render lists (unordered and ordered)
     * Fixed: properly wraps consecutive <li> groups with <ul> or <ol>,
     * handles multiple separate list blocks, and distinguishes list types.
     */
    renderLists(text) {
        const lines = text.split('\n');
        const out = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Unordered list item: starts with "* "
            if (/^\* .+/.test(line)) {
                const items = [];
                while (i < lines.length && /^\* .+/.test(lines[i])) {
                    items.push(`<li>${lines[i].replace(/^\* /, '')}</li>`);
                    i++;
                }
                out.push(`<ul>\n${items.join('\n')}\n</ul>`);
                continue;
            }

            // Ordered list item: starts with "1. " / "2. " etc.
            if (/^\d+\. .+/.test(line)) {
                const items = [];
                while (i < lines.length && /^\d+\. .+/.test(lines[i])) {
                    items.push(`<li>${lines[i].replace(/^\d+\. /, '')}</li>`);
                    i++;
                }
                out.push(`<ol>\n${items.join('\n')}\n</ol>`);
                continue;
            }

            out.push(line);
            i++;
        }

        return out.join('\n');
    }

    /**
     * Render paragraphs
     */
    renderParagraphs(text) {
        return text.split('\n\n').map(para => {
            // Skip already-HTML blocks (headings, lists, tables, etc.)
            if (para.match(/^<[huoltdpbf]/)) return para;
            // Skip code block placeholders — they will be restored as <pre> after this step
            if (para.includes('\x02CODEBLOCK_')) return para;
            return `<p>${para}</p>`;
        }).join('\n');
    }

    /**
     * Render GFM tables
     * Supports alignment: :--- (left), :---: (center), ---: (right)
     */
    renderTables(text) {
        // Match GFM table format
        const tableRegex = /^\|(.+)\|\n\|([:\-\s|]+)\|\n((?:\|.+\|\n?)+)/gm;
        
        return text.replace(tableRegex, (match, header, separator, rows) => {
            // Parse header
            const headers = header.split('|').map(h => h.trim()).filter(h => h);
            
            // Parse alignment
            const alignments = separator.split('|').map(s => {
                s = s.trim();
                if (s.startsWith(':') && s.endsWith(':')) return 'center';
                if (s.endsWith(':')) return 'right';
                return 'left';
            }).filter((_, i) => i < headers.length);
            
            // Parse rows
            const rowsArray = rows.trim().split('\n').map(row => {
                return row.split('|').map(cell => cell.trim()).filter((cell, i) => i > 0 && i <= headers.length);
            });
            
            // Build table HTML
            let tableHtml = '<table>\n<thead>\n<tr>\n';
            headers.forEach((h, i) => {
                const align = alignments[i] || 'left';
                tableHtml += `<th style="text-align: ${align}">${h}</th>\n`;
            });
            tableHtml += '</tr>\n</thead>\n<tbody>\n';
            
            rowsArray.forEach(row => {
                tableHtml += '<tr>\n';
                row.forEach((cell, i) => {
                    const align = alignments[i] || 'left';
                    tableHtml += `<td style="text-align: ${align}">${cell}</td>\n`;
                });
                tableHtml += '</tr>\n';
            });
            
            tableHtml += '</tbody>\n</table>';
            return tableHtml;
        });
    }

    /**
     * Render footnotes
     * Supports [^1] references and [^1]: definitions
     */
    renderFootnotes(text) {
        // Extract footnote definitions
        const definitionRegex = /^\[\^(\w+)\]:\s*(.+)$/gm;
        const definitions = {};
        
        text = text.replace(definitionRegex, (match, id, content) => {
            definitions[id] = content.trim();
            return ''; // Remove definition from text
        });
        
        // Replace footnote references
        const referenceRegex = /\[\^(\w+)\]/g;
        text = text.replace(referenceRegex, (match, id) => {
            if (definitions[id]) {
                this.footnoteIndex++;
                this.footnotes.push({
                    id,
                    index: this.footnoteIndex,
                    content: definitions[id]
                });
                return `<sup><a href="#fn-${id}" id="fnref-${id}">[${this.footnoteIndex}]</a></sup>`;
            }
            return match;
        });
        
        return text;
    }

    /**
     * Render footnotes list at the end of content
     */
    renderFootnotesList() {
        if (this.footnotes.length === 0) return '';
        
        let html = '\n<div class="footnotes">\n<hr>\n<ol>\n';
        this.footnotes.forEach(fn => {
            html += `<li id="fn-${fn.id}">${fn.content} <a href="#fnref-${fn.id}">↩</a></li>\n`;
        });
        html += '</ol>\n</div>';
        
        return html;
    }

    /**
     * Render task lists
     * Supports - [ ] and - [x]
     * Fixed N2: consecutive task items are wrapped in <ul class="rue-notes-task-list">
     */
    renderTaskLists(text) {
        const lines = text.split('\n');
        const out = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            const isUnchecked = /^- \[ \] .+/.test(line);
            const isChecked   = /^- \[x\] .+/i.test(line);

            if (isUnchecked || isChecked) {
                const items = [];
                while (i < lines.length && (/^- \[ \] .+/.test(lines[i]) || /^- \[x\] .+/i.test(lines[i]))) {
                    if (/^- \[x\] .+/i.test(lines[i])) {
                        items.push(`<li><input type="checkbox" checked disabled> ${lines[i].replace(/^- \[x\] /i, '')}</li>`);
                    } else {
                        items.push(`<li><input type="checkbox" disabled> ${lines[i].replace(/^- \[ \] /, '')}</li>`);
                    }
                    i++;
                }
                out.push(`<ul class="rue-notes-task-list">\n${items.join('\n')}\n</ul>`);
                continue;
            }

            out.push(line);
            i++;
        }

        return out.join('\n');
    }

    /**
     * Render strikethrough
     * Supports ~~text~~
     */
    renderStrikethrough(text) {
        return text.replace(/~~(.*?)~~/g, '<del>$1</del>');
    }

    /**
     * Render auto links
     * Automatically convert URLs to clickable links
     */
    renderAutoLinks(text) {
        const urlRegex = /(?<!href="|src=")(https?:\/\/[^\s<]+)/g;
        return text.replace(urlRegex, '<a href="$1">$1</a>');
    }

    /**
     * Render definition lists
     * Supports term/definition pairs
     */
    renderDefinitionLists(text) {
        const dlRegex = /^(.+)\n:\s+(.+)$/gm;
        return text.replace(dlRegex, '<dl><dt>$1</dt><dd>$2</dd></dl>');
    }

    /**
     * Render code blocks
     * Supports fenced code blocks with language specification
     */
    renderCodeBlocks(text) {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        
        return text.replace(codeBlockRegex, (match, language, code) => {
            const escapedCode = this.escapeHTML(code.trim());
            
            // Use syntax highlighter if available
            if (this.syntaxHighlighter && language) {
                try {
                    const highlighted = this.syntaxHighlighter.highlight(escapedCode, language);
                    
                    // Apply optional features if configured
                    let finalHtml = highlighted;
                    if (this.syntaxHighlighter.config.lineNumbers) {
                        finalHtml = this.syntaxHighlighter.addLineNumbers(finalHtml);
                    }
                    
                    const langClass = ` class="language-${language}"`;
                    let codeBlock = `<pre><code${langClass}>${finalHtml}</code></pre>`;
                    
                    if (this.syntaxHighlighter.config.copyButton) {
                        codeBlock = this.syntaxHighlighter.addCopyButton(codeBlock);
                    }
                    
                    return codeBlock;
                } catch (e) {
                    // Fallback to plain code
                    console.warn('Syntax highlighting failed:', e);
                }
            }
            
            // Plain code block (no highlighting or highlighting failed)
            const langClass = language ? ` class="language-${language}"` : '';
            return `<pre><code${langClass}>${escapedCode}</code></pre>`;
        });
    }

    /**
     * Highlight code using syntax highlighter
     */
    highlightCode(code, language) {
        if (!this.syntaxHighlighter) {
            return this.escapeHTML(code);
        }
        
        try {
            return this.syntaxHighlighter.highlight(code, language);
        } catch (e) {
            console.warn(`Syntax highlighting failed for ${language}:`, e);
            return this.escapeHTML(code);
        }
    }

    /**
     * Sanitize HTML to prevent XSS attacks
     * Removes dangerous tags and attributes using a whitelist-oriented approach.
     */
    sanitizeHTML(html) {
        // Remove dangerous block-level tags (with their contents)
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
        html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        html = html.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

        // Remove void dangerous tags
        html = html.replace(/<embed\b[^>]*>/gi, '');
        html = html.replace(/<base\b[^>]*>/gi, '');
        html = html.replace(/<meta\b[^>]*>/gi, '');
        html = html.replace(/<link\b[^>]*>/gi, '');
        html = html.replace(/<form\b[^>]*>/gi, '');
        html = html.replace(/<\/form>/gi, '');
        // Remove all <input> except task-list checkboxes (type="checkbox" disabled)
        html = html.replace(/<input\b(?![^>]*type=["']checkbox["'])[^>]*>/gi, '');

        // Remove event handlers (onclick, onerror, onload, etc.)
        html = html.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');
        html = html.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');
        html = html.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');

        // Neutralise dangerous protocols in href/src/action attributes
        html = html.replace(/(href|src|action)\s*=\s*["']\s*javascript:[^"']*/gi, '$1="#"');
        html = html.replace(/(href|src|action)\s*=\s*["']\s*vbscript:[^"']*/gi, '$1="#"');
        html = html.replace(/(href|src|action)\s*=\s*["']\s*data:text\/html[^"']*/gi, '$1="#"');

        // Catch any remaining bare protocol references
        html = html.replace(/javascript:/gi, '');
        html = html.replace(/vbscript:/gi, '');

        return html;
    }

    /**
     * Escape HTML special characters
     */
    escapeHTML(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Browser environment
if (typeof window !== 'undefined') {
    window.MarkdownRenderer = MarkdownRenderer;
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownRenderer;
}


