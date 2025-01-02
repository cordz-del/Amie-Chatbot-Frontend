document.addEventListener("DOMContentLoaded", () => {
    const BACKEND_URL = "https://my-chatbot-app-env.eba-xyz.us-east-1.elasticbeanstalk.com";
    
    // DOM Elements
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatHistory = document.getElementById("chat-history");
    const startRecordBtn = document.getElementById("start-record-btn");
    const stopRecordBtn = document.getElementById("stop-record-btn");
    const resetChatBtn = document.getElementById("reset-chat-btn");
    const ageDropdown = document.getElementById("age-dropdown");
    const volumeControl = document.getElementById("volume-control");

    let isRecording = false;
    let mediaRecorder = null;
    let recordedChunks = [];
    let conversationLog = []; // Keeps track of conversation history

    /**
     * Append a message to the chat history.
     * @param {string} sender - The sender of the message ("You" or "Amie").
     * @param {string} message - The content of the message.
     */
    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message", sender === "You" ? "user" : "bot");
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    /**
     * Play audio from a Base64-encoded string.
     * @param {string} base64Audio - The Base64-encoded audio data.
     */
    function playAudio(base64Audio) {
        try {
            const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioData], { type: "audio/wav" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.volume = Math.min(Math.max(parseFloat(volumeControl.value), 0.5), 2.0); // Clamp volume
            audio.play().catch(error => {
                console.error("Error playing audio:", error);
                appendMessage("Error", "Unable to play audio response.");
            });
        } catch (error) {
            console.error("Audio playback error:", error);
            appendMessage("Error", "Audio playback error.");
        }
    }

    /**
     * Handle chat form submission (text input).
     */
    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();  // Prevent form default submission
        const message = chatInput.value.trim();
        const age = parseInt(ageDropdown.value, 10) || 10;
        const volume = parseFloat(volumeControl.value);

        if (!message) return;

        appendMessage("You", message);
        chatInput.value = "";

        conversationLog.push({ role: "user", content: message });

        try {
            // Ensure Content-Type is JSON
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json"  // Fixed Content-Type header
                },
                body: JSON.stringify({ 
                    message, 
                    age, 
                    volume, 
                    conversation_log: conversationLog 
                }),
            });

            if (!response.ok) throw new Error("Failed to fetch chatbot response.");

            const data = await response.json();
            appendMessage("Amie", data.response || "No response received.");
            if (data.audio) playAudio(data.audio);

            // Update conversation log
            conversationLog.push({ role: "assistant", content: data.response });
        } catch (error) {
            console.error("Error:", error);
            appendMessage("Error", "Failed to connect to the server.");
        }
    });

    /**
     * Start recording audio using the browser's MediaRecorder API.
     */
    startRecordBtn.addEventListener("click", async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];

            appendMessage("System", "Recording started...");
            mediaRecorder.start();

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
                const formData = new FormData();
                formData.append("audio", audioBlob, "recording.wav");
                formData.append("age", ageDropdown.value || "10");
                formData.append("volume", volumeControl.value || "1.0");

                appendMessage("System", "Recording stopped. Processing...");

                try {
                    const response = await fetch(`${BACKEND_URL}/voice`, {
                        method: "POST",
                        body: formData,  // Sends audio file as multipart/form-data
                    });

                    if (!response.ok) throw new Error("Failed to process voice input.");

                    const data = await response.json();
                    appendMessage("Amie", data.response || "No response received.");
                    if (data.audio) playAudio(data.audio);
                } catch (error) {
                    console.error("Error:", error);
                    appendMessage("Error", "Something went wrong while processing your voice input.");
                }
            };

            isRecording = true;
            startRecordBtn.disabled = true;
            stopRecordBtn.disabled = false;
        } catch (error) {
            console.error("Microphone access error:", error);
            appendMessage("Error", "Please enable microphone access.");
        }
    });

    /**
     * Stop recording audio.
     */
    stopRecordBtn.addEventListener("click", () => {
        if (!isRecording || !mediaRecorder) return;

        mediaRecorder.stop();
        isRecording = false;
        startRecordBtn.disabled = false;
        stopRecordBtn.disabled = true;
    });

    /**
     * Reset the chat history and conversation log.
     */
    resetChatBtn.addEventListener("click", () => {
        chatHistory.innerHTML = "";
        conversationLog = [];
        appendMessage("Amie", "Chat reset. How can I assist you today?");
    });

    console.log("Chatbot frontend loaded successfully.");
});
