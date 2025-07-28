// Enhanced Background Service Worker
class BackgroundService {
    constructor() {
        this.sessions = new Map();
        this.activeTab = null;
        this.analytics = new AnalyticsCollector();
    }

    init() {
        // Set up message listeners
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
        });

        // Set up command listeners
        chrome.commands.onCommand.addListener((command) => {
            this.handleCommand(command);
        });

        // Set up tab listeners
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.handleTabActivation(activeInfo);
        });

        chrome.tabs.onRemoved.addListener((tabId) => {
            this.sessions.delete(tabId);
        });

        // Handle installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        console.log('Background service initialized');
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'START_VOICE_INPUT':
                    await this.startVoiceInput(message.data);
                    sendResponse({ success: true });
                    break;
                    
                case 'STOP_VOICE_INPUT':
                    await this.stopVoiceInput();
                    sendResponse({ success: true });
                    break;
                    
                case 'INSERT_TEXT':
                    await this.insertText(message.data.text);
                    sendResponse({ success: true });
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
                    const status = this.getStatus();
                    sendResponse(status);
                    break;
                    
                case 'VOICE_RESULT':
                    await this.handleVoiceResult(message.data, sender.tab?.id);
                    sendResponse({ success: true });
                    break;
                    
                case 'VOICE_ERROR':
                    await this.handleVoiceError(message.data, sender.tab?.id);
                    sendResponse({ success: true });
                    break;
                    
                case 'OPEN_SETTINGS':
                    chrome.runtime.openOptionsPage();
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background message handling error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async startVoiceInput(data = {}) {
        try {
            const tab = this.activeTab || await this.getActiveTab();
            if (!tab) {
                throw new Error('No active tab found');
            }

            const message = {
                action: 'START_VOICE_RECOGNITION',
                data: {
                    language: data.language || 'en-US',
                    continuous: data.continuous || false
                }
            };

            await chrome.tabs.sendMessage(tab.id, message);
            
            // Track session
            this.sessions.set(tab.id, {
                startTime: Date.now(),
                language: data.language,
                continuous: data.continuous
            });

            this.analytics.track('voice_session_started', {
                language: data.language,
                continuous: data.continuous,
                tabId: tab.id
            });

        } catch (error) {
            console.error('Failed to start voice input:', error);
            throw error;
        }
    }

    async stopVoiceInput() {
        try {
            const tab = this.activeTab || await this.getActiveTab();
            if (!tab) {
                throw new Error('No active tab found');
            }

            await chrome.tabs.sendMessage(tab.id, {
                action: 'STOP_VOICE_RECOGNITION'
            });

            // End session tracking
            const session = this.sessions.get(tab.id);
            if (session) {
                const duration = Date.now() - session.startTime;
                this.analytics.track('voice_session_ended', {
                    duration,
                    language: session.language,
                    continuous: session.continuous,
                    tabId: tab.id
                });
                this.sessions.delete(tab.id);
            }

        } catch (error) {
            console.error('Failed to stop voice input:', error);
            throw error;
        }
    }

    async insertText(text) {
        try {
            const tab = this.activeTab || await this.getActiveTab();
            if (!tab) {
                throw new Error('No active tab found');
            }

            await chrome.tabs.sendMessage(tab.id, {
                action: 'INSERT_TEXT',
                data: { text }
            });

            this.analytics.track('text_inserted', {
                length: text.length,
                tabId: tab.id
            });

        } catch (error) {
            console.error('Failed to insert text:', error);
            throw error;
        }
    }

    async checkMicrophonePermission() {
        try {
            const tab = await this.getActiveTab();
            if (!tab) return false;

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    return navigator.permissions.query({ name: 'microphone' })
                        .then(permission => permission.state === 'granted')
                        .catch(() => false);
                }
            });

            return results[0]?.result || false;
        } catch (error) {
            console.error('Failed to check microphone permission:', error);
            return false;
        }
    }

    async requestMicrophonePermission() {
        try {
            const tab = await this.getActiveTab();
            if (!tab) return false;

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    return navigator.mediaDevices.getUserMedia({ audio: true })
                        .then(stream => {
                            stream.getTracks().forEach(track => track.stop());
                            return true;
                        })
                        .catch(() => false);
                }
            });

            return results[0]?.result || false;
        } catch (error) {
            console.error('Failed to request microphone permission:', error);
            return false;
        }
    }

    getStatus() {
        return {
            isRecording: this.sessions.size > 0,
            activeSessions: this.sessions.size,
            activeTab: this.activeTab
        };
    }

    async handleVoiceResult(data, tabId) {
        try {
            if (!tabId) {
                console.warn('No tab ID provided for voice result');
                return;
            }

            // Send result directly to content script
            await chrome.tabs.sendMessage(tabId, {
                type: 'VOICE_RESULT',
                data: {
                    text: data.text,
                    confidence: data.confidence,
                    timestamp: Date.now()
                }
            });

            // Also send to popup if it's open
            try {
                await chrome.runtime.sendMessage({
                    type: 'VOICE_RESULT',
                    data: {
                        text: data.text,
                        confidence: data.confidence,
                        timestamp: Date.now()
                    }
                });
            } catch (popupError) {
                // Popup might not be open, which is fine
                console.debug('Popup not available for voice result');
            }

            this.analytics.track('voice_result_received', {
                length: data.text.length,
                confidence: data.confidence,
                tabId
            });

        } catch (error) {
            console.error('Failed to handle voice result:', error);
            
            // Try to send error to content script
            if (tabId) {
                try {
                    await chrome.tabs.sendMessage(tabId, {
                        type: 'VOICE_ERROR',
                        data: {
                            error: 'Failed to process voice result',
                            details: error.message
                        }
                    });
                } catch (sendError) {
                    console.error('Failed to send error to content script:', sendError);
                }
            }
        }
    }

    async handleVoiceError(data, tabId) {
        try {
            if (!tabId) {
                console.warn('No tab ID provided for voice error');
                return;
            }

            // Send error directly to content script
            await chrome.tabs.sendMessage(tabId, {
                type: 'VOICE_ERROR',
                data: {
                    error: data.error,
                    timestamp: Date.now()
                }
            });

            // Also send to popup if it's open
            try {
                await chrome.runtime.sendMessage({
                    type: 'VOICE_ERROR',
                    data: {
                        error: data.error,
                        timestamp: Date.now()
                    }
                });
            } catch (popupError) {
                // Popup might not be open, which is fine
                console.debug('Popup not available for voice error');
            }

            this.analytics.track('voice_error', {
                error: data.error,
                tabId
            });

        } catch (error) {
            console.error('Failed to handle voice error:', error);
        }
    }

    handleInstallation(details) {
        if (details.reason === 'install') {
            // Set default settings
            chrome.storage.sync.set({
                language: 'en-US',
                autoInsert: false,
                continuousMode: false,
                enableCommands: true,
                enablePunctuation: true,
                noiseSuppression: true
            });

            this.analytics.track('extension_installed', {
                version: chrome.runtime.getManifest().version
            });
        }
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Reset listening state when navigating to a new page
        if (changeInfo.status === 'loading' && this.sessions.has(tabId)) {
            this.sessions.delete(tabId);
        }
    }

    handleTabActivation(activeInfo) {
        this.activeTab = {
            id: activeInfo.tabId,
            windowId: activeInfo.windowId
        };
    }

    handleCommand(command) {
        switch (command) {
            case 'toggle-recording':
                this.toggleRecording();
                break;
            case 'stop-recording':
                this.stopVoiceInput();
                break;
        }
    }

    async toggleRecording() {
        const status = this.getStatus();
        if (status.isRecording) {
            await this.stopVoiceInput();
        } else {
            await this.startVoiceInput();
        }
    }

    async getActiveTab() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            return tabs[0] || null;
        } catch (error) {
            console.error('Failed to get active tab:', error);
            return null;
        }
    }
}

// Analytics data collector
class AnalyticsCollector {
    constructor() {
        this.events = [];
        this.maxEvents = 1000;
    }

    track(event, data = {}) {
        const eventData = {
            event,
            timestamp: Date.now(),
            ...data
        };

        this.events.push(eventData);

        // Keep only the latest events
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        // Store in chrome.storage for persistence
        chrome.storage.local.set({ analytics: this.events });

        console.log('Analytics:', eventData);
    }

    getEvents() {
        return this.events;
    }

    clearEvents() {
        this.events = [];
        chrome.storage.local.remove('analytics');
    }

    async loadEvents() {
        try {
            const result = await chrome.storage.local.get('analytics');
            this.events = result.analytics || [];
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.events = [];
        }
    }
}

// Initialize background service
const backgroundService = new BackgroundService();
backgroundService.init(); 