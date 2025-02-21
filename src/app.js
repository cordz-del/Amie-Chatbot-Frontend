import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      setRecognition(recognition);
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      // Send transcript to backend
      sendToBackend(transcript);
    }
  };

  const sendToBackend = async (text) => {
    try {
      const response = await fetch('https://your-backend-url/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });
      
      const data = await response.json();
      setResponse(data.response);
      
      // Text-to-speech for the response
      const speech = new SpeechSynthesisUtterance(data.response);
      window.speechSynthesis.speak(speech);
    } catch (error) {
      console.error('Error sending message to backend:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Amie Chatbot</h1>
        <div className="chat-container">
          <div className="transcript">
            <h3>Your Message:</h3>
            <p>{transcript}</p>
          </div>
          <div className="response">
            <h3>Amie's Response:</h3>
            <p>{response}</p>
          </div>
          <div className="controls">
            <button 
              onClick={startListening} 
              disabled={isListening}
              className="control-button"
            >
              Start Chat
            </button>
            <button 
              onClick={stopListening} 
              disabled={!isListening}
              className="control-button"
            >
              Stop Chat
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
