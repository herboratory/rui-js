/**
 * ContentSchema - Entry frontmatter schema definition and validation
 * 
 * Defines the expected structure of entry metadata and provides validation
 * to ensure data consistency across the rue-notes system.
 * 
 * @class ContentSchema
 */
class ContentSchema {
    /**
     * Get the default schema definition
     * @returns {Object} Schema definition
     */
    static getSchema() {
        return {
            // Required fields
            slug: {
                type: 'string',
                required: true,
                pattern: /^[a-z0-9-]+$/,
                description: 'Unique identifier for the entry (lowercase, alphanumeric, hyphens only)'
            },
            title: {
                type: 'string',
                required: true,
                minLength: 1,
                maxLength: 200,
                description: 'Entry title'
            },
            
            // Recommended fields
            lang: {
                type: 'string',
                required: false,
                pattern: /^[a-z]{2}(-[A-Z][a-z]{3})?$/,
                default: 'en',
                description: 'Language code (e.g., en, zh-Hant, zh-Hans)'
            },
            summary: {
                type: 'string',
                required: false,
                maxLength: 500,
                description: 'Brief summary or excerpt'
            },
            date: {
                type: 'string',
                required: false,
                pattern: /^\d{4}-\d{2}-\d{2}$/,
                description: 'Publication date (YYYY-MM-DD format)'
            },
            
            // Optional fields
            type: {
                type: 'string',
                required: false,
                description: 'Entry type (e.g., tutorial, news, changelog)'
            },
            category: {
                type: 'string',
                required: false,
                description: 'Entry category'
            },
            tags: {
                type: 'array',
                required: false,
                itemType: 'string',
                description: 'Array of tags'
            },
            author: {
                type: 'string',
                required: false,
                description: 'Author name'
            },
            draft: {
                type: 'boolean',
                required: false,
                default: false,
                description: 'Draft status (true = not published)'
            },
            featured: {
                type: 'boolean',
                required: false,
                default: false,
                description: 'Featured status'
            },
            image: {
                type: 'string',
                required: false,
                description: 'Featured image URL'
            },
            
            // Internal fields (auto-generated)
            content: {
                type: 'string',
                required: false,
                internal: true,
                description: 'Markdown content (auto-populated)'
            },
            html: {
                type: 'string',
                required: false,
                internal: true,
                description: 'Rendered HTML (auto-generated)'
            },
            _fallbackLang: {
                type: 'string',
                required: false,
                internal: true,
                description: 'Fallback language used (auto-populated)'
            },
            _isFallbackSearch: {
                type: 'boolean',
                required: false,
                internal: true,
                description: 'Whether entry is from fallback search (auto-populated)'
            }
        };
    }
    
    /**
     * Validate an entry against the schema
     * @param {Object} entry - Entry to validate
     * @param {Object} options - Validation options
     * @param {boolean} options.strict - Throw error on validation failure (default: false)
     * @param {boolean} options.skipInternal - Skip validation of internal fields (default: true)
     * @returns {Object} Validation result { valid: boolean, errors: Array, warnings: Array }
     */
    static validate(entry, options = {}) {
        const {
            strict = false,
            skipInternal = true
        } = options;
        
        const schema = this.getSchema();
        const errors = [];
        const warnings = [];
        
        // Check required fields
        for (const [field, definition] of Object.entries(schema)) {
            if (skipInternal && definition.internal) {
                continue;
            }
            
            if (definition.required && !(field in entry)) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate existing fields
        for (const [field, value] of Object.entries(entry)) {
            const definition = schema[field];
            
            // Unknown field warning
            if (!definition) {
                warnings.push(`Unknown field: ${field}`);
                continue;
            }
            
            // Skip internal fields if requested
            if (skipInternal && definition.internal) {
                continue;
            }
            
            // Type validation
            const typeError = this._validateType(field, value, definition);
            if (typeError) {
                errors.push(typeError);
            }
            
            // Pattern validation
            if (definition.pattern && typeof value === 'string') {
                if (!definition.pattern.test(value)) {
                    errors.push(`Field ${field} does not match pattern: ${definition.pattern}`);
                }
            }
            
            // Length validation
            if (typeof value === 'string') {
                if (definition.minLength && value.length < definition.minLength) {
                    errors.push(`Field ${field} is too short (min: ${definition.minLength})`);
                }
                if (definition.maxLength && value.length > definition.maxLength) {
                    warnings.push(`Field ${field} is too long (max: ${definition.maxLength})`);
                }
            }
            
            // Array item type validation
            if (definition.type === 'array' && Array.isArray(value)) {
                if (definition.itemType) {
                    value.forEach((item, index) => {
                        if (typeof item !== definition.itemType) {
                            errors.push(`Field ${field}[${index}] should be ${definition.itemType}, got ${typeof item}`);
                        }
                    });
                }
            }
        }
        
        const result = {
            valid: errors.length === 0,
            errors,
            warnings
        };
        
        if (strict && !result.valid) {
            throw new Error(`Entry validation failed:\n${errors.join('\n')}`);
        }
        
        return result;
    }
    
    /**
     * Validate field type
     * @private
     */
    static _validateType(field, value, definition) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        if (actualType !== definition.type) {
            return `Field ${field} should be ${definition.type}, got ${actualType}`;
        }
        
        return null;
    }
    
    /**
     * Apply default values to an entry
     * @param {Object} entry - Entry to apply defaults to
     * @returns {Object} Entry with defaults applied
     */
    static applyDefaults(entry) {
        const schema = this.getSchema();
        const result = { ...entry };
        
        for (const [field, definition] of Object.entries(schema)) {
            if (definition.default !== undefined && !(field in result)) {
                result[field] = definition.default;
            }
        }
        
        return result;
    }
    
    /**
     * Sanitize an entry (remove internal fields, apply defaults)
     * @param {Object} entry - Entry to sanitize
     * @returns {Object} Sanitized entry
     */
    static sanitize(entry) {
        const schema = this.getSchema();
        const result = {};
        
        for (const [field, value] of Object.entries(entry)) {
            const definition = schema[field];
            
            // Skip internal fields
            if (definition && definition.internal) {
                continue;
            }
            
            // Keep known fields
            if (definition) {
                result[field] = value;
            }
        }
        
        return this.applyDefaults(result);
    }
    
    /**
     * Get schema documentation
     * @returns {string} Markdown documentation
     */
    static getDocumentation() {
        const schema = this.getSchema();
        let doc = '# Entry Schema Documentation\n\n';
        
        // Required fields
        doc += '## Required Fields\n\n';
        for (const [field, definition] of Object.entries(schema)) {
            if (definition.required && !definition.internal) {
                doc += this._formatFieldDoc(field, definition);
            }
        }
        
        // Recommended fields
        doc += '\n## Recommended Fields\n\n';
        for (const [field, definition] of Object.entries(schema)) {
            if (!definition.required && !definition.internal && ['lang', 'summary', 'date'].includes(field)) {
                doc += this._formatFieldDoc(field, definition);
            }
        }
        
        // Optional fields
        doc += '\n## Optional Fields\n\n';
        for (const [field, definition] of Object.entries(schema)) {
            if (!definition.required && !definition.internal && !['lang', 'summary', 'date'].includes(field)) {
                doc += this._formatFieldDoc(field, definition);
            }
        }
        
        return doc;
    }
    
    /**
     * Format field documentation
     * @private
     */
    static _formatFieldDoc(field, definition) {
        let doc = `### ${field}\n\n`;
        doc += `- **Type**: ${definition.type}\n`;
        doc += `- **Required**: ${definition.required ? 'Yes' : 'No'}\n`;
        
        if (definition.default !== undefined) {
            doc += `- **Default**: ${JSON.stringify(definition.default)}\n`;
        }
        if (definition.pattern) {
            doc += `- **Pattern**: \`${definition.pattern}\`\n`;
        }
        if (definition.minLength) {
            doc += `- **Min Length**: ${definition.minLength}\n`;
        }
        if (definition.maxLength) {
            doc += `- **Max Length**: ${definition.maxLength}\n`;
        }
        if (definition.itemType) {
            doc += `- **Item Type**: ${definition.itemType}\n`;
        }
        
        doc += `- **Description**: ${definition.description}\n\n`;
        
        return doc;
    }
    
    /**
     * Create an example entry
     * @returns {Object} Example entry
     */
    static createExample() {
        return {
            slug: 'my-first-post',
            lang: 'en',
            title: 'My First Post',
            summary: 'This is my first blog post about web development.',
            date: '2024-03-06',
            type: 'tutorial',
            category: 'frontend',
            tags: ['javascript', 'react', 'tutorial'],
            author: 'John Doe',
            draft: false,
            featured: false
        };
    }
}

// Browser environment
if (typeof window !== 'undefined') {
    window.ContentSchema = ContentSchema;
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentSchema;
}
