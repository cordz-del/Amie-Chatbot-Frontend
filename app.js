import React, { useState, useEffect, useRef } from "react";
import "./style.css"; // Ensure styles are applied

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);

  // Function to start recording (STT)
  const startChat = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      setAudioChunks([]);
      
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      });
      
      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        transcribeAudio(audioBlob);
      });
      
      mediaRecorder.start(250); // Collect data in 250ms chunks
      setIsRecording(true);
      console.log("Chat started: recording started");
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  // Function to stop recording
  const stopChat = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // Stop all audio tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      console.log("Chat stopped: recording stopped");
    }
  };

  // Placeholder function to transcribe audio using Deepgram STT
  const transcribeAudio = async (audioBlob) => {
    console.log("Transcribing audio...");
    // Replace with actual Deepgram API call.
    // For testing, we'll simulate a transcription:
    const simulatedTranscript = "Hello, this is a test transcription.";
    setTranscript(simulatedTranscript);
    // Once transcribed, speak the text.
    speakText(simulatedTranscript);
  };

  // Placeholder function to perform TTS (could use Deepgram TTS or Web Speech API)
  const speakText = async (text) => {
    console.log("Speaking text:", text);
    // For a simple solution, we use the Web Speech API:
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  // Clean up audio stream on unmount
  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div id="main-container">
      <header>
        <h1 id="amie-title">Amie</h1>
        <p id="amie-subtitle">Social and Emotional Learning Assistant</p>
      </header>
      
      <main id="chat-container">
        <div id="chat-history" aria-label="Chat history">
          {transcript && <p>{transcript}</p>}
        </div>
        <div id="chat-buttons">
          <button id="start-chat-btn" onClick={startChat} disabled={isRecording}>
            Start Chat
          </button>
          <button id="stop-chat-btn" onClick={stopChat} disabled={!isRecording}>
            Stop Chat
          </button>
        </div>
      </main>
      
      <footer>
        <p>Powered by Amie - AI for Social &amp; Emotional Learning</p>
      </footer>
    </div>
  );
};

export default App;
