import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await fetch('https://amie-chatbot-backend.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();
      
      // Add bot response to chat
      const botMessage = { text: data.response, sender: 'bot' };
      setMessages(messages => [...messages, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { text: 'Sorry, I had trouble connecting. Please try again.', sender: 'bot' };
      setMessages(messages => [...messages, errorMessage]);
    }
    setIsLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Amie Chatbot</h1>
      </header>
      
      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.text}
            </div>
          ))}
          {isLoading && <div className="message bot">Thinking...</div>}
        </div>

        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
