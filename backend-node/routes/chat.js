import express from 'express';
import Medicine from '../models/Medicine.js';
import { authenticateToken } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

router.use(authenticateToken);

// AI Chatbot (placeholder - AI integration can be added later)
router.post('/', async (req, res) => {
  try {
    const { message, session_id } = req.body;
    const sessionId = session_id || randomUUID();

    // Get medicine data for context
    const medicines = await Medicine.find({}).limit(20);

    let medicine_context = 'Available medicines in inventory:\n';
    medicines.forEach(med => {
      medicine_context += `- ${med.name} (${med.generic_name}): ${med.quantity} ${med.unit}, Category: ${med.category}\n`;
    });

    // Placeholder response - AI integration can be added here
    const response = `AI chat is not available in this environment. However, I can see you have ${medicines.length} medicines in inventory.`;

    res.json({
      response,
      session_id: sessionId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({
      response: "I'm here to help with medicine inventory queries. Please try again.",
      session_id: req.body.session_id || randomUUID()
    });
  }
});

export default router;

