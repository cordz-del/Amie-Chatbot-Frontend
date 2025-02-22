class ChatApp {
    constructor() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.chatHistory = document.getElementById('chat-history');
        
        // Initialize Speech Recognition
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        // Initialize Speech Synthesis
        this.synthesis = window.speechSynthesis;
        
        // Bind event listeners
        this.startBtn.addEventListener('click', () => this.startListening());
        this.stopBtn.addEventListener('click', () => this.stopListening());
        this.setupSpeechRecognition();
        
        // Initial UI state
        this.stopBtn.disabled = true;
    }

    setupSpeechRecognition() {
        this.recognition.onstart = () => {
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.addMessage("Listening...", "amie");
        };

        this.recognition.onend = () => {
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
        };

        this.recognition.onresult = (event) => {
            const resultIndex = event.resultIndex;
            const transcript = event.results[resultIndex][0].transcript;
            
            if (event.results[resultIndex].isFinal) {
                this.addMessage(transcript, "you");
                this.processUserInput(transcript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.addMessage(`Error: ${event.error}`, "amie");
            this.stopListening();
        };
    }

    startListening() {
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    }

    stopListening() {
        try {
            this.recognition.stop();
            this.synthesis.cancel(); // Stop any ongoing speech
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        this.chatHistory.appendChild(messageDiv);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }

    async processUserInput(input) {
        // Simple response logic - replace with actual AI processing
        let response = "I heard you say: " + input;
        
        // Add AI response to chat
        this.addMessage(response, "amie");
        
        // Speak the response
        this.speakResponse(response);
    }

    speakResponse(text) {
        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure speech settings
        utterance.rate = 1.0;  // Speed of speech
        utterance.pitch = 1.0; // Pitch of voice
        utterance.volume = 1.0; // Volume
        
        // Optional: Select a specific voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.lang === 'en-US');
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
            console.log('Finished speaking');
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
        };

        this.synthesis.speak(utterance);
    }
}

// Wait for the DOM to load before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Check for browser compatibility
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
    }

    if (!('speechSynthesis' in window)) {
        alert('Text-to-speech is not supported in this browser. Please use Chrome or Edge.');
        return;
    }

    // Initialize the chat application
    const chatApp = new ChatApp();
});
