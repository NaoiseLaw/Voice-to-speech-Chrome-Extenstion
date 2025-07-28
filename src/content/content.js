// Content Script for Voice Input Extension
// Handles voice recognition and text insertion on web pages

class VoiceInputManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.activeElement = null;
    this.interimResults = '';
    this.settings = {};
    this.init();
  }

  async init() {
    // Load settings
    await this.loadSettings();
    
    // Listen for messages from background script via window.postMessage
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      this.handleMessage(event.data);
    });

    // Listen for direct messages from popup/background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message);
      sendResponse({ success: true });
    });

    // Listen for clicks to detect active input elements
    document.addEventListener('click', (event) => {
      this.handleElementClick(event);
    });

    // Listen for focus events
    document.addEventListener('focusin', (event) => {
      this.handleElementFocus(event);
    });

    console.log('Voice Input Manager initialized');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'voiceEnabled',
        'language',
        'continuousMode',
        'showInterimResults'
      ]);
      this.settings = {
        voiceEnabled: result.voiceEnabled ?? true,
        language: result.language ?? 'en-US',
        continuousMode: result.continuousMode ?? false,
        showInterimResults: result.showInterimResults ?? true
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = {
        voiceEnabled: true,
        language: 'en-US',
        continuousMode: false,
        showInterimResults: true
      };
    }
  }

  initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition settings
    this.recognition.continuous = this.settings.continuousMode;
    this.recognition.interimResults = this.settings.showInterimResults;
    this.recognition.lang = this.settings.language;
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.showListeningIndicator();
      console.log('Voice recognition started');
    };

    this.recognition.onresult = (event) => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onerror = (event) => {
      this.handleRecognitionError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.hideListeningIndicator();
      console.log('Voice recognition ended');
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'START_VOICE_RECOGNITION':
        this.startRecognition();
        break;
      case 'STOP_VOICE_RECOGNITION':
        this.stopRecognition();
        break;
      case 'INSERT_VOICE_TEXT':
        this.insertText(data.data);
        break;
      case 'INSERT_TEXT':
        this.insertText(data.text);
        break;
      case 'VOICE_ERROR':
        this.showError(data.error);
        break;
      case 'SETTINGS_UPDATED':
        this.updateSettings(data.settings);
        break;
    }
  }

  handleElementClick(event) {
    const target = event.target;
    if (this.isInputElement(target)) {
      this.activeElement = target;
      this.showVoiceIndicator(target);
    }
  }

  handleElementFocus(event) {
    const target = event.target;
    if (this.isInputElement(target)) {
      this.activeElement = target;
      this.showVoiceIndicator(target);
    }
  }

  isInputElement(element) {
    const inputTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'textarea'];
    return (
      element.tagName === 'INPUT' && inputTypes.includes(element.type) ||
      element.tagName === 'TEXTAREA' ||
      element.contentEditable === 'true' ||
      element.role === 'textbox'
    );
  }

  async startRecognition() {
    if (!this.recognition) {
      // Initialize speech recognition if not already done
      this.initializeSpeechRecognition();
    }

    if (!this.recognition) {
      console.error('Speech recognition not supported');
      this.sendError('Speech recognition not supported in this browser');
      return;
    }

    if (this.isListening) {
      console.log('Already listening');
      return;
    }

    // Check microphone permission first
    try {
      const permissionResult = await navigator.permissions.query({ name: 'microphone' });
      if (permissionResult.state === 'denied') {
        this.sendError('Microphone permission denied. Please allow microphone access in your browser settings.');
        return;
      }
      
      if (permissionResult.state === 'prompt') {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('Microphone permission error:', error);
      this.sendError('Failed to access microphone. Please check your browser settings.');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.sendError('Failed to start voice recognition');
    }
  }

  stopRecognition() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }

  handleRecognitionResult(event) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      this.insertText(finalTranscript);
      this.sendResult(finalTranscript);
    } else if (interimTranscript && this.settings.showInterimResults) {
      this.showInterimText(interimTranscript);
    }
  }

  handleRecognitionError(event) {
    console.error('Recognition error:', event.error);
    
    let errorMessage = 'Voice recognition error';
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected';
        break;
      case 'audio-capture':
        errorMessage = 'Microphone not available';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone permission denied';
        break;
      case 'network':
        errorMessage = 'Network error';
        break;
      case 'service-not-allowed':
        errorMessage = 'Speech recognition service not available';
        break;
    }

    this.sendError(errorMessage);
    this.showError(errorMessage);
  }

  insertText(text) {
    if (!this.activeElement) {
      console.warn('No active element to insert text');
      // Send error message to popup
      chrome.runtime.sendMessage({
        type: 'INSERT_ERROR',
        error: 'No text field selected. Please click in a text field first.'
      });
      return;
    }

    try {
      if (this.activeElement.contentEditable === 'true') {
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
        const start = this.activeElement.selectionStart;
        const end = this.activeElement.selectionEnd;
        const currentValue = this.activeElement.value;
        
        this.activeElement.value = 
          currentValue.substring(0, start) + 
          text + 
          currentValue.substring(end);
        
        // Set cursor position after inserted text
        this.activeElement.selectionStart = this.activeElement.selectionEnd = start + text.length;
      }

      // Trigger input event to notify the page
      this.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      this.activeElement.dispatchEvent(new Event('change', { bubbles: true }));

      this.hideInterimText();
      
      // Send success message to popup
      chrome.runtime.sendMessage({
        type: 'TEXT_INSERTED',
        data: {
          text,
          timestamp: Date.now(),
          element: {
            tagName: this.activeElement.tagName,
            type: this.activeElement.type,
            id: this.activeElement.id,
            className: this.activeElement.className
          }
        }
      });
    } catch (error) {
      console.error('Failed to insert text:', error);
      this.sendError('Failed to insert text');
    }
  }

  showInterimText(text) {
    this.interimResults = text;
    this.showInterimIndicator(text);
  }

  hideInterimText() {
    this.interimResults = '';
    this.hideInterimIndicator();
  }

  sendResult(text) {
    chrome.runtime.sendMessage({
      type: 'VOICE_RESULT',
      data: {
        text,
        timestamp: Date.now(),
        element: this.activeElement ? {
          tagName: this.activeElement.tagName,
          type: this.activeElement.type,
          id: this.activeElement.id,
          className: this.activeElement.className
        } : null
      }
    });
  }

  sendError(error) {
    chrome.runtime.sendMessage({
      type: 'VOICE_ERROR',
      error: {
        message: error,
        timestamp: Date.now()
      }
    });
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update recognition settings if recognition is initialized
    if (this.recognition) {
      this.recognition.lang = this.settings.language;
      this.recognition.continuous = this.settings.continuousMode;
      this.recognition.interimResults = this.settings.showInterimResults;
    }
    
    console.log('Settings updated:', this.settings);
  }

  showListeningIndicator() {
    this.createOrUpdateIndicator('listening', '🎤 Listening...', '#4CAF50');
  }

  hideListeningIndicator() {
    this.removeIndicator('listening');
  }

  showInterimIndicator(text) {
    this.createOrUpdateIndicator('interim', `🎤 ${text}`, '#FF9800');
  }

  hideInterimIndicator() {
    this.removeIndicator('interim');
  }

  showVoiceIndicator(element) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    this.createOrUpdateIndicator('voice-ready', '🎤 Click to speak', '#2196F3', {
      position: 'fixed',
      top: `${rect.bottom + 5}px`,
      left: `${rect.left}px`,
      zIndex: '10000'
    });
  }

  showError(message) {
    this.createOrUpdateIndicator('error', `❌ ${message}`, '#F44336');
    setTimeout(() => this.removeIndicator('error'), 3000);
  }

  createOrUpdateIndicator(id, text, color, additionalStyles = {}) {
    let indicator = document.getElementById(`voice-indicator-${id}`);
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = `voice-indicator-${id}`;
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
      `;
      document.body.appendChild(indicator);
    }

    indicator.textContent = text;
    
    // Apply additional styles
    Object.assign(indicator.style, additionalStyles);
  }

  removeIndicator(id) {
    const indicator = document.getElementById(`voice-indicator-${id}`);
    if (indicator) {
      indicator.remove();
    }
  }
}

// Initialize the voice input manager
const voiceInputManager = new VoiceInputManager(); 