import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const BACKEND_URL = 'https://amie-chatbot-backend-raarongraham.replit.app';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    const messageToSend = inputMessage;

    const userMessage = {
      text: messageToSend,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const botResponse = {
        text: data.response,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        text: "Sorry, I couldn't process your request. Please try again.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          try {
            const response = await fetch(`${BACKEND_URL}/transcribe`, {
              method: 'POST',
              headers: {
                'Content-Type': 'audio/wav',
              },
              body: audioBlob
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            setInputMessage(data.transcription);
          } catch (error) {
            console.error('Error:', error);
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }
    } else {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Amie Chatbot</h1>
      </header>
      <main className="chat-container" ref={chatContainerRef}>
        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <p>{message.text}</p>
              <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
            </div>
          ))}
          {isLoading && (
            <div className="message bot-message">
              <p>Thinking...</p>
            </div>
          )}
        </div>
        <form onSubmit={handleSendMessage} className="input-form">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="button" onClick={handleVoiceInput} className={isRecording ? 'recording' : ''}>
            {isRecording ? '🔴 Stop' : '🎤 Record'}
          </button>
          <button type="submit" disabled={isLoading || !inputMessage.trim()}>
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
