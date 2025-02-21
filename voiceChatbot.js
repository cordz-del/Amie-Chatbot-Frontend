// voiceChatbot.js - Handles voice interaction with Deepgram STT & TTS, and OpenAI
import { transcribeAudio, speakText, getOpenAIResponse } from "./apiBridge.js";

let mediaRecorder;
let audioChunks = [];

/**
 * Starts voice recording for Speech-to-Text processing.
 */
export function startVoiceChat() {
    console.log("Start Chat clicked...");
    const statusEl = document.getElementById("status");
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");

    statusEl.textContent = "Listening...";

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log("Recording stopped. Processing audio...");
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

                try {
                    // Step 1: Transcribe audio via Deepgram STT
                    statusEl.textContent = "Transcribing...";
                    const transcript = await transcribeAudio(audioBlob);
                    console.log("Transcript:", transcript);

                    if (!transcript) {
                        statusEl.textContent = "No speech detected.";
                        return;
                    }

                    // Step 2: Get OpenAI chatbot response
                    statusEl.textContent = "Thinking...";
                    const aiResponse = await getOpenAIResponse(transcript);
                    console.log("AI Response:", aiResponse);

                    // Step 3: Display chatbot response
                    updateChatWindow("You", transcript);
                    updateChatWindow("Amie", aiResponse);

                    // Step 4: Convert response to speech using Deepgram TTS
                    statusEl.textContent = "Speaking...";
                    const audioUrl = await speakText(aiResponse);
                    const audioElement = new Audio(audioUrl);
                    audioElement.play();
                    audioElement.onended = () => {
                        statusEl.textContent = "Ready";
                    };

                } catch (error) {
                    console.error("Error in voice chat flow:", error);
                    statusEl.textContent = "Error processing chat.";
                }
            };

            // Start recording
            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
        })
        .catch(error => {
            console.error("Microphone access error:", error);
            statusEl.textContent = "Microphone access denied.";
        });
}

/**
 * Stops voice recording and processes the recorded audio.
 */
export function stopVoiceChat() {
    console.log("Stop Chat clicked...");
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");

    if (!mediaRecorder) {
        console.warn("No active recording session.");
        return;
    }

    mediaRecorder.stop();
    startButton.disabled = false;
    stopButton.disabled = true;
}

/**
 * Updates the chat window with a new message.
 * @param {string} sender - The sender of the message ("You" or "Amie").
 * @param {string} message - The message content.
 */
function updateChatWindow(sender, message) {
    const chatHistory = document.getElementById("chat-history");
    if (!chatHistory) {
        console.error("Chat history container not found.");
        return;
    }

    const messageElement = document.createElement("p");
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatHistory.appendChild(messageElement);
}
