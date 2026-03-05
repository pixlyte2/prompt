const Prompt = require("../models/prompt");

exports.chat = async (req, res) => {
  try {
    const { promptId, sourceText, videoLength, message, history } = req.body;

    if (!promptId || !message) {
      return res.status(400).json({ message: "Prompt and message are required" });
    }

    const prompt = await Prompt.findById(promptId)
      .populate("channelId", "name")
      .populate("promptTypeId", "name");

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    // Replace placeholders
    let finalPrompt = prompt.promptText
      .replace(/\[SOURCE\]/g, sourceText || '')
      .replace(/\[LENGTH\]/g, videoLength === 'reel' ? 'Short Video 30s' : 'Long Video 3 min');

    // MOCK RESPONSE FOR TESTING
    const mockResponse = `🤖 MOCK AI RESPONSE

📝 Your Prompt:
${finalPrompt}

💬 Your Message:
${message}

✨ Generated Content:

This is a mock AI-generated response to test the result modal functionality.

Here's what would be generated based on your prompt:

1. Introduction
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

2. Main Content
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

3. Key Points:
- Point one with detailed explanation
- Point two with supporting information
- Point three with actionable insights

4. Conclusion
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

🎯 This mock response demonstrates:
- Multi-line formatting
- Structured content
- Emoji support
- Long-form text display

✅ The result modal should display this content properly with scrolling and copy functionality.

🔥 Additional sections to test scrolling:

5. Best Practices
- Always start with a clear objective
- Break down complex tasks into smaller steps
- Use consistent formatting throughout
- Include examples where applicable
- Test your content before publishing

6. Tips and Tricks
- Leverage templates for efficiency
- Keep your audience in mind
- Use engaging language
- Include call-to-actions
- Optimize for readability

7. Common Mistakes to Avoid
- Being too generic
- Ignoring your target audience
- Overcomplicating the message
- Forgetting to proofread
- Not testing different formats

8. Final Thoughts
Remember that great content takes time and practice. Keep refining your approach based on feedback and results. The key is to stay consistent and always aim for improvement.

✨ End of mock response ✨`;

    return res.json({ response: mockResponse, finalPrompt });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ message: error.message || "Failed to process chat request" });
  }
};
