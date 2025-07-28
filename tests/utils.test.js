// Unit tests for Voice Input Extension utilities
// Tests the utility functions in src/lib/utils.js

describe('VoiceInputUtils', () => {
  // Mock the utils module
  let VoiceInputUtils;

  beforeEach(() => {
    // Reset mocks
    global.resetMocks();
    
    // Import the utils module
    VoiceInputUtils = require('../src/lib/utils.js');
  });

  describe('Audio Constraints', () => {
    test('should return low quality constraints', () => {
      const constraints = VoiceInputUtils.getAudioConstraints('low');
      
      expect(constraints).toEqual({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        channelCount: 1
      });
    });

    test('should return medium quality constraints by default', () => {
      const constraints = VoiceInputUtils.getAudioConstraints();
      
      expect(constraints).toEqual({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      });
    });

    test('should return high quality constraints', () => {
      const constraints = VoiceInputUtils.getAudioConstraints('high');
      
      expect(constraints).toEqual({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2
      });
    });
  });

  describe('Text Processing', () => {
    test('should sanitize text correctly', () => {
      const input = '<script>alert("test")</script>Hello world';
      const result = VoiceInputUtils.sanitizeText(input);
      
      expect(result).toBe('scriptalert("test")/scriptHello world');
    });

    test('should handle null and undefined input', () => {
      expect(VoiceInputUtils.sanitizeText(null)).toBe('');
      expect(VoiceInputUtils.sanitizeText(undefined)).toBe('');
      expect(VoiceInputUtils.sanitizeText('')).toBe('');
    });

    test('should format text with options', () => {
      const input = 'hello world';
      const result = VoiceInputUtils.formatText(input, {
        capitalizeFirst: true,
        addPunctuation: true
      });
      
      expect(result).toBe('Hello world.');
    });

    test('should not add punctuation if already present', () => {
      const input = 'Hello world!';
      const result = VoiceInputUtils.formatText(input, {
        addPunctuation: true
      });
      
      expect(result).toBe('Hello world!');
    });
  });

  describe('DOM Utilities', () => {
    test('should identify input elements correctly', () => {
      const textInput = global.createMockElement('input', { type: 'text' });
      const textarea = global.createMockElement('textarea');
      const contentEditable = global.createMockElement('div', { contentEditable: 'true' });
      const button = global.createMockElement('button');
      
      expect(VoiceInputUtils.isInputElement(textInput)).toBe(true);
      expect(VoiceInputUtils.isInputElement(textarea)).toBe(true);
      expect(VoiceInputUtils.isInputElement(contentEditable)).toBe(true);
      expect(VoiceInputUtils.isInputElement(button)).toBe(false);
    });

    test('should handle null element', () => {
      expect(VoiceInputUtils.isInputElement(null)).toBe(false);
    });

    test('should insert text at cursor position', () => {
      const input = global.createMockElement('input', { value: 'Hello' });
      input.selectionStart = 5;
      input.selectionEnd = 5;
      
      const result = VoiceInputUtils.insertTextAtCursor(input, ' world');
      
      expect(result).toBe(true);
      expect(input.value).toBe('Hello world');
      expect(input.dispatchEvent).toHaveBeenCalledTimes(2);
    });

    test('should handle contentEditable elements', () => {
      const contentEditable = global.createMockElement('div', { contentEditable: 'true' });
      
      // Mock window.getSelection
      global.window.getSelection = jest.fn(() => ({
        rangeCount: 1,
        getRangeAt: jest.fn(() => ({
          deleteContents: jest.fn(),
          insertNode: jest.fn(),
          collapse: jest.fn()
        })),
        removeAllRanges: jest.fn(),
        addRange: jest.fn()
      }));
      
      const result = VoiceInputUtils.insertTextAtCursor(contentEditable, 'test');
      
      expect(result).toBe(true);
    });
  });

  describe('Storage Utilities', () => {
    test('should get storage data', async () => {
      const mockData = { language: 'en-US' };
      global.chrome.storage.sync.get.mockResolvedValue(mockData);
      
      const result = await VoiceInputUtils.getStorageData(['language']);
      
      expect(result).toEqual(mockData);
      expect(global.chrome.storage.sync.get).toHaveBeenCalledWith(['language']);
    });

    test('should handle storage errors', async () => {
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const result = await VoiceInputUtils.getStorageData(['language']);
      
      expect(result).toEqual({});
    });

    test('should set storage data', async () => {
      global.chrome.storage.sync.set.mockResolvedValue();
      
      const result = await VoiceInputUtils.setStorageData({ language: 'en-US' });
      
      expect(result).toBe(true);
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({ language: 'en-US' });
    });
  });

  describe('Messaging Utilities', () => {
    test('should send message to runtime', async () => {
      const mockResponse = { success: true };
      global.chrome.runtime.sendMessage.mockResolvedValue(mockResponse);
      
      const result = await VoiceInputUtils.sendMessage({ type: 'TEST' });
      
      expect(result).toEqual(mockResponse);
      expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TEST' });
    });

    test('should send message to tab', async () => {
      const mockResponse = { success: true };
      global.chrome.tabs.sendMessage.mockResolvedValue(mockResponse);
      
      const result = await VoiceInputUtils.sendMessageToTab(1, { type: 'TEST' });
      
      expect(result).toEqual(mockResponse);
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'TEST' });
    });
  });

  describe('Permission Utilities', () => {
    test('should check microphone permission', async () => {
      global.navigator.permissions.query.mockResolvedValue({ state: 'granted' });
      
      const result = await VoiceInputUtils.checkMicrophonePermission();
      
      expect(result).toBe('granted');
    });

    test('should request microphone permission', async () => {
      const mockStream = {
        getTracks: () => [{ stop: jest.fn() }]
      };
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      
      const result = await VoiceInputUtils.requestMicrophonePermission();
      
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should get error message for NotAllowedError', () => {
      const error = { name: 'NotAllowedError', message: 'Permission denied' };
      const result = VoiceInputUtils.getErrorMessage(error);
      
      expect(result).toBe('Microphone access was denied');
    });

    test('should get error message for string error', () => {
      const result = VoiceInputUtils.getErrorMessage('Test error');
      
      expect(result).toBe('Test error');
    });

    test('should get generic error message for unknown error', () => {
      const error = { name: 'UnknownError' };
      const result = VoiceInputUtils.getErrorMessage(error);
      
      expect(result).toBe('An unknown error occurred');
    });
  });

  describe('Performance Utilities', () => {
    test('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = VoiceInputUtils.debounce(() => {
        callCount++;
        expect(callCount).toBe(1);
        done();
      }, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
    });

    test('should throttle function calls', (done) => {
      let callCount = 0;
      const throttledFn = VoiceInputUtils.throttle(() => {
        callCount++;
      }, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });
  });

  describe('Validation', () => {
    test('should validate settings correctly', () => {
      const validSettings = {
        language: 'en-US',
        maxAlternatives: 2,
        dataRetention: 7
      };
      
      const errors = VoiceInputUtils.validateSettings(validSettings);
      
      expect(errors).toHaveLength(0);
    });

    test('should detect invalid language format', () => {
      const invalidSettings = {
        language: 'invalid',
        maxAlternatives: 2,
        dataRetention: 7
      };
      
      const errors = VoiceInputUtils.validateSettings(invalidSettings);
      
      expect(errors).toContain('Invalid language format');
    });

    test('should detect invalid maxAlternatives', () => {
      const invalidSettings = {
        language: 'en-US',
        maxAlternatives: 5,
        dataRetention: 7
      };
      
      const errors = VoiceInputUtils.validateSettings(invalidSettings);
      
      expect(errors).toContain('Maximum alternatives must be between 1 and 3');
    });
  });

  describe('Browser Detection', () => {
    test('should detect Chrome browser', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      });
      
      const result = VoiceInputUtils.getBrowserInfo();
      
      expect(result.name).toBe('Chrome');
      expect(result.version).toBe('91');
    });

    test('should detect Firefox browser', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        configurable: true
      });
      
      const result = VoiceInputUtils.getBrowserInfo();
      
      expect(result.name).toBe('Firefox');
      expect(result.version).toBe('89');
    });
  });

  describe('Feature Detection', () => {
    test('should detect speech recognition support', () => {
      const result = VoiceInputUtils.supportsSpeechRecognition();
      
      expect(result).toBe(true);
    });

    test('should detect media devices support', () => {
      const result = VoiceInputUtils.supportsMediaDevices();
      
      expect(result).toBe(true);
    });

    test('should detect permissions support', () => {
      const result = VoiceInputUtils.supportsPermissions();
      
      expect(result).toBe(true);
    });
  });

  describe('Logging', () => {
    test('should log messages correctly', () => {
      VoiceInputUtils.log('info', 'Test message', { data: 'test' });
      
      expect(global.console.info).toHaveBeenCalled();
    });

    test('should store logs', () => {
      VoiceInputUtils.log('error', 'Test error');
      
      const logs = VoiceInputUtils.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('Test error');
    });

    test('should clear logs', () => {
      VoiceInputUtils.log('info', 'Test message');
      VoiceInputUtils.clearLogs();
      
      const logs = VoiceInputUtils.getLogs();
      
      expect(logs).toHaveLength(0);
    });
  });
}); 