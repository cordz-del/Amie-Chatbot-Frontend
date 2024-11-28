// Select DOM elements
const micButton = document.getElementById('mic-button');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input'); // Not visible but functional if needed

let recognition;

// Initialize Speech Recognition
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
} else if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
} else {
    alert('Your browser does not support speech recognition.');
}

// Configure recognition if supported
if (recognition) {
    recognition.continuous = false; // Stop after one utterance
    recognition.interimResults = false; // Do not show interim results
    recognition.lang = 'en-US'; // Set language to English

    recognition.onstart = () => {
        micButton.disabled = true;
        micButton.title = "Listening...";
    };

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript.trim();
        addMessageToChat("You", transcript);
        await sendMessage(transcript);
    };

    recognition.onerror = (event) => {
        addMessageToChat("Error", `Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
        micButton.disabled = false;
        micButton.title = "Start Speaking";
    };

    micButton.addEventListener('click', () => {
        recognition.start();
    });
}

// Function to handle form submission (if text input is required in the future)
if (chatInput) {
    chatInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission
            const message = chatInput.value.trim();
            if (message) {
                addMessageToChat("You", message);
                chatInput.value = ''; // Clear input field
                await sendMessage(message);
            } else {
                addMessageToChat("Error", "Please enter a message.");
            }
        }
    });
}

// Function to send a message to the chatbot API
async function sendMessage(message) {
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        if (data.response) {
            addMessageToChat("Amie", data.response);

            // If audio is included in the response (base64 encoded)
            if (data.audio) {
                playAudio(data.audio);
            }
        } else {
            addMessageToChat("Error", "No response received from the chatbot.");
        }
    } catch (error) {
        addMessageToChat("Error", `Failed to communicate with the server: ${error.message}`);
    }
}

// Function to add messages to the chat history
function addMessageToChat(sender, message) {
    chatHistory.innerHTML += `<p><strong>${sender}:</strong> ${message}</p>`;
    chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll to the bottom
}

// Function to play audio if provided as base64 data
function playAudio(audioBase64) {
    const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioData], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.play().catch((error) => console.error("Error playing audio:", error));
}

// Browser-based fallback for text-to-speech (if needed)
function speakText(text) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onerror = () => {
        console.error("Error occurred during speech synthesis.");
    };
    synth.speak(utterance);
}
