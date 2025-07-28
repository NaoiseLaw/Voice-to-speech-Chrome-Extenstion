// Floating Voice Widget Implementation
class FloatingVoiceWidget {
    constructor() {
        this.element = null;
        this.isRecording = false;
        this.isExpanded = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.position = { x: 20, y: 20 };
        this.visualizer = null;
        this.visualizerInterval = null;
    }

    create() {
        this.createHTML();
        this.injectStyles();
        this.setupInteractions();
        this.makeDraggable();
        this.loadPosition();
        this.checkVisibility();
    }

    createHTML() {
        this.element = document.createElement('div');
        this.element.id = 'voice-input-widget';
        this.element.className = 'voice-widget';
        this.element.innerHTML = `
            <div class="widget-main">
                <button class="widget-btn" id="widgetVoiceBtn" aria-label="Toggle voice recording">
                    <svg class="widget-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C13.1 2 14 2.9 14 4V8C14 9.1 13.1 10 12 10C10.9 10 10 9.1 10 8V4C10 2.9 10.9 2 12 2Z"/>
                        <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H7V12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12V10H19Z"/>
                    </svg>
                    <canvas class="widget-visualizer" width="40" height="40"></canvas>
                </button>
            </div>
            
            <div class="widget-menu" id="widgetMenu">
                <div class="menu-header">
                    <span class="menu-title">Voice Input</span>
                    <button class="menu-close" id="menuClose" aria-label="Close menu">×</button>
                </div>
                
                <div class="menu-content">
                    <div class="menu-section">
                        <label class="menu-label">Language:</label>
                        <select class="menu-select" id="widgetLanguage">
                            <option value="en-US">English (US)</option>
                            <option value="en-GB">English (UK)</option>
                            <option value="es-ES">Spanish</option>
                            <option value="fr-FR">French</option>
                            <option value="de-DE">German</option>
                        </select>
                    </div>
                    
                    <div class="menu-section">
                        <button class="menu-btn" id="pauseBtn" aria-label="Pause recording">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                            Pause
                        </button>
                        
                        <button class="menu-btn" id="settingsBtn" aria-label="Open settings">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                            </svg>
                            Settings
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="widget-transcript" id="widgetTranscript"></div>
            <div class="widget-error" id="widgetError"></div>
        `;
        
        document.body.appendChild(this.element);
    }

    injectStyles() {
        const styles = `
            .voice-widget {
                position: fixed;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                user-select: none;
                transition: all 0.3s ease;
            }
            
            .widget-main {
                position: relative;
                width: 60px;
                height: 60px;
            }
            
            .widget-btn {
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .widget-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
            }
            
            .widget-btn.recording {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                animation: widget-pulse 1.5s infinite;
            }
            
            @keyframes widget-pulse {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
            
            .widget-icon {
                width: 24px;
                height: 24px;
                z-index: 2;
                transition: transform 0.3s ease;
            }
            
            .widget-btn.recording .widget-icon {
                transform: scale(1.1);
            }
            
            .widget-visualizer {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border-radius: 50%;
                opacity: 0;
                transition: opacity 0.3s ease;
                z-index: 1;
            }
            
            .widget-btn.recording .widget-visualizer {
                opacity: 1;
            }
            
            .widget-menu {
                position: absolute;
                top: 70px;
                right: 0;
                width: 280px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                border: 1px solid #e2e8f0;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }
            
            .widget-menu.expanded {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .menu-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .menu-title {
                font-weight: 600;
                color: #1e293b;
                font-size: 14px;
            }
            
            .menu-close {
                background: none;
                border: none;
                font-size: 20px;
                color: #64748b;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }
            
            .menu-close:hover {
                background-color: #f1f5f9;
            }
            
            .menu-content {
                padding: 16px;
            }
            
            .menu-section {
                margin-bottom: 16px;
            }
            
            .menu-section:last-child {
                margin-bottom: 0;
            }
            
            .menu-label {
                display: block;
                font-size: 12px;
                font-weight: 500;
                color: #64748b;
                margin-bottom: 8px;
            }
            
            .menu-select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                color: #1e293b;
            }
            
            .menu-select:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            .menu-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: white;
                color: #1e293b;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 8px;
            }
            
            .menu-btn:hover {
                background-color: #f8fafc;
                border-color: #6366f1;
            }
            
            .menu-btn:last-child {
                margin-bottom: 0;
            }
            
            .widget-transcript {
                position: absolute;
                top: 70px;
                right: 0;
                width: 280px;
                background: white;
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border: 1px solid #e2e8f0;
                font-size: 14px;
                line-height: 1.5;
                color: #1e293b;
                max-height: 120px;
                overflow-y: auto;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }
            
            .widget-transcript.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .widget-error {
                position: absolute;
                top: 70px;
                right: 0;
                width: 280px;
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 12px;
                color: #dc2626;
                font-size: 14px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }
            
            .widget-error.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            @media (max-width: 768px) {
                .widget-menu,
                .widget-transcript,
                .widget-error {
                    width: 240px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    setupInteractions() {
        const voiceBtn = this.element.querySelector('#widgetVoiceBtn');
        const menu = this.element.querySelector('#widgetMenu');
        const menuClose = this.element.querySelector('#menuClose');
        const pauseBtn = this.element.querySelector('#pauseBtn');
        const settingsBtn = this.element.querySelector('#settingsBtn');
        const languageSelect = this.element.querySelector('#widgetLanguage');

        // Main button click
        voiceBtn.addEventListener('click', () => {
            this.toggleRecording();
        });

        // Long press for menu
        let longPressTimer;
        voiceBtn.addEventListener('mousedown', () => {
            longPressTimer = setTimeout(() => {
                this.toggleExpanded();
            }, 500);
        });

        voiceBtn.addEventListener('mouseup', () => {
            clearTimeout(longPressTimer);
        });

        voiceBtn.addEventListener('mouseleave', () => {
            clearTimeout(longPressTimer);
        });

        // Menu interactions
        menuClose.addEventListener('click', () => {
            this.toggleExpanded();
        });

        pauseBtn.addEventListener('click', () => {
            this.handleMenuAction('pause');
        });

        settingsBtn.addEventListener('click', () => {
            this.handleMenuAction('settings');
        });

        languageSelect.addEventListener('change', () => {
            this.handleMenuAction('language', languageSelect.value);
        });

        // Click outside to close menu
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.isExpanded = false;
                this.updatePosition();
            }
        });
    }

    makeDraggable() {
        let isDragging = false;
        let startX, startY;

        const startDrag = (e) => {
            if (e.target.closest('.widget-menu, .widget-transcript, .widget-error')) {
                return;
            }

            isDragging = true;
            const rect = this.element.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        };

        const drag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            const x = e.clientX - startX;
            const y = e.clientY - startY;
            
            this.position = { x, y };
            this.updatePosition();
        };

        const stopDrag = () => {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            this.savePosition();
        };

        this.element.addEventListener('mousedown', startDrag);
    }

    toggleRecording() {
        if (typeof voiceInputManager !== 'undefined') {
            voiceInputManager.toggleRecording();
        }
    }

    setRecordingState(isRecording) {
        this.isRecording = isRecording;
        const btn = this.element.querySelector('#widgetVoiceBtn');
        const icon = this.element.querySelector('.widget-icon');
        
        if (isRecording) {
            btn.classList.add('recording');
            this.startVisualizer();
        } else {
            btn.classList.remove('recording');
            this.stopVisualizer();
        }
    }

    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
        const menu = this.element.querySelector('#widgetMenu');
        
        if (this.isExpanded) {
            menu.classList.add('expanded');
        } else {
            menu.classList.remove('expanded');
        }
    }

    showTranscript(text) {
        const transcript = this.element.querySelector('#widgetTranscript');
        transcript.textContent = text;
        transcript.classList.add('show');
        
        setTimeout(() => {
            transcript.classList.remove('show');
        }, 5000);
    }

    showInterimTranscript(text) {
        const transcript = this.element.querySelector('#widgetTranscript');
        transcript.textContent = `Listening: ${text}`;
        transcript.classList.add('show');
    }

    clearTranscript() {
        const transcript = this.element.querySelector('#widgetTranscript');
        transcript.classList.remove('show');
    }

    insertTranscript() {
        if (typeof voiceInputManager !== 'undefined') {
            const transcript = this.element.querySelector('#widgetTranscript');
            voiceInputManager.insertText(transcript.textContent);
        }
    }

    showError(message) {
        const error = this.element.querySelector('#widgetError');
        error.textContent = message;
        error.classList.add('show');
        
        setTimeout(() => {
            error.classList.remove('show');
        }, 3000);
    }

    showNearElement(element) {
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        const widgetSize = 60;
        const margin = 10;
        
        let x = rect.right + margin;
        let y = rect.top;
        
        // Check if widget would go off screen
        if (x + widgetSize > window.innerWidth) {
            x = rect.left - widgetSize - margin;
        }
        
        if (y + widgetSize > window.innerHeight) {
            y = window.innerHeight - widgetSize - margin;
        }
        
        this.position = { x, y };
        this.updatePosition();
        this.show();
    }

    hide() {
        this.element.style.display = 'none';
    }

    show() {
        this.element.style.display = 'block';
    }

    handleMenuAction(action, data) {
        switch (action) {
            case 'language':
                if (typeof voiceInputManager !== 'undefined') {
                    voiceInputManager.updateSettings({ language: data });
                }
                break;
            case 'pause':
                this.toggleRecording();
                break;
            case 'settings':
                chrome.runtime.sendMessage({ action: 'OPEN_SETTINGS' });
                break;
        }
    }

    updatePosition() {
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
    }

    snapToEdge() {
        const widgetRect = this.element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        if (this.position.x + widgetRect.width > viewportWidth - 20) {
            this.position.x = viewportWidth - widgetRect.width - 20;
        }
        
        if (this.position.x < 20) {
            this.position.x = 20;
        }
        
        this.updatePosition();
        this.savePosition();
    }

    startVisualizer() {
        if (this.visualizerInterval) return;
        
        const canvas = this.element.querySelector('.widget-visualizer');
        const ctx = canvas.getContext('2d');
        let angle = 0;
        
        this.visualizerInterval = setInterval(() => {
            if (!this.isRecording) {
                this.stopVisualizer();
                return;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Simple circular visualizer
            for (let i = 0; i < 6; i++) {
                const x = canvas.width / 2 + Math.cos(angle + i * 0.8) * 15;
                const y = canvas.height / 2 + Math.sin(angle + i * 0.8) * 15;
                
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fill();
            }
            
            angle += 0.1;
        }, 50);
    }

    stopVisualizer() {
        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
            this.visualizerInterval = null;
            
            const canvas = this.element.querySelector('.widget-visualizer');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    checkVisibility() {
        const restrictedDomains = [
            'chrome://',
            'chrome-extension://',
            'moz-extension://',
            'edge://',
            'about:',
            'data:',
            'file://'
        ];
        
        const currentUrl = window.location.href;
        const isRestricted = restrictedDomains.some(domain => currentUrl.startsWith(domain));
        
        if (isRestricted) {
            this.hide();
        } else {
            this.show();
        }
    }

    loadPosition() {
        try {
            const saved = localStorage.getItem('voice_widget_position');
            if (saved) {
                this.position = JSON.parse(saved);
                this.updatePosition();
            }
        } catch (error) {
            console.error('Failed to load widget position:', error);
        }
    }

    savePosition() {
        try {
            localStorage.setItem('voice_widget_position', JSON.stringify(this.position));
        } catch (error) {
            console.error('Failed to save widget position:', error);
        }
    }

    destroy() {
        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
        }
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 