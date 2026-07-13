const groqProvider = require('./groq.provider');
const ollamaProvider = require('./ollama.provider');

/**
 * AI Service trung gian để quản lý việc gọi các LLM providers
 */
const generateContent = async (prompt) => {
  const provider = process.env.AI_PROVIDER || 'groq';
  const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

  console.time("[Chatbot AI] Generate");

  if (provider === 'groq') {
    console.log('[AI Provider]: groq');
    console.log('[AI Model]:', groqModel);
    try {
      // Gọi Groq với timeout 8 giây
      const response = await groqProvider.generateResponse(prompt, 8000);
      console.timeEnd("[Chatbot AI] Generate");
      console.log('[AI Response]:', response);
      return response;
    } catch (error) {
      console.error('[AI Service] Groq error, falling back to Ollama:', error.message);
      
      // Fallback sang Ollama
      console.log('[AI Provider] (Fallback): ollama');
      console.log('[AI Model] (Fallback):', ollamaModel);
      try {
        const response = await ollamaProvider.generateResponse(prompt, 15000);
        console.timeEnd("[Chatbot AI] Generate");
        console.log('[AI Response]:', response);
        return response;
      } catch (ollamaError) {
        console.timeEnd("[Chatbot AI] Generate");
        console.error('[AI Service] Fallback Ollama error:', ollamaError.message);
        throw ollamaError;
      }
    }
  } else {
    // Mặc định gọi Ollama
    console.log('[AI Provider]: ollama');
    console.log('[AI Model]:', ollamaModel);
    try {
      const response = await ollamaProvider.generateResponse(prompt, 15000);
      console.timeEnd("[Chatbot AI] Generate");
      console.log('[AI Response]:', response);
      return response;
    } catch (error) {
      console.timeEnd("[Chatbot AI] Generate");
      console.error('[AI Service] Ollama error:', error.message);
      throw error;
    }
  }
};

module.exports = { generateContent };
