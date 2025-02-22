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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    // Add user message
    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages(newMessages);
    setInputText('');

    try {
      // Add loading message
      setMessages([...newMessages, { text: "Thinking...", sender: 'ai' }]);

      // Make API call to your backend
      const response = await fetch('https://your-backend-url/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      });

      const data = await response.json();
      
      // Update with AI response
      setMessages([...newMessages, { text: data.response, sender: 'ai' }]);
    } catch (error) {
      setMessages([...newMessages, { text: "Sorry, I'm having trouble connecting right now.", sender: 'ai' }]);
    }
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
