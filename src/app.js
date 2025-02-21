import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Speech Recognition setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setInputText(transcript);
    setIsListening(false);
  };

  // Text-to-Speech function
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage = {
        text: inputText,
        isUser: true
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      // Here you would typically call your AI backend
      // For now, we'll just echo the message
      setTimeout(() => {
        const botResponse = {
          text: `You said: ${inputText}`,
          isUser: false
        };
        setMessages(prev => [...prev, botResponse]);
        speak(botResponse.text); // Read out the response
      }, 1000);
    }
  };

  const startListening = () => {
    setIsListening(true);
    recognition.start();
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Amie</h1>
      </header>

      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.isUser ? 'user' : 'bot'}`}>
              {message.text}
            </div>
          ))}
        </div>
        
        <div className="input-container">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend}>Send</button>
          <button onClick={startListening}>
            {isListening ? 'Listening...' : 'Start Speaking'}
          </button>
        </div>
      </div>

      <footer className="footer">
        <p>© 2024 Amie Chatbot</p>
      </footer>
    </div>
  );
}

export default App;
