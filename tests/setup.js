// Test setup file for Voice Input Extension
// Configures Jest environment for testing Chrome extensions

// Mock Chrome extension APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`)
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    executeScript: jest.fn()
  },
  permissions: {
    query: jest.fn(),
    request: jest.fn(),
    contains: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Mock Web Speech API
global.SpeechRecognition = jest.fn().mockImplementation(() => ({
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null
}));

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock MediaDevices API
global.navigator.mediaDevices = {
  getUserMedia: jest.fn()
};

// Mock Permissions API
global.navigator.permissions = {
  query: jest.fn()
};

// Mock window.postMessage
global.window.postMessage = jest.fn();

// Mock document methods
global.document.addEventListener = jest.fn();
global.document.removeEventListener = jest.fn();
global.document.getElementById = jest.fn();
global.document.querySelector = jest.fn();
global.document.querySelectorAll = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Helper function to reset all mocks
global.resetMocks = () => {
  jest.clearAllMocks();
  global.chrome.runtime.sendMessage.mockClear();
  global.chrome.storage.sync.get.mockClear();
  global.chrome.storage.sync.set.mockClear();
  global.chrome.tabs.query.mockClear();
  global.chrome.tabs.sendMessage.mockClear();
  global.navigator.mediaDevices.getUserMedia.mockClear();
  global.navigator.permissions.query.mockClear();
  global.window.postMessage.mockClear();
};

// Helper function to create mock DOM elements
global.createMockElement = (tagName = 'input', attributes = {}) => {
  const element = {
    tagName: tagName.toUpperCase(),
    type: attributes.type || 'text',
    value: attributes.value || '',
    id: attributes.id || '',
    className: attributes.className || '',
    contentEditable: attributes.contentEditable || false,
    role: attributes.role || '',
    selectionStart: 0,
    selectionEnd: 0,
    focus: jest.fn(),
    blur: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    getAttribute: jest.fn((attr) => attributes[attr]),
    setAttribute: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
      top: 0,
      left: 0,
      bottom: 20,
      right: 100,
      width: 100,
      height: 20
    }))
  };

  return element;
};

// Helper function to create mock event
global.createMockEvent = (type, target = null) => ({
  type,
  target,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  bubbles: true,
  cancelable: true
});

// Helper function to create mock speech recognition result
global.createMockSpeechResult = (transcript, isFinal = true) => ({
  transcript,
  confidence: 0.9,
  isFinal
});

// Helper function to create mock speech recognition event
global.createMockSpeechEvent = (results = []) => ({
  resultIndex: 0,
  results: results.map((result, index) => [result, index])
});

// Set up test environment
beforeEach(() => {
  global.resetMocks();
});

afterEach(() => {
  jest.clearAllMocks();
}); 