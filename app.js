document.addEventListener("DOMContentLoaded", () => {
    // Correct BACKEND_URL
    const BACKEND_URL = "https://462d2d49-1f98-4257-a721-46da919d929b-00-3hhfbf6wdvr1l.kirk.replit.dev";
    const chatHistory = document.getElementById("chat-history");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const ageInput = document.getElementById("age-input");
    const volumeControl = document.getElementById("volume-control");
    const startRecordBtn = document.getElementById("start-record-btn");
    const stopRecordBtn = document.getElementById("stop-record-btn");
    const statusMessage = document.getElementById("status");
    const resetButton = document.getElementById("reset-chat-btn");

    let isRecording = false;
    let mediaRecorder;
    let recordedChunks = [];
    let conversationLog = []; // Maintain conversation history

    // Update button states dynamically
    function updateButtonStates() {
        startRecordBtn.disabled = isRecording;
        stopRecordBtn.disabled = !isRecording;
        startRecordBtn.classList.toggle("enabled", !isRecording);
        stopRecordBtn.classList.toggle("enabled", isRecording);
    }

    // Append messages to the chat history
    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.textContent = `${sender}: ${message}`;
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to the latest message
    }

    // Show and hide loading indicator
    function showLoadingIndicator() {
        const loadingIndicator = document.createElement("div");
        loadingIndicator.id = "loading-indicator";
        loadingIndicator.textContent = "Processing...";
        chatHistory.appendChild(loadingIndicator);
    }

    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById("loading-indicator");
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    // Clamp volume to the range [0.0, 1.0]
    function clampVolume(value) {
        return Math.min(Math.max(parseFloat(value), 0.0), 1.0);
    }

    // Play audio response from base64-encoded data
    function playAudio(base64Audio) {
        if (!base64Audio) {
            console.error("No audio data received.");
            appendMessage("Error", "Audio response not available.");
            return;
        }
        try {
            const audioData = Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0));
            const audioBlob = new Blob([audioData], { type: "audio/wav" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.volume = clampVolume(volumeControl.value); // Adjust volume
            audio.play().catch((error) => {
                console.error("Error playing audio:", error);
                appendMessage("Error", "Could not play audio response.");
            });
        } catch (error) {
            console.error("Error decoding or playing audio:", error);
            appendMessage("Error", "Audio playback error.");
        }
    }

    // Handle chat submission
    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = chatInput.value.trim();
        const age = parseInt(ageInput.value, 10) || 10;
        const volume = clampVolume(volumeControl.value);

        if (!message) return;

        // Append user message to chat
        appendMessage("You", message);
        chatInput.value = "";

        // Add user message to conversation log
        conversationLog.push({ user: message });

        // Show loading indicator
        showLoadingIndicator();

        try {
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message, age, volume, conversation_log: conversationLog }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch response from server");
            }

            const data = await response.json();

            // Append bot's response to chat
            appendMessage("Amie", data.response);

            // Update conversation log with bot's response
            conversationLog.push({ bot: data.response });

            // Play audio response if available
            if (data.audio) {
                playAudio(data.audio);
            }
        } catch (error) {
            console.error("Error:", error);
            appendMessage("Error", "Something went wrong!");
        } finally {
            hideLoadingIndicator(); // Hide loading indicator
        }
    });

    // Handle volume changes
    volumeControl.addEventListener("input", () => {
        const volume = clampVolume(volumeControl.value);
    });

    // Handle voice recording
    startRecordBtn.addEventListener("click", async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
                const formData = new FormData();
                formData.append("audio", audioBlob, "recording.wav");
                formData.append("age", ageInput.value);
                formData.append("conversation_log", JSON.stringify(conversationLog));
                formData.append("volume", volumeControl.value);

                try {
                    const response = await fetch(`${BACKEND_URL}/voice`, {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error("Failed to fetch response from server");
                    }

                    const data = await response.json();

                    // Append bot's response to chat
                    appendMessage("Amie", data.response);

                    // Update conversation log
                    conversationLog.push({ bot: data.response });

                    // Play audio response if available
                    if (data.audio) {
                        playAudio(data.audio);
                    }
                } catch (error) {
                    console.error("Error:", error);
                    appendMessage("Error", "Something went wrong!");
                }
            };

            mediaRecorder.start();
            isRecording = true;
            updateButtonStates();
            statusMessage.textContent = "Recording...";
        } catch (error) {
            console.error("Error accessing microphone:", error);
            appendMessage("Error", "Could not access microphone.");
        }
    });

    stopRecordBtn.addEventListener("click", () => {
        if (!isRecording || !mediaRecorder) return;

        mediaRecorder.stop();
        isRecording = false;
        updateButtonStates();
        statusMessage.textContent = "Processing...";
    });

    // Reset chat history
    resetButton.addEventListener("click", () => {
        chatHistory.innerHTML = ""; // Clear chat history
        appendMessage("Amie", "Chat reset. How can I help you today?");
        conversationLog = []; // Reset conversation log
    });

    // Initialize button states
    updateButtonStates();
});
