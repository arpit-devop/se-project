import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import Medicine from '../models/Medicine.js';

dotenv.config();

const router = express.Router();

router.use(authenticateToken);

// Simple Chatbot with OpenRouter API
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

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      // Fallback response if API key is not set
      const medicines = await Medicine.find({}).limit(10);
      return res.json({
        response: `I can help you with pharmacy inventory queries. Currently, I can see you have ${medicines.length} medicine(s) in inventory. To enable AI responses, please add OPENROUTER_API_KEY to your .env file.`,
        session_id: sessionId,
        intent: 'fallback'
      });
    }

    // Get basic inventory data for context
    const medicines = await Medicine.find({}).limit(20);
    const totalMedicines = medicines.length;
    const lowStock = medicines.filter(m => m.quantity <= m.reorder_level);

    // Build context
    let context = `You are a helpful Pharmacy Assistant. Here's basic inventory information:\n\n`;
    context += `Total Medicines: ${totalMedicines}\n`;
    context += `Low Stock Items: ${lowStock.length}\n\n`;
    
    if (medicines.length > 0) {
      context += `Sample Medicines:\n`;
      medicines.slice(0, 10).forEach(med => {
        context += `- ${med.name} (${med.generic_name}): ${med.quantity} ${med.unit}, Category: ${med.category}\n`;
      });
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pharmaventory.com',
        'X-Title': 'Pharmaventory Assistant'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${context}\n\nYou are a friendly Pharmacy Assistant. Answer questions about medicines, inventory, and provide basic information. Be concise and helpful. Use emojis sparingly.`
          },
          {
            role: 'user',
            content: message.trim()
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      
      // Fallback response
      const medicines = await Medicine.find({}).limit(10);
      return res.json({
        response: `I can help you with pharmacy inventory. You have ${medicines.length} medicine(s) in inventory. Please try asking about specific medicines or inventory details.`,
        session_id: sessionId,
        intent: 'fallback'
      });
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return res.json({
        response: data.choices[0].message.content,
        session_id: sessionId,
        intent: 'ai_generated',
        suggestions: ['Show inventory', 'Low stock items', 'Medicine search']
      });
    }

    // Final fallback
    return res.json({
      response: "I'm here to help with your pharmacy inventory. Ask me about medicines, stock levels, or inventory details!",
      session_id: sessionId,
      intent: 'fallback'
    });

  } catch (error) {
    console.error('[Chat] Error:', error);
    res.json({
      response: "I encountered an issue. Please try again or ask me about your pharmacy inventory.",
      session_id: req.body.session_id || randomUUID(),
      intent: 'error'
    });
  }
});

export default router;
