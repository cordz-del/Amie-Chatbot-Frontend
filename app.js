document.addEventListener("DOMContentLoaded", () => {
    const BACKEND_URL = "https://462d2d49-1f98-4257-a721-46da919d929b-00-3hhfbf6wdvr1l.kirk.replit.dev";
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatHistory = document.getElementById("chat-history");
    const startRecordBtn = document.getElementById("start-record-btn");
    const stopRecordBtn = document.getElementById("stop-record-btn");
    const statusMessage = document.getElementById("status");
    const ageInput = document.getElementById("age-input");
    const volumeControl = document.getElementById("volume-control");
    const resetButton = document.getElementById("reset-chat-btn");

    let isRecording = false;
    let mediaRecorder;
    let recordedChunks = [];
    let conversationLog = []; // Maintain conversation history

    // Ensure elements exist before accessing them
    if (!chatForm || !chatInput || !chatHistory || !startRecordBtn || !stopRecordBtn || !statusMessage || !ageInput || !volumeControl || !resetButton) {
        console.error("One or more required elements are missing in the DOM.");
        return;
    }

    // Update button states dynamically
    function updateButtonStates() {
        startRecordBtn.disabled = isRecording;
        stopRecordBtn.disabled = !isRecording;
    }

    // Append messages to the chat history
    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to the latest message
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

            // Set volume based on slider value
            audio.volume = clampVolume(volumeControl.value);

            // Play the audio
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
        const age = parseInt(ageInput.value, 10) || 10; // Default age if not provided
        const volume = clampVolume(volumeControl.value);

        if (!message) return;

        appendMessage("You", message);
        chatInput.value = "";

        conversationLog.push({ role: "user", content: message });

        try {
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, age, volume }),
            });

            if (!response.ok) throw new Error("Failed to fetch response from server");

            const data = await response.json();
            appendMessage("Amie", data.response || "No response received.");

            if (data.audio) playAudio(data.audio);
        } catch (error) {
            console.error("Error:", error);
            appendMessage("Error", "Something went wrong!");
        }
    });

    // Handle voice recording
    startRecordBtn.addEventListener("click", async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];

            appendMessage("System", "Listening...");

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
                const formData = new FormData();
                formData.append("audio", audioBlob, "recording.wav");
                formData.append("age", ageInput.value);
                formData.append("volume", volumeControl.value);

                try {
                    const response = await fetch(`${BACKEND_URL}/voice`, {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) throw new Error("Failed to fetch response from server");

                    const data = await response.json();
                    appendMessage("Amie", data.response || "No response received.");

                    if (data.audio) playAudio(data.audio);
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

    // Handle volume changes
    volumeControl.addEventListener("input", () => {
        console.log(`Volume set to: ${volumeControl.value}`);
    });

    updateButtonStates();
    console.log("Frontend loaded successfully.");
});
