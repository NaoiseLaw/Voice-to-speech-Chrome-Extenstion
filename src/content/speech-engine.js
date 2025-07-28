// Advanced Speech Recognition Engine
class AdvancedSpeechEngine {
    constructor(settings = {}) {
        this.settings = {
            language: 'en-US',
            continuous: false,
            interimResults: true,
            enableCommands: true,
            enablePunctuation: true,
            noiseSuppression: true,
            ...settings
        };
        
        this.commandGrammar = this.buildCommandGrammar();
        this.contextualProcessor = new ContextualProcessor();
        this.performanceOptimizer = new PerformanceOptimizer();
    }

    isSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    createRecognition(settings) {
        if (!this.isSupported()) {
            throw new Error('Speech recognition not supported in this browser');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        // Configure recognition settings
        recognition.continuous = settings.continuous || false;
        recognition.interimResults = settings.interimResults !== false;
        recognition.lang = settings.language || 'en-US';
        recognition.maxAlternatives = 1;

        // Apply performance optimizations
        if (settings.noiseSuppression !== false) {
            this.performanceOptimizer.applyAudioConstraints(recognition);
        }

        return recognition;
    }

    buildCommandGrammar() {
        return {
            punctuation: {
                'period': '.',
                'full stop': '.',
                'dot': '.',
                'question mark': '?',
                'exclamation mark': '!',
                'exclamation point': '!',
                'comma': ',',
                'semicolon': ';',
                'colon': ':',
                'hyphen': '-',
                'dash': '-',
                'underscore': '_',
                'at sign': '@',
                'at': '@',
                'hash': '#',
                'pound': '#',
                'dollar sign': '$',
                'dollar': '$',
                'percent': '%',
                'ampersand': '&',
                'and': '&',
                'asterisk': '*',
                'star': '*',
                'plus': '+',
                'equals': '=',
                'slash': '/',
                'backslash': '\\',
                'pipe': '|',
                'tilde': '~',
                'backtick': '`',
                'single quote': "'",
                'double quote': '"',
                'quote': '"',
                'quotes': '"',
                'open parenthesis': '(',
                'close parenthesis': ')',
                'open bracket': '[',
                'close bracket': ']',
                'open brace': '{',
                'close brace': '}',
                'less than': '<',
                'greater than': '>',
                'left arrow': '<',
                'right arrow': '>'
            },
            formatting: {
                'new line': '\n',
                'new paragraph': '\n\n',
                'tab': '\t',
                'space': ' ',
                'double space': '  ',
                'capitalize': 'CAPITALIZE',
                'uppercase': 'UPPERCASE',
                'lowercase': 'lowercase',
                'title case': 'TITLE_CASE',
                'bold': 'BOLD',
                'italic': 'ITALIC',
                'underline': 'UNDERLINE'
            },
            navigation: {
                'next field': 'NEXT_FIELD',
                'previous field': 'PREVIOUS_FIELD',
                'select all': 'SELECT_ALL',
                'select word': 'SELECT_WORD',
                'select line': 'SELECT_LINE',
                'go to start': 'GO_TO_START',
                'go to end': 'GO_TO_END',
                'go to beginning': 'GO_TO_START',
                'move cursor left': 'MOVE_LEFT',
                'move cursor right': 'MOVE_RIGHT',
                'move cursor up': 'MOVE_UP',
                'move cursor down': 'MOVE_DOWN'
            },
            editing: {
                'undo': 'UNDO',
                'redo': 'REDO',
                'cut': 'CUT',
                'copy': 'COPY',
                'paste': 'PASTE',
                'delete': 'DELETE',
                'delete word': 'DELETE_WORD',
                'delete line': 'DELETE_LINE',
                'delete character': 'DELETE_CHAR',
                'backspace': 'BACKSPACE',
                'clear': 'CLEAR',
                'clear all': 'CLEAR_ALL'
            },
            text_manipulation: {
                'find': 'FIND',
                'find and replace': 'FIND_REPLACE',
                'replace': 'REPLACE',
                'replace all': 'REPLACE_ALL',
                'duplicate line': 'DUPLICATE_LINE',
                'move line up': 'MOVE_LINE_UP',
                'move line down': 'MOVE_LINE_DOWN',
                'indent': 'INDENT',
                'outdent': 'OUTDENT',
                'comment': 'COMMENT',
                'uncomment': 'UNCOMMENT'
            },
            special_commands: {
                'stop listening': 'STOP_LISTENING',
                'pause': 'PAUSE',
                'resume': 'RESUME',
                'clear transcript': 'CLEAR_TRANSCRIPT',
                'save': 'SAVE',
                'submit': 'SUBMIT',
                'enter': 'ENTER',
                'tab': 'TAB',
                'escape': 'ESCAPE',
                'space': 'SPACE'
            },
            formatting_commands: {
                'make bold': 'BOLD',
                'make italic': 'ITALIC',
                'make underline': 'UNDERLINE',
                'make uppercase': 'UPPERCASE',
                'make lowercase': 'lowercase',
                'capitalize first letter': 'CAPITALIZE_FIRST',
                'title case': 'TITLE_CASE',
                'sentence case': 'SENTENCE_CASE'
            }
        };
    }

    processTranscript(rawText, confidence = 1) {
        if (!rawText || typeof rawText !== 'string') {
            return '';
        }

        let processedText = rawText.trim();

        // Apply commands first
        processedText = this.applyCommands(processedText);

        // Smart punctuation
        if (this.settings.enablePunctuation) {
            processedText = this.smartPunctuation(processedText);
        }

        // Contextual processing
        const fieldType = this.getCurrentFieldType();
        processedText = this.contextualProcessor.process(processedText, fieldType);

        // Smart capitalization
        processedText = this.smartCapitalization(processedText);

        return processedText;
    }

    applyCommands(text) {
        const lowerText = text.toLowerCase();
        let processedText = text;

        // Check for punctuation commands
        for (const [command, replacement] of Object.entries(this.commandGrammar.punctuation)) {
            const regex = new RegExp(`\\b${command}\\b`, 'gi');
            processedText = processedText.replace(regex, replacement);
        }

        // Check for formatting commands
        for (const [command, replacement] of Object.entries(this.commandGrammar.formatting)) {
            const regex = new RegExp(`\\b${command}\\b`, 'gi');
            processedText = processedText.replace(regex, replacement);
        }

        // Check for action commands
        for (const [command, action] of Object.entries(this.commandGrammar.actions)) {
            if (lowerText.includes(command)) {
                // Return a special marker for action commands
                return `__ACTION__${action}`;
            }
        }

        return processedText;
    }

    detectCommand(text) {
        const lowerText = text.toLowerCase();
        
        // Check if text contains any action commands
        for (const command of Object.keys(this.commandGrammar.actions)) {
            if (lowerText.includes(command)) {
                return true;
            }
        }
        
        return false;
    }

    smartPunctuation(text) {
        // Add periods at the end of sentences if missing
        if (text && !text.match(/[.!?]$/)) {
            // Check if it looks like a complete sentence
            const words = text.trim().split(' ');
            if (words.length > 3) {
                // Simple heuristic: if it's a longer phrase, add a period
                text += '.';
            }
        }

        // Add question marks for questions
        const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'whose', 'whom'];
        const lowerText = text.toLowerCase();
        if (questionWords.some(word => lowerText.includes(word)) && !text.includes('?')) {
            text += '?';
        }

        // Add exclamation marks for emphasis
        const emphasisWords = ['wow', 'amazing', 'incredible', 'fantastic', 'awesome', 'great'];
        if (emphasisWords.some(word => lowerText.includes(word)) && !text.includes('!')) {
            text += '!';
        }

        return text;
    }

    smartCapitalization(text) {
        if (!text) return text;

        // Capitalize first letter
        text = text.charAt(0).toUpperCase() + text.slice(1);

        // Capitalize 'I' when it's a pronoun
        text = text.replace(/\bi\b/g, 'I');

        // Capitalize after periods, exclamation marks, and question marks
        text = text.replace(/([.!?])\s+([a-z])/g, (match, punct, letter) => {
            return punct + ' ' + letter.toUpperCase();
        });

        // Capitalize proper nouns (simple heuristic)
        const properNouns = [
            'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
            'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
            'google', 'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'netflix', 'amazon', 'microsoft', 'apple'
        ];

        for (const noun of properNouns) {
            const regex = new RegExp(`\\b${noun}\\b`, 'gi');
            text = text.replace(regex, noun.charAt(0).toUpperCase() + noun.slice(1));
        }

        return text;
    }

    getCurrentFieldType() {
        const activeElement = document.activeElement;
        if (!activeElement) return 'general';

        const tagName = activeElement.tagName.toLowerCase();
        const type = activeElement.type || '';
        const name = activeElement.name || '';
        const id = activeElement.id || '';

        // Email fields
        if (type === 'email' || name.includes('email') || id.includes('email')) {
            return 'email';
        }

        // URL fields
        if (type === 'url' || name.includes('url') || id.includes('url') || name.includes('link')) {
            return 'url';
        }

        // Phone fields
        if (type === 'tel' || name.includes('phone') || name.includes('tel') || id.includes('phone')) {
            return 'phone';
        }

        // Number fields
        if (type === 'number' || type === 'range' || name.includes('number') || id.includes('number')) {
            return 'number';
        }

        // Password fields
        if (type === 'password') {
            return 'password';
        }

        return 'general';
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
}

// Contextual processing for different field types
class ContextualProcessor {
    process(text, fieldType) {
        switch (fieldType) {
            case 'email':
                return this.processEmail(text);
            case 'url':
                return this.processURL(text);
            case 'phone':
                return this.processPhone(text);
            case 'number':
                return this.processNumber(text);
            default:
                return text;
        }
    }

    processEmail(text) {
        // Convert spoken words to email format
        let processed = text.toLowerCase();
        
        // Replace common spoken patterns
        processed = processed.replace(/\bat\b/g, '@');
        processed = processed.replace(/\bdot\b/g, '.');
        processed = processed.replace(/\bunderscore\b/g, '_');
        processed = processed.replace(/\bhyphen\b/g, '-');
        processed = processed.replace(/\bdash\b/g, '-');
        
        // Remove extra spaces
        processed = processed.replace(/\s+/g, '');
        
        return processed;
    }

    processURL(text) {
        // Convert spoken words to URL format
        let processed = text.toLowerCase();
        
        // Replace common spoken patterns
        processed = processed.replace(/\bdot\b/g, '.');
        processed = processed.replace(/\bslash\b/g, '/');
        processed = processed.replace(/\bbackslash\b/g, '\\');
        processed = processed.replace(/\bunderscore\b/g, '_');
        processed = processed.replace(/\bhyphen\b/g, '-');
        processed = processed.replace(/\bdash\b/g, '-');
        
        // Add protocol if missing
        if (!processed.startsWith('http://') && !processed.startsWith('https://')) {
            processed = 'https://' + processed;
        }
        
        return processed;
    }

    processPhone(text) {
        // Convert spoken words to phone number format
        let processed = text.toLowerCase();
        
        // Remove non-numeric words
        processed = processed.replace(/\b(phone|number|call|dial|contact)\b/g, '');
        
        // Convert number words to digits
        const numberWords = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
        };
        
        for (const [word, digit] of Object.entries(numberWords)) {
            processed = processed.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
        }
        
        // Remove all non-numeric characters except +, -, (, ), and spaces
        processed = processed.replace(/[^\d+\-()\s]/g, '');
        
        // Clean up extra spaces
        processed = processed.replace(/\s+/g, ' ').trim();
        
        return processed;
    }

    processNumber(text) {
        // Convert spoken words to number format
        let processed = text.toLowerCase();
        
        // Convert number words to digits
        const numberWords = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
            'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
            'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19',
            'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
            'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90',
            'hundred': '100', 'thousand': '1000', 'million': '1000000'
        };
        
        for (const [word, digit] of Object.entries(numberWords)) {
            processed = processed.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
        }
        
        // Handle compound numbers (e.g., "twenty five" -> "25")
        processed = processed.replace(/(\d+)\s+(\d+)/g, (match, num1, num2) => {
            return parseInt(num1) + parseInt(num2);
        });
        
        // Remove all non-numeric characters except decimal points
        processed = processed.replace(/[^\d.]/g, '');
        
        return processed;
    }
}

// Performance optimizer
class PerformanceOptimizer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.silenceTimer = null;
        this.sessionStartTime = null;
    }

    getAudioConstraints(settings) {
        return {
            echoCancellation: true,
            noiseSuppression: settings.noiseSuppression !== false,
            autoGainControl: true,
            sampleRate: 44100
        };
    }

    async initializeAudioProcessing(stream) {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Start silence detection
            this.startSilenceDetection(dataArray);
        } catch (error) {
            console.warn('Audio processing initialization failed:', error);
        }
    }

    startSilenceDetection(dataArray) {
        const checkSilence = () => {
            if (!this.analyser) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            if (average < 10) { // Threshold for silence
                if (!this.silenceTimer) {
                    this.silenceTimer = setTimeout(() => {
                        // Auto-stop recording after 3 seconds of silence
                        if (typeof voiceInputManager !== 'undefined') {
                            voiceInputManager.stopRecognition();
                        }
                    }, 3000);
                }
            } else {
                if (this.silenceTimer) {
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = null;
                }
            }
            
            requestAnimationFrame(checkSilence);
        };
        
        checkSilence();
    }

    startSession() {
        this.sessionStartTime = Date.now();
    }

    endSession() {
        if (this.sessionStartTime) {
            const duration = Date.now() - this.sessionStartTime;
            console.log(`Voice session duration: ${duration}ms`);
            this.sessionStartTime = null;
        }
    }

    cleanup() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.analyser = null;
    }
} 