import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get the backend URL from environment variables
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Function to send a text message to the backend
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    // Add the user message to the chat
    const userMessage = {
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send the user message to the /chat endpoint on your backend
      const response = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: inputMessage })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      // Assume your backend returns an object with a property "reply"
      const botMessage = {
        sender: 'bot',
        text: data.reply,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally, add an error message to the chat
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: "Sorry, I couldn't process your message.", timestamp: new Date().toISOString() }
      ]);
    } finally {
      setInputMessage('');
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Amie Chatbot</h1>
      </header>
      <main className="chat-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}-message`}>
            <span>{msg.text}</span>
          </div>
        ))}
        {isLoading && <div className="loading">Loading...</div>}
      </main>
      <footer className="input-form">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit">Send</button>
        </form>
      </footer>
    </div>
  );
}

export default App;
