# Voice Input Extension

A powerful Chrome extension that enables voice-to-text input across all web pages, providing seamless dictation capabilities with high accuracy and privacy-focused design.

## 🎯 Features

- **Universal Voice Input**: Works on any website with text input fields
- **High Accuracy**: Leverages Web Speech API for reliable transcription
- **Privacy First**: Local processing when possible, minimal data collection
- **Multi-language Support**: Supports 15+ languages including English, Spanish, French, German, and more
- **Smart Input Detection**: Automatically detects text fields, textareas, and contentEditable elements
- **Real-time Feedback**: Shows interim results and listening status
- **Customizable Settings**: Extensive configuration options for power users
- **Modern UI**: Beautiful, responsive interface with smooth animations

## 🚀 Quick Start

### Installation

1. **Download the Extension**
   ```bash
   git clone https://github.com/yourusername/voice-input-extension.git
   cd voice-input-extension
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extension folder

3. **Grant Permissions**
   - Click the extension icon in your toolbar
   - Click "Start Voice Input" to begin
   - Grant microphone permission when prompted

### Usage

1. **Activate Voice Input**
   - Click the extension icon in your browser toolbar
   - Click the "Start Voice Input" button

2. **Start Dictating**
   - Click on any text input field on the current page
   - Speak clearly into your microphone
   - Your speech will be converted to text in real-time

3. **Stop Voice Input**
   - Click the "Stop Voice Input" button in the popup
   - Or click the extension icon again

## 🛠️ Development

### Project Structure

```
voice-input-extension/
├── manifest.json              # Extension configuration
├── src/
│   ├── background/            # Service worker
│   │   └── background.js      # Background script
│   ├── content/               # Content scripts
│   │   └── content.js         # Page injection script
│   ├── popup/                 # Extension popup
│   │   ├── popup.html         # Popup interface
│   │   ├── popup.css          # Popup styles
│   │   └── popup.js           # Popup logic
│   ├── options/               # Options page
│   │   ├── options.html       # Settings interface
│   │   ├── options.css        # Settings styles
│   │   └── options.js         # Settings logic
│   ├── permission/            # Permission handling
│   │   ├── permission.html    # Permission request page
│   │   └── permission.js      # Permission logic
│   └── lib/                   # Shared utilities
│       └── utils.js           # Common functions
├── assets/                    # Icons and images
├── tests/                     # Test files
├── docs/                      # Documentation
└── README.md                  # This file
```

### Building from Source

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/voice-input-extension.git
   cd voice-input-extension
   ```

2. **Install Dependencies** (if using build tools)
   ```bash
   npm install
   ```

3. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select the project folder

### Development Commands

```bash
# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## ⚙️ Configuration

### Basic Settings

Access settings by clicking the extension icon and selecting "Advanced Settings":

- **Language**: Choose your primary language for voice recognition
- **Continuous Mode**: Keep listening without stopping automatically
- **Interim Results**: Show partial transcription while speaking
- **Voice Indicators**: Display microphone icons near input fields

### Advanced Settings

- **Audio Quality**: Balance between accuracy and processing speed
- **Echo Cancellation**: Reduce background noise and echo
- **Noise Suppression**: Filter out background noise
- **Data Retention**: Control how long voice data is kept
- **Local Processing**: Enable when available for better privacy

## 🔧 Technical Details

### Architecture

The extension follows Manifest V3 architecture with these components:

- **Service Worker**: Coordinates between components and handles background tasks
- **Content Script**: Injects voice recognition capabilities into web pages
- **Popup**: Provides user interface and controls
- **Options Page**: Advanced settings and configuration
- **Permission Handler**: Manages microphone access requests

### Browser Compatibility

- **Chrome**: 88+ (Manifest V3 support)
- **Edge**: 88+ (Chromium-based)
- **Firefox**: Not supported (different extension architecture)

### API Usage

The extension uses the following web APIs:

- **Web Speech API**: For voice recognition
- **MediaDevices API**: For microphone access
- **Permissions API**: For permission management
- **Chrome Extensions API**: For extension functionality

## 🧪 Testing

### Manual Testing

1. **Basic Functionality**
   - Test voice input on various websites
   - Verify text insertion in different input types
   - Check permission handling

2. **Settings**
   - Test all configuration options
   - Verify settings persistence
   - Test language switching

3. **Error Handling**
   - Test with no microphone
   - Test with denied permissions
   - Test network connectivity issues

### Automated Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## 📦 Publishing

### Chrome Web Store

1. **Prepare Assets**
   - Create extension icons (16x16, 32x32, 48x48, 128x128)
   - Take screenshots (1280x800 or 640x400)
   - Write store description

2. **Package Extension**
   ```bash
   npm run build
   ```

3. **Upload to Store**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Upload the packaged extension
   - Fill in store listing details
   - Submit for review

### Distribution

- **Chrome Web Store**: Primary distribution channel
- **GitHub Releases**: For developers and beta testing
- **Direct Download**: For enterprise deployments

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style

- Follow ESLint configuration
- Use meaningful variable names
- Add comments for complex logic
- Write unit tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Microphone not working?**
- Check browser permissions
- Ensure microphone is not in use by another application
- Try refreshing the page

**Voice recognition not accurate?**
- Speak clearly and at a normal pace
- Reduce background noise
- Check your language setting

**Extension not working on a site?**
- Ensure the site allows content scripts
- Check for any site-specific restrictions
- Try disabling other extensions

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/voice-input-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/voice-input-extension/discussions)
- **Email**: support@voiceinputextension.com

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes.

### Recent Updates

- **v1.0.0**: Initial release with core voice input functionality
- **v1.1.0**: Added multi-language support and improved accuracy
- **v1.2.0**: Enhanced privacy features and performance optimizations

## 🙏 Acknowledgments

- Web Speech API for voice recognition capabilities
- Chrome Extensions team for the excellent platform
- Contributors and beta testers for feedback and improvements

---

**Made with ❤️ for better web accessibility and productivity** 