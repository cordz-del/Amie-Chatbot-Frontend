document.addEventListener("DOMContentLoaded", () => {
    const BACKEND_URL = "https://462d2d49-1f98-4257-a721-46da919d929b-00-3hhfbf6wdvr1l.kirk.replit.dev";

    const chatHistory = document.getElementById("chat-history");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const ageInput = document.getElementById("age-input");
    const audioPlayer = document.getElementById("audio-player");
    const volumeControl = document.getElementById("volume-control");
    const startRecordBtn = document.getElementById("start-record-btn");
    const stopRecordBtn = document.getElementById("stop-record-btn");
    const statusMessage = document.getElementById("status");

    let isRecording = false;
    let mediaRecorder;
    let recordedChunks = [];

    // Append messages to the chat history
    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.className = sender === "You" ? "user-message" : "bot-message";
        messageElement.textContent = `${sender}: ${message}`;
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll to the latest message
    }

    // Handle chat submission
    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = chatInput.value.trim();
        const age = parseInt(ageInput.value, 10) || 10;
        const volume = parseFloat(volumeControl.value) || 1.0;

        if (!message) return;

        appendMessage("You", message);
        chatInput.value = "";

        try {
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message, age, volume }),
            });

            if (!response.ok) {
                console.error(`HTTP error: ${response.status}`);
                throw new Error("Failed to fetch response from the server.");
            }

            const data = await response.json();
            appendMessage("Amie", data.response);

            if (data.audio) {
                const audioData = `data:audio/wav;base64,${data.audio}`;
                audioPlayer.src = audioData;
                audioPlayer.volume = volume;
                audioPlayer.hidden = false;
                audioPlayer.play();
            }
        } catch (error) {
            console.error("Error:", error);
            appendMessage("Error", "Something went wrong while processing your message.");
        }
    });

    // Handle volume changes
    volumeControl.addEventListener("input", () => {
        const volume = parseFloat(volumeControl.value) || 1.0;
        audioPlayer.volume = volume; // Adjust audio player volume in real-time
    });

    // Handle voice recording start
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
                formData.append("age", ageInput.value || "10");
                formData.append("volume", volumeControl.value || "1.0");

                console.log("Recorded chunks:", recordedChunks);
                console.log("FormData:", formData);

                try {
                    const response = await fetch(`${BACKEND_URL}/voice`, { method: "POST", body: formData });

                    if (!response.ok) {
                        console.error(`HTTP error: ${response.status}`);
                        throw new Error("Failed to process voice input");
                    }

                    const data = await response.json();
                    appendMessage("Amie", data.response);

                    if (data.audio) {
                        const audioData = `data:audio/wav;base64,${data.audio}`;
                        audioPlayer.src = audioData;
                        audioPlayer.volume = parseFloat(volumeControl.value) || 1.0;
                        audioPlayer.hidden = false;
                        audioPlayer.play();
                    }
                } catch (error) {
                    console.error("Error in voice processing:", error);
                    appendMessage("Error", "Could not process your voice input.");
                }
            };

            mediaRecorder.start();
            isRecording = true;
            startRecordBtn.disabled = true;
            stopRecordBtn.disabled = false;
            statusMessage.textContent = "Recording...";
        } catch (error) {
            console.error("Error accessing microphone:", error);
            appendMessage("Error", "Could not access microphone. Please check permissions.");
        }
    });

    // Handle voice recording stop
    stopRecordBtn.addEventListener("click", () => {
        if (!isRecording || !mediaRecorder) return;

        mediaRecorder.stop();
        isRecording = false;
        startRecordBtn.disabled = false;
        stopRecordBtn.disabled = true;
        statusMessage.textContent = "Processing...";
    });
});
