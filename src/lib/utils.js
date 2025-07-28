// Utility functions for Voice Input Extension
// Common helper functions used across the extension

class VoiceInputUtils {
  // Audio processing utilities
  static getAudioConstraints(quality = 'medium') {
    const constraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };

    switch (quality) {
      case 'low':
        return {
          ...constraints,
          sampleRate: 16000,
          channelCount: 1
        };
      case 'high':
        return {
          ...constraints,
          sampleRate: 48000,
          channelCount: 2
        };
      default: // medium
        return {
          ...constraints,
          sampleRate: 44100,
          channelCount: 1
        };
    }
  }

  // Text processing utilities
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remove potentially harmful characters
    return text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  static formatText(text, options = {}) {
    let formatted = text;

    // Capitalize first letter if enabled
    if (options.capitalizeFirst) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    // Add punctuation if missing and enabled
    if (options.addPunctuation && !/[.!?]$/.test(formatted)) {
      formatted += '.';
    }

    // Remove extra whitespace
    formatted = formatted.replace(/\s+/g, ' ');

    return formatted;
  }

  // DOM utilities
  static isInputElement(element) {
    if (!element) return false;

    const inputTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'textarea'];
    
    return (
      element.tagName === 'INPUT' && inputTypes.includes(element.type) ||
      element.tagName === 'TEXTAREA' ||
      element.contentEditable === 'true' ||
      element.role === 'textbox' ||
      element.getAttribute('data-voice-input') === 'true'
    );
  }

  static insertTextAtCursor(element, text) {
    if (!element) return false;

    try {
      if (element.contentEditable === 'true') {
        // Handle contentEditable elements
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // Handle regular input elements
        const start = element.selectionStart;
        const end = element.selectionEnd;
        const currentValue = element.value;
        
        element.value = 
          currentValue.substring(0, start) + 
          text + 
          currentValue.substring(end);
        
        // Set cursor position after inserted text
        element.selectionStart = element.selectionEnd = start + text.length;
      }

      // Trigger input event to notify the page
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return true;
    } catch (error) {
      console.error('Failed to insert text:', error);
      return false;
    }
  }

  // Storage utilities
  static async getStorageData(keys) {
    try {
      return await chrome.storage.sync.get(keys);
    } catch (error) {
      console.error('Failed to get storage data:', error);
      return {};
    }
  }

  static async setStorageData(data) {
    try {
      await chrome.storage.sync.set(data);
      return true;
    } catch (error) {
      console.error('Failed to set storage data:', error);
      return false;
    }
  }

  // Messaging utilities
  static async sendMessage(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  static async sendMessageToTab(tabId, message) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Failed to send message to tab:', error);
      return null;
    }
  }

  // Permission utilities
  static async checkMicrophonePermission() {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' });
      return permission.state;
    } catch (error) {
      console.error('Failed to check microphone permission:', error);
      return 'unknown';
    }
  }

  static async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: this.getAudioConstraints() 
      });
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Failed to request microphone permission:', error);
      return false;
    }
  }

  // Error handling utilities
  static getErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }

    if (error.name) {
      switch (error.name) {
        case 'NotAllowedError':
          return 'Microphone access was denied';
        case 'NotFoundError':
          return 'No microphone found on this device';
        case 'NotReadableError':
          return 'Microphone is already in use by another application';
        case 'OverconstrainedError':
          return 'Microphone does not meet the required constraints';
        case 'TypeError':
          return 'Microphone access is not supported in this browser';
        case 'NetworkError':
          return 'Network error occurred';
        case 'ServiceNotAllowedError':
          return 'Speech recognition service not available';
        default:
          return error.message || 'An unknown error occurred';
      }
    }

    return error.message || 'An unknown error occurred';
  }

  // Performance utilities
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Validation utilities
  static validateSettings(settings) {
    const errors = [];
    
    if (settings.language && !/^[a-z]{2}-[A-Z]{2}$/.test(settings.language)) {
      errors.push('Invalid language format');
    }
    
    if (settings.maxAlternatives && (settings.maxAlternatives < 1 || settings.maxAlternatives > 3)) {
      errors.push('Maximum alternatives must be between 1 and 3');
    }
    
    if (settings.dataRetention && (settings.dataRetention < 0 || settings.dataRetention > 365)) {
      errors.push('Data retention must be between 0 and 365 days');
    }
    
    return errors;
  }

  // Browser detection
  static getBrowserInfo() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return {
        name: 'Chrome',
        version: userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown'
      };
    } else if (userAgent.includes('Firefox')) {
      return {
        name: 'Firefox',
        version: userAgent.match(/Firefox\/(\d+)/)?.[1] || 'unknown'
      };
    } else if (userAgent.includes('Safari')) {
      return {
        name: 'Safari',
        version: userAgent.match(/Version\/(\d+)/)?.[1] || 'unknown'
      };
    } else if (userAgent.includes('Edge')) {
      return {
        name: 'Edge',
        version: userAgent.match(/Edge\/(\d+)/)?.[1] || 'unknown'
      };
    }
    
    return {
      name: 'Unknown',
      version: 'unknown'
    };
  }

  // Feature detection
  static supportsSpeechRecognition() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  static supportsMediaDevices() {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }

  static supportsPermissions() {
    return 'permissions' in navigator && 'query' in navigator.permissions;
  }

  // Logging utilities
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      extension: 'Voice Input Extension'
    };

    switch (level) {
      case 'error':
        console.error(logEntry);
        break;
      case 'warn':
        console.warn(logEntry);
        break;
      case 'info':
        console.info(logEntry);
        break;
      default:
        console.log(logEntry);
    }

    // Store logs for debugging (optional)
    this.storeLog(logEntry);
  }

  static storeLog(logEntry) {
    // Store recent logs in memory for debugging
    if (!this.logs) {
      this.logs = [];
    }
    
    this.logs.push(logEntry);
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }

  static getLogs() {
    return this.logs || [];
  }

  static clearLogs() {
    this.logs = [];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceInputUtils;
} 