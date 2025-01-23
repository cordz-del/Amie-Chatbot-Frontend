import React, { useState, useEffect } from "react";
import { connect, RoomEvent } from "livekit-client";
import { ParticipantView } from "@livekit/react";
import "./style.css"; // Ensure styles are applied

const App = () => {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState([]);

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
        </div>
      </main>

      <footer>
        <p>Powered by Amie - AI for Social & Emotional Learning</p>
      </footer>
    </div>
  );
};

export default App;
