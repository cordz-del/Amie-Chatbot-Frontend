let recognition;
let isListening = false;

// Initialize speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = false;
}

document.addEventListener('DOMContentLoaded', function() {
    const chatbox = document.querySelector('.chatbox');
    const inputField = document.querySelector('.input-field');
    const sendButton = document.querySelector('.send-btn');
    const micButton = document.querySelector('.mic-btn');

    // Function to add messages to the chatbox
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
        messageDiv.textContent = text;
        chatbox.appendChild(messageDiv);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    // Function to handle sending messages to OpenAI and getting responses
    async function handleMessage(userInput) {
        if (!userInput.trim()) return;

        // Display user message
        addMessage(userInput, true);
        inputField.value = '';

        try {
            // Send message to OpenAI
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are Amie, a Social and Emotional Learning Assistant. Provide helpful, empathetic responses."
                        },
                        {
                            role: "user",
                            content: userInput
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from OpenAI');
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // Display AI response
            addMessage(aiResponse, false);

            // Speak the response using Deepgram
            await speakResponse(aiResponse);

        } catch (error) {
            console.error('Error:', error);
            addMessage("I'm sorry, I'm having trouble connecting to my services.", false);
        }
    }

    // Function to handle text-to-speech using Deepgram
    async function speakResponse(text) {
        try {
            const response = await fetch('https://api.deepgram.com/v1/speak', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    voice: "alloy",
                    rate: 1.0,
                    pitch: 1.0
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get audio response');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            await audio.play();
        } catch (error) {
            console.error('TTS Error:', error);
        }
    }

    // Send button click handler
    sendButton.addEventListener('click', () => {
        handleMessage(inputField.value);
    });

    // Enter key handler
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleMessage(inputField.value);
        }
    });

    // Speech recognition handlers
    if (recognition) {
        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript;
            handleMessage(text);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            micButton.classList.remove('listening');
        };

        recognition.onend = () => {
            isListening = false;
            micButton.classList.remove('listening');
        };

        // Microphone button handler
        micButton.addEventListener('click', () => {
            if (!isListening) {
                recognition.start();
                isListening = true;
                micButton.classList.add('listening');
            } else {
                recognition.stop();
                isListening = false;
                micButton.classList.remove('listening');
            }
        });
    }

    // Initial greeting
    const initialGreeting = "Hello! I'm Amie, your Social and Emotional Learning Assistant. How can I help you today?";
    addMessage(initialGreeting, false);
    speakResponse(initialGreeting);
});
