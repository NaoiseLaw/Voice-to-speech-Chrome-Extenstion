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
          try {
            await this.startVoiceInput(sender.tab?.id);
            sendResponse({ success: true });
          } catch (error) {
            console.error('Failed to start voice input:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'STOP_VOICE_INPUT':
          try {
            await this.stopVoiceInput();
            sendResponse({ success: true });
          } catch (error) {
            console.error('Failed to stop voice input:', error);
            sendResponse({ success: false, error: error.message });
          }
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

    try {
      // Get the active tab if not provided
      if (!tabId) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
          throw new Error('No active tab found');
        }
        tabId = tabs[0].id;
      }

      this.currentTabId = tabId;
      this.isListening = true;

      // Send message to content script to start recognition
      await chrome.tabs.sendMessage(tabId, {
        type: 'START_VOICE_RECOGNITION'
      });

      console.log('Voice input started successfully');
    } catch (error) {
      console.error('Failed to start voice input:', error);
      this.isListening = false;
      this.currentTabId = null;
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
        await chrome.tabs.sendMessage(this.currentTabId, {
          type: 'STOP_VOICE_RECOGNITION'
        });
      } catch (error) {
        console.error('Failed to stop voice input:', error);
      }
    }

    this.currentTabId = null;
  }

  async checkMicrophonePermission() {
    // Chrome extensions don't have direct microphone permission
    // We'll check if the content script can access microphone
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        const result = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            return navigator.permissions.query({ name: 'microphone' })
              .then(result => result.state === 'granted')
              .catch(() => false);
          }
        });
        this.permissionGranted = result[0]?.result || false;
        return this.permissionGranted;
      }
      return false;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return false;
    }
  }

  async requestMicrophonePermission() {
    // Request microphone permission through content script
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        const result = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            return navigator.mediaDevices.getUserMedia({ audio: true })
              .then(stream => {
                stream.getTracks().forEach(track => track.stop());
                return true;
              })
              .catch(() => false);
          }
        });
        this.permissionGranted = result[0]?.result || false;
        return this.permissionGranted;
      }
      return false;
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