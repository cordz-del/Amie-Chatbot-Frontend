// src/utils/apiBridge.js

class ApiBridge {
  constructor() {
    // Use environment variables for security
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.deepgramApiKey = process.env.REACT_APP_DEEPGRAM_API_KEY;
    
    if (!this.openaiApiKey || !this.deepgramApiKey) {
      console.error("API keys are not set properly in environment variables.");
    }
  }

  async sendToOpenAI(message, context) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are Amie, a nurturing and understanding female chatbot designed to help ${context.age <= 12 ? 'children' : 'people'} with social and emotional learning. Your voice is kind, warm, and supportive.`
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error("Unexpected response format from OpenAI");
      }
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  async synthesizeSpeech(text) {
    try {
      const response = await fetch('https://api.deepgram.com/v1/speak', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.deepgramApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice: "alloy",
          speed: 0.9,
          pitch: 1.0
        })
      });

      if (!response.ok) {
        throw new Error(`Deepgram API error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Deepgram API Error:', error);
      throw error;
    }
  }
}

export default ApiBridge;
