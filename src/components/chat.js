import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chat.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faStop, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message) => {
    try {
      // Add user message to chat
      setMessages(prev => [...prev, { text: message, sender: 'user' }]);
      
      // Send message to backend
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/chat`, {
        message: message
      });
      
      // Add AI response to chat
      setMessages(prev => [...prev, { text: response.data.response, sender: 'ai' }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error connecting to the server.', 
        sender: 'ai' 
      }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      await sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await handleAudioSubmit(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error accessing the microphone.', 
        sender: 'system' 
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioSubmit = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Add "Transcribing..." message
      setMessages(prev => [...prev, { text: 'Transcribing...', sender: 'system' }]);

      // Send audio for transcription
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/transcribe`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Remove "Transcribing..." message
      setMessages(prev => prev.filter(msg => msg.text !== 'Transcribing...'));

      // If we got a transcription, send it as a message
      if (response.data.transcription) {
        await sendMessage(response.data.transcription);
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      setMessages(prev => prev.filter(msg => msg.text !== 'Transcribing...'));
      setMessages(prev => [...prev, { 
        text: 'Sorry, I had trouble processing the audio.', 
        sender: 'system' 
      }]);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <div className="message-content">
              {message.sender === 'ai' && <div className="ai-label">AMIE</div>}
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`record-button ${isRecording ? 'recording' : ''}`}
        >
          <FontAwesomeIcon icon={isRecording ? faStop : faMicrophone} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
