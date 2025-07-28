// Permission Request Script for Voice Input Extension
// Handles microphone permission requests and user interaction

class PermissionController {
  constructor() {
    this.init();
  }

  init() {
    // Get DOM elements
    this.requestButton = document.getElementById('requestPermission');
    this.denyButton = document.getElementById('denyPermission');
    this.closeButton = document.getElementById('closeButton');
    this.statusDiv = document.getElementById('status');

    // Set up event listeners
    this.setupEventListeners();

    // Check current permission status
    this.checkPermissionStatus();

    console.log('Permission controller initialized');
  }

  setupEventListeners() {
    // Request permission button
    this.requestButton.addEventListener('click', () => {
      this.requestMicrophonePermission();
    });

    // Deny permission button
    this.denyButton.addEventListener('click', () => {
      this.denyPermission();
    });

    // Close button
    this.closeButton.addEventListener('click', () => {
      this.closeWindow();
    });

    // Listen for messages from parent window
    window.addEventListener('message', (event) => {
      this.handleMessage(event);
    });
  }

  async checkPermissionStatus() {
    try {
      // Check if we already have permission
      const permission = await navigator.permissions.query({ name: 'microphone' });
      
      if (permission.state === 'granted') {
        this.showStatus('Microphone access already granted!', 'success');
        this.requestButton.disabled = true;
        this.requestButton.textContent = 'Permission Granted';
      } else if (permission.state === 'denied') {
        this.showStatus('Microphone access was previously denied. Please enable it in your browser settings.', 'error');
        this.requestButton.disabled = true;
        this.requestButton.textContent = 'Permission Denied';
      }

      // Listen for permission changes
      permission.addEventListener('change', () => {
        this.handlePermissionChange(permission.state);
      });
    } catch (error) {
      console.error('Failed to check permission status:', error);
      this.showStatus('Unable to check permission status', 'error');
    }
  }

  async requestMicrophonePermission() {
    try {
      this.showStatus('Requesting microphone access...', 'info');
      this.requestButton.disabled = true;
      this.requestButton.textContent = 'Requesting...';

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());

      // Permission granted
      this.showStatus('Microphone access granted successfully!', 'success');
      this.requestButton.textContent = 'Permission Granted';
      this.requestButton.disabled = true;

      // Notify parent window
      this.notifyParent('PERMISSION_GRANTED');

      // Close window after a delay
      setTimeout(() => {
        this.closeWindow();
      }, 2000);

    } catch (error) {
      console.error('Failed to get microphone permission:', error);
      
      let errorMessage = 'Failed to get microphone permission';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access was denied by the user';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found on this device';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone does not meet the required constraints';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Microphone access is not supported in this browser';
      }

      this.showStatus(errorMessage, 'error');
      this.requestButton.disabled = false;
      this.requestButton.textContent = 'Try Again';
    }
  }

  denyPermission() {
    this.showStatus('Microphone access denied. Voice input will not be available.', 'error');
    this.denyButton.disabled = true;
    this.denyButton.textContent = 'Access Denied';

    // Notify parent window
    this.notifyParent('PERMISSION_DENIED');

    // Close window after a delay
    setTimeout(() => {
      this.closeWindow();
    }, 2000);
  }

  handlePermissionChange(state) {
    switch (state) {
      case 'granted':
        this.showStatus('Microphone access granted!', 'success');
        this.requestButton.disabled = true;
        this.requestButton.textContent = 'Permission Granted';
        this.notifyParent('PERMISSION_GRANTED');
        break;
      
      case 'denied':
        this.showStatus('Microphone access denied.', 'error');
        this.requestButton.disabled = true;
        this.requestButton.textContent = 'Permission Denied';
        this.notifyParent('PERMISSION_DENIED');
        break;
      
      case 'prompt':
        this.showStatus('Microphone permission is in prompt state.', 'info');
        this.requestButton.disabled = false;
        this.requestButton.textContent = 'Grant Microphone Access';
        break;
    }
  }

  handleMessage(event) {
    // Only accept messages from the same origin
    if (event.origin !== window.location.origin) {
      return;
    }

    switch (event.data.type) {
      case 'CHECK_PERMISSION':
        this.checkPermissionStatus();
        break;
      
      case 'REQUEST_PERMISSION':
        this.requestMicrophonePermission();
        break;
    }
  }

  notifyParent(message) {
    try {
      // Try to notify parent window
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: message,
          timestamp: Date.now()
        }, '*');
      }

      // Also notify the extension background script
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: message,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to notify parent:', error);
    }
  }

  showStatus(message, type = 'info') {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
    this.statusDiv.style.display = 'block';
  }

  closeWindow() {
    try {
      // Try to close the window
      window.close();
    } catch (error) {
      console.log('Could not close window automatically');
      // If we can't close the window, show a message
      this.showStatus('You can now close this window', 'info');
    }
  }

  // Test microphone functionality
  async testMicrophone() {
    try {
      this.showStatus('Testing microphone...', 'info');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Create audio context to test audio input
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      source.connect(analyser);
      
      // Check if we're getting audio data
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();

      if (average > 0) {
        this.showStatus('Microphone test successful! Audio detected.', 'success');
      } else {
        this.showStatus('Microphone test completed, but no audio detected.', 'info');
      }

    } catch (error) {
      console.error('Microphone test failed:', error);
      this.showStatus('Microphone test failed: ' + error.message, 'error');
    }
  }
}

// Initialize permission controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const permissionController = new PermissionController();
}); 