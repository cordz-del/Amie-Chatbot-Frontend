let recognition;
let isListening = false;
const synth = window.speechSynthesis;

// Initialize speech recognition if available
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
}

document.addEventListener('DOMContentLoaded', () => {
  const chatbox = document.querySelector('.chatbox');
  const inputField = document.querySelector('.input-field');
  const sendButton = document.querySelector('.send-btn');
  const micButton = document.querySelector('.mic-btn');

  // Function to add messages to the chatbox
  function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
    messageDiv.textContent = text;
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  // Handle sending a message to the OpenAI API
  async function handleMessage(userInput) {
    if (!userInput.trim()) return;
    addMessage(userInput, true);
    inputField.value = '';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Adjust based on your build system; for Vite use import.meta.env
          'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
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
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      addMessage(aiResponse, false);

      // Use Deepgram TTS for speaking the response
      await speakWithDeepgram(aiResponse);

    } catch (error) {
      console.error('Error:', error);
      addMessage("I apologize, but I'm having trouble connecting right now. Please try again.", false);
    }
  }

  // Use Deepgram's TTS endpoint to speak text
  async function speakWithDeepgram(text) {
    try {
      const response = await fetch('https://api.deepgram.com/v1/speak', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.VITE_DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice: "alloy"
        })
      });

      if (!response.ok) {
        throw new Error('Deepgram API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      speakWithBrowser(text);
    }
  }

  // Fallback: use browser's SpeechSynthesis for TTS
  function speakWithBrowser(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voices = synth.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(voice =>
        voice.lang.includes('en') && voice.name.includes('Female')
      ) || voices[0];
      utterance.voice = preferredVoice;
    }
    synth.speak(utterance);
  }

  // Event listeners for sending messages
  sendButton.addEventListener('click', () => {
    handleMessage(inputField.value);
  });

  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleMessage(inputField.value);
    }
  });

  // Setup speech recognition events if available
  if (recognition) {
    recognition.addEventListener('result', (event) => {
      const lastResultIndex = event.results.length - 1;
      const text = event.results[lastResultIndex][0].transcript;
      handleMessage(text);
    });

    recognition.addEventListener('error', (event) => {
      console.error('Speech recognition error:', event.error);
      isListening = false;
      micButton.classList.remove('listening');
    });

    recognition.addEventListener('end', () => {
      isListening = false;
      micButton.classList.remove('listening');
    });

    micButton.addEventListener('click', () => {
      if (!isListening) {
        recognition.start();
        isListening = true;
        micButton.classList.add('listening');
      } else {
        recognition.stop();
        isListening = false;
        micButton.classList.remove('listening');
      }
    });
  }

  // Initial greeting
  const initialGreeting = "Hello! I'm Amie, your Social and Emotional Learning Assistant. How can I help you today?";
  addMessage(initialGreeting, false);
  speakWithDeepgram(initialGreeting);
});
