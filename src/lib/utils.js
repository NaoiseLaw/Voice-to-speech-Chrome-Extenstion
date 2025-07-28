// Utility functions for Voice Input Pro

// DOM utilities
const DOMUtils = {
    /**
     * Safely get an element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} - The element or null if not found
     */
    getElement(id) {
        try {
            return document.getElementById(id);
        } catch (error) {
            console.error(`Failed to get element with ID: ${id}`, error);
            return null;
        }
    },

    /**
     * Safely get multiple elements by selector
     * @param {string} selector - CSS selector
     * @returns {NodeList|Array} - Elements or empty array
     */
    getElements(selector) {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.error(`Failed to get elements with selector: ${selector}`, error);
            return [];
        }
    },

    /**
     * Add event listener with error handling
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    addEventListener(element, event, handler, options = {}) {
        try {
            if (element && typeof element.addEventListener === 'function') {
                element.addEventListener(event, handler, options);
            }
        } catch (error) {
            console.error(`Failed to add event listener for ${event}:`, error);
        }
    },

    /**
     * Remove event listener with error handling
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    removeEventListener(element, event, handler, options = {}) {
        try {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(event, handler, options);
            }
        } catch (error) {
            console.error(`Failed to remove event listener for ${event}:`, error);
        }
    }
};

// Storage utilities
const StorageUtils = {
    /**
     * Save data to chrome.storage.sync
     * @param {Object} data - Data to save
     * @returns {Promise} - Promise that resolves when saved
     */
    async save(data) {
        try {
            await chrome.storage.sync.set(data);
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            return false;
        }
    },

    /**
     * Load data from chrome.storage.sync
     * @param {string|Array} keys - Keys to load
     * @returns {Promise<Object>} - Promise that resolves with data
     */
    async load(keys) {
        try {
            return await chrome.storage.sync.get(keys);
        } catch (error) {
            console.error('Failed to load from storage:', error);
            return {};
        }
    },

    /**
     * Remove data from chrome.storage.sync
     * @param {string|Array} keys - Keys to remove
     * @returns {Promise} - Promise that resolves when removed
     */
    async remove(keys) {
        try {
            await chrome.storage.sync.remove(keys);
            return true;
        } catch (error) {
            console.error('Failed to remove from storage:', error);
            return false;
        }
    }
};

// Validation utilities
const ValidationUtils = {
    /**
     * Validate language code
     * @param {string} lang - Language code to validate
     * @returns {boolean} - True if valid
     */
    isValidLanguage(lang) {
        const validLanguages = [
            'en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT',
            'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN', 'ru-RU', 'ar-SA'
        ];
        return validLanguages.includes(lang);
    },

    /**
     * Validate settings object
     * @param {Object} settings - Settings to validate
     * @returns {Object} - Validated settings with defaults
     */
    validateSettings(settings = {}) {
        return {
            language: this.isValidLanguage(settings.language) ? settings.language : 'en-US',
            autoInsert: Boolean(settings.autoInsert),
            continuousMode: Boolean(settings.continuousMode),
            enableCommands: settings.enableCommands !== false,
            enablePunctuation: settings.enablePunctuation !== false,
            noiseSuppression: settings.noiseSuppression !== false
        };
    },

    /**
     * Sanitize text input
     * @param {string} text - Text to sanitize
     * @returns {string} - Sanitized text
     */
    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        
        // Remove potentially dangerous characters
        return text
            .replace(/[<>]/g, '') // Remove < and >
            .trim();
    }
};

// Audio utilities
const AudioUtils = {
    /**
     * Check if audio is supported
     * @returns {boolean} - True if audio is supported
     */
    isSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    },

    /**
     * Get audio constraints
     * @param {Object} options - Audio options
     * @returns {Object} - Audio constraints
     */
    getAudioConstraints(options = {}) {
        return {
            echoCancellation: true,
            noiseSuppression: options.noiseSuppression !== false,
            autoGainControl: true,
            sampleRate: options.sampleRate || 44100
        };
    },

    /**
     * Request microphone permission
     * @returns {Promise<boolean>} - Promise that resolves to permission status
     */
    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: this.getAudioConstraints() 
            });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            return false;
        }
    },

    /**
     * Check microphone permission status
     * @returns {Promise<string>} - Promise that resolves to permission state
     */
    async checkMicrophonePermission() {
        try {
            const permission = await navigator.permissions.query({ name: 'microphone' });
            return permission.state;
        } catch (error) {
            console.error('Failed to check microphone permission:', error);
            return 'denied';
        }
    }
};

// Text processing utilities
const TextUtils = {
    /**
     * Capitalize first letter of each word
     * @param {string} text - Text to capitalize
     * @returns {string} - Capitalized text
     */
    capitalizeWords(text) {
        if (!text) return '';
        return text.replace(/\b\w/g, l => l.toUpperCase());
    },

    /**
     * Convert text to title case
     * @param {string} text - Text to convert
     * @returns {string} - Title case text
     */
    toTitleCase(text) {
        if (!text) return '';
        return text.replace(/\w\S*/g, txt => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },

    /**
     * Clean up extra whitespace
     * @param {string} text - Text to clean
     * @returns {string} - Cleaned text
     */
    cleanWhitespace(text) {
        if (!text) return '';
        return text.replace(/\s+/g, ' ').trim();
    },

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated text
     */
    truncate(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

// Error handling utilities
const ErrorUtils = {
    /**
     * Create a standardized error object
     * @param {string} message - Error message
     * @param {string} code - Error code
     * @param {Object} details - Additional error details
     * @returns {Object} - Standardized error object
     */
    createError(message, code = 'UNKNOWN_ERROR', details = {}) {
        return {
            message,
            code,
            details,
            timestamp: Date.now()
        };
    },

    /**
     * Log error with context
     * @param {Error|Object} error - Error to log
     * @param {string} context - Error context
     */
    logError(error, context = '') {
        const errorInfo = {
            message: error.message || error,
            code: error.code || 'UNKNOWN_ERROR',
            context,
            timestamp: Date.now(),
            stack: error.stack
        };
        
        console.error('Voice Input Pro Error:', errorInfo);
        return errorInfo;
    },

    /**
     * Handle async errors
     * @param {Function} fn - Async function to wrap
     * @returns {Function} - Wrapped function with error handling
     */
    asyncHandler(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.logError(error, fn.name);
                throw error;
            }
        };
    }
};

// Performance utilities
const PerformanceUtils = {
    /**
     * Measure execution time of a function
     * @param {Function} fn - Function to measure
     * @param {string} name - Name for logging
     * @returns {Function} - Wrapped function
     */
    measureTime(fn, name = 'Function') {
        return async (...args) => {
            const start = performance.now();
            try {
                const result = await fn(...args);
                const duration = performance.now() - start;
                console.log(`${name} took ${duration.toFixed(2)}ms`);
                return result;
            } catch (error) {
                const duration = performance.now() - start;
                console.error(`${name} failed after ${duration.toFixed(2)}ms:`, error);
                throw error;
            }
        };
    },

    /**
     * Debounce function calls
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} - Debounced function
     */
    debounce(fn, delay = 300) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    },

    /**
     * Throttle function calls
     * @param {Function} fn - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} - Throttled function
     */
    throttle(fn, limit = 300) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export utilities for use in other modules
window.VoiceInputUtils = {
    DOM: DOMUtils,
    Storage: StorageUtils,
    Validation: ValidationUtils,
    Audio: AudioUtils,
    Text: TextUtils,
    Error: ErrorUtils,
    Performance: PerformanceUtils
}; 