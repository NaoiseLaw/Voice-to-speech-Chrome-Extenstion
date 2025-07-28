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
        const defaults = {
            language: 'en-US',
            autoInsert: false,
            continuousMode: false,
            enableCommands: true,
            enablePunctuation: true,
            noiseSuppression: true,
            showInterimResults: true,
            audioQuality: 'medium',
            enableEchoCancellation: true,
            enableLocalProcessing: false,
            clearDataOnClose: false,
            dataRetention: 0,
            showVoiceIndicators: true,
            autoFocusOnInput: false,
            indicatorPosition: 'top-right',
            maxAlternatives: 1
        };

        const validated = { ...defaults };

        // Validate and migrate settings
        for (const [key, value] of Object.entries(settings)) {
            switch (key) {
                case 'language':
                    validated.language = this.isValidLanguage(value) ? value : defaults.language;
                    break;
                    
                case 'autoInsert':
                case 'continuousMode':
                case 'enableCommands':
                case 'enablePunctuation':
                case 'noiseSuppression':
                case 'showInterimResults':
                case 'enableEchoCancellation':
                case 'enableLocalProcessing':
                case 'clearDataOnClose':
                case 'showVoiceIndicators':
                case 'autoFocusOnInput':
                    validated[key] = typeof value === 'boolean' ? value : defaults[key];
                    break;
                    
                case 'audioQuality':
                    validated.audioQuality = ['low', 'medium', 'high'].includes(value) ? value : defaults.audioQuality;
                    break;
                    
                case 'indicatorPosition':
                    validated.indicatorPosition = ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(value) ? value : defaults.indicatorPosition;
                    break;
                    
                case 'maxAlternatives':
                    const num = parseInt(value);
                    validated.maxAlternatives = (num >= 1 && num <= 3) ? num : defaults.maxAlternatives;
                    break;
                    
                case 'dataRetention':
                    const retention = parseInt(value);
                    validated.dataRetention = [0, 1, 7, 30].includes(retention) ? retention : defaults.dataRetention;
                    break;
                    
                // Handle legacy settings
                case 'voiceIndicators':
                    validated.showVoiceIndicators = value;
                    break;
                    
                case 'interimResults':
                    validated.showInterimResults = value;
                    break;
                    
                case 'echoCancellation':
                    validated.enableEchoCancellation = value;
                    break;
            }
        }

        return validated;
    },

    async migrateSettings() {
        try {
            const oldSettings = await this.load('oldSettings');
            if (oldSettings && Object.keys(oldSettings).length > 0) {
                const migrated = this.validateSettings(oldSettings);
                await this.save(migrated);
                await this.remove('oldSettings');
                console.log('Settings migrated successfully');
                return migrated;
            }
        } catch (error) {
            console.error('Failed to migrate settings:', error);
        }
        return null;
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
    },

    /**
     * Track performance metrics
     */
    metrics: new Map(),
    marks: new Map(),
    
    startTimer(name) {
        this.marks.set(name, performance.now());
    },
    
    endTimer(name) {
        const start = this.marks.get(name);
        if (start) {
            const duration = performance.now() - start;
            this.metrics.set(name, duration);
            this.marks.delete(name);
            return duration;
        }
        return 0;
    },
    
    getMetrics() {
        return Object.fromEntries(this.metrics);
    },
    
    clearMetrics() {
        this.metrics.clear();
        this.marks.clear();
    },
    
    logMetrics() {
        console.log('Performance Metrics:', this.getMetrics());
    }
};

// Memory management utilities
const MemoryUtils = {
    /**
     * Track object memory usage
     * @param {Object} obj - Object to track
     * @param {string} name - Name for tracking
     */
    trackObject(obj, name) {
        if (window.performance && window.performance.memory) {
            const memory = window.performance.memory;
            console.log(`${name} - Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used`);
        }
    },

    /**
     * Check current memory usage
     * @returns {Object|null} - Current memory usage or null if not available
     */
    checkMemoryUsage() {
        if (window.performance && window.performance.memory) {
            const memory = window.performance.memory;
            return {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit
            };
        }
        return null;
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
    Performance: PerformanceUtils,
    Memory: MemoryUtils
}; 