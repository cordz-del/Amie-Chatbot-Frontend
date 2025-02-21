import React, { useState } from 'react';
import './App.css';

function App() {
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  const startChat = () => {
    setIsChatting(true);
    setMessages([{ text: "Hello! I'm Amie. How can I help you today?", sender: 'ai' }]);
  };

  const stopChat = () => {
    setIsChatting(false);
    setMessages([]);
    setInputText('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages(newMessages);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      setMessages([...newMessages, { 
        text: "I'm processing your message...", 
        sender: 'ai' 
      }]);
    }, 1000);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Amie Chatbot</h1>
      </header>

      <main className="chat-container">
        {!isChatting ? (
          <button onClick={startChat} className="control-button start">
            Start Chat
          </button>
        ) : (
          <>
            <div className="messages">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.sender}`}>
                  {message.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="input-form">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="message-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
            <button onClick={stopChat} className="control-button stop">
              Stop Chat
            </button>
          </>
        )}
      </main>

      <footer className="App-footer">
        <p>© 2023 Amie Chatbot</p>
      </footer>
    </div>
  );
}

export default App;
