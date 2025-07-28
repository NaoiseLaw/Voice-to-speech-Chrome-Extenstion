// Options Page Script for Voice Input Extension
// Handles advanced settings management and configuration

class OptionsController {
  constructor() {
    this.settings = {};
    this.defaultSettings = {
      // Voice Recognition
      language: 'en-US',
      continuousMode: false,
      showInterimResults: true,
      maxAlternatives: 1,
      
      // User Interface
      showVoiceIndicators: true,
      autoFocusOnInput: true,
      indicatorPosition: 'top-right',
      
      // Privacy & Security
      enableLocalProcessing: false,
      clearDataOnClose: true,
      dataRetention: 0,
      
      // Performance
      audioQuality: 'medium',
      enableEchoCancellation: true,
      enableNoiseSuppression: true
    };
    
    this.init();
  }

  async init() {
    // Get all form elements
    this.formElements = {
      languageSelect: document.getElementById('languageSelect'),
      continuousMode: document.getElementById('continuousMode'),
      showInterimResults: document.getElementById('showInterimResults'),
      maxAlternatives: document.getElementById('maxAlternatives'),
      showVoiceIndicators: document.getElementById('showVoiceIndicators'),
      autoFocusOnInput: document.getElementById('autoFocusOnInput'),
      indicatorPosition: document.getElementById('indicatorPosition'),
      enableLocalProcessing: document.getElementById('enableLocalProcessing'),
      clearDataOnClose: document.getElementById('clearDataOnClose'),
      dataRetention: document.getElementById('dataRetention'),
      audioQuality: document.getElementById('audioQuality'),
      enableEchoCancellation: document.getElementById('enableEchoCancellation'),
      enableNoiseSuppression: document.getElementById('enableNoiseSuppression')
    };

    // Action buttons
    this.saveButton = document.getElementById('saveButton');
    this.resetButton = document.getElementById('resetButton');
    this.statusMessage = document.getElementById('statusMessage');

    // Load current settings
    await this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('Options controller initialized');
  }

  setupEventListeners() {
    // Save button
    this.saveButton.addEventListener('click', () => {
      this.saveSettings();
    });

    // Reset button
    this.resetButton.addEventListener('click', () => {
      this.resetToDefaults();
    });

    // Auto-save on form changes (optional)
    Object.values(this.formElements).forEach(element => {
      if (element) {
        element.addEventListener('change', () => {
          this.markAsChanged();
        });
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 's') {
          event.preventDefault();
          this.saveSettings();
        }
      }
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(Object.keys(this.defaultSettings));
      
      // Merge with defaults
      this.settings = { ...this.defaultSettings, ...result };
      
      // Update form elements
      this.updateFormElements();
      
      console.log('Settings loaded:', this.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showStatus('Failed to load settings', 'error');
    }
  }

  updateFormElements() {
    // Update select elements
    if (this.formElements.languageSelect) {
      this.formElements.languageSelect.value = this.settings.language;
    }
    if (this.formElements.maxAlternatives) {
      this.formElements.maxAlternatives.value = this.settings.maxAlternatives;
    }
    if (this.formElements.indicatorPosition) {
      this.formElements.indicatorPosition.value = this.settings.indicatorPosition;
    }
    if (this.formElements.dataRetention) {
      this.formElements.dataRetention.value = this.settings.dataRetention;
    }
    if (this.formElements.audioQuality) {
      this.formElements.audioQuality.value = this.settings.audioQuality;
    }

    // Update checkbox elements
    if (this.formElements.continuousMode) {
      this.formElements.continuousMode.checked = this.settings.continuousMode;
    }
    if (this.formElements.showInterimResults) {
      this.formElements.showInterimResults.checked = this.settings.showInterimResults;
    }
    if (this.formElements.showVoiceIndicators) {
      this.formElements.showVoiceIndicators.checked = this.settings.showVoiceIndicators;
    }
    if (this.formElements.autoFocusOnInput) {
      this.formElements.autoFocusOnInput.checked = this.settings.autoFocusOnInput;
    }
    if (this.formElements.enableLocalProcessing) {
      this.formElements.enableLocalProcessing.checked = this.settings.enableLocalProcessing;
    }
    if (this.formElements.clearDataOnClose) {
      this.formElements.clearDataOnClose.checked = this.settings.clearDataOnClose;
    }
    if (this.formElements.enableEchoCancellation) {
      this.formElements.enableEchoCancellation.checked = this.settings.enableEchoCancellation;
    }
    if (this.formElements.enableNoiseSuppression) {
      this.formElements.enableNoiseSuppression.checked = this.settings.enableNoiseSuppression;
    }
  }

  async saveSettings() {
    try {
      // Collect form values
      const newSettings = {
        language: this.formElements.languageSelect.value,
        continuousMode: this.formElements.continuousMode.checked,
        showInterimResults: this.formElements.showInterimResults.checked,
        maxAlternatives: parseInt(this.formElements.maxAlternatives.value),
        showVoiceIndicators: this.formElements.showVoiceIndicators.checked,
        autoFocusOnInput: this.formElements.autoFocusOnInput.checked,
        indicatorPosition: this.formElements.indicatorPosition.value,
        enableLocalProcessing: this.formElements.enableLocalProcessing.checked,
        clearDataOnClose: this.formElements.clearDataOnClose.checked,
        dataRetention: parseInt(this.formElements.dataRetention.value),
        audioQuality: this.formElements.audioQuality.value,
        enableEchoCancellation: this.formElements.enableEchoCancellation.checked,
        enableNoiseSuppression: this.formElements.enableNoiseSuppression.checked
      };

      // Save to storage
      await chrome.storage.sync.set(newSettings);
      
      // Update local settings
      this.settings = newSettings;
      
      // Notify all tabs of settings change
      await this.notifyTabsOfSettingsChange();
      
      this.showStatus('Settings saved successfully!', 'success');
      this.markAsSaved();
      
      console.log('Settings saved:', newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }

  async resetToDefaults() {
    try {
      // Save default settings
      await chrome.storage.sync.set(this.defaultSettings);
      
      // Update local settings
      this.settings = { ...this.defaultSettings };
      
      // Update form elements
      this.updateFormElements();
      
      // Notify all tabs of settings change
      await this.notifyTabsOfSettingsChange();
      
      this.showStatus('Settings reset to defaults', 'info');
      this.markAsSaved();
      
      console.log('Settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.showStatus('Failed to reset settings', 'error');
    }
  }

  async notifyTabsOfSettingsChange() {
    try {
      const tabs = await chrome.tabs.query({});
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            settings: this.settings
          });
        } catch (error) {
          // Tab might not have content script loaded
          console.log(`Could not notify tab ${tab.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Failed to notify tabs:', error);
    }
  }

  showStatus(message, type = 'info') {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type} show`;
    
    // Hide after 3 seconds
    setTimeout(() => {
      this.statusMessage.classList.remove('show');
    }, 3000);
  }

  markAsChanged() {
    this.saveButton.textContent = 'Save Settings *';
    this.saveButton.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
  }

  markAsSaved() {
    this.saveButton.textContent = 'Save Settings';
    this.saveButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  // Validate settings before saving
  validateSettings(settings) {
    const errors = [];
    
    if (!settings.language) {
      errors.push('Language is required');
    }
    
    if (settings.maxAlternatives < 1 || settings.maxAlternatives > 3) {
      errors.push('Maximum alternatives must be between 1 and 3');
    }
    
    if (settings.dataRetention < 0 || settings.dataRetention > 365) {
      errors.push('Data retention must be between 0 and 365 days');
    }
    
    return errors;
  }

  // Export settings for backup
  async exportSettings() {
    try {
      const settings = await chrome.storage.sync.get();
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `voice-input-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showStatus('Failed to export settings', 'error');
    }
  }

  // Import settings from backup
  async importSettings(file) {
    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      // Validate imported settings
      const errors = this.validateSettings(settings);
      if (errors.length > 0) {
        throw new Error(`Invalid settings: ${errors.join(', ')}`);
      }
      
      // Save imported settings
      await chrome.storage.sync.set(settings);
      this.settings = { ...this.defaultSettings, ...settings };
      this.updateFormElements();
      
      await this.notifyTabsOfSettingsChange();
      
      this.showStatus('Settings imported successfully!', 'success');
    } catch (error) {
      console.error('Failed to import settings:', error);
      this.showStatus('Failed to import settings: ' + error.message, 'error');
    }
  }
}

// Initialize options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const options = new OptionsController();
}); 