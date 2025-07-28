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
            this.setupUnloadHandler();
            
            console.log('Voice Input Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Voice Input Manager:', error);
            // Try to recover from initialization errors
            this.handleInitError(error);
        }
    }

    handleInitError(error) {
        console.error('Initialization error:', error);
        
        // Try to set up basic functionality even if some components fail
        try {
            this.setupMessageListeners();
            this.setupPageListeners();
            this.setupUnloadHandler();
            
            console.log('Basic functionality initialized despite errors');
        } catch (recoveryError) {
            console.error('Failed to recover from initialization error:', recoveryError);
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
        if (!this.recognition) {
            this.initializeSpeechRecognition();
        }

        if (this.isRecording) return;

        try {
            // Check microphone permission
            const hasPermission = await this.checkMicrophonePermission();
            if (!hasPermission) {
                this.widget.showError('Microphone permission denied');
                return;
            }

            this.shouldRestart = true;
            this.recognition.start();

            // Start performance monitoring
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: this.performanceOptimizer.getAudioConstraints(this.settings) 
            });
            this.performanceOptimizer.initializeAudioProcessing(stream);

        } catch (error) {
            console.error('Failed to start recognition:', error);
            
            // Retry logic with exponential backoff
            if (retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                console.log(`Retrying recognition in ${delay}ms (attempt ${retryCount + 1}/3)`);
                
                setTimeout(() => {
                    this.startRecognition(retryCount + 1);
                }, delay);
            } else {
                this.widget.showError('Failed to start voice recognition after multiple attempts');
                this.handleRecognitionError({ error: 'max_retries_exceeded' });
            }
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
        switch (command.action) {
            // Basic editing
            case 'undo':
                document.execCommand('undo');
                break;
            case 'redo':
                document.execCommand('redo');
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
            case 'delete':
                document.execCommand('delete');
                break;
            case 'backspace':
                document.execCommand('backspace');
                break;
            case 'clear':
            case 'clear_all':
                if (this.activeElement) {
                    this.activeElement.value = '';
                    this.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
                break;

            // Selection commands
            case 'select_all':
                if (this.activeElement) {
                    this.activeElement.select();
                }
                break;
            case 'select_word':
                // Select current word
                if (this.activeElement && this.activeElement.setSelectionRange) {
                    const value = this.activeElement.value;
                    const cursorPos = this.activeElement.selectionStart;
                    const wordStart = value.lastIndexOf(' ', cursorPos - 1) + 1;
                    const wordEnd = value.indexOf(' ', cursorPos);
                    const end = wordEnd === -1 ? value.length : wordEnd;
                    this.activeElement.setSelectionRange(wordStart, end);
                }
                break;
            case 'select_line':
                // Select current line
                if (this.activeElement && this.activeElement.setSelectionRange) {
                    const value = this.activeElement.value;
                    const cursorPos = this.activeElement.selectionStart;
                    const lineStart = value.lastIndexOf('\n', cursorPos - 1) + 1;
                    const lineEnd = value.indexOf('\n', cursorPos);
                    const end = lineEnd === -1 ? value.length : lineEnd;
                    this.activeElement.setSelectionRange(lineStart, end);
                }
                break;

            // Navigation commands
            case 'next_field':
                this.focusNextField();
                break;
            case 'previous_field':
                this.focusPreviousField();
                break;
            case 'go_to_start':
                if (this.activeElement && this.activeElement.setSelectionRange) {
                    this.activeElement.setSelectionRange(0, 0);
                }
                break;
            case 'go_to_end':
                if (this.activeElement && this.activeElement.setSelectionRange) {
                    const length = this.activeElement.value.length;
                    this.activeElement.setSelectionRange(length, length);
                }
                break;

            // Text manipulation
            case 'delete_word':
                if (this.activeElement) {
                    const value = this.activeElement.value;
                    const cursorPos = this.activeElement.selectionStart;
                    const wordStart = value.lastIndexOf(' ', cursorPos - 1) + 1;
                    const newValue = value.substring(0, wordStart) + value.substring(cursorPos);
                    this.activeElement.value = newValue;
                    this.activeElement.setSelectionRange(wordStart, wordStart);
                    this.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
                break;
            case 'delete_line':
                if (this.activeElement) {
                    const value = this.activeElement.value;
                    const cursorPos = this.activeElement.selectionStart;
                    const lineStart = value.lastIndexOf('\n', cursorPos - 1) + 1;
                    const lineEnd = value.indexOf('\n', cursorPos);
                    const end = lineEnd === -1 ? value.length : lineEnd;
                    const newValue = value.substring(0, lineStart) + value.substring(end);
                    this.activeElement.value = newValue;
                    this.activeElement.setSelectionRange(lineStart, lineStart);
                    this.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
                break;

            // Special commands
            case 'stop_listening':
                this.stopRecognition();
                break;
            case 'pause':
                this.stopRecognition();
                break;
            case 'resume':
                this.startRecognition();
                break;
            case 'clear_transcript':
                this.currentTranscript = '';
                if (this.widget) {
                    this.widget.clearTranscript();
                }
                break;
            case 'save':
                // Trigger save event
                if (this.activeElement) {
                    this.activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
                break;
            case 'submit':
                // Find and submit the closest form
                if (this.activeElement) {
                    const form = this.activeElement.closest('form');
                    if (form) {
                        form.dispatchEvent(new Event('submit', { bubbles: true }));
                    }
                }
                break;
            case 'enter':
                if (this.activeElement) {
                    this.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                }
                break;
            case 'tab':
                if (this.activeElement) {
                    this.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
                }
                break;
            case 'escape':
                if (this.activeElement) {
                    this.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                }
                break;
            case 'space':
                if (this.activeElement) {
                    this.insertTextAtCursor(this.activeElement, ' ');
                }
                break;

            // Formatting commands
            case 'bold':
                document.execCommand('bold');
                break;
            case 'italic':
                document.execCommand('italic');
                break;
            case 'underline':
                document.execCommand('underline');
                break;
            case 'uppercase':
                if (this.activeElement) {
                    const selection = window.getSelection();
                    if (selection.toString()) {
                        const range = selection.getRangeAt(0);
                        const text = range.toString().toUpperCase();
                        range.deleteContents();
                        range.insertNode(document.createTextNode(text));
                    }
                }
                break;
            case 'lowercase':
                if (this.activeElement) {
                    const selection = window.getSelection();
                    if (selection.toString()) {
                        const range = selection.getRangeAt(0);
                        const text = range.toString().toLowerCase();
                        range.deleteContents();
                        range.insertNode(document.createTextNode(text));
                    }
                }
                break;
            case 'capitalize_first':
                if (this.activeElement) {
                    const selection = window.getSelection();
                    if (selection.toString()) {
                        const range = selection.getRangeAt(0);
                        const text = range.toString();
                        const capitalized = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
                        range.deleteContents();
                        range.insertNode(document.createTextNode(capitalized));
                    }
                }
                break;
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
        console.error('Recognition error:', event);
        
        let errorMessage = 'Voice recognition error';
        let shouldRetry = false;
        
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected';
                shouldRetry = true;
                break;
            case 'audio-capture':
                errorMessage = 'Microphone not available';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied';
                break;
            case 'network':
                errorMessage = 'Network error';
                shouldRetry = true;
                break;
            case 'aborted':
                errorMessage = 'Recognition aborted';
                break;
            case 'service-not-allowed':
                errorMessage = 'Speech recognition service not available';
                break;
            case 'bad-grammar':
                errorMessage = 'Grammar error';
                break;
            case 'language-not-supported':
                errorMessage = 'Language not supported';
                break;
            case 'max_retries_exceeded':
                errorMessage = 'Failed to start after multiple attempts';
                break;
        }
        
        this.widget.showError(errorMessage);
        
        // Retry for certain errors
        if (shouldRetry && this.settings.continuousMode) {
            setTimeout(() => {
                if (this.shouldRestart) {
                    this.startRecognition();
                }
            }, 2000);
        }
        
        chrome.runtime.sendMessage({
            type: 'VOICE_ERROR',
            error: { message: errorMessage }
        });
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
        try {
            // Stop recognition if active
            if (this.recognition && this.isRecording) {
                this.recognition.stop();
            }

            // Clean up event listeners
            this.messageListeners.forEach((listener, type) => {
                if (type === 'runtime') {
                    chrome.runtime.onMessage.removeListener(listener);
                } else {
                    document.removeEventListener(type, listener, true);
                }
            });
            this.messageListeners.clear();

            this.pageListeners.forEach((listener, type) => {
                document.removeEventListener(type, listener, true);
            });
            this.pageListeners.clear();

            // Clean up widget
            if (this.widget) {
                this.widget.destroy();
                this.widget = null;
            }

            // Clean up speech engine
            if (this.speechEngine) {
                this.speechEngine.cleanup();
                this.speechEngine = null;
            }

            // Clean up performance optimizer
            if (this.performanceOptimizer) {
                this.performanceOptimizer.cleanup();
                this.performanceOptimizer = null;
            }

            // Clear references
            this.recognition = null;
            this.activeElement = null;
            this.currentTranscript = '';

            console.log('Voice Input Manager cleaned up successfully');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    // Add window unload handler
    setupUnloadHandler() {
        const unloadHandler = () => {
            this.cleanup();
        };

        window.addEventListener('unload', unloadHandler);
        this.pageListeners.set('unload', unloadHandler);
    }
}

// Initialize voice input manager
const voiceInputManager = new VoiceInputManager();
voiceInputManager.init();

// Cleanup on page unload
window.addEventListener('unload', () => {
    voiceInputManager.cleanup();
}); 