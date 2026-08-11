/**
 * Rue Carousel - Lightweight content carousel with multilingual support
 * Part of the Rue toolkit for static sites
 */
class RueCarousel {
    constructor(options = {}) {
        this.container = typeof options.container === 'string' 
            ? document.querySelector(options.container)
            : options.container;
        
        if (!this.container) {
            throw new Error('RueCarousel: container not found');
        }

        this.data = options.data || { items: [] };
        this.lang = options.lang || document.documentElement.lang || 'en';
        this.fallback = options.fallback || this.getDefaultFallbackChain(this.lang);
        this.template = options.template || this.defaultTemplate.bind(this);
        this.onItemClick = options.onItemClick || null;

        // Navigation options
        this.showArrows = options.showArrows !== false;   // default: true
        this.showDots   = options.showDots   !== false;   // default: true
        this.loop       = options.loop       !== false;   // default: true
        this.autoplay   = options.autoplay   || false;    // ms interval, e.g. 3000
        this.keyboard   = options.keyboard   !== false;   // default: true

        this.currentIndex = 0;
        this.items = this.data.items || [];
        this._autoplayTimer = null;
        this._boundKeyHandler = null;

        this.init();
    }

    /**
     * Get default fallback chain based on current language
     */
    getDefaultFallbackChain(lang) {
        switch (lang) {
            case 'zh-Hans':
            case 'zh-CN':
                return ['zh-Hans', 'zh-Hant', 'en'];
            case 'zh-Hant':
            case 'zh-TW':
                return ['zh-Hant', 'zh-Hans', 'en'];
            default:
                return ['en', 'zh-Hant', 'zh-Hans'];
        }
    }

    /**
     * Resolve localized field value
     * Supports both single-language (string) and multi-language (object) formats
     */
    resolveField(value, lang = this.lang, fallbackChain = this.fallback) {
        if (value == null) return '';
        
        // Single language: return directly
        if (typeof value === 'string') return value;
        
        // Multi-language: resolve by language chain
        if (typeof value === 'object' && !Array.isArray(value)) {
            const chain = [lang, ...fallbackChain];
            for (const key of chain) {
                if (value[key]) return value[key];
            }
            
            // Return first available value if all fallbacks fail
            const firstValue = Object.values(value).find(v => v);
            return firstValue || '';
        }
        
        return '';
    }

    /**
     * Resolve all fields in an item
     */
    resolveItem(item) {
        const resolved = { ...item };
        
        for (const key in resolved) {
            if (typeof resolved[key] === 'object' && !Array.isArray(resolved[key]) && resolved[key] !== null) {
                // Check if this is a multilingual field (has language keys)
                const hasLangKeys = Object.keys(resolved[key]).some(k => 
                    ['en', 'zh-Hant', 'zh-Hans', 'zh-TW', 'zh-CN', 'ja', 'fr', 'de', 'es'].includes(k)
                );
                
                if (hasLangKeys) {
                    resolved[key] = this.resolveField(resolved[key]);
                }
            }
        }
        
        return resolved;
    }

    /**
     * Default template for rendering items
     */
    defaultTemplate(item) {
        const resolved = this.resolveItem(item);
        
        return `
            <div class="rue-carousel-item" data-id="${resolved.id || ''}">
                ${resolved.image ? `<img src="${resolved.image}" alt="${resolved.title || ''}" class="rue-carousel-image" />` : ''}
                <div class="rue-carousel-content">
                    ${resolved.title ? `<h3 class="rue-carousel-title">${resolved.title}</h3>` : ''}
                    ${resolved.summary ? `<p class="rue-carousel-summary">${resolved.summary}</p>` : ''}
                    ${resolved.tags && Array.isArray(resolved.tags) ? `
                        <div class="rue-carousel-tags">
                            ${resolved.tags.map(tag => `<span class="rue-carousel-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Initialize carousel
     */
    init() {
        this.render();
        this.attachEvents();
        if (this.autoplay) {
            this.startAutoplay();
        }
    }

    /**
     * Render carousel including wrapper, arrows, and dots
     */
    render() {
        if (!this.items.length) {
            this.container.innerHTML = '<p class="rue-carousel-empty">No items to display</p>';
            return;
        }

        const itemsHtml = this.items.map(item => this.template(item)).join('');

        const prevBtn = this.showArrows
            ? `<button class="rue-carousel-arrow rue-carousel-arrow--prev" aria-label="Previous" ${(!this.loop && this.currentIndex === 0) ? 'disabled' : ''}>&#8249;</button>`
            : '';
        const nextBtn = this.showArrows
            ? `<button class="rue-carousel-arrow rue-carousel-arrow--next" aria-label="Next" ${(!this.loop && this.currentIndex === this.items.length - 1) ? 'disabled' : ''}>&#8250;</button>`
            : '';

        const dotsHtml = this.showDots
            ? `<div class="rue-carousel-dots">${this.items.map((_, i) =>
                `<button class="rue-carousel-dot${i === this.currentIndex ? ' active' : ''}" data-index="${i}" aria-label="Go to item ${i + 1}"></button>`
              ).join('')}</div>`
            : '';

        this.container.innerHTML = `
            <div class="rue-carousel-nav">
                ${prevBtn}
                <div class="rue-carousel-wrapper">${itemsHtml}</div>
                ${nextBtn}
            </div>
            ${dotsHtml}
        `;

        // Scroll active item into view (no animation jank on first render)
        this._scrollToIndex(this.currentIndex, false);
    }

    /**
     * Scroll the wrapper so item at index is fully visible
     * @param {number} index
     * @param {boolean} smooth - use smooth scrolling (default true)
     */
    _scrollToIndex(index, smooth = true) {
        const wrapper = this.container.querySelector('.rue-carousel-wrapper');
        if (!wrapper) return;
        const item = wrapper.children[index];
        if (!item) return;
        wrapper.scrollTo({
            left: item.offsetLeft,
            behavior: smooth ? 'smooth' : 'instant'
        });
    }

    /**
     * Update dot indicators to reflect currentIndex
     */
    _updateDots() {
        this.container.querySelectorAll('.rue-carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }

    /**
     * Update arrow disabled states to reflect currentIndex
     */
    _updateArrows() {
        if (!this.showArrows || this.loop) return;
        const prev = this.container.querySelector('.rue-carousel-arrow--prev');
        const next = this.container.querySelector('.rue-carousel-arrow--next');
        if (prev) prev.disabled = this.currentIndex === 0;
        if (next) next.disabled = this.currentIndex === this.items.length - 1;
    }

    /**
     * Navigate to a specific index
     * @param {number} index
     */
    goTo(index) {
        if (!this.items.length) return;
        if (this.loop) {
            this.currentIndex = (index + this.items.length) % this.items.length;
        } else {
            this.currentIndex = Math.max(0, Math.min(index, this.items.length - 1));
        }
        this._scrollToIndex(this.currentIndex);
        this._updateDots();
        this._updateArrows();
    }

    /**
     * Navigate to the previous item
     */
    prev() {
        this.goTo(this.currentIndex - 1);
    }

    /**
     * Navigate to the next item
     */
    next() {
        this.goTo(this.currentIndex + 1);
    }

    /**
     * Start autoplay
     */
    startAutoplay() {
        if (this._autoplayTimer) return;
        this._autoplayTimer = setInterval(() => this.next(), this.autoplay);
    }

    /**
     * Stop autoplay
     */
    stopAutoplay() {
        if (this._autoplayTimer) {
            clearInterval(this._autoplayTimer);
            this._autoplayTimer = null;
        }
    }

    /**
     * Attach all event listeners
     */
    attachEvents() {
        // Arrow buttons (delegated to container)
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.rue-carousel-arrow--prev')) {
                this.prev();
                return;
            }
            if (e.target.closest('.rue-carousel-arrow--next')) {
                this.next();
                return;
            }
            // Dot navigation
            const dot = e.target.closest('.rue-carousel-dot');
            if (dot) {
                this.goTo(parseInt(dot.dataset.index, 10));
                return;
            }
            // Item click callback
            if (this.onItemClick) {
                const item = e.target.closest('.rue-carousel-item');
                if (item) {
                    const id = item.dataset.id;
                    const originalItem = this.items.find(i => i.id === id);
                    if (originalItem) {
                        this.onItemClick(this.resolveItem(originalItem), e);
                    }
                }
            }
        });

        // Pause autoplay on hover
        if (this.autoplay) {
            this.container.addEventListener('mouseenter', () => this.stopAutoplay());
            this.container.addEventListener('mouseleave', () => this.startAutoplay());
        }

        // Keyboard navigation (Arrow keys) — bound to document, scoped to focus
        if (this.keyboard) {
            this._boundKeyHandler = (e) => {
                if (!this.container.contains(document.activeElement) && document.activeElement !== document.body) return;
                if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
                if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
            };
            document.addEventListener('keydown', this._boundKeyHandler);
        }
    }

    /**
     * Update language and re-render
     */
    setLanguage(lang, fallbackChain = null) {
        this.lang = lang;
        if (fallbackChain) {
            this.fallback = fallbackChain;
        } else {
            this.fallback = this.getDefaultFallbackChain(lang);
        }
        this.render();
    }

    /**
     * Update data and re-render
     */
    setData(data) {
        this.data = data;
        this.items = data.items || [];
        this.currentIndex = 0;
        this.render();
    }

    /**
     * Filter items by predicate
     */
    filter(predicate) {
        const filtered = this.items.filter(predicate);
        const tempItems = this.items;
        this.items = filtered;
        this.currentIndex = 0;
        this.render();
        this.items = tempItems; // Restore original
        return filtered;
    }

    /**
     * Destroy carousel and clean up all resources
     */
    destroy() {
        this.stopAutoplay();
        if (this._boundKeyHandler) {
            document.removeEventListener('keydown', this._boundKeyHandler);
            this._boundKeyHandler = null;
        }
        this.container.innerHTML = '';
    }

    /**
     * Static factory method
     */
    static create(options) {
        return new RueCarousel(options);
    }
}

// Browser environment
if (typeof window !== 'undefined') {
    window.RueCarousel = RueCarousel;
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RueCarousel;
}

