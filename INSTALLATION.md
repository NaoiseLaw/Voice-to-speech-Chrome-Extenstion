# Installation Guide

This guide will walk you through installing and setting up the Voice Input Extension.

## Prerequisites

- **Chrome Browser**: Version 88 or higher (for Manifest V3 support)
- **Microphone**: Built-in or external microphone
- **Internet Connection**: Required for voice recognition (Web Speech API)

## Installation Methods

### Method 1: Chrome Web Store (Recommended)

1. **Visit the Chrome Web Store**
   - Go to [Chrome Web Store](https://chrome.google.com/webstore)
   - Search for "Voice Input Extension"
   - Click "Add to Chrome"

2. **Confirm Installation**
   - Review the permissions requested
   - Click "Add extension"
   - Wait for installation to complete

3. **Verify Installation**
   - Look for the extension icon in your toolbar
   - Click the icon to open the popup

### Method 2: Developer Mode (For Development)

1. **Download the Extension**
   ```bash
   git clone https://github.com/yourusername/voice-input-extension.git
   cd voice-input-extension
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the extension folder
   - Click "Select Folder"

4. **Verify Installation**
   - The extension should appear in your extensions list
   - Look for the extension icon in your toolbar

## Initial Setup

### 1. Grant Microphone Permission

1. **Click the Extension Icon**
   - Look for the microphone icon in your browser toolbar
   - Click to open the popup

2. **Start Voice Input**
   - Click "Start Voice Input" button
   - Chrome will prompt for microphone permission
   - Click "Allow" to grant permission

3. **Test Microphone**
   - Speak into your microphone
   - You should see the listening indicator

### 2. Configure Settings

1. **Access Settings**
   - Click the extension icon
   - Click "Advanced Settings" at the bottom

2. **Basic Settings**
   - **Language**: Choose your primary language
   - **Continuous Mode**: Keep listening without stopping
   - **Interim Results**: Show partial transcription

3. **Advanced Settings**
   - **Audio Quality**: Balance accuracy vs. speed
   - **Echo Cancellation**: Reduce background noise
   - **Data Retention**: Control privacy settings

## Usage

### Basic Voice Input

1. **Activate Voice Input**
   - Click the extension icon
   - Click "Start Voice Input"

2. **Select Input Field**
   - Click on any text input field on the page
   - Look for the microphone indicator

3. **Start Speaking**
   - Speak clearly into your microphone
   - Watch for real-time transcription

4. **Stop Voice Input**
   - Click "Stop Voice Input" in the popup
   - Or click the extension icon again

### Supported Input Types

- **Text Inputs**: `<input type="text">`
- **Email Inputs**: `<input type="email">`
- **Search Inputs**: `<input type="search">`
- **Textareas**: `<textarea>`
- **Content Editable**: `contenteditable="true"`
- **Rich Text Editors**: Most WYSIWYG editors

### Keyboard Shortcuts

- **Ctrl/Cmd + Shift + V**: Quick voice input toggle
- **Ctrl/Cmd + Shift + S**: Open settings
- **Escape**: Stop voice input

## Troubleshooting

### Microphone Not Working

1. **Check Browser Permissions**
   - Go to `chrome://settings/content/microphone`
   - Ensure the extension has permission
   - Check if microphone is blocked

2. **Check System Permissions**
   - Windows: Settings > Privacy > Microphone
   - macOS: System Preferences > Security & Privacy > Microphone
   - Linux: Check audio settings

3. **Test Microphone**
   - Try using microphone in other applications
   - Check if microphone is selected in system settings

### Voice Recognition Not Accurate

1. **Improve Audio Quality**
   - Reduce background noise
   - Speak clearly and at normal pace
   - Use a better microphone if available

2. **Check Settings**
   - Verify language setting is correct
   - Enable echo cancellation
   - Try different audio quality settings

3. **Network Issues**
   - Ensure stable internet connection
   - Web Speech API requires internet access
   - Try refreshing the page

### Extension Not Working on Specific Sites

1. **Check Site Compatibility**
   - Some sites may block content scripts
   - Try disabling other extensions
   - Check browser console for errors

2. **HTTPS Requirement**
   - Voice recognition requires HTTPS
   - Some local development sites may not work
   - Use localhost for testing

3. **Site-Specific Issues**
   - Some sites use custom input handling
   - Try clicking the input field first
   - Check if the site allows extensions

## Advanced Configuration

### Custom Settings

1. **Language Options**
   - Support for 15+ languages
   - Automatic language detection
   - Manual language selection

2. **Performance Tuning**
   - Audio quality settings
   - Noise suppression options
   - Echo cancellation settings

3. **Privacy Controls**
   - Data retention settings
   - Local processing options
   - Clear data on browser close

### Developer Options

1. **Debug Mode**
   - Open browser console
   - Look for extension logs
   - Check for error messages

2. **Manual Testing**
   - Test on various websites
   - Verify input field detection
   - Check permission handling

## Uninstallation

### Remove Extension

1. **Chrome Web Store Installation**
   - Go to `chrome://extensions/`
   - Find "Voice Input Extension"
   - Click "Remove"

2. **Developer Mode Installation**
   - Go to `chrome://extensions/`
   - Find the extension
   - Click "Remove"

### Clean Up Data

1. **Clear Extension Data**
   - Go to `chrome://settings/clearBrowserData`
   - Select "Cached images and files"
   - Click "Clear data"

2. **Remove Permissions**
   - Go to `chrome://settings/content/microphone`
   - Remove extension permissions

## Support

### Getting Help

1. **Check Documentation**
   - Read the README.md file
   - Review troubleshooting section
   - Check the changelog

2. **Report Issues**
   - Create a GitHub issue
   - Include browser version and OS
   - Describe the problem clearly

3. **Community Support**
   - Check GitHub discussions
   - Search existing issues
   - Ask for help in the community

### System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, Linux
- **Browser**: Chrome 88+ or Edge 88+
- **Memory**: 50MB available RAM
- **Storage**: 5MB disk space
- **Network**: Internet connection for voice recognition

## Privacy & Security

### Data Handling

- **Voice Data**: Processed by Google's Web Speech API
- **Local Storage**: Settings stored locally in browser
- **No Tracking**: Extension does not track user behavior
- **Transparent**: Open source code for review

### Permissions

- **Microphone**: Required for voice input
- **Active Tab**: Required to inject content scripts
- **Storage**: Required to save settings
- **Host Permissions**: Required to work on all websites

### Security Features

- **Content Security Policy**: Prevents code injection
- **HTTPS Only**: Secure data transmission
- **Input Validation**: Sanitizes all user input
- **Error Handling**: Graceful failure handling

---

**Need Help?** Check our [GitHub Issues](https://github.com/yourusername/voice-input-extension/issues) or [Documentation](README.md). 