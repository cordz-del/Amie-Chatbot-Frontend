import React, { useState, useEffect } from "react";
import { connect, RoomEvent } from "livekit-client";
import { ParticipantView } from "@livekit/react";
import "./style.css"; // Ensure styles are applied

const App = () => {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState([]
                                                  const [isRecording, setIsRecording] = useState(false);
const [audioChunks, setAudioChunks] = useState([]);
const [transcript, setTranscript] = useState(''););
  const startRecording = () => {
    // Start the waveform animation when recording starts
    drawWaveform();
  setIsRecording(true);
  setAudioChunks([]);
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        setAudioChunks((prev) => [...prev, event.data]);
      }
    });
    mediaRecorder.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      transcribeAudio(audioBlob);
    });
    mediaRecorder.start(250);
  });
};

// Initialize audio context and analyser
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
const canvas = document.getElementById('waveform');
const canvasCtx = canvas.getContext('2d');

function drawWaveform() {
    requestAnimationFrame(drawWaveform);
    analyser.getByteTimeDomainData(dataArray);
    canvasCtx.fillStyle = '#f0f4f8';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#007bff';
    canvasCtx.beginPath();

    let sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = v * canvas.height / 2;
        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}
drawWaveform();  const stopRecording = () => {
  setIsRecording(false);
    // Stop the waveform animation when recording stops
    cancelAnimationFrame(drawWaveform);
};
  const speakText = async (text) => {
  const response = await fetch('https://api.deepgram.com/v1/speak', {
    method: 'POST',
    headers: {
      'Authorization': 'Token 5fc1624a41d5256f6e211a85a20ca268e86c0125',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      model: 'aura-asteria-en',
      encoding: 'linear16',
      sample_rate: 22050,
      output: 'wav',
    }),
  });
  const audioData = await response.blob();
  const audioUrl = URL.createObjectURL(audioData);
  const audioElement = new Audio(audioUrl);
  audioElement.play();
};

  const LIVEKIT_URL = "wss://amiev1-b4k5uxvt.livekit.cloud";
  const ACCESS_TOKEN = process.env.REACT_APP_LIVEKIT_ACCESS_TOKEN; // Use environment variable

  const handleConnect = async () => {
    try {
      const newRoom = await connect(LIVEKIT_URL, ACCESS_TOKEN, {
        video: true,
        audio: true,
      });
      setRoom(newRoom);
      setConnected(true);

      // Update participants on events
      setParticipants(Array.from(newRoom.participants.values()));
      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        setParticipants((prev) => [...prev, participant]);
      });
      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setParticipants((prev) =>
          prev.filter((p) => p.identity !== participant.identity)
        );
      });

      // Handle room disconnection
      newRoom.on(RoomEvent.Disconnected, () => {
        setConnected(false);
        setRoom(null);
        setParticipants([]);
      });
    } catch (error) {
      console.error("Error connecting to LiveKit:", error);
    }
  };

  const handleDisconnect = () => {
    if (room) {
      room.disconnect();
      setConnected(false);
      setRoom(null);
      setParticipants([]);
    }
  };

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return (
    <div id="main-container">
      <header>
        <h1 id="amie-title">Amie</h1>
      </header>

      <main>
        <div id="chat-container">
          <div id="chat-history" aria-label="Chat history">
            {participants.map((participant) => (
              <ParticipantView
                key={participant.identity}
                participant={participant}
                enableVideo
                enableAudio
              />
            ))}
          </div>

    {connected && (
  <div id="chat-container">
    <div id="chat-history" aria-label="Chat history">
      {participants.map((participant) => (
        <ParticipantView
          key={participant.identity}
          participant={participant}
          enableVideo
          enableAudio
        />
      ))}
    </div>

    <div id="connection-section">
      {!connected ? (
        <button id="connect-btn" onClick={handleConnect}>
          Connect
        </button>
      ) : (
        <button id="connect-btn" onClick={handleDisconnect}>
          Disconnect
        </button>
      )}
    </div>

    <button id="record-btn" onClick={startRecording} disabled={isRecording}>
      Start Talking
    </button>
    <button id="stop-btn" onClick={stopRecording} disabled={!isRecording}>
      Stop Talking
    </button>
  </div>
)}

<footer>
  <p>Powered by Amie - AI for Social & Emotional Learning</p>
</footer>
export default App;
