import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';

export const getAIResponse = async (prompt: string) => {
  try {
    const response = await axios.post(OLLAMA_URL, {
      model: 'phi3',
      prompt: `You are a helpful assistant for Jungle Chama, a community savings and investment platform. 
      Answer the user's question concisely. If you don't know the answer or it's too complex, say "I'm sorry, I don't have enough information to answer that. Let me connect you with a human admin."
      
      User: ${prompt}
      Assistant:`,
      stream: false
    });

    return response.data.response;
  } catch (error) {
    console.error('Ollama Error:', error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later or contact an admin.";
  }
};
