document.addEventListener("DOMContentLoaded", () => {
    const BACKEND_URL = "https://462d2d49-1f98-4257-a721-46da919d929b-00-3hhfbf6wdvr1l.kirk.replit.dev";
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatHistory = document.getElementById("chat-history");
    const startRecordBtn = document.getElementById("start-record-btn");
    const stopRecordBtn = document.getElementById("stop-record-btn");
    const resetChatBtn = document.getElementById("reset-chat-btn");
    const ageDropdown = document.getElementById("age-dropdown");
    const volumeControl = document.getElementById("volume-control");

    let isRecording = false;
    let mediaRecorder;
    let recordedChunks = [];
    let conversationLog = []; // Maintain conversation log for chat history

    // Ensure elements exist in the DOM
    if (!chatForm || !chatInput || !chatHistory || !startRecordBtn || !stopRecordBtn || !resetChatBtn || !ageDropdown || !volumeControl) {
        console.error("One or more required elements are missing in the DOM.");
        return;
    }

    // Utility function: Append a message to the chat history
    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to the latest message
    }

    // Clamp volume to a safe range [0.0, 1.0]
    function clampVolume(value) {
        return Math.min(Math.max(parseFloat(value), 0.0), 1.0);
    }

    // Play audio from a base64-encoded string
    function playAudio(base64Audio) {
        if (!base64Audio) {
            appendMessage("Error", "Audio response not available.");
            return;
        }

        try {
            const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioData], { type: "audio/wav" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.volume = clampVolume(volumeControl.value); // Set audio volume
            audio.play().catch(error => {
                console.error("Error playing audio:", error);
                appendMessage("Error", "Unable to play audio response.");
            });
        } catch (error) {
            console.error("Audio playback error:", error);
            appendMessage("Error", "Audio playback error.");
        }
    }

    // Handle form submission for chat messages
    chatForm.addEventListener("submit", async event => {
        event.preventDefault();
        const message = chatInput.value.trim();
        const age = parseInt(ageDropdown.value, 10) || 10; // Default age to 10 if not selected
        const volume = clampVolume(volumeControl.value);

        if (!message) return;

        appendMessage("You", message);
        chatInput.value = ""; // Clear input field

        conversationLog.push({ role: "user", content: message });

        try {
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, age, volume }),
            });

            if (!response.ok) throw new Error("Failed to fetch chatbot response");

            const data = await response.json();
            appendMessage("Amie", data.response || "No response received.");
            if (data.audio) playAudio(data.audio);
        } catch (error) {
            console.error("Error:", error);
            appendMessage("Error", "Something went wrong!");
        }
    });

    // Start voice recording
    startRecordBtn.addEventListener("click", async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];

            appendMessage("System", "Recording started...");

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
                const formData = new FormData();
                formData.append("audio", audioBlob, "recording.wav");
                formData.append("age", ageDropdown.value);
                formData.append("volume", volumeControl.value);

                try {
                    const response = await fetch(`${BACKEND_URL}/voice`, {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) throw new Error("Failed to fetch voice response");

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
            startRecordBtn.disabled = true;
            stopRecordBtn.disabled = false;
        } catch (error) {
            console.error("Microphone access error:", error);
            appendMessage("Error", "Unable to access microphone.");
        }
    });

    // Stop voice recording
    stopRecordBtn.addEventListener("click", () => {
        if (!isRecording || !mediaRecorder) return;

        mediaRecorder.stop();
        isRecording = false;
        startRecordBtn.disabled = false;
        stopRecordBtn.disabled = true;
        appendMessage("System", "Recording stopped. Processing...");
    });

    // Reset chat history
    resetChatBtn.addEventListener("click", () => {
        chatHistory.innerHTML = ""; // Clear chat history
        appendMessage("Amie", "Chat reset. How can I help you today?");
        conversationLog = []; // Clear conversation log
    });

    // Handle volume changes
    volumeControl.addEventListener("input", () => {
        console.log(`Volume set to: ${volumeControl.value}`);
    });

    // Initialize button states
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;

    console.log("Frontend loaded successfully.");
});
