document.addEventListener("DOMContentLoaded", () => {
    const BACKEND_URL = "https://462d2d49-1f98-4257-a721-46da919d929b-00-3hhfbf6wdvr1l.kirk.replit.dev/"; // Update with your backend's actual URL
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
    let conversationLog = [];

    if (!chatForm || !chatInput || !chatHistory || !startRecordBtn || !stopRecordBtn || !resetChatBtn || !ageDropdown || !volumeControl) {
        console.error("One or more required elements are missing in the DOM.");
        return;
    }

    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function clampVolume(value) {
        return Math.min(Math.max(parseFloat(value), 0.0), 1.0);
    }

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

            audio.volume = clampVolume(volumeControl.value);
            audio.play().catch(error => {
                console.error("Error playing audio:", error);
                appendMessage("Error", "Unable to play audio response.");
            });
        } catch (error) {
            console.error("Audio playback error:", error);
            appendMessage("Error", "Audio playback error.");
        }
    }

    async function testBackend() {
        try {
            const response = await fetch(`${BACKEND_URL}/test`);
            const data = await response.json();
            console.log('Test Endpoint Response:', data);
            appendMessage("System", `Backend test response: ${data.message}`);
        } catch (error) {
            console.error('Error testing backend:', error);
            appendMessage("Error", "Backend test failed.");
        }
    }

    async function sendMessageToChatbot(message) {
        try {
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, conversation_log: conversationLog, volume: clampVolume(volumeControl.value) }),
            });

            if (!response.ok) throw new Error(`Failed to fetch chatbot response: ${response.statusText}`);

            const data = await response.json();
            appendMessage("Amie", data.response || "No response received.");
            if (data.audio) playAudio(data.audio);
        } catch (error) {
            console.error("Error:", error);
            appendMessage("Error", "Failed to connect to the server. Please try again.");
        }
    }

    async function sendVoiceMessage(audioFile) {
        try {
            const formData = new FormData();
            formData.append('audio', audioFile);

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
            appendMessage("Error", "Something went wrong during processing.");
        }
    }

    chatForm.addEventListener("submit", event => {
        event.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        appendMessage("You", message);
        chatInput.value = "";

        conversationLog.push({ role: "user", content: message });
        sendMessageToChatbot(message);
    });

    startRecordBtn.addEventListener("click", async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            recordedChunks = [];

            appendMessage("System", "Listening...");

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
                sendVoiceMessage(audioBlob);
            };

            mediaRecorder.start();
            isRecording = true;
            startRecordBtn.disabled = true;
            stopRecordBtn.disabled = false;
        } catch (error) {
            console.error("Microphone access error:", error);
            appendMessage("Error", "Unable to access microphone. Please enable permissions.");
        }
    });

    stopRecordBtn.addEventListener("click", () => {
        if (!isRecording || !mediaRecorder) return;

        mediaRecorder.stop();
        isRecording = false;
        startRecordBtn.disabled = false;
        stopRecordBtn.disabled = true;
        appendMessage("System", "Recording stopped. Processing...");
    });

    resetChatBtn.addEventListener("click", () => {
        chatHistory.innerHTML = "";
        appendMessage("Amie", "Chat reset. How can I help you today?");
        conversationLog = [];
    });

    volumeControl.addEventListener("input", () => {
        console.log(`Volume set to: ${volumeControl.value}`);
    });

    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;

    console.log("Frontend loaded successfully.");

    // Test the backend connection
    testBackend();
});
