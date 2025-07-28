// Service Worker for Voice Input Extension
// Handles coordination between popup, content scripts, and permission management

class BackgroundService {
  constructor() {
    this.isListening = false;
    this.currentTabId = null;
    this.permissionGranted = false;
    this.init();
  }

  init() {
    // Listen for messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Handle tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivation(activeInfo);
    });

    console.log('Voice Input Extension background service initialized');
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'START_VOICE_INPUT':
          await this.startVoiceInput(sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'STOP_VOICE_INPUT':
          await this.stopVoiceInput();
          sendResponse({ success: true });
          break;

        case 'CHECK_PERMISSION':
          const hasPermission = await this.checkMicrophonePermission();
          sendResponse({ hasPermission });
          break;

        case 'REQUEST_PERMISSION':
          const granted = await this.requestMicrophonePermission();
          sendResponse({ granted });
          break;

        case 'GET_STATUS':
          sendResponse({
            isListening: this.isListening,
            permissionGranted: this.permissionGranted,
            currentTabId: this.currentTabId
          });
          break;

        case 'VOICE_RESULT':
          await this.handleVoiceResult(message.data, sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'VOICE_ERROR':
          await this.handleVoiceError(message.error, sender.tab?.id);
          sendResponse({ success: true });
          break;

        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async startVoiceInput(tabId) {
    if (this.isListening) {
      console.log('Voice input already active');
      return;
    }

    this.currentTabId = tabId;
    this.isListening = true;

    // Check if we have microphone permission
    if (!this.permissionGranted) {
      const granted = await this.requestMicrophonePermission();
      if (!granted) {
        this.isListening = false;
        throw new Error('Microphone permission denied');
      }
    }

    // Inject content script to start voice recognition
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        function: () => {
          // This will be executed in the content script context
          window.postMessage({ type: 'START_VOICE_RECOGNITION' }, '*');
        }
      });
    } catch (error) {
      console.error('Failed to start voice input:', error);
      this.isListening = false;
      throw error;
    }
  }

  async stopVoiceInput() {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;

    if (this.currentTabId) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: this.currentTabId },
          function: () => {
            window.postMessage({ type: 'STOP_VOICE_RECOGNITION' }, '*');
          }
        });
      } catch (error) {
        console.error('Failed to stop voice input:', error);
      }
    }

    this.currentTabId = null;
  }

  async checkMicrophonePermission() {
    try {
      const result = await chrome.permissions.contains({
        permissions: ['microphone']
      });
      this.permissionGranted = result;
      return result;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return false;
    }
  }

  async requestMicrophonePermission() {
    try {
      const granted = await chrome.permissions.request({
        permissions: ['microphone']
      });
      this.permissionGranted = granted;
      return granted;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  }

  async handleVoiceResult(data, tabId) {
    if (!tabId) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        function: (voiceData) => {
          window.postMessage({
            type: 'INSERT_VOICE_TEXT',
            data: voiceData
          }, '*');
        },
        args: [data]
      });
    } catch (error) {
      console.error('Failed to handle voice result:', error);
    }
  }

  async handleVoiceError(error, tabId) {
    if (!tabId) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        function: (errorData) => {
          window.postMessage({
            type: 'VOICE_ERROR',
            error: errorData
          }, '*');
        },
        args: [error]
      });
    } catch (err) {
      console.error('Failed to handle voice error:', err);
    }
  }

  handleInstallation(details) {
    if (details.reason === 'install') {
      console.log('Voice Input Extension installed');
      // Set default settings
      chrome.storage.sync.set({
        voiceEnabled: true,
        language: 'en-US',
        continuousMode: false,
        showInterimResults: true
      });
    } else if (details.reason === 'update') {
      console.log('Voice Input Extension updated');
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      // Reset listening state when navigating to a new page
      if (this.currentTabId === tabId && this.isListening) {
        this.stopVoiceInput();
      }
    }
  }

  handleTabActivation(activeInfo) {
    // Update current tab when switching tabs
    this.currentTabId = activeInfo.tabId;
  }
}

// Initialize the background service
const backgroundService = new BackgroundService(); 