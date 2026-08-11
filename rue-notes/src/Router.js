/**
 * Router - Hash-based routing system for rue-notes
 * 
 * Handles URL hash routing and state management for the rue-notes content system.
 * Supports routes: #notes (list), #notes/:slug (detail), #notes?q=query (search)
 * 
 * @class Router
 */
class Router {
    /**
     * Creates a Router instance
     * 
     * @param {Object} rueNotes - Reference to the RueNotes main instance
     * @param {Object} config - Router configuration
     * @param {boolean} config.enabled - Whether routing is enabled
     * @param {string} [config.base='#notes'] - Base hash path
     */
    constructor(rueNotes, config = {}) {
        this.rueNotes = rueNotes;
        this.enabled = config.enabled !== false;
        this.base = config.base || '#notes';
        
        // Current route state
        this.currentRoute = {
            view: 'list',
            slug: null,
            params: {}
        };
        
        // Bound event handler for cleanup
        this._boundHashChangeHandler = null;
    }
    
    /**
     * Initialize the router and register event listeners
     * Requirements: 1.1 - Register hashchange event listener
     */
    init() {
        if (!this.enabled) {
            return;
        }
        
        // Bind the handler so we can remove it later
        this._boundHashChangeHandler = this.handleHashChange.bind(this);
        
        // Register hashchange event listener
        window.addEventListener('hashchange', this._boundHashChangeHandler);
        
        // Parse initial hash
        const initialHash = window.location.hash || this.base;
        this.currentRoute = this.parseHash(initialHash);
        
        // Update RueNotes state with initial route
        if (this.rueNotes && this.rueNotes.setState) {
            this.rueNotes.setState({
                view: this.currentRoute.view,
                currentSlug: this.currentRoute.slug,
                searchQuery: this.currentRoute.params.q || '',
                filters: {
                    type: this.currentRoute.params.type,
                    tag: this.currentRoute.params.tag,
                    tags: this.currentRoute.params.tags
                }
            });
        }

        // Trigger initial render so direct/shared URLs work without
        // the caller having to manually call notes.render() afterwards.
        if (this.rueNotes && this.rueNotes.render) {
            this.rueNotes.render();
        }
    }
    
    /**
     * Destroy the router and cleanup event listeners
     */
    destroy() {
        if (this._boundHashChangeHandler) {
            window.removeEventListener('hashchange', this._boundHashChangeHandler);
            this._boundHashChangeHandler = null;
        }
    }
    
    /**
     * Handle hashchange events
     * Requirements: 1.9 - Support browser forward and back buttons
     * v0.2: Automatically triggers re-render on route change, supports category navigation
     * 
     * @param {HashChangeEvent} event - The hashchange event
     */
    handleHashChange(event) {
        const newHash = window.location.hash;
        const newRoute = this.parseHash(newHash);
        
        this.currentRoute = newRoute;
        
        // Handle language parameter if present
        if (newRoute.params.lang && this.rueNotes && this.rueNotes.setLanguage) {
            // Only change language if it's different from current
            if (newRoute.params.lang !== this.rueNotes.lang) {
                this.rueNotes.setLanguage(newRoute.params.lang);
                // Return early as setLanguage will trigger render
                return;
            }
        }
        
        // Update RueNotes state
        if (this.rueNotes && this.rueNotes.setState) {
            // Skip render if suppressed (e.g. triggered by performSearch which renders itself)
            const suppress = this._suppressNextRender;
            this._suppressNextRender = false;
            
            this.rueNotes.setState({
                view: newRoute.view,
                currentSlug: newRoute.slug,
                currentCategory: newRoute.category,
                searchQuery: newRoute.params.q || '',
                filters: {
                    type: newRoute.params.type,
                    tag: newRoute.params.tag,
                    tags: newRoute.params.tags,
                    category: newRoute.category || newRoute.params.category
                }
            });
            
            // Trigger re-render after state update
            if (!suppress && this.rueNotes.render) {
                this.rueNotes.render();
            }
        }
    }
    
    /**
     * Parse URL hash into RouteState
     * Requirements: 1.2, 1.3, 1.4 - Parse different route formats
     * v0.2: Added support for category navigation (/notes/category/subcategory)
     * 
     * Supports:
     * - #notes -> list view
     * - #notes/:slug -> detail view
     * - #notes/category/:category -> category view
     * - #notes/category/:category/:subcategory -> nested category view
     * - #notes?q=search -> list view with search
     * - #notes/:slug?q=search -> detail view with query params
     * 
     * @param {string} hash - The URL hash to parse
     * @returns {Object} RouteState object { view, slug, category, params }
     */
    parseHash(hash) {
        try {
            // Remove leading # if present
            hash = hash.startsWith('#') ? hash.substring(1) : hash;
            
            // Split hash and query string
            const [path, queryString] = hash.split('?');
            
            // Parse query parameters
            const params = queryString ? this.parseQueryParams(queryString) : {};
            
            // Remove base path (e.g., 'notes')
            const basePath = this.base.startsWith('#') ? this.base.substring(1) : this.base;
            let routePath = path;
            
            if (path.startsWith(basePath)) {
                routePath = path.substring(basePath.length);
            }
            
            // Remove leading slash
            routePath = routePath.startsWith('/') ? routePath.substring(1) : routePath;
            
            // Determine view, slug, and category
            let view = 'list';
            let slug = null;
            let category = null;
            
            if (routePath && routePath.length > 0) {
                // Check if it's a category path
                if (routePath.startsWith('category/')) {
                    view = 'category';
                    category = routePath.substring(9); // Remove 'category/'
                } else {
                    // Detail view: #notes/my-post
                    view = 'detail';
                    slug = routePath;
                }
            }
            
            return {
                view,
                slug,
                category,
                params
            };
        } catch (error) {
            console.warn('Invalid hash format, falling back to default:', error);
            return this.getDefaultRouteState();
        }
    }
    
    /**
     * Parse query parameters from query string
     * Requirements: 10.7 - Support array-type query parameters
     * 
     * @param {string} queryString - The query string (without ?)
     * @returns {Object} Parsed query parameters
     */
    parseQueryParams(queryString) {
        const params = {};
        
        if (!queryString || queryString.length === 0) {
            return params;
        }
        
        const pairs = queryString.split('&');
        
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            
            if (!key) continue;
            
            const decodedKey = this.decodeValue(key);
            const decodedValue = value ? this.decodeValue(value) : '';
            
            // Handle array-type parameters (e.g., ?tags=ui&tags=ux)
            if (params[decodedKey] !== undefined) {
                // Convert to array if not already
                if (!Array.isArray(params[decodedKey])) {
                    params[decodedKey] = [params[decodedKey]];
                }
                params[decodedKey].push(decodedValue);
            } else {
                params[decodedKey] = decodedValue;
            }
        }
        
        return params;
    }
    
    /**
     * Decode URL-encoded value
     * Requirements: 10.4 - Handle URL encoding/decoding
     * 
     * @param {string} value - The encoded value
     * @returns {string} Decoded value
     */
    decodeValue(value) {
        try {
            return decodeURIComponent(value);
        } catch (error) {
            console.warn('Failed to decode value:', value, error);
            return value;
        }
    }
    
    /**
     * Get default route state
     * Requirements: 10.6 - Return default state for invalid URLs
     * 
     * @returns {Object} Default RouteState
     */
    getDefaultRouteState() {
        return {
            view: 'list',
            slug: null,
            params: {}
        };
    }
    
    /**
     * Serialize RouteState into URL hash
     * Requirements: 1.5, 1.6, 1.7, 1.8 - Update URL with state changes
     * v0.2: Added support for category navigation
     * 
     * @param {Object} state - RouteState object
     * @param {string} state.view - View type ('list', 'detail', or 'category')
     * @param {string|null} state.slug - Entry slug (for detail view)
     * @param {string|null} state.category - Category path (for category view)
     * @param {Object} state.params - Query parameters
     * @returns {string} URL hash string
     */
    serializeHash(state) {
        const basePath = this.base.startsWith('#') ? this.base.substring(1) : this.base;
        let hash = basePath;
        
        // Add slug for detail view
        if (state.view === 'detail' && state.slug) {
            hash += '/' + state.slug;
        }
        
        // Add category for category view
        if (state.view === 'category' && state.category) {
            hash += '/category/' + state.category;
        }
        
        // Add query parameters
        const queryString = this.serializeQueryParams(state.params);
        if (queryString) {
            hash += '?' + queryString;
        }
        
        return '#' + hash;
    }
    
    /**
     * Serialize query parameters into query string
     * Requirements: 1.8 - Combine multiple query parameters
     * 
     * @param {Object} params - Query parameters object
     * @returns {string} Query string (without ?)
     */
    serializeQueryParams(params) {
        if (!params || Object.keys(params).length === 0) {
            return '';
        }
        
        const pairs = [];
        
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null) {
                continue;
            }
            
            const encodedKey = this.encodeValue(key);
            
            // Handle array values
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (item !== undefined && item !== null) {
                        pairs.push(`${encodedKey}=${this.encodeValue(String(item))}`);
                    }
                }
            } else {
                pairs.push(`${encodedKey}=${this.encodeValue(String(value))}`);
            }
        }
        
        return pairs.join('&');
    }
    
    /**
     * Encode value for URL
     * Requirements: 10.4 - Handle URL encoding/decoding
     * 
     * @param {string} value - The value to encode
     * @returns {string} Encoded value
     */
    encodeValue(value) {
        try {
            return encodeURIComponent(value);
        } catch (error) {
            console.warn('Failed to encode value:', value, error);
            return value;
        }
    }
    
    /**
     * Navigate to a new route programmatically
     * Requirements: 1.5, 1.6, 1.7 - Update URL hash on user actions
     * 
     * @param {string} path - The path to navigate to (e.g., 'my-post' or '')
     * @param {Object} [query={}] - Query parameters
     */
    navigate(path, query = {}) {
        if (!this.enabled) {
            return;
        }
        
        const state = {
            view: path ? 'detail' : 'list',
            slug: path || null,
            params: query
        };
        
        const hash = this.serializeHash(state);
        window.location.hash = hash;
    }
    
    /**
     * Match route pattern and extract information
     * Requirements: 1.2, 1.3, 1.4 - Match different route patterns
     * 
     * @param {string} hash - The URL hash to match
     * @returns {Object} Matched route information
     */
    matchRoute(hash) {
        const route = this.parseHash(hash);
        return {
            view: route.view,
            slug: route.slug,
            params: route.params
        };
    }
    
    /**
     * Update route with new query parameters while preserving current path
     * Requirements: 1.7, 1.8 - Add filter/search to URL query parameters
     * 
     * @param {Object} newParams - New query parameters to merge
     */
    updateRoute(newParams) {
        if (!this.enabled) {
            return;
        }
        
        const currentRoute = this.currentRoute;
        const mergedParams = { ...currentRoute.params, ...newParams };
        
        // Remove undefined/null values
        Object.keys(mergedParams).forEach(key => {
            if (mergedParams[key] === undefined || mergedParams[key] === null || mergedParams[key] === '') {
                delete mergedParams[key];
            }
        });
        
        const state = {
            view: currentRoute.view,
            slug: currentRoute.slug,
            params: mergedParams
        };
        
        const hash = this.serializeHash(state);
        window.location.hash = hash;
    }
    
    /**
     * Navigate to entry detail view
     * Requirements: 1.5 - Update URL hash to #notes/:slug on entry click
     * 
     * @param {string} slug - Entry slug
     */
    navigateTo(slug) {
        this.navigate(slug, this.currentRoute.params);
    }
}

// Browser environment
if (typeof window !== 'undefined') {
    window.Router = Router;
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}
