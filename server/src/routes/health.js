import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Seevv API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// List available models
router.get("/models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
    );
    const data = await response.json();
    const models = data.models
      ?.filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name);
    res.json({ available_models: models });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Test AI connection
router.get("/ai", async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const result = await model.generateContent(
      "Say 'Seevv AI is connected' and nothing else.",
    );
    const text = result.response.text();
    res.json({ status: "ok", message: text.trim() });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
