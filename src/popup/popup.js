// Enhanced Popup Controller with Advanced Features
class PopupController {
    constructor() {
        this.elements = {};
        this.isRecording = false;
        this.currentTranscript = '';
        this.settings = {};
        this.analytics = new AnalyticsTracker();
        this.haptic = new HapticFeedback();
        this.visualizer = null;
        this.continuousMode = false;
        this.pushToTalkTimer = null;
        this.isMobile = false;
    }

    async init() {
        try {
            this.getDOMElements();
            this.validateElements();
            await this.loadSettings();
            this.updateStatus();
            this.initializeVisualizer();
            this.initializeGestures();
            this.setupEventListeners();
            this.checkMobileDevice();
            this.initializeAccessibility();
            
            this.analytics.track('popup_opened');
        } catch (error) {
            console.error('Popup initialization failed:', error);
            this.showError('Failed to initialize popup');
        }
    }

    getDOMElements() {
        this.elements = {
            voiceBtn: document.getElementById('voiceBtn'),
            micIcon: document.getElementById('micIcon'),
            btnText: document.getElementById('btnText'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            transcript: document.getElementById('transcript'),
            infoText: document.getElementById('infoText'),
            insertBtn: document.getElementById('insertBtn'),
            copyBtn: document.getElementById('copyBtn'),
            clearBtn: document.getElementById('clearBtn'),
            language: document.getElementById('language'),
            autoInsert: document.getElementById('autoInsert'),
            continuousMode: document.getElementById('continuousMode'),
            settingsBtn: document.getElementById('settingsBtn'),
            helpBtn: document.getElementById('helpBtn'),
            voiceVisualizer: document.getElementById('voiceVisualizer'),
            announcer: document.getElementById('announcer')
        };
    }

    validateElements() {
        const requiredElements = [
            'voiceBtn', 'micIcon', 'btnText', 'statusDot', 'statusText',
            'transcript', 'infoText', 'insertBtn', 'copyBtn', 'clearBtn',
            'language', 'autoInsert', 'continuousMode', 'settingsBtn',
            'helpBtn', 'voiceVisualizer', 'announcer'
        ];

        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                throw new Error(`Required element not found: ${elementName}`);
            }
        }
    }

    setupEventListeners() {
        this.setupVoiceButton();
        this.setupActionButtons();
        this.setupSettingsControls();
        this.setupKeyboardShortcuts();
        
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
            sendResponse({ success: true });
        });
    }

    setupVoiceButton() {
        // Push-to-talk functionality
        const events = this.isMobile ? ['touchstart', 'touchend'] : ['mousedown', 'mouseup'];
        
        events.forEach(eventType => {
            this.elements.voiceBtn.addEventListener(eventType, (e) => {
                e.preventDefault();
                
                if (eventType.includes('start')) {
                    this.startPushToTalk();
                } else if (eventType.includes('end')) {
                    this.stopPushToTalk();
                }
            });
        });

        // Long press for continuous mode
        let longPressTimer;
        this.elements.voiceBtn.addEventListener('mousedown', () => {
            longPressTimer = setTimeout(() => {
                if (this.continuousMode) {
                    this.toggleVoiceInput();
                }
            }, 1000);
        });

        this.elements.voiceBtn.addEventListener('mouseup', () => {
            clearTimeout(longPressTimer);
        });

        // Ripple effect
        this.elements.voiceBtn.addEventListener('click', (e) => {
            this.addRippleEffect(e);
        });
    }

    setupActionButtons() {
        this.elements.insertBtn.addEventListener('click', () => {
            this.insertText();
            this.addRippleEffect(event);
        });

        this.elements.copyBtn.addEventListener('click', () => {
            this.copyText();
            this.addRippleEffect(event);
        });

        this.elements.clearBtn.addEventListener('click', () => {
            this.clearTranscript();
            this.addRippleEffect(event);
        });
    }

    setupSettingsControls() {
        this.elements.language.addEventListener('change', () => {
            this.saveSettings();
            this.analytics.track('language_changed', { language: this.elements.language.value });
        });

        this.elements.autoInsert.addEventListener('change', () => {
            this.saveSettings();
            this.analytics.track('auto_insert_toggled', { enabled: this.elements.autoInsert.checked });
        });

        this.elements.continuousMode.addEventListener('change', () => {
            this.continuousMode = this.elements.continuousMode.checked;
            this.saveSettings();
            this.updateVoiceButtonMode();
            this.analytics.track('continuous_mode_toggled', { enabled: this.continuousMode });
        });

        this.elements.settingsBtn.addEventListener('click', () => {
            this.openSettings();
        });

        this.elements.helpBtn.addEventListener('click', () => {
            this.showHelp();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'v':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.toggleVoiceInput();
                        }
                        break;
                    case 's':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.stopVoiceInput();
                        }
                        break;
                }
            }
        });
    }

    async startPushToTalk() {
        if (this.pushToTalkTimer) return;
        
        this.pushToTalkTimer = setTimeout(async () => {
            await this.startVoiceInput();
        }, 100);
    }

    async stopPushToTalk() {
        if (this.pushToTalkTimer) {
            clearTimeout(this.pushToTalkTimer);
            this.pushToTalkTimer = null;
        }
        
        if (this.isRecording) {
            await this.stopVoiceInput();
        }
    }

    async toggleVoiceInput() {
        if (this.isRecording) {
            await this.stopVoiceInput();
        } else {
            await this.startVoiceInput();
        }
    }

    async startVoiceInput() {
        try {
            this.isRecording = true;
            this.updateUI();
            this.startVisualizer();
            this.haptic.vibrate('short');
            
            this.analytics.track('voice_recording_started', {
                language: this.elements.language.value,
                continuous: this.continuousMode
            });

            await chrome.runtime.sendMessage({
                action: 'START_VOICE_INPUT',
                data: {
                    language: this.elements.language.value,
                    continuous: this.continuousMode
                }
            });

            this.announce('Voice recording started');
        } catch (error) {
            console.error('Failed to start voice input:', error);
            this.showError('Failed to start recording');
            this.isRecording = false;
            this.updateUI();
        }
    }

    async stopVoiceInput() {
        try {
            this.isRecording = false;
            this.updateUI();
            this.stopVisualizer();
            this.haptic.vibrate('short');
            
            this.analytics.track('voice_recording_stopped');

            await chrome.runtime.sendMessage({
                action: 'STOP_VOICE_INPUT'
            });

            this.announce('Voice recording stopped');
        } catch (error) {
            console.error('Failed to stop voice input:', error);
            this.showError('Failed to stop recording');
        }
    }

    updateUI() {
        const btn = this.elements.voiceBtn;
        const icon = this.elements.micIcon;
        const text = this.elements.btnText;
        const statusDot = this.elements.statusDot;
        const statusText = this.elements.statusText;

        if (this.isRecording) {
            btn.classList.add('recording');
            text.textContent = 'Recording...';
            statusDot.style.background = 'var(--error-color)';
            statusText.textContent = 'Listening';
            this.elements.infoText.textContent = 'Speak now...';
        } else {
            btn.classList.remove('recording');
            text.textContent = this.continuousMode ? 'Click to Toggle' : 'Hold to Talk';
            statusDot.style.background = 'var(--success-color)';
            statusText.textContent = 'Ready';
            this.elements.infoText.textContent = this.continuousMode ? 
                'Click to start/stop recording' : 'Click and hold to start recording';
        }
    }

    showTranscript(text, isFinal = true) {
        this.currentTranscript = text;
        this.elements.transcript.textContent = text;
        
        if (isFinal && this.elements.autoInsert.checked) {
            this.insertText();
        }

        this.enableActionButtons();
        
        if (isFinal) {
            this.analytics.track('transcript_received', { length: text.length });
        }
    }

    enableActionButtons() {
        this.elements.insertBtn.disabled = false;
        this.elements.copyBtn.disabled = false;
        this.elements.clearBtn.disabled = false;
        
        this.elements.insertBtn.classList.add('enabled');
        this.elements.copyBtn.classList.add('enabled');
        this.elements.clearBtn.classList.add('enabled');
    }

    disableActionButtons() {
        this.elements.insertBtn.disabled = true;
        this.elements.copyBtn.disabled = true;
        this.elements.clearBtn.disabled = true;
        
        this.elements.insertBtn.classList.remove('enabled');
        this.elements.copyBtn.classList.remove('enabled');
        this.elements.clearBtn.classList.remove('enabled');
    }

    async insertText() {
        try {
            if (!this.currentTranscript) return;

            await chrome.runtime.sendMessage({
                action: 'INSERT_TEXT',
                data: { text: this.currentTranscript }
            });

            this.showSuccess('Text inserted successfully');
            this.analytics.track('text_inserted', { length: this.currentTranscript.length });
        } catch (error) {
            console.error('Failed to insert text:', error);
            this.showError('Failed to insert text');
        }
    }

    async copyText() {
        try {
            if (!this.currentTranscript) return;

            await navigator.clipboard.writeText(this.currentTranscript);
            this.showSuccess('Text copied to clipboard');
            this.analytics.track('text_copied', { length: this.currentTranscript.length });
        } catch (error) {
            console.error('Failed to copy text:', error);
            this.showError('Failed to copy text');
        }
    }

    clearTranscript() {
        this.currentTranscript = '';
        this.elements.transcript.textContent = '';
        this.disableActionButtons();
        this.analytics.track('transcript_cleared');
    }

    addRippleEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        const rippleContainer = button.querySelector('.ripple-container');
        rippleContainer.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    initializeVisualizer() {
        this.visualizer = this.elements.voiceVisualizer;
        const ctx = this.visualizer.getContext('2d');
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
    }

    startVisualizer() {
        if (!this.visualizer) return;
        
        const ctx = this.visualizer.getContext('2d');
        let angle = 0;
        
        const animate = () => {
            if (!this.isRecording) return;
            
            ctx.clearRect(0, 0, this.visualizer.width, this.visualizer.height);
            
            // Simple sine wave animation
            for (let i = 0; i < 8; i++) {
                const x = this.visualizer.width / 2 + Math.cos(angle + i * 0.5) * 30;
                const y = this.visualizer.height / 2 + Math.sin(angle + i * 0.5) * 30;
                
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            angle += 0.1;
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    stopVisualizer() {
        if (this.visualizer) {
            const ctx = this.visualizer.getContext('2d');
            ctx.clearRect(0, 0, this.visualizer.width, this.visualizer.height);
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'language', 'autoInsert', 'continuousMode', 'theme'
            ]);
            
            this.settings = {
                language: result.language || 'en-US',
                autoInsert: result.autoInsert || false,
                continuousMode: result.continuousMode || false,
                theme: result.theme || 'light'
            };

            this.elements.language.value = this.settings.language;
            this.elements.autoInsert.checked = this.settings.autoInsert;
            this.elements.continuousMode.checked = this.settings.continuousMode;
            this.continuousMode = this.settings.continuousMode;
            
            this.updateVoiceButtonMode();
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                language: this.elements.language.value,
                autoInsert: this.elements.autoInsert.checked,
                continuousMode: this.elements.continuousMode.checked,
                theme: this.settings.theme
            };

            await chrome.storage.sync.set(settings);
            this.settings = settings;
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    updateVoiceButtonMode() {
        if (this.continuousMode) {
            this.elements.btnText.textContent = 'Click to Toggle';
            this.elements.infoText.textContent = 'Click to start/stop recording';
        } else {
            this.elements.btnText.textContent = 'Hold to Talk';
            this.elements.infoText.textContent = 'Click and hold to start recording';
        }
    }

    async updateStatus() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'GET_STATUS'
            });
            
            if (response && response.isRecording) {
                this.isRecording = true;
                this.updateUI();
            }
        } catch (error) {
            console.error('Failed to get status:', error);
        }
    }

    handleMessage(message) {
        switch (message.action) {
            case 'VOICE_RESULT':
                this.showTranscript(message.data.text, true);
                break;
            case 'INTERIM_RESULT':
                this.showTranscript(message.data.text, false);
                break;
            case 'VOICE_ERROR':
                this.showError(message.data.error);
                this.isRecording = false;
                this.updateUI();
                break;
            case 'TEXT_INSERTED':
                this.showSuccess('Text inserted successfully');
                break;
            case 'INSERT_ERROR':
                this.showError('Failed to insert text');
                break;
        }
    }

    showError(message, persistent = false) {
        this.elements.statusText.textContent = 'Error';
        this.elements.statusDot.style.background = 'var(--error-color)';
        
        if (!persistent) {
            setTimeout(() => {
                this.updateUI();
            }, 3000);
        }
        
        this.announce(`Error: ${message}`);
    }

    showSuccess(message) {
        this.elements.statusText.textContent = 'Success';
        this.elements.statusDot.style.background = 'var(--success-color)';
        
        setTimeout(() => {
            this.updateUI();
        }, 2000);
        
        this.announce(message);
    }

    initializeAccessibility() {
        // Focus trap
        const focusableElements = this.elements.voiceBtn.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }

    announce(message, priority = 'polite') {
        this.elements.announcer.textContent = message;
        this.elements.announcer.setAttribute('aria-live', priority);
    }

    checkMobileDevice() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            document.body.classList.add('mobile');
        }
    }

    setupMobileGestures() {
        if (!this.isMobile) return;
        
        let startY = 0;
        let currentY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = startY - currentY;
            
            if (diff > 50) {
                // Swipe up to expand
                document.body.classList.add('expanded');
            } else if (diff < -50) {
                // Swipe down to collapse
                document.body.classList.remove('expanded');
            }
        });
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    showHelp() {
        const helpText = `
Voice Input Pro Help:

• Hold the microphone button to record
• Use continuous mode for longer recordings
• Auto-insert automatically places text in active fields
• Keyboard shortcuts: Ctrl+Shift+V (toggle), Ctrl+Shift+S (stop)
• Voice commands: "undo", "redo", "select all", "delete word"
        `;
        
        alert(helpText);
    }

    handleResize() {
        // Handle popup resize if needed
        const height = window.innerHeight;
        if (height < 500) {
            document.body.classList.add('compact');
        } else {
            document.body.classList.remove('compact');
        }
    }
}

// Analytics tracking
class AnalyticsTracker {
    track(event, data = {}) {
        const eventData = {
            event,
            timestamp: Date.now(),
            ...data
        };
        
        console.log('Analytics:', eventData);
        
        // Store in local storage for debugging
        const analytics = JSON.parse(localStorage.getItem('voice_input_analytics') || '[]');
        analytics.push(eventData);
        localStorage.setItem('voice_input_analytics', JSON.stringify(analytics.slice(-100)));
    }
}

// Haptic feedback
class HapticFeedback {
    vibrate(type = 'short') {
        if ('vibrate' in navigator) {
            const patterns = {
                short: 50,
                long: 200,
                error: [50, 100, 50]
            };
            
            navigator.vibrate(patterns[type] || patterns.short);
        }
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    const popup = new PopupController();
    popup.init();
}); 