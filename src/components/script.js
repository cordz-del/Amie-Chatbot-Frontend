import { OPENAI_API_KEY, DEEPGRAM_API_KEY } from '../config/keys';

class ChatAssistant {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.synth = window.speechSynthesis;
    this.chatbox = null;
    this.inputField = null;
    this.sendButton = null;
    this.micButton = null;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
    }

    this.init = this.init.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.speakWithDeepgram = this.speakWithDeepgram.bind(this);
    this.speakWithBrowser = this.speakWithBrowser.bind(this);
  }

  async handleMessage(userInput) {
    if (!userInput.trim()) return;
    
    this.addMessage(userInput, true);
    this.inputField.value = '';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are Amie, a Social and Emotional Learning Assistant. Provide helpful, empathetic responses."
            },
            {
              role: "user",
              content: userInput
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      this.addMessage(aiResponse, false);
      await this.speakWithDeepgram(aiResponse);

    } catch (error) {
      console.error('Error:', error);
      this.addMessage("I apologize, but I'm having trouble connecting right now. Please try again.", false);
    }
  }

  async speakWithDeepgram(text) {
    try {
      const response = await fetch('https://api.deepgram.com/v1/speak', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${import.meta.env.VITE_DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: "alloy"
        })
      });

      if (!response.ok) {
        throw new Error(`Deepgram API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
      URL.revokeObjectURL(audioUrl);

    } catch (error) {
      console.error('TTS Error:', error);
      this.speakWithBrowser(text);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const chatAssistant = new ChatAssistant();
  chatAssistant.init();
});

export default ChatAssistant;
