// Enhanced Content Script with Floating Widget
class VoiceInputManager {
    constructor() {
        this.isRecording = false;
        this.recognition = null;
        this.currentTranscript = '';
        this.settings = {};
        this.widget = null;
        this.speechEngine = null;
        this.performanceOptimizer = null;
        this.messageListeners = new Map();
        this.pageListeners = new Map();
        this.activeElement = null;
    }

    async init() {
        try {
            await this.loadSettings();
            this.initializeComponents();
            this.setupMessageListeners();
            this.setupPageListeners();
            
            console.log('Voice Input Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Voice Input Manager:', error);
        }
    }

    initializeComponents() {
        // Initialize floating widget
        this.widget = new FloatingVoiceWidget();
        this.widget.create();

        // Initialize speech engine
        this.speechEngine = new AdvancedSpeechEngine(this.settings);

        // Initialize performance optimizer
        this.performanceOptimizer = new PerformanceOptimizer();
    }

    setupMessageListeners() {
        const messageHandler = (message, sender, sendResponse) => {
            this.handleMessage(message);
            sendResponse({ success: true });
        };

        chrome.runtime.onMessage.addListener(messageHandler);
        this.messageListeners.set('runtime', messageHandler);
    }

    setupPageListeners() {
        // Track active element
        const focusHandler = (event) => {
            this.activeElement = event.target;
            if (this.isInputElement(this.activeElement)) {
                this.widget.showNearElement(this.activeElement);
            }
        };

        const clickHandler = (event) => {
            if (this.isInputElement(event.target)) {
                this.activeElement = event.target;
                this.widget.showNearElement(event.target);
            }
        };

        const focusoutHandler = () => {
            // Keep widget visible but don't track element
        };

        document.addEventListener('focusin', focusHandler);
        document.addEventListener('click', clickHandler);
        document.addEventListener('focusout', focusoutHandler);

        this.pageListeners.set('focusin', focusHandler);
        this.pageListeners.set('click', clickHandler);
        this.pageListeners.set('focusout', focusoutHandler);
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'language', 'autoInsert', 'continuousMode', 'enableCommands',
                'enablePunctuation', 'noiseSuppression'
            ]);

            this.settings = {
                language: result.language || 'en-US',
                autoInsert: result.autoInsert || false,
                continuousMode: result.continuousMode || false,
                enableCommands: result.enableCommands !== false,
                enablePunctuation: result.enablePunctuation !== false,
                noiseSuppression: result.noiseSuppression !== false
            };

            if (this.speechEngine) {
                this.speechEngine.updateSettings(this.settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    initializeSpeechRecognition() {
        if (this.recognition) return;

        try {
            this.recognition = this.speechEngine.createRecognition(this.settings);
            this.setupRecognitionHandlers();
        } catch (error) {
            console.error('Failed to initialize speech recognition:', error);
            throw error;
        }
    }

    setupRecognitionHandlers() {
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.widget.setRecordingState(true);
            this.performanceOptimizer.startSession();
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.widget.setRecordingState(false);
            this.performanceOptimizer.endSession();
        };

        this.recognition.onresult = (event) => {
            this.handleRecognitionResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleRecognitionError(event);
        };
    }

    handleMessage(message) {
        switch (message.action) {
            case 'START_VOICE_RECOGNITION':
                this.startRecognition();
                break;
            case 'STOP_VOICE_RECOGNITION':
                this.stopRecognition();
                break;
            case 'INSERT_TEXT':
                this.insertText(message.data.text);
                break;
            case 'SETTINGS_UPDATED':
                this.updateSettings(message.settings);
                break;
            case 'TEST_CLEANUP':
                this.cleanup();
                break;
        }
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecognition();
        } else {
            this.startRecognition();
        }
    }

    async startRecognition(retryCount = 0) {
        try {
            // Check microphone permission
            const hasPermission = await this.checkMicrophonePermission();
            if (!hasPermission) {
                throw new Error('Microphone permission denied');
            }

            // Initialize recognition if needed
            if (!this.recognition) {
                this.initializeSpeechRecognition();
            }

            // Start performance monitoring
            this.performanceOptimizer.startSession();

            // Start recognition
            this.recognition.start();
            
            console.log('Voice recognition started');
        } catch (error) {
            console.error('Failed to start recognition:', error);
            
            // Retry logic for permission issues
            if (error.name === 'NotAllowedError' && retryCount < 3) {
                console.log(`Retrying recognition (${retryCount + 1}/3)...`);
                setTimeout(() => {
                    this.startRecognition(retryCount + 1);
                }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
                return;
            }

            this.widget.showError(error.message);
            this.sendMessageToPopup('VOICE_ERROR', { error: error.message });
        }
    }

    stopRecognition() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            this.widget.setRecordingState(false);
            console.log('Voice recognition stopped');
        }
    }

    handleRecognitionResult(event) {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        const isFinal = result.isFinal;

        if (isFinal) {
            this.handleFinalTranscript(transcript);
        } else {
            this.widget.showInterimTranscript(transcript);
            this.sendMessageToPopup('INTERIM_RESULT', { text: transcript });
        }
    }

    handleFinalTranscript(text) {
        // Process transcript through speech engine
        const processedText = this.speechEngine.processTranscript(text);
        
        // Check for voice commands
        if (this.settings.enableCommands && this.speechEngine.detectCommand(processedText)) {
            this.executeCommand(processedText);
            return;
        }

        // Show final transcript
        this.currentTranscript = processedText;
        this.widget.showTranscript(processedText);
        this.sendMessageToPopup('VOICE_RESULT', { text: processedText });

        // Auto-insert if enabled
        if (this.settings.autoInsert) {
            this.insertText(processedText);
        }
    }

    executeCommand(command) {
        const commandMap = {
            'undo': () => document.execCommand('undo'),
            'redo': () => document.execCommand('redo'),
            'select all': () => document.execCommand('selectAll'),
            'delete word': () => {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const text = range.toString();
                    const words = text.split(' ');
                    if (words.length > 1) {
                        words.pop();
                        range.deleteContents();
                        range.insertNode(document.createTextNode(words.join(' ')));
                    }
                }
            },
            'next field': () => this.focusNextField(),
            'previous field': () => this.focusPreviousField()
        };

        const commandLower = command.toLowerCase();
        for (const [cmd, action] of Object.entries(commandMap)) {
            if (commandLower.includes(cmd)) {
                action();
                this.widget.showTranscript(`Command executed: ${cmd}`);
                break;
            }
        }
    }

    focusNextField() {
        const inputElements = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        const currentIndex = Array.from(inputElements).indexOf(this.activeElement);
        const nextIndex = (currentIndex + 1) % inputElements.length;
        inputElements[nextIndex].focus();
    }

    focusPreviousField() {
        const inputElements = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        const currentIndex = Array.from(inputElements).indexOf(this.activeElement);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : inputElements.length - 1;
        inputElements[prevIndex].focus();
    }

    handleRecognitionError(event) {
        console.error('Recognition error:', event.error);
        this.widget.showError(`Recognition error: ${event.error}`);
        this.sendMessageToPopup('VOICE_ERROR', { error: event.error });
    }

    insertText(text) {
        if (!text) return;

        try {
            const element = this.activeElement || document.activeElement;
            
            if (this.isInputElement(element)) {
                this.insertTextAtCursor(element, text);
                this.sendMessageToPopup('TEXT_INSERTED', { success: true });
            } else {
                throw new Error('No active input element');
            }
        } catch (error) {
            console.error('Failed to insert text:', error);
            this.sendMessageToPopup('INSERT_ERROR', { error: error.message });
        }
    }

    insertTextAtCursor(element, text) {
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
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            // Handle input/textarea elements
            const start = element.selectionStart;
            const end = element.selectionEnd;
            const value = element.value;
            
            element.value = value.substring(0, start) + text + value.substring(end);
            element.selectionStart = element.selectionEnd = start + text.length;
            
            // Trigger input event for frameworks
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Trigger focus to ensure element is active
        element.focus();
    }

    isInputElement(element) {
        if (!element) return false;

        // Standard input elements
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            return true;
        }

        // ContentEditable elements
        if (element.contentEditable === 'true') {
            return true;
        }

        // Rich text editors
        const richEditors = [
            '[data-lexical-editor]', // Lexical
            '.ProseMirror', // ProseMirror
            '.ql-editor', // Quill
            'trix-editor', // Trix
            '.medium-editor-element', // Medium Editor
            '.DraftEditor-root', // Draft.js
            '.ck-editor__editable', // CKEditor
            '.tox-edit-area', // TinyMCE
            '.wysiwyg-editor', // Generic WYSIWYG
            '[role="textbox"]' // ARIA textbox
        ];

        return richEditors.some(selector => element.matches(selector));
    }

    getElementInfo(element) {
        if (!element) return null;

        return {
            tagName: element.tagName,
            type: element.type,
            contentEditable: element.contentEditable,
            role: element.getAttribute('role'),
            className: element.className,
            id: element.id,
            name: element.name
        };
    }

    async checkMicrophonePermission() {
        try {
            const permission = await navigator.permissions.query({ name: 'microphone' });
            return permission.state === 'granted';
        } catch (error) {
            console.error('Failed to check microphone permission:', error);
            return false;
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (this.speechEngine) {
            this.speechEngine.updateSettings(this.settings);
        }
    }

    sendMessageToPopup(action, data) {
        try {
            chrome.runtime.sendMessage({
                action,
                data
            });
        } catch (error) {
            console.error('Failed to send message to popup:', error);
        }
    }

    cleanup() {
        // Stop recognition
        if (this.recognition) {
            this.recognition.stop();
        }

        // Remove event listeners
        this.messageListeners.forEach((listener, type) => {
            if (type === 'runtime') {
                chrome.runtime.onMessage.removeListener(listener);
            }
        });

        this.pageListeners.forEach((listener, type) => {
            document.removeEventListener(type, listener);
        });

        // Destroy components
        if (this.widget) {
            this.widget.destroy();
        }

        if (this.performanceOptimizer) {
            this.performanceOptimizer.cleanup();
        }

        // Clear references
        this.recognition = null;
        this.widget = null;
        this.speechEngine = null;
        this.performanceOptimizer = null;
        this.messageListeners.clear();
        this.pageListeners.clear();
    }
}

// Initialize voice input manager
const voiceInputManager = new VoiceInputManager();
voiceInputManager.init();

// Cleanup on page unload
window.addEventListener('unload', () => {
    voiceInputManager.cleanup();
}); 