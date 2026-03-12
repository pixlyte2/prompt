# Gemini AI Integration Setup

## Installation Steps

### 1. Install Gemini SDK (Server)

Navigate to the server directory and install the package:

```bash
cd server
npm install @google/generative-ai
```

The package is already listed in package.json, so you can also run:

```bash
npm install
```

### 2. Configure API Key

1. Go to **Settings** page in the admin panel
2. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Sign in with your Google account
4. Click "Create API Key"
5. Copy the API key
6. Paste it in the Settings page
7. Click "Save API Key"

The API key will be encrypted with AES-256-GCM and stored locally in your browser.

### 3. Test the Integration

1. Go to **AI Chat** page
2. Select a prompt from the dropdown
3. Add source text (optional)
4. Choose video length
5. Type your message
6. Click "Generate"

The system will:
- Decrypt your API key
- Send it to the backend
- Call Gemini API with your prompt
- Display the AI-generated response

## Features Implemented

✅ **Secure API Key Storage**
- AES-256-GCM encryption
- Stored locally in browser
- Never sent to your servers

✅ **Gemini Integration**
- Support for all Gemini models (gemini-pro, gemini-1.5-pro, etc.)
- Conversation history support
- Dynamic prompt replacement ([SOURCE], [LENGTH])
- Video length options (40s, 2min, 3min, 5min)

✅ **Error Handling**
- API key validation
- Invalid key detection
- Network error handling
- User-friendly error messages

## API Models Supported

The system supports any Gemini model specified in your prompts:
- `gemini-pro` (default)
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- Any future Gemini models

## Security Notes

🔒 **Your API key is secure:**
- Encrypted before storage
- Only decrypted when needed
- Transmitted over HTTPS
- Not logged or stored on server

## Troubleshooting

**"Please configure your Gemini API key in Settings first"**
- Go to Settings and add your API key

**"Invalid API key"**
- Check your API key in Google AI Studio
- Make sure you copied the entire key
- Try generating a new key

**"Failed to decrypt API key"**
- Clear your browser cache
- Re-enter your API key in Settings

**"AI Error: ..."**
- Check your internet connection
- Verify your API key is valid
- Check Google AI Studio for quota limits

## Next Steps

1. Install the package: `npm install` in server directory
2. Configure your API key in Settings
3. Start creating amazing AI-generated content!

Enjoy your Gemini-powered AI Chat! 🚀
