import { GoogleGenerativeAI } from "@google/generative-ai";

export default class GeminiProvider {
  static id = "gemini";
  static label = "Google Gemini";
  static models = {
    flash: "gemini-2.5-flash",
    pro: "gemini-2.5-flash",
  };

  constructor(apiKey) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt, modelTier = "flash", options = {}) {
    const modelName = GeminiProvider.models[modelTier] || GeminiProvider.models.flash;
    const model = this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
        responseMimeType: options.json ? "application/json" : "text/plain",
      },
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
