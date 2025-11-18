import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { randomUUID } from 'crypto';
import aiChatbot from '../services/aiChatbot.js';

const router = express.Router();

router.use(authenticateToken);

// World's Best AI Chatbot for Pharmacy Inventory
router.post('/', async (req, res) => {
  try {
    const { message, session_id } = req.body;
    const userId = req.user?.id || req.user?.email || 'anonymous';
    const sessionId = session_id || randomUUID();

    if (!message || !message.trim()) {
      return res.json({
        response: "Please send me a message! I'm here to help with your pharmacy inventory. 😊",
        session_id: sessionId,
        intent: 'error'
      });
    }

    console.log(`[Chat] Processing message from user ${userId}, session ${sessionId}:`, message.substring(0, 50));

    // Process message with AI chatbot
    const result = await aiChatbot.processMessage(message.trim(), sessionId, userId);

    console.log(`[Chat] Response generated, intent: ${result.intent}`);

    res.json({
      response: result.response,
      session_id: sessionId,
      intent: result.intent,
      suggestions: result.suggestions
    });
  } catch (error) {
    console.error('[Chat] Error processing message:', error);
    console.error('[Chat] Error stack:', error.stack);
    res.json({
      response: "I encountered an issue processing your request. Please try again, or ask me something like 'Show inventory' or 'Check low stock'.",
      session_id: req.body.session_id || randomUUID(),
      intent: 'error'
    });
  }
});

export default router;

