<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amie Chatbot</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Amie Chatbot</h1>
    </header>

    <main>
        <!-- Chat History Section -->
        <div id="chat-container">
            <div id="chat-history"></div>
        </div>

        <!-- Input Section -->
        <section id="input-container">
            <form id="chat-form">
                <label for="age-input">Age:</label>
                <input type="number" id="age-input" placeholder="Enter your age" min="3" max="18" required />
                
                <label for="chat-input">Message:</label>
                <input type="text" id="chat-input" placeholder="Type your message here..." autocomplete="off" required />
                
                <button type="submit">Send</button>
            </form>
        </section>

        <!-- Voice Interaction Controls -->
        <section id="voice-controls">
            <button id="start-record-btn">Start Recording</button>
            <button id="stop-record-btn" disabled>Stop Recording</button>
            <p id="status"></p>
        </section>

        <!-- Volume Control Section -->
        <section id="volume-control-section">
            <label for="volume-control">Volume:</label>
            <input type="range" id="volume-control" min="0.5" max="2.0" step="0.1" value="1.0">
        </section>

        <!-- Hidden Audio Player -->
        <audio id="audio-player" controls hidden></audio>
    </main>

    <footer>
        <p>Powered by Amie Chatbot Project - AI for Social and Emotional Learning</p>
    </footer>

    <script>
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

            // Append messages to chat history
            function appendMessage(sender, message) {
                const messageElement = document.createElement("div");
                messageElement.className = sender === "User" ? "user-message" : "bot-message";
                messageElement.textContent = `${sender}: ${message}`;
                chatHistory.appendChild(messageElement);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }

            // Handle chat submission
            chatForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const userMessage = chatInput.value.trim();
                const age = parseInt(ageInput.value, 10) || 10;
                const volume = parseFloat(volumeControl.value) || 1.0;

                if (!userMessage || !age) return;

                // Append user message to chat
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

                    // Append bot's response to chat
                    appendMessage("Amie", data.response);

                    // Play audio response if available
                    if (data.audio) {
                        const audioData = `data:audio/wav;base64,${data.audio}`;
                        audioPlayer.src = audioData;
                        audioPlayer.volume = volume; // Set audio volume from the slider
                        audioPlayer.hidden = false; // Show the audio player controls
                        audioPlayer.play();
                    }
                } catch (error) {
                    console.error("Error:", error);
                    appendMessage("Error", "Something went wrong!");
                }
            });

            // Handle volume changes
            volumeControl.addEventListener("input", () => {
                const volume = parseFloat(volumeControl.value) || 1.0;
                audioPlayer.volume = volume; // Adjust audio player volume in real-time
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

                            // Append bot's response to chat
                            appendMessage("Amie", data.response);

                            // Play audio response if available
                            if (data.audio) {
                                const audioData = `data:audio/wav;base64,${data.audio}`;
                                audioPlayer.src = audioData;
                                audioPlayer.volume = parseFloat(volumeControl.value) || 1.0;
                                audioPlayer.hidden = false; // Show audio player controls
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

            stopRecordBtn.addEventListener("click", () => {
                if (!isRecording || !mediaRecorder) return;

                mediaRecorder.stop();
                isRecording = false;
                startRecordBtn.disabled = false;
                stopRecordBtn.disabled = true;
                statusMessage.textContent = "Processing...";
            });
        });
    </script>
</body>
</html>
