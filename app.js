// DOM Elements
const micButton = document.getElementById('mic-button');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');
const status = document.getElementById('status');

let recognition;
let isRecording = false;

// Backend URL
const BACKEND_URL = 'https://462d2d49-1f98-4257-a721-46da919d929b-00-3hhfbf6wdvr1l.kirk.replit.dev/chat';

// Check for browser support for Speech Recognition
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
} else if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
} else {
    alert('Your browser does not support speech recognition.');
}

// Configure Speech Recognition if supported
if (recognition) {
    recognition.continuous = false; // Stop after each utterance
    recognition.interimResults = false; // Don't show interim results
    recognition.lang = 'en-US'; // Set language to English

    recognition.onstart = () => {
        isRecording = true;
        status.textContent = 'Listening...';
        micButton.disabled = true;
    };

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript.trim();
        status.textContent = '';
        if (transcript) {
            addMessage('You', transcript);
            await sendMessage(transcript);
        } else {
            status.textContent = 'No input detected. Please try again.';
        }
    };

    recognition.onerror = (event) => {
        status.textContent = `Error: ${event.error}`;
        console.error(event.error);
        isRecording = false;
        micButton.disabled = false;
    };

    recognition.onend = () => {
        isRecording = false;
        micButton.disabled = false;
        status.textContent = '';
    };

    micButton.addEventListener('click', () => {
        if (!isRecording) {
            recognition.start();
        }
    });
}

// Handle form submission for text input
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form reload
    const message = chatInput.value.trim();
    if (message) {
        addMessage('You', message);
        chatInput.value = ''; // Clear input field
        await sendMessage(message);
    } else {
        status.textContent = 'Please enter a message.';
    }
});

// Function to add messages to the chat history
function addMessage(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll
}

// Function to send a message to the backend
async function sendMessage(message) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (data && data.response) {
            addMessage('Bot', data.response);

            // Play audio if available in the response
            if (data.audio) {
                playAudio(data.audio);
            }
        } else if (data.error) {
            addMessage('Bot', `Error: ${data.error}`);
        } else {
            addMessage('Bot', 'Error: No response from the chatbot.');
        }
    } catch (error) {
        addMessage('Bot', `Error: ${error.message}`);
        console.error('Error in sendMessage:', error);
    }
}

// Function to play audio from base64 data
function playAudio(audioBase64) {
    const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play().catch((error) => console.error('Error playing audio:', error));
}

// Utility function to convert base64 to Blob
function base64ToBlob(base64, mimeType) {
    const binary = atob(base64);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: mimeType });
}
