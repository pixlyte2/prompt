const Prompt = require("../models/prompt");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
      
      // Validate model name and use correct format
      const modelMap = {
        "gemini-2.5-flash": "gemini-2.5-flash",
        "gemini-2.5-pro": "gemini-2.5-pro",
        "gemini-2.0-flash": "gemini-2.0-flash",
        "gemini-flash-latest": "gemini-flash-latest",
        "gemini-pro-latest": "gemini-pro-latest"
      };
      
      const validModels = Object.keys(modelMap);
      
      console.log("Validating model:", aiModel, "Type:", typeof aiModel);
      
      if (!validModels.includes(aiModel)) {
        console.log("❌ Invalid model detected:", aiModel);
        return res.status(400).json({ 
          message: `Invalid AI model: ${aiModel}. Valid models are: ${validModels.join(', ')}` 
        });
      }
      
      const actualModelName = modelMap[aiModel];
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
