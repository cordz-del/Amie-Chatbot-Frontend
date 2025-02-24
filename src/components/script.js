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

    // Initialize speech recognition
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

  init() {
    this.chatbox = document.querySelector('.chatbox');
    this.inputField = document.querySelector('.input-field');
    this.sendButton = document.querySelector('.send-btn');
    this.micButton = document.querySelector('.mic-btn');

    if (!this.chatbox || !this.inputField || !this.sendButton || !this.micButton) {
      console.error('Required elements not found');
      return;
    }

    this.setupEventListeners();
    this.showInitialGreeting();
  }

  addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
    messageDiv.textContent = text;
    this.chatbox.appendChild(messageDiv);
    this.chatbox.scrollTop = this.chatbox.scrollHeight;
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
      URL.revokeObjectURL(audioUrl); // Clean up the URL after playing

    } catch (error) {
      console.error('TTS Error:', error);
      this.speakWithBrowser(text);
    }
  }

  speakWithBrowser(text) {
    if (!this.synth) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Wait for voices to be loaded
    const setVoice = () => {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(voice =>
          voice.lang.includes('en') && voice.name.includes('Female')
        ) || voices[0];
        utterance.voice = preferredVoice;
      }
    };

    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = setVoice;
    }

    setVoice();
    this.synth.speak(utterance);
  }

  setupEventListeners() {
    this.sendButton.addEventListener('click', () => {
      this.handleMessage(this.inputField.value);
    });

    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleMessage(this.inputField.value);
      }
    });

    if (this.recognition) {
      this.setupSpeechRecognition();
    }
  }

  setupSpeechRecognition() {
    this.recognition.addEventListener('result', (event) => {
      const lastResultIndex = event.results.length - 1;
      const text = event.results[lastResultIndex][0].transcript;
      this.handleMessage(text);
    });

    this.recognition.addEventListener('error', (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.micButton.classList.remove('listening');
    });

    this.recognition.addEventListener('end', () => {
      this.isListening = false;
      this.micButton.classList.remove('listening');
    });

    this.micButton.addEventListener('click', () => {
      if (!this.isListening) {
        this.recognition.start();
        this.isListening = true;
        this.micButton.classList.add('listening');
      } else {
        this.recognition.stop();
        this.isListening = false;
        this.micButton.classList.remove('listening');
      }
    });
  }

  showInitialGreeting() {
    const initialGreeting = "Hello! I'm Amie, your Social and Emotional Learning Assistant. How can I help you today?";
    this.addMessage(initialGreeting, false);
    this.speakWithDeepgram(initialGreeting);
  }
}

// Initialize the chat assistant when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const chatAssistant = new ChatAssistant();
  chatAssistant.init();
});

export default ChatAssistant;
