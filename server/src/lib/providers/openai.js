import OpenAI from "openai";

export default class OpenAIProvider {
  static id = "openai";
  static label = "OpenAI";
  static models = {
    flash: "gpt-4o-mini",
    pro: "gpt-4o",
  };

  constructor(apiKey) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(prompt, modelTier = "flash", options = {}) {
    const modelName = OpenAIProvider.models[modelTier] || OpenAIProvider.models.flash;
    const response = await this.client.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    });
    return response.choices[0].message.content;
  }
}
