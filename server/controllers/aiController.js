const Prompt = require("../models/prompt");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_MODEL_MAP = {
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.5-pro": "gemini-2.5-pro",
  "gemini-2.0-flash": "gemini-2.0-flash",
  "gemini-flash-latest": "gemini-flash-latest",
  "gemini-pro-latest": "gemini-pro-latest",
};

const ASSISTANT_SYSTEM = `You are **CreatorAI Assistant**, an in-app helper for people using the CreatorAI admin app (prompt management, channels, users, AI Chat with Google Gemini, Content Guard).

**What you do**
- Explain screens and workflows in short, clear steps. Name UI areas as users see them (e.g. "AI Chat", "Prompt Management", "Settings" tab for the API key).
- Help draft or improve prompt ideas, placeholders like [SOURCE] and [LENGTH], and content strategy — you cannot see their database; if they need account-specific help, ask them to describe what they see.
- Answer general questions about using Gemini in this app (models, API key in Settings, encrypted local storage).

**Rules**
- Do not pretend you clicked buttons or changed data in their account.
- Prefer markdown: short lists, **bold** for labels, code spans for field names when useful.
- If asked about things outside CreatorAI or general Gemini API billing, answer briefly and offer to focus on the app.
- Keep replies concise unless the user asks for detail.`;

function resolveGeminiModelId(aiModel) {
  return GEMINI_MODEL_MAP[aiModel] || null;
}

exports.validateContent = async (req, res) => {
  try {
    const { content, aiModel, apiKey } = req.body;
    if (!content || !apiKey) return res.status(400).json({ message: "Content and API key are required" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: aiModel || "gemini-2.5-flash",
      generationConfig: { maxOutputTokens: 65536, temperature: 0.7 }
    });

    const prompt = `You are a content policy and ad-suitability expert. Analyze the following content and respond ONLY with valid JSON (no markdown, no code fences) in this exact format:
{"issues":[{"type":"string","severity":"High|Medium|Low","description":"string"}],"optimizedContent":"string with the rewritten/optimized version of the content that fixes all issues"}

Content to validate:
${content}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error) {
    console.error("Validate content error:", error);
    res.status(500).json({ message: error.message || "Validation failed" });
  }
};

exports.chat = async (req, res) => {
  try {
    const { promptId, sourceText, videoLength, aiModel, message, history, apiKey } = req.body;

    console.log("=== AI Chat Request ===");
    console.log("Prompt ID:", promptId);
    console.log("Message:", message);
    console.log("AI Model from request:", aiModel);
    console.log("AI Model type:", typeof aiModel);
    console.log("API Key received:", apiKey ? "Yes (length: " + apiKey.length + ")" : "No");
    console.log("Video Length:", videoLength);

    if (!promptId || !message) {
      return res.status(400).json({ message: "Prompt and message are required" });
    }

    if (!apiKey) {
      console.log("❌ No API key provided");
      return res.status(400).json({ message: "Gemini API key is required. Please configure it in Settings." });
    }

    if (!aiModel) {
      return res.status(400).json({ message: "AI Model is required" });
    }

    const prompt = await Prompt.findById(promptId)
      .populate("channelId", "name")
      .populate("promptTypeId", "name");

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    console.log("Prompt found:", {
      channel: prompt.channelId?.name,
      promptType: prompt.promptTypeId?.name,
      storedAiModel: prompt.aiModel
    });
    console.log("Using AI Model from request (not from prompt):", aiModel);

    // Map video length to readable format
    const lengthMap = {
      '40s': '40 seconds',
      '2min': '2 minutes',
      '3min': '3 minutes',
      '5min': '5 minutes'
    };

    // Replace placeholders
    let finalPrompt = prompt.promptText
      .replace(/\[SOURCE\]/g, sourceText || '')
      .replace(/\[LENGTH\]/g, lengthMap[videoLength] || videoLength);

    console.log("Final Prompt:", finalPrompt.substring(0, 100) + "...");

    try {
      console.log("🚀 Calling Gemini API...");
      
      const validModels = Object.keys(GEMINI_MODEL_MAP);

      console.log("Validating model:", aiModel, "Type:", typeof aiModel);

      const actualModelName = resolveGeminiModelId(aiModel);
      if (!actualModelName) {
        console.log("❌ Invalid model detected:", aiModel);
        return res.status(400).json({
          message: `Invalid AI model: ${aiModel}. Valid models are: ${validModels.join(", ")}`,
        });
      }
      console.log("✅ Model validated successfully:", aiModel, "-> Using:", actualModelName);
      
      // Set max output tokens based on model
      const maxOutputTokens = aiModel === "gemini-2.0-flash" ? 8192 : 65536;
      console.log("Max output tokens for this model:", maxOutputTokens);
      
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      console.log("Creating model with:", actualModelName);
      const model = genAI.getGenerativeModel({ 
        model: actualModelName,
        generationConfig: {
          maxOutputTokens: maxOutputTokens,
          temperature: 0.9,
        }
      });
      console.log("Model created successfully");

      // Build conversation history for context
      const chatHistory = [];
      if (history && Array.isArray(history)) {
        history.forEach(msg => {
          if (msg.role === 'user') {
            chatHistory.push({ role: 'user', parts: [{ text: msg.content }] });
          } else if (msg.role === 'assistant') {
            chatHistory.push({ role: 'model', parts: [{ text: msg.content }] });
          }
        });
      }

      console.log("Chat history items:", chatHistory.length);

      // Start chat with history
      const chat = model.startChat({
        history: chatHistory
      });

      // Combine finalized prompt with user message
      const fullMessage = `${finalPrompt}\n\nUser Request: ${message}`;

      // Send message and get response
      const result = await chat.sendMessage(fullMessage);
      const response = await result.response;
      const aiResponse = response.text();

      console.log("✅ Gemini response received (length:", aiResponse.length, ")");

      return res.json({ response: aiResponse, finalPrompt });
    } catch (aiError) {
      console.error("❌ Gemini API error:", aiError.message);
      console.error("Error name:", aiError.name);
      console.error("Error stack:", aiError.stack);
      console.error("Full error object:", JSON.stringify(aiError, null, 2));
      
      // Handle specific API errors
      if (aiError.message?.includes('API key')) {
        return res.status(401).json({ message: "Invalid API key. Please check your Gemini API key in Settings." });
      }
      
      return res.status(500).json({ 
        message: `AI Error: ${aiError.message || 'Failed to generate response'}`,
        error: aiError.name,
        details: aiError.stack
      });
    }
  } catch (error) {
    console.error("❌ AI chat error:", error);
    res.status(500).json({ message: error.message || "Failed to process chat request" });
  }
};

exports.assistant = async (req, res) => {
  try {
    const { message, history, aiModel, apiKey } = req.body;
    const text = typeof message === "string" ? message.trim() : "";

    if (!text) {
      return res.status(400).json({ message: "Message is required" });
    }
    if (text.length > 12000) {
      return res.status(400).json({ message: "Message is too long" });
    }
    if (!apiKey) {
      return res.status(400).json({
        message: "Gemini API key is required. Add it in AI Chat → Settings.",
      });
    }
    if (!aiModel) {
      return res.status(400).json({ message: "AI model is required" });
    }

    const actualModelName = resolveGeminiModelId(aiModel);
    if (!actualModelName) {
      return res.status(400).json({
        message: `Invalid AI model. Valid models are: ${Object.keys(GEMINI_MODEL_MAP).join(", ")}`,
      });
    }

    const maxOutputTokens = aiModel === "gemini-2.0-flash" ? 8192 : 16384;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: actualModelName,
      systemInstruction: ASSISTANT_SYSTEM,
      generationConfig: {
        maxOutputTokens,
        temperature: 0.65,
      },
    });

    const chatHistory = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        if (msg.role === "user") {
          chatHistory.push({ role: "user", parts: [{ text: msg.content }] });
        } else if (msg.role === "assistant") {
          chatHistory.push({ role: "model", parts: [{ text: msg.content }] });
        }
      });
    }

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(text);
    const response = await result.response;
    const aiResponse = response.text();

    return res.json({ response: aiResponse });
  } catch (aiError) {
    console.error("Assistant error:", aiError.message);
    if (aiError.message?.includes("API key")) {
      return res.status(401).json({ message: "Invalid API key. Check Settings in AI Chat." });
    }
    return res.status(500).json({
      message: aiError.message || "Assistant request failed",
    });
  }
};
