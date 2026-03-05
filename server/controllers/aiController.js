const Prompt = require("../models/prompt");

exports.chat = async (req, res) => {
  try {
    const { promptId, sourceText, message, history } = req.body;

    if (!promptId || !message) {
      return res.status(400).json({ message: "Prompt and message are required" });
    }

    const prompt = await Prompt.findById(promptId)
      .populate("channelId", "name")
      .populate("promptTypeId", "name");

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    // Build context from prompt and source
    let systemPrompt = prompt.promptText;
    if (sourceText) {
      systemPrompt += `\n\nSource Material:\n${sourceText}`;
    }

    // For now, return a mock response
    // TODO: Integrate with OpenAI/Gemini API based on prompt.aiModel
    const response = `This is a mock AI response. To enable real AI responses, integrate with ${prompt.aiModel} API.\n\nYour message: "${message}"\nPrompt: ${prompt.promptTypeId?.name}\nChannel: ${prompt.channelId?.name}`;

    res.json({ response });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ message: "Failed to process chat request" });
  }
};
