document.addEventListener("DOMContentLoaded", () => {
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

    // Function to append messages to the chat history
    function appendMessage(sender, message) {
        const messageElement = document.createElement("div");
        messageElement.className = sender === "User" ? "user-message" : "bot-message";
        messageElement.textContent = `${sender}: ${message}`;
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Handle form submission
    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const userMessage = chatInput.value.trim();
        const age = parseInt(ageInput.value, 10) || 10;
        const volume = parseFloat(volumeControl.value) || 1.0;

        if (!userMessage || !age) return;

        // Append user message to the chat
        appendMessage("User", userMessage);
        chatInput.value = "";

        try {
            // Send the message to the backend
            const response = await fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage, age, volume }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch response from server");
            }

            const data = await response.json();

            // Append bot's response to the chat
            appendMessage("Amie", data.response);

            // Play audio response if available
            if (data.audio) {
                const audioData = `data:audio/wav;base64,${data.audio}`;
                audioPlayer.src = audioData;
                audioPlayer.volume = volume; // Set volume from slider
                audioPlayer.hidden = false; // Show audio controls
                audioPlayer.play();
            }
        } catch (error) {
            console.error("Error:", error);
            appendMessage("Error", "Something went wrong!");
        }
    });

    // Handle volume slider change
    volumeControl.addEventListener("input", () => {
        const volume = parseFloat(volumeControl.value) || 1.0;
        audioPlayer.volume = volume; // Adjust volume in real-time
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
                formData.append("audio", audioBlob);
                formData.append("age", ageInput.value);
                formData.append("volume", volumeControl.value);

                try {
                    const response = await fetch("/voice", {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error("Failed to fetch response from server");
                    }

                    const data = await response.json();

                    // Append bot's response to the chat
                    appendMessage("Amie", data.response);

                    // Play audio response if available
                    if (data.audio) {
                        const audioData = `data:audio/wav;base64,${data.audio}`;
                        audioPlayer.src = audioData;
                        audioPlayer.volume = parseFloat(volumeControl.value) || 1.0;
                        audioPlayer.hidden = false; // Show audio controls
                        audioPlayer.play();
                    }
                } catch (error) {
                    console.error("Error:", error);
                    appendMessage("Error", "Something went wrong!");
                }
            };

            mediaRecorder.start();
            isRecording = true;
            startRecordBtn.disabled = true;
            stopRecordBtn.disabled = false;
            statusMessage.textContent = "Recording...";
        } catch (error) {
            console.error("Error accessing microphone:", error);
            appendMessage("Error", "Could not access microphone.");
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
