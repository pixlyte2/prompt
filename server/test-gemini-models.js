const { GoogleGenerativeAI } = require("@google/generative-ai");

// Replace with your actual API key
const API_KEY = process.argv[2];

if (!API_KEY) {
  console.log("Usage: node test-gemini-models.js YOUR_API_KEY");
  process.exit(1);
}

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    console.log("Fetching available models...\n");
    
    // Try to list models
    const models = await genAI.listModels();
    
    console.log("Available models:");
    console.log("=================\n");
    
    for await (const model of models) {
      console.log(`Model: ${model.name}`);
      console.log(`Display Name: ${model.displayName}`);
      console.log(`Description: ${model.description}`);
      console.log(`Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log("---");
    }
  } catch (error) {
    console.error("Error listing models:", error.message);
    console.error("\nTrying alternative approach...\n");
    
    // Try common model names
    const testModels = [
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash-latest",
      "models/gemini-pro",
      "models/gemini-1.5-pro",
      "models/gemini-1.5-flash"
    ];
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    for (const modelName of testModels) {
      try {
        console.log(`Testing: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log(`✅ ${modelName} - WORKS!`);
        console.log(`   Response: ${response.text().substring(0, 50)}...\n`);
      } catch (err) {
        console.log(`❌ ${modelName} - Failed: ${err.message.substring(0, 100)}\n`);
      }
    }
  }
}

listModels();
