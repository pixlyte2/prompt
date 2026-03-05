# Gemini API Integration Setup

## Installation

1. Install the required package:
```bash
cd server
npm install @google/generative-ai
```

## Configuration

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Add the API key to your `.env` file:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

3. Restart the server

## Features

- **Finalized Prompt Display**: The prompt with [SOURCE] replaced is shown above the chat messages
- **Additional Input**: Users can add extra questions or context in the message input
- **Chat History**: Conversation history is maintained for context-aware responses
- **Gemini Pro Model**: Uses Google's Gemini Pro model for AI responses

## Usage

1. Select a prompt from the dropdown
2. Add source content (optional) - replaces [SOURCE] placeholder
3. The finalized prompt will be displayed after first message
4. Type additional input or questions in the message box
5. AI responses will consider both the finalized prompt and your additional input
