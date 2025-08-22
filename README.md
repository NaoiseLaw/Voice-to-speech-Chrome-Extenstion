# Voice-to-Speech Chrome Extension 🎤

A powerful Chrome extension that converts voice input to text and provides text-to-speech functionality, making web browsing more accessible and efficient.

## 📋 Table of Contents
- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Browser Compatibility](#browser-compatibility)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Author](#author)

## ✨ Features

- **Voice-to-Text Conversion**: Convert spoken words into text instantly using Web Speech API
- **Text-to-Speech Output**: Read selected text or entire pages aloud
- **Multiple Language Support**: Supports various languages and accents
- **Customizable Settings**: Adjust speech rate, pitch, and volume
- **Keyboard Shortcuts**: Quick access to voice features
- **Privacy Focused**: All processing happens locally in your browser
- **Lightweight**: Minimal performance impact on browser

## 🎬 Demo

[Add a GIF or link to video demonstration here]

## 🚀 Installation

### Method 1: Install from Chrome Web Store
*[Coming Soon - Add link when published]*

### Method 2: Manual Installation (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/NaoiseLaw/Voice-to-speech-Chrome-Extension.git
   cd Voice-to-speech-Chrome-Extension
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the extension directory containing `manifest.json`

5. **Verify Installation**
   - The extension icon should appear in your Chrome toolbar
   - Pin it for easy access

## 📖 Usage

### Basic Usage

1. **Activate Voice Input**
   - Click the extension icon in the toolbar
   - Or press `Ctrl+Shift+S` (customizable)
   - Start speaking when the microphone indicator appears

2. **Text-to-Speech**
   - Select any text on a webpage
   - Right-click and choose "Read Aloud"
   - Or click the extension icon and select "Read Page"

3. **Stop Speaking**
   - Click the stop button in the extension popup
   - Or press `Ctrl+Shift+X`

### Advanced Features

- **Language Selection**: Choose input/output language from settings
- **Voice Selection**: Pick from available system voices
- **Speed Control**: Adjust reading speed (0.5x to 2x)
- **Auto-detect Language**: Automatically detect text language

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **APIs**: 
  - Web Speech API for speech recognition
  - Speech Synthesis API for text-to-speech
  - Chrome Extensions API
- **Build Tools**: [Specify if using any]
- **Testing**: [Specify testing framework if applicable]

## 📁 Project Structure

```
Voice-to-speech-Chrome-Extension/
│
├── manifest.json          # Extension configuration
├── README.md             # Project documentation
├── LICENSE               # License file
│
├── src/
│   ├── background.js     # Background script for extension
│   ├── content.js        # Content script for page interaction
│   ├── popup.html        # Extension popup interface
│   ├── popup.js          # Popup functionality
│   └── options.html      # Settings page
│
├── styles/
│   ├── popup.css         # Popup styling
│   └── options.css       # Options page styling
│
├── images/
│   ├── icon16.png        # Extension icons (various sizes)
│   ├── icon48.png
│   └── icon128.png
│
└── lib/                  # Third-party libraries (if any)
```

## ⚙️ Configuration

### manifest.json Configuration
The extension's behavior can be modified by editing `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Voice-to-Speech Chrome Extension",
  "version": "1.0.0",
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus"
  ]
}
```

### User Settings
Access settings through the extension's options page:
- Speech recognition language
- Text-to-speech voice and speed
- Keyboard shortcuts
- Auto-pause on tab switch

## 🌐 Browser Compatibility

- **Chrome**: Version 90+ (Full support)
- **Edge**: Version 90+ (Full support)
- **Brave**: Latest version (Full support)
- **Opera**: Version 76+ (Partial support)

*Note: This extension is specifically designed for Chromium-based browsers*

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Setup

1. Clone the repo
2. Make your changes
3. Test in Chrome using Developer Mode
4. Ensure no console errors
5. Submit PR with description of changes

## 🐛 Troubleshooting

### Common Issues

**Microphone not working:**
- Check browser microphone permissions
- Ensure no other application is using the microphone
- Try refreshing the page

**Text-to-Speech not working:**
- Check system audio settings
- Verify text-to-speech is enabled in Chrome settings
- Try selecting a different voice in options

**Extension not loading:**
- Ensure Developer Mode is enabled
- Check for manifest.json errors
- Verify all files are present

### Debug Mode
Enable debug mode for detailed logging:
1. Go to extension options
2. Enable "Debug Mode"
3. Check console for detailed logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**NaoiseLaw**
- GitHub: [@NaoiseLaw](https://github.com/NaoiseLaw)
- LinkedIn: [Your LinkedIn Profile]

## 🙏 Acknowledgments

- Web Speech API documentation
- Chrome Extensions documentation
- [List any libraries or resources used]

## 📊 Project Status

Current Version: 1.0.0
Status: Active Development

### Upcoming Features
- [ ] Cloud sync for settings
- [ ] Support for more languages
- [ ] Batch text processing
- [ ] Voice commands for navigation
- [ ] Integration with popular web apps

---

**Note**: This extension requires microphone access and appropriate permissions to function properly. All voice processing is done locally for privacy.

For issues or feature requests, please [open an issue](https://github.com/NaoiseLaw/Voice-to-speech-Chrome-Extension/issues).
