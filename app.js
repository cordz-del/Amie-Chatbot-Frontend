// DOM elements
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-btn');
const micButton = document.getElementById('mic-btn');
const status = document.getElementById('status');

let recognition;

// Check for browser support for speech recognition
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
} else if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
} else {
    alert('Your browser does not support speech recognition.');
}

// Configure recognition if supported
if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        status.textContent = 'Listening...';
        micButton.disabled = true;
    };

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript.trim();
        status.textContent = `You said: ${transcript}`;
        if (transcript) {
            await sendMessage(transcript);
        }
    };

    recognition.onerror = (event) => {
        status.textContent = `Error occurred: ${event.error}`;
    };

    recognition.onend = () => {
        micButton.disabled = false;
        status.textContent = '';
    };

    micButton.addEventListener('click', () => {
        recognition.start();
    });
}

// Handle send button click
sendButton.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (message) {
        await sendMessage(message);
        chatInput.value = '';
    }
});

// Handle "Enter" key for text input
chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendButton.click();
    }
});

// Function to send a message to the backend
async function sendMessage(message) {
    try {
        const response = await fetch('https://462d2d49-1f98-4257-a721-46da919d929b-00-3hhfbf6wdvr1l.kirk.replit.dev/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        if (data.response) {
            addMessageToChat('user', message);
            addMessageToChat('bot', data.response);

            if (data.audio) {
                playAudio(data.audio);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to add messages to the chat history
function addMessageToChat(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.classList.add(sender);
    messageElement.textContent = `${sender === 'user' ? 'You' : 'Bot'}: ${message}`;
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Function to play audio if provided
function playAudio(audioData) {
    const audioBlob = new Blob([new Uint8Array(audioData)], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error('Error playing audio:', error));
}
