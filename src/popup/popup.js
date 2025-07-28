// Popup Script for Voice Input Extension
// Handles user interface interactions and communicates with background service

class PopupController {
  constructor() {
    this.isListening = false;
    this.currentTranscript = '';
    this.settings = {};
    this.init();
  }

  async init() {
    try {
      // Get DOM elements with null checks
      this.voiceBtn = document.getElementById('voiceBtn');
      this.micIcon = document.getElementById('micIcon');
      this.btnText = document.getElementById('btnText');
      this.statusDot = document.getElementById('statusDot');
      this.statusText = document.getElementById('statusText');
      this.transcript = document.getElementById('transcript');
      this.insertBtn = document.getElementById('insertBtn');
      this.copyBtn = document.getElementById('copyBtn');
      this.language = document.getElementById('language');
      this.autoInsert = document.getElementById('autoInsert');
      this.settingsBtn = document.getElementById('settingsBtn');

      // Validate required elements exist
      const requiredElements = [
        'voiceBtn', 'micIcon', 'btnText', 'statusDot', 
        'statusText', 'transcript', 'insertBtn', 'copyBtn'
      ];

      for (const elementName of requiredElements) {
        if (!this[elementName]) {
          throw new Error(`Required element not found: ${elementName}`);
        }
      }

      // Load settings and current status
      await this.loadSettings();
      await this.updateStatus();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Popup controller initialized');
    } catch (error) {
      console.error('Failed to initialize popup controller:', error);
      this.showError('Failed to initialize popup');
    }
  }

  setupEventListeners() {
    // Voice button click
    this.voiceBtn.addEventListener('click', () => {
      this.toggleVoiceInput();
    });

    // Action buttons
    this.insertBtn.addEventListener('click', () => {
      this.insertText();
    });

    this.copyBtn.addEventListener('click', () => {
      this.copyText();
    });

    // Settings controls
    this.language.addEventListener('change', () => {
      this.saveSettings();
    });

    this.autoInsert.addEventListener('change', () => {
      this.saveSettings();
    });

    // Settings button
    this.settingsBtn.addEventListener('click', () => {
      this.openSettings();
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message);
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'language',
        'autoInsert'
      ]);

      this.settings = {
        language: result.language ?? 'en-US',
        autoInsert: result.autoInsert ?? false
      };

      // Update UI
      this.language.value = this.settings.language;
      this.autoInsert.checked = this.settings.autoInsert;
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      const newSettings = {
        language: this.language.value,
        autoInsert: this.autoInsert.checked
      };

      await chrome.storage.sync.set(newSettings);
      this.settings = newSettings;

      // Notify content script of settings change
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'SETTINGS_UPDATED',
            settings: newSettings
          }).catch(() => {
            // Content script might not be ready yet
          });
        }
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async updateStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      this.isListening = response.isListening;
      this.updateUI();
    } catch (error) {
      console.error('Failed to get status:', error);
    }
  }

  async toggleVoiceInput() {
    if (this.isListening) {
      await this.stopVoiceInput();
    } else {
      await this.startVoiceInput();
    }
  }

  async startVoiceInput() {
    try {
      // Start voice input - permission will be handled by content script
      const response = await chrome.runtime.sendMessage({ 
        type: 'START_VOICE_INPUT',
        language: this.settings.language
      });

      if (response.success) {
        this.isListening = true;
        this.updateUI();
        this.updateStatusText('Listening... Speak now');
      } else {
        this.showError('Failed to start voice input');
      }
    } catch (error) {
      console.error('Failed to start voice input:', error);
      this.showError('Failed to start voice input');
    }
  }

  async stopVoiceInput() {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'STOP_VOICE_INPUT' 
      });

      if (response.success) {
        this.isListening = false;
        this.updateUI();
        this.updateStatusText('Ready');
        
        // Enable action buttons if we have text
        if (this.currentTranscript) {
          this.enableActionButtons();
        }
      }
    } catch (error) {
      console.error('Failed to stop voice input:', error);
    }
  }

  updateUI() {
    // Update voice button
    this.voiceBtn.classList.toggle('listening', this.isListening);
    
    // Update main content background
    const mainContent = document.querySelector('.main');
    mainContent.classList.toggle('recording', this.isListening);
    
    if (this.isListening) {
      this.btnText.textContent = 'Stop Recording';
      this.micIcon.textContent = '⏹️';
      // Add visual feedback for active recording
      this.voiceBtn.style.transform = 'scale(1.05)';
    } else {
      this.btnText.textContent = 'Start Recording';
      this.micIcon.textContent = '🎤';
      this.voiceBtn.style.transform = 'scale(1)';
    }

    // Update status indicator
    this.statusDot.classList.toggle('listening', this.isListening);
    this.statusText.textContent = this.isListening ? 'Listening' : 'Ready';

    // Update status message
    if (!this.isListening) {
      this.updateStatusText('Click the button to start recording');
    }
  }

  updateStatusText(message) {
    // Update the info text in voice-info section
    const infoText = document.querySelector('.info-text');
    if (infoText) {
      infoText.textContent = message;
    }
  }

  showTranscript(text) {
    this.currentTranscript = text;
    this.transcript.textContent = text;
    this.transcript.style.display = text ? 'block' : 'none';
    
    // Enable action buttons if we have text
    if (text) {
      this.enableActionButtons();
      // Ensure the transcript is visible by scrolling if needed
      this.transcript.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      this.disableActionButtons();
    }
  }

  enableActionButtons() {
    this.insertBtn.disabled = false;
    this.insertBtn.classList.add('enabled');
    this.copyBtn.disabled = false;
    this.copyBtn.classList.add('enabled');
  }

  disableActionButtons() {
    this.insertBtn.disabled = true;
    this.insertBtn.classList.remove('enabled');
    this.copyBtn.disabled = true;
    this.copyBtn.classList.remove('enabled');
  }

  async insertText() {
    if (!this.currentTranscript) return;
    
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'INSERT_TEXT',
            text: this.currentTranscript
          }).catch(() => {
            this.showError('Failed to insert text. Please click in a text field first.');
          });
        }
      });
    } catch (error) {
      console.error('Failed to insert text:', error);
      this.showError('Failed to insert text');
    }
  }

  async copyText() {
    if (!this.currentTranscript) return;
    
    try {
      await navigator.clipboard.writeText(this.currentTranscript);
      this.updateStatusText('Text copied to clipboard!');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        this.updateStatusText('Click the button to start recording');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      this.showError('Failed to copy text');
    }
  }

  showError(message) {
    this.statusDot.classList.add('error');
    this.statusText.textContent = 'Error';
    this.updateStatusText(message);
    
    // Reset error state after 3 seconds
    setTimeout(() => {
      this.statusDot.classList.remove('error');
      this.statusText.textContent = 'Ready';
      this.updateStatusText('Click the button to start recording');
    }, 3000);
  }

  handleMessage(message) {
    switch (message.type) {
      case 'VOICE_RESULT':
        this.showTranscript(message.data.text);
        this.updateStatusText(`Transcribed: "${message.data.text}"`);
        
        // Auto-insert if enabled
        if (this.settings.autoInsert) {
          this.insertText();
        }
        break;
      
      case 'VOICE_ERROR':
        this.showError(message.error.message);
        break;
      
      case 'INTERIM_RESULT':
        this.showTranscript(message.data.text);
        break;
        
      case 'TEXT_INSERTED':
        this.updateStatusText('Text inserted successfully!');
        this.currentTranscript = '';
        this.showTranscript('');
        this.disableActionButtons();
        
        // Reset status after 2 seconds
        setTimeout(() => {
          this.updateStatusText('Click the button to start recording');
        }, 2000);
        break;
        
      case 'INSERT_ERROR':
        this.showError('Failed to insert text. Please click in a text field first.');
        break;
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupController();
}); 