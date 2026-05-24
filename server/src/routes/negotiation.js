import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { generateNegotiationCoaching, simulateNegotiationRoleplay } from "../lib/ai.js";

const router = Router();
router.use(authMiddleware);

// POST /api/negotiation/coach
// Full negotiation strategy: market range, script, email, objection handlers
router.post("/coach", async (req, res) => {
  const { roleTitle, company, location, offeredSalary, currency, experience, targetSalary } = req.body;

  if (!roleTitle || !offeredSalary || !currency) {
    return res.status(400).json({ error: "roleTitle, offeredSalary, and currency are required" });
  }

  try {
    const coaching = await generateNegotiationCoaching(
      roleTitle, company, location, offeredSalary, currency, experience, targetSalary,
    );
    res.json({ success: true, coaching });
  } catch (err) {
    console.error("Negotiation coach error:", err);
    res.status(500).json({ error: "Failed to generate negotiation coaching. Please try again." });
  }
});

// POST /api/negotiation/roleplay
// Simulates a recruiter response in a negotiation roleplay conversation
router.post("/roleplay", async (req, res) => {
  const { userMessage, context, history } = req.body;

  if (!userMessage) return res.status(400).json({ error: "userMessage is required" });

  try {
    const response = await simulateNegotiationRoleplay(userMessage, context, history);
    res.json({ success: true, response });
  } catch (err) {
    console.error("Roleplay error:", err);
    res.status(500).json({ error: "Roleplay failed. Please try again." });
  }
});

export default router;
