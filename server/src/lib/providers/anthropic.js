import Anthropic from "@anthropic-ai/sdk";

export default class AnthropicProvider {
  static id = "anthropic";
  static label = "Anthropic Claude";
  static models = {
    flash: "claude-haiku-4-5-20251001",
    pro: "claude-sonnet-4-6",
  };

  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt, modelTier = "flash", options = {}) {
    const modelName = AnthropicProvider.models[modelTier] || AnthropicProvider.models.flash;
    const response = await this.client.messages.create({
      model: modelName,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      messages: [{ role: "user", content: prompt }],
    });
    return response.content[0].text;
  }
}
