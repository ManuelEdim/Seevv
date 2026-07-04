import { Mistral } from "@mistralai/mistralai";

export default class MistralProvider {
  static id = "mistral";
  static label = "Mistral AI";
  static models = {
    flash: "mistral-small-latest",
    pro: "mistral-large-latest",
  };

  constructor(apiKey) {
    this.client = new Mistral({ apiKey });
  }

  async generate(prompt, modelTier = "flash", options = {}) {
    const modelName = MistralProvider.models[modelTier] || MistralProvider.models.flash;
    const response = await this.client.chat.complete({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 4096,
      ...(options.json ? { responseFormat: { type: "json_object" } } : {}),
    });
    return response.choices[0].message.content;
  }
}
