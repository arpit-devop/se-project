import Medicine from '../models/Medicine.js';
import ReorderRequest from '../models/ReorderRequest.js';
import Prescription from '../models/Prescription.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * World's Best RAG-Powered AI Chatbot for Pharmacy Inventory Management
 * Features:
 * - Retrieval Augmented Generation (RAG) with OpenRouter API
 * - Intelligent data retrieval from database
 * - Context-aware responses with real-time inventory data
 * - Natural language understanding
 * - Proactive recommendations
 */

class AIChatbot {
  constructor() {
    this.sessionContext = new Map();
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY;
    this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.useAI = !!this.openRouterApiKey;
    
    if (this.useAI) {
      console.log('[AIChatbot] ✅ OpenRouter API enabled - RAG System Active');
    } else {
      console.log('[AIChatbot] ⚠️ OpenRouter API not configured');
      console.log('[AIChatbot] 💡 Add OPENROUTER_API_KEY to .env to enable RAG system');
    }
  }

  // Main chat handler - Always uses RAG if API key is available
  async processMessage(message, sessionId, userId) {
    const originalMessage = message.trim();
    
    // Get or create session context
    if (!this.sessionContext.has(sessionId)) {
      this.sessionContext.set(sessionId, {
        history: [],
        lastIntent: null,
        userPreferences: {}
      });
    }
    
    const context = this.sessionContext.get(sessionId);
    context.history.push({ role: 'user', message: originalMessage });

    // Always try RAG system first if API key is available
    if (this.useAI) {
      try {
        const aiResponse = await this.getRAGResponse(originalMessage, context, userId);
        if (aiResponse && aiResponse.trim()) {
          context.history.push({ role: 'bot', message: aiResponse });
          if (context.history.length > 20) {
            context.history = context.history.slice(-20);
          }
          return {
            response: aiResponse.trim(),
            intent: 'rag_generated',
            suggestions: this.generateSuggestions('general')
          };
        }
      } catch (error) {
        console.error('[AIChatbot] RAG error:', error.message);
        // Fall through to rule-based system
      }
    }

    // Fallback to intelligent rule-based system
    const normalizedMessage = originalMessage.toLowerCase();
    const intent = this.detectIntent(normalizedMessage, context);
    context.lastIntent = intent;

    let response = '';
    
    switch (intent.type) {
      case 'greeting':
        response = this.handleGreeting(context);
        break;
      case 'inventory_query':
        response = await this.handleInventoryQuery(intent, userId);
        break;
      case 'stock_check':
        response = await this.handleStockCheck(intent, userId);
        break;
      case 'low_stock':
        response = await this.handleLowStockAlert(userId);
        break;
      case 'medicine_search':
        response = await this.handleMedicineSearch(intent, userId);
        break;
      case 'category_query':
        response = await this.handleCategoryQuery(intent, userId);
        break;
      case 'expiry_check':
        response = await this.handleExpiryCheck(userId);
        break;
      case 'reorder_suggestion':
        response = await this.handleReorderSuggestions(userId);
        break;
      case 'analytics':
        response = await this.handleAnalyticsQuery(intent, userId);
        break;
      case 'help':
        response = this.handleHelp();
        break;
      case 'conversational':
        response = this.handleConversational(normalizedMessage, context);
        break;
      default:
        response = await this.handleGeneralQuery(normalizedMessage, userId);
    }

    context.history.push({ role: 'bot', message: response });
    
    if (context.history.length > 20) {
      context.history = context.history.slice(-20);
    }

    return {
      response: response.trim(),
      intent: intent.type,
      suggestions: this.generateSuggestions(intent.type)
    };
  }

  // RAG System - Retrieval Augmented Generation
  async getRAGResponse(message, context, userId) {
    try {
      console.log('[RAG] Retrieving relevant data for query...');
      
      // Step 1: Retrieve all relevant data from database
      const retrievedData = await this.retrieveRelevantData(message);
      
      // Step 2: Build comprehensive context
      const ragContext = this.buildRAGContext(retrievedData, message);
      
      // Step 3: Build conversation history
      const conversationHistory = context.history.slice(-8).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));

      // Step 4: Create system prompt with RAG context
      const systemPrompt = this.createRAGSystemPrompt(ragContext);

      // Step 5: Call OpenRouter API
      console.log('[RAG] Calling OpenRouter API...');
      const response = await fetch(this.openRouterUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pharmaventory.com',
          'X-Title': 'Pharmaventory RAG Assistant'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[RAG] API error:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        console.log('[RAG] Response generated successfully');
        return data.choices[0].message.content;
      }

      return null;
    } catch (error) {
      console.error('[RAG] Request failed:', error);
      return null;
    }
  }

  // Retrieve relevant data based on query
  async retrieveRelevantData(query) {
    const queryLower = query.toLowerCase();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Get all medicines
    let medicines = await Medicine.find({}).sort({ name: 1 });
    
    // If query mentions specific medicine, search for it
    const medicineKeywords = this.extractMedicineKeywords(query);
    if (medicineKeywords.length > 0) {
      const searchRegex = new RegExp(medicineKeywords.join('|'), 'i');
      medicines = medicines.filter(m => 
        searchRegex.test(m.name) || 
        searchRegex.test(m.generic_name) ||
        searchRegex.test(m.category) ||
        searchRegex.test(m.manufacturer)
      );
    }

    // Get low stock items
    const lowStock = medicines.filter(m => m.quantity <= m.reorder_level);
    
    // Get expiring items
    const expired = medicines.filter(m => m.expiry_date < now);
    const expiringSoon = medicines.filter(m => 
      m.expiry_date >= now && m.expiry_date <= thirtyDaysFromNow
    );
    const expiringIn90Days = medicines.filter(m => 
      m.expiry_date > thirtyDaysFromNow && m.expiry_date <= ninetyDaysFromNow
    );

    // Get categories
    const categories = [...new Set(medicines.map(m => m.category))];
    
    // Calculate statistics
    const totalValue = medicines.reduce((sum, m) => sum + (m.quantity * m.unit_price), 0);
    const totalQuantity = medicines.reduce((sum, m) => sum + m.quantity, 0);

    // Get reorder requests if query mentions it
    let reorderRequests = [];
    if (queryLower.includes('reorder') || queryLower.includes('order') || queryLower.includes('request')) {
      reorderRequests = await ReorderRequest.find({ status: 'pending' }).limit(10);
    }

    return {
      medicines: medicines.slice(0, 100), // Limit to 100 for context
      lowStock,
      expired,
      expiringSoon,
      expiringIn90Days,
      categories,
      statistics: {
        totalMedicines: medicines.length,
        totalValue,
        totalQuantity,
        lowStockCount: lowStock.length,
        expiredCount: expired.length,
        expiringSoonCount: expiringSoon.length
      },
      reorderRequests
    };
  }

  // Extract medicine keywords from query
  extractMedicineKeywords(query) {
    const commonMedicines = [
      'paracetamol', 'aspirin', 'ibuprofen', 'amoxicillin', 'azithromycin',
      'metformin', 'insulin', 'atorvastatin', 'omeprazole', 'levothyroxine',
      'amlodipine', 'metoprolol', 'losartan', 'sertraline', 'gabapentin',
      'dolo', 'crocin', 'calpol', 'combiflam', 'vicks'
    ];

    const words = query.toLowerCase().split(/\s+/);
    const found = [];

    // Check for common medicine names
    commonMedicines.forEach(med => {
      if (query.toLowerCase().includes(med)) {
        found.push(med);
      }
    });

    // Extract potential medicine names (words that might be medicine names)
    words.forEach(word => {
      if (word.length > 3 && !['the', 'what', 'where', 'when', 'how', 'show', 'list', 'find', 'check'].includes(word)) {
        found.push(word);
      }
    });

    return [...new Set(found)];
  }

  // Build RAG context string
  buildRAGContext(data, query) {
    let context = `=== PHARMACY INVENTORY DATABASE CONTEXT ===\n\n`;
    
    // Statistics
    context += `📊 INVENTORY STATISTICS:\n`;
    context += `- Total Medicines: ${data.statistics.totalMedicines}\n`;
    context += `- Total Inventory Value: ₹${data.statistics.totalValue.toLocaleString()}\n`;
    context += `- Total Stock Units: ${data.statistics.totalQuantity.toLocaleString()}\n`;
    context += `- Low Stock Items: ${data.statistics.lowStockCount}\n`;
    context += `- Expired Items: ${data.statistics.expiredCount}\n`;
    context += `- Expiring Soon (30 days): ${data.statistics.expiringSoonCount}\n`;
    context += `- Categories: ${data.categories.length} (${data.categories.slice(0, 10).join(', ')}${data.categories.length > 10 ? '...' : ''})\n\n`;

    // Low Stock Items
    if (data.lowStock.length > 0) {
      context += `⚠️ LOW STOCK ITEMS (Need Reordering):\n`;
      data.lowStock.slice(0, 15).forEach(med => {
        const percentage = Math.round((med.quantity / med.reorder_level) * 100);
        context += `- ${med.name} (${med.generic_name}): ${med.quantity} ${med.unit} (${percentage}% of reorder level ${med.reorder_level} ${med.unit})\n`;
        context += `  Category: ${med.category} | Location: ${med.location} | Price: ₹${med.unit_price}/${med.unit}\n`;
      });
      context += `\n`;
    }

    // Expiring Soon
    if (data.expiringSoon.length > 0) {
      context += `📅 EXPIRING SOON (Next 30 Days):\n`;
      data.expiringSoon.slice(0, 15).forEach(med => {
        const daysLeft = Math.ceil((med.expiry_date - new Date()) / (1000 * 60 * 60 * 24));
        context += `- ${med.name}: Expires in ${daysLeft} days (${med.quantity} ${med.unit} remaining)\n`;
        context += `  Location: ${med.location} | Batch: ${med.batch_number}\n`;
      });
      context += `\n`;
    }

    // Expired Items
    if (data.expired.length > 0) {
      context += `🚨 EXPIRED ITEMS (Remove from inventory):\n`;
      data.expired.slice(0, 10).forEach(med => {
        const daysAgo = Math.ceil((new Date() - med.expiry_date) / (1000 * 60 * 60 * 24));
        context += `- ${med.name}: Expired ${daysAgo} days ago (${med.quantity} ${med.unit})\n`;
      });
      context += `\n`;
    }

    // All Medicines (if query is about inventory or search)
    if (data.medicines.length > 0 && data.medicines.length <= 50) {
      context += `📦 ALL MEDICINES IN INVENTORY:\n`;
      data.medicines.forEach(med => {
        const stockStatus = med.quantity > med.reorder_level ? '✅' : '⚠️';
        const daysUntilExpiry = Math.ceil((med.expiry_date - new Date()) / (1000 * 60 * 60 * 24));
        context += `${stockStatus} ${med.name} (${med.generic_name})\n`;
        context += `   Stock: ${med.quantity} ${med.unit} | Reorder Level: ${med.reorder_level} ${med.unit}\n`;
        context += `   Category: ${med.category} | Location: ${med.location}\n`;
        context += `   Manufacturer: ${med.manufacturer} | Price: ₹${med.unit_price}/${med.unit}\n`;
        if (daysUntilExpiry > 0 && daysUntilExpiry < 90) {
          context += `   Expiry: ${daysUntilExpiry} days (${med.expiry_date.toLocaleDateString()})\n`;
        } else if (daysUntilExpiry > 0) {
          context += `   Expiry: ${med.expiry_date.toLocaleDateString()}\n`;
        }
        context += `\n`;
      });
    } else if (data.medicines.length > 50) {
      context += `📦 SAMPLE MEDICINES (${data.medicines.length} total in inventory):\n`;
      data.medicines.slice(0, 20).forEach(med => {
        const stockStatus = med.quantity > med.reorder_level ? '✅' : '⚠️';
        context += `${stockStatus} ${med.name} (${med.generic_name}): ${med.quantity} ${med.unit} | ${med.category} | ${med.location}\n`;
      });
      context += `\n...and ${data.medicines.length - 20} more medicines.\n\n`;
    }

    // Reorder Requests
    if (data.reorderRequests.length > 0) {
      context += `🛒 PENDING REORDER REQUESTS:\n`;
      data.reorderRequests.forEach(req => {
        context += `- ${req.medicine_name}: Requested ${req.requested_quantity} units (Current: ${req.current_quantity})\n`;
        context += `  Status: ${req.status} | Requested by: ${req.requested_by}\n`;
      });
      context += `\n`;
    }

    return context;
  }

  // Create RAG system prompt
  createRAGSystemPrompt(ragContext) {
    return `You are an intelligent AI Pharmacy Assistant powered by Retrieval Augmented Generation (RAG). You have access to real-time pharmacy inventory data and can answer any question about medicines, stock levels, expiry dates, categories, locations, and inventory management.

${ragContext}

YOUR CAPABILITIES:
1. Answer questions about any medicine in the inventory (stock, location, expiry, price, category)
2. Identify low stock items and suggest reordering
3. Track expiry dates and alert about expiring medicines
4. Provide inventory analytics and insights
5. Search medicines by name, generic name, category, or manufacturer
6. Help with inventory management decisions
7. Answer general questions about pharmacy operations

RESPONSE GUIDELINES:
- Be helpful, professional, and accurate
- Use the provided inventory data to give precise answers
- Format responses clearly with bullet points, emojis, and structure
- If asked about specific medicines, provide ALL available details
- For low stock items, suggest reorder quantities
- For expiring items, provide urgency level
- Always use actual data from the inventory context above
- If data is not available in context, say so clearly
- Provide actionable insights and recommendations

IMPORTANT:
- All numbers and data must be accurate based on the inventory context
- Never make up medicine names or data
- If a medicine is not in the inventory, clearly state that
- Use ₹ for currency (Indian Rupees)
- Format dates clearly (e.g., "Expires in 15 days" or "Expired 5 days ago")

Answer the user's question using the inventory data provided above. Be comprehensive and helpful.`;
  }

  // Intent Detection (for fallback)
  detectIntent(message, context) {
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/.test(message)) {
      return { type: 'greeting', confidence: 0.95 };
    }
    if (/(how many|total|count|list|show|display|what medicines|inventory|stock)/.test(message)) {
      if (/(low|running out|need to order|reorder|out of stock)/.test(message)) {
        return { type: 'low_stock', confidence: 0.9 };
      }
      return { type: 'inventory_query', confidence: 0.85 };
    }
    if (/(stock|quantity|available|how much|left|remaining)/.test(message)) {
      const medicineMatch = this.extractMedicineName(message);
      if (medicineMatch) {
        return { type: 'stock_check', medicine: medicineMatch, confidence: 0.9 };
      }
    }
    if (/(find|search|look for|where is|locate|get me)/.test(message)) {
      const medicineMatch = this.extractMedicineName(message);
      if (medicineMatch) {
        return { type: 'medicine_search', medicine: medicineMatch, confidence: 0.9 };
      }
    }
    if (/(category|categories|type|kind|class)/.test(message)) {
      return { type: 'category_query', confidence: 0.85 };
    }
    if (/(expir|expiring|expired|expiry date|going bad|soon to expire)/.test(message)) {
      return { type: 'expiry_check', confidence: 0.9 };
    }
    if (/(reorder|order more|need to buy|purchase|restock|should order)/.test(message)) {
      return { type: 'reorder_suggestion', confidence: 0.9 };
    }
    if (/(analytics|statistics|stats|report|summary|overview|insights|trends)/.test(message)) {
      return { type: 'analytics', confidence: 0.85 };
    }
    if (/(help|what can you|what do you|how can you|assist|support)/.test(message)) {
      return { type: 'help', confidence: 0.9 };
    }
    if (/(how are you|what's up|tell me|explain|describe)/.test(message)) {
      return { type: 'conversational', confidence: 0.7 };
    }
    return { type: 'general', confidence: 0.5 };
  }

  extractMedicineName(message) {
    const medicineKeywords = [
      'paracetamol', 'aspirin', 'ibuprofen', 'amoxicillin', 'azithromycin',
      'metformin', 'insulin', 'atorvastatin', 'omeprazole', 'levothyroxine',
      'amlodipine', 'metoprolol', 'losartan', 'sertraline', 'gabapentin'
    ];

    for (const keyword of medicineKeywords) {
      if (message.includes(keyword)) {
        return keyword;
      }
    }

    const patterns = [
      /(?:stock|quantity|available|find|search|get|locate|where is)\s+(?:of\s+)?([a-z\s]+?)(?:\s|$|,|\.|\?)/i,
      /([a-z\s]+?)\s+(?:stock|quantity|available|medicine|drug|pill|tablet)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted.length > 2 && extracted.length < 50) {
          return extracted;
        }
      }
    }

    return null;
  }

  // Fallback handlers (used when RAG fails)
  handleGreeting(context) {
    const greetings = [
      "Hello! 👋 I'm your AI Pharmacy Assistant with RAG capabilities. I can answer any question about your inventory using real-time data. What would you like to know?",
      "Hi there! I have access to your complete pharmacy inventory. Ask me anything about medicines, stock levels, or inventory management!",
      "Greetings! I'm powered by RAG (Retrieval Augmented Generation) and can provide detailed answers about your pharmacy inventory. How can I help?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  async handleInventoryQuery(intent, userId) {
    try {
      const medicines = await Medicine.find({}).sort({ name: 1 });
      const totalMedicines = medicines.length;
      const totalQuantity = medicines.reduce((sum, med) => sum + med.quantity, 0);
      const categories = [...new Set(medicines.map(m => m.category))];
      const lowStock = medicines.filter(m => m.quantity <= m.reorder_level);
      
      let response = `📊 **Inventory Overview:**\n\n`;
      response += `• Total Medicines: **${totalMedicines}**\n`;
      response += `• Total Stock Units: **${totalQuantity.toLocaleString()}**\n`;
      response += `• Categories: **${categories.length}** (${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''})\n`;
      
      if (lowStock.length > 0) {
        response += `\n⚠️ **Alert:** ${lowStock.length} medicine(s) are running low and need reordering!\n`;
        response += `Top priorities: ${lowStock.slice(0, 3).map(m => m.name).join(', ')}`;
      } else {
        response += `\n✅ All medicines are well-stocked!`;
      }
      
      return response;
    } catch (error) {
      return "I encountered an issue accessing the inventory. Please try again.";
    }
  }

  async handleStockCheck(intent, userId) {
    try {
      const searchTerm = intent.medicine || '';
      const medicines = await Medicine.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { generic_name: { $regex: searchTerm, $options: 'i' } }
        ]
      }).limit(10);

      if (medicines.length === 0) {
        return `I couldn't find "${searchTerm}" in your inventory. Would you like me to search for similar medicines?`;
      }

      if (medicines.length === 1) {
        const med = medicines[0];
        const stockStatus = med.quantity > med.reorder_level ? '✅ Well Stocked' : '⚠️ Low Stock';
        const daysUntilExpiry = Math.ceil((med.expiry_date - new Date()) / (1000 * 60 * 60 * 24));
        
        let response = `📦 **${med.name}** (${med.generic_name})\n\n`;
        response += `• Current Stock: **${med.quantity} ${med.unit}**\n`;
        response += `• Status: ${stockStatus}\n`;
        response += `• Reorder Level: ${med.reorder_level} ${med.unit}\n`;
        response += `• Location: ${med.location}\n`;
        response += `• Category: ${med.category}\n`;
        response += `• Manufacturer: ${med.manufacturer}\n`;
        response += `• Unit Price: ₹${med.unit_price}\n`;
        
        if (daysUntilExpiry > 0 && daysUntilExpiry < 90) {
          response += `\n⚠️ Expires in ${daysUntilExpiry} days!`;
        } else if (daysUntilExpiry > 0) {
          response += `\n📅 Expires: ${med.expiry_date.toLocaleDateString()}`;
        }
        
        if (med.quantity <= med.reorder_level) {
          response += `\n\n💡 **Recommendation:** Consider reordering soon to avoid stockout!`;
        }
        
        return response;
      }

      let response = `I found ${medicines.length} medicines matching "${searchTerm}":\n\n`;
      medicines.forEach((med, idx) => {
        const status = med.quantity > med.reorder_level ? '✅' : '⚠️';
        response += `${idx + 1}. ${status} **${med.name}** - ${med.quantity} ${med.unit} (${med.category})\n`;
      });
      response += `\nWhich one would you like more details about?`;
      
      return response;
    } catch (error) {
      return "I encountered an issue checking stock. Please try again.";
    }
  }

  async handleLowStockAlert(userId) {
    try {
      const medicines = await Medicine.find({});
      const lowStock = medicines.filter(m => m.quantity <= m.reorder_level);
      
      if (lowStock.length === 0) {
        return "✅ Great news! All your medicines are well-stocked. No immediate reordering needed.";
      }

      lowStock.sort((a, b) => (a.quantity / a.reorder_level) - (b.quantity / b.reorder_level));
      
      let response = `⚠️ **Low Stock Alert:** ${lowStock.length} medicine(s) need attention!\n\n`;
      
      lowStock.slice(0, 10).forEach((med, idx) => {
        const percentage = Math.round((med.quantity / med.reorder_level) * 100);
        response += `${idx + 1}. **${med.name}** - ${med.quantity} ${med.unit} (${percentage}% of reorder level)\n`;
        response += `   Category: ${med.category} | Location: ${med.location}\n\n`;
      });
      
      if (lowStock.length > 10) {
        response += `...and ${lowStock.length - 10} more.\n\n`;
      }
      
      response += `💡 **Action Required:** Consider placing reorder requests for these items.`;
      
      return response;
    } catch (error) {
      return "I encountered an issue checking low stock items. Please try again.";
    }
  }

  async handleMedicineSearch(intent, userId) {
    try {
      const searchTerm = intent.medicine || '';
      const medicines = await Medicine.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { generic_name: { $regex: searchTerm, $options: 'i' } },
          { category: { $regex: searchTerm, $options: 'i' } },
          { manufacturer: { $regex: searchTerm, $options: 'i' } }
        ]
      }).limit(15);

      if (medicines.length === 0) {
        return `I couldn't find any medicines matching "${searchTerm}". Try searching by name, generic name, category, or manufacturer.`;
      }

      let response = `🔍 Found ${medicines.length} result(s) for "${searchTerm}":\n\n`;
      
      medicines.forEach((med, idx) => {
        const status = med.quantity > med.reorder_level ? '✅' : '⚠️';
        response += `${idx + 1}. ${status} **${med.name}**\n`;
        response += `   Generic: ${med.generic_name} | Stock: ${med.quantity} ${med.unit}\n`;
        response += `   Category: ${med.category} | Location: ${med.location}\n\n`;
      });
      
      return response;
    } catch (error) {
      return "I encountered an issue searching medicines. Please try again.";
    }
  }

  async handleCategoryQuery(intent, userId) {
    try {
      const medicines = await Medicine.find({});
      const categoryMap = {};
      
      medicines.forEach(med => {
        if (!categoryMap[med.category]) {
          categoryMap[med.category] = { count: 0, totalQuantity: 0, medicines: [] };
        }
        categoryMap[med.category].count++;
        categoryMap[med.category].totalQuantity += med.quantity;
        categoryMap[med.category].medicines.push(med.name);
      });

      const categories = Object.entries(categoryMap)
        .sort((a, b) => b[1].count - a[1].count);

      let response = `📂 **Medicine Categories:**\n\n`;
      
      categories.forEach(([category, data]) => {
        response += `**${category}**\n`;
        response += `• Medicines: ${data.count}\n`;
        response += `• Total Stock: ${data.totalQuantity.toLocaleString()} units\n`;
        response += `• Examples: ${data.medicines.slice(0, 3).join(', ')}${data.medicines.length > 3 ? '...' : ''}\n\n`;
      });
      
      return response;
    } catch (error) {
      return "I encountered an issue retrieving categories. Please try again.";
    }
  }

  async handleExpiryCheck(userId) {
    try {
      const medicines = await Medicine.find({}).sort({ expiry_date: 1 });
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      const expired = medicines.filter(m => m.expiry_date < now);
      const expiringSoon = medicines.filter(m => m.expiry_date >= now && m.expiry_date <= thirtyDays);
      const expiringIn90Days = medicines.filter(m => m.expiry_date > thirtyDays && m.expiry_date <= ninetyDays);

      let response = `📅 **Expiry Status:**\n\n`;
      
      if (expired.length > 0) {
        response += `🚨 **Expired (${expired.length}):**\n`;
        expired.slice(0, 5).forEach(med => {
          const daysAgo = Math.ceil((now - med.expiry_date) / (1000 * 60 * 60 * 24));
          response += `• ${med.name} - Expired ${daysAgo} days ago (${med.quantity} ${med.unit})\n`;
        });
        response += `\n`;
      }
      
      if (expiringSoon.length > 0) {
        response += `⚠️ **Expiring Soon - Next 30 Days (${expiringSoon.length}):**\n`;
        expiringSoon.slice(0, 10).forEach(med => {
          const daysLeft = Math.ceil((med.expiry_date - now) / (1000 * 60 * 60 * 24));
          response += `• ${med.name} - ${daysLeft} days left (${med.quantity} ${med.unit})\n`;
        });
        response += `\n`;
      }
      
      if (expiringIn90Days.length > 0) {
        response += `📋 **Expiring in 90 Days (${expiringIn90Days.length}):**\n`;
        response += `Consider prioritizing these for sale.\n\n`;
      }
      
      if (expired.length === 0 && expiringSoon.length === 0) {
        response += `✅ Great! No medicines are expiring in the next 30 days.`;
      }
      
      return response;
    } catch (error) {
      return "I encountered an issue checking expiry dates. Please try again.";
    }
  }

  async handleReorderSuggestions(userId) {
    try {
      const medicines = await Medicine.find({});
      const needsReorder = medicines.filter(m => m.quantity <= m.reorder_level);
      
      if (needsReorder.length === 0) {
        return "✅ All medicines are well-stocked! No reordering needed at this time.";
      }

      needsReorder.sort((a, b) => {
        const urgencyA = a.quantity / a.reorder_level;
        const urgencyB = b.quantity / b.reorder_level;
        return urgencyA - urgencyB;
      });

      let response = `🛒 **Reorder Recommendations:**\n\n`;
      response += `I've identified ${needsReorder.length} medicine(s) that need reordering:\n\n`;
      
      needsReorder.slice(0, 10).forEach((med, idx) => {
        const suggestedQty = Math.max(med.reorder_level * 3, 100);
        const urgency = med.quantity / med.reorder_level;
        const urgencyLevel = urgency < 0.5 ? '🚨 Critical' : urgency < 0.8 ? '⚠️ High' : '📋 Medium';
        
        response += `${idx + 1}. ${urgencyLevel} **${med.name}**\n`;
        response += `   Current: ${med.quantity} ${med.unit} | Reorder Level: ${med.reorder_level} ${med.unit}\n`;
        response += `   💡 Suggested Order: ${suggestedQty} ${med.unit} (₹${(suggestedQty * med.unit_price).toLocaleString()})\n\n`;
      });
      
      response += `💼 **Total Estimated Cost:** ₹${needsReorder.slice(0, 10).reduce((sum, med) => {
        const qty = Math.max(med.reorder_level * 3, 100);
        return sum + (qty * med.unit_price);
      }, 0).toLocaleString()}\n\n`;
      response += `Would you like me to help you create reorder requests for these?`;
      
      return response;
    } catch (error) {
      return "I encountered an issue generating reorder suggestions. Please try again.";
    }
  }

  async handleAnalyticsQuery(intent, userId) {
    try {
      const medicines = await Medicine.find({});
      const totalValue = medicines.reduce((sum, m) => sum + (m.quantity * m.unit_price), 0);
      const categories = [...new Set(medicines.map(m => m.category))];
      const lowStock = medicines.filter(m => m.quantity <= m.reorder_level);
      const expiringSoon = medicines.filter(m => {
        const daysUntilExpiry = (m.expiry_date - new Date()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      });

      let response = `📊 **Inventory Analytics:**\n\n`;
      response += `**Overview:**\n`;
      response += `• Total Medicines: ${medicines.length}\n`;
      response += `• Total Inventory Value: ₹${totalValue.toLocaleString()}\n`;
      response += `• Categories: ${categories.length}\n`;
      response += `• Average Stock per Medicine: ${Math.round(medicines.reduce((sum, m) => sum + m.quantity, 0) / medicines.length)}\n\n`;
      
      response += `**Health Metrics:**\n`;
      response += `• Low Stock Items: ${lowStock.length} (${Math.round(lowStock.length / medicines.length * 100)}%)\n`;
      response += `• Expiring Soon: ${expiringSoon.length}\n`;
      response += `• Well Stocked: ${medicines.length - lowStock.length} (${Math.round((medicines.length - lowStock.length) / medicines.length * 100)}%)\n\n`;
      
      const categoryValue = {};
      medicines.forEach(m => {
        if (!categoryValue[m.category]) categoryValue[m.category] = 0;
        categoryValue[m.category] += m.quantity * m.unit_price;
      });
      
      const topCategories = Object.entries(categoryValue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      response += `**Top Categories by Value:**\n`;
      topCategories.forEach(([cat, value], idx) => {
        response += `${idx + 1}. ${cat}: ₹${value.toLocaleString()}\n`;
      });
      
      return response;
    } catch (error) {
      return "I encountered an issue generating analytics. Please try again.";
    }
  }

  handleHelp() {
    return `🤖 **I can help you with:**\n\n` +
      `📦 **Inventory Management:**\n` +
      `• "Show me all medicines"\n` +
      `• "What's the stock of [medicine name]?"\n` +
      `• "List low stock items"\n\n` +
      `🔍 **Search & Find:**\n` +
      `• "Find [medicine name]"\n` +
      `• "Search medicines in [category]"\n` +
      `• "Where is [medicine] located?"\n\n` +
      `📊 **Analytics & Insights:**\n` +
      `• "Show analytics"\n` +
      `• "What medicines are expiring?"\n` +
      `• "Give me reorder suggestions"\n\n` +
      `💡 **Just ask naturally!** I understand context and can help with complex queries too.`;
  }

  handleConversational(message, context) {
    if (/(how are you|what's up)/.test(message)) {
      return "I'm doing great! Ready to help you manage your pharmacy inventory efficiently. What would you like to know? 😊";
    }
    
    if (/(tell me about|explain|describe)/.test(message)) {
      return "I'm your AI Pharmacy Assistant powered by RAG! I help you manage inventory, track stock levels, identify low-stock items, check expiry dates, and provide smart recommendations. Ask me anything about your pharmacy inventory!";
    }
    
    return "I'm here to help with your pharmacy inventory! Try asking me about stock levels, medicine availability, or inventory insights. What would you like to know?";
  }

  async handleGeneralQuery(message, userId) {
    const medicines = await Medicine.find({}).limit(5);
    
    if (medicines.length > 0) {
      return `I'm here to help with your pharmacy inventory! I can assist with:\n\n` +
        `• Stock levels and availability\n` +
        `• Medicine search and location\n` +
        `• Low stock alerts\n` +
        `• Expiry date tracking\n` +
        `• Reorder recommendations\n` +
        `• Inventory analytics\n\n` +
        `Try asking something like "Show me low stock items" or "What medicines do we have?"`;
    }
    
    return "I'm your AI Pharmacy Assistant! I can help you manage inventory, check stock levels, find medicines, and provide smart recommendations. What would you like to know?";
  }

  generateSuggestions(intentType) {
    const suggestions = {
      greeting: ["Show inventory", "Check low stock", "Medicine search"],
      inventory_query: ["Low stock items", "Expiring soon", "Analytics"],
      stock_check: ["Search another medicine", "Show all medicines", "Low stock alert"],
      low_stock: ["Reorder suggestions", "Inventory analytics", "Category overview"],
      medicine_search: ["Stock check", "Category search", "Low stock items"],
      category_query: ["Medicine search", "Inventory overview", "Analytics"],
      expiry_check: ["Reorder suggestions", "Low stock items", "Analytics"],
      reorder_suggestion: ["Low stock items", "Inventory overview", "Analytics"],
      analytics: ["Low stock items", "Expiry check", "Reorder suggestions"],
      help: ["Show inventory", "Check stock", "Low stock alert"],
      general: ["Show inventory", "Low stock items", "Help"],
      rag_generated: ["Show more details", "Check another medicine", "Analytics"]
    };
    
    return suggestions[intentType] || suggestions.general;
  }

  cleanupSessions(maxAge = 3600000) {
    const now = Date.now();
    for (const [sessionId, context] of this.sessionContext.entries()) {
      if (context.lastActivity && (now - context.lastActivity) > maxAge) {
        this.sessionContext.delete(sessionId);
      }
    }
  }
}

export default new AIChatbot();
