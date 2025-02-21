// app.js - Main script to control chat interactions
import { transcribeAudio, speakText, getOpenAIResponse } from "./apiBridge.js";

// Ensure DOM is fully loaded before running scripts
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initialized...");
  
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const chatWindow = document.getElementById("chatWindow");
  const statusEl = document.getElementById("status");
  let mediaRecorder;
  let audioChunks = [];

  // Check if buttons exist
  if (!startButton || !stopButton) {
    console.error("Start/Stop buttons not found in DOM.");
    return;
  }

  // 🎤 Start Chat: Records audio and transcribes it
  startButton.addEventListener("click", async () => {
    console.log("Start Chat clicked...");
    statusEl.textContent = "Listening...";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped. Sending to Deepgram...");
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        try {
          // Step 1: Transcribe audio via Deepgram
          const transcript = await transcribeAudio(audioBlob);
          console.log("Transcript:", transcript);
          statusEl.textContent = "Thinking...";
          
          // Step 2: Send transcript to OpenAI
          const aiResponse = await getOpenAIResponse(transcript);
          console.log("AI Response:", aiResponse);

          // Step 3: Display chatbot response in chat
          updateChatWindow("Amie", aiResponse);
          
          // Step 4: Convert AI response to speech
          const audioUrl = await speakText(aiResponse);
          const audioElement = new Audio(audioUrl);
          audioElement.play();
          statusEl.textContent = "Speaking...";
          audioElement.onended = () => {
            statusEl.textContent = "Ready";
          };
        } catch (error) {
          console.error("Error in chat flow:", error);
          statusEl.textContent = "Error processing chat.";
        }
      };

      // Start recording
      mediaRecorder.start();
      startButton.disabled = true;
      stopButton.disabled = false;
    } catch (error) {
      console.error("Microphone access error:", error);
      statusEl.textContent = "Microphone access denied.";
    }
  });

  // ⏹ Stop Chat: Stops recording and processes audio
  stopButton.addEventListener("click", () => {
    console.log("Stop Chat clicked...");
    if (mediaRecorder) {
      mediaRecorder.stop();
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  });

  // 📌 Function to update chat window UI
  function updateChatWindow(sender, message) {
    if (!chatWindow) {
      console.error("Chat window not found!");
      return;
    }
    const messageElement = document.createElement("p");
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatWindow.appendChild(messageElement);
  }
});
