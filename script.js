import ApiBridge from './apiBridge.js';
import VoiceChatbot from './voiceChatbot.js';

class ChatApp {
    constructor() {
        this.apiBridge = new ApiBridge();
        this.voiceChatbot = new VoiceChatbot(this.apiBridge);
        
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.chatHistory = document.getElementById('chat-history');
        
        this.userName = null;
        this.userAge = null;
        this.conversationState = 'initial';
        
        this.setupEventListeners();
        this.setupInitialGreeting();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startListening());
        this.stopBtn.addEventListener('click', () => this.stopListening());
        
        this.voiceChatbot.setResultCallback((userText, aiResponse) => {
            this.addMessage(userText, 'user');
            this.addMessage(aiResponse, 'amie');
        });
    }

    setupInitialGreeting() {
        const initialGreeting = "Hello, I am Amie, your Social and Emotional Learning Assistant. May I know who I have the pleasure of talking to today?";
        this.addMessage(initialGreeting, "amie");
        this.voiceChatbot.speakResponse(initialGreeting);
    }

    startListening() {
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.voiceChatbot.startListening();
    }

    stopListening() {
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.voiceChatbot.stopListening();
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        this.chatHistory.appendChild(messageDiv);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }

    updateConversationState(userInput) {
        switch (this.conversationState) {
            case 'initial':
                this.userName = userInput.trim();
                this.conversationState = 'asking_feeling';
                break;
            case 'asking_feeling':
                this.conversationState = 'asking_age';
                break;
            case 'asking_age':
                this.userAge = parseInt(userInput);
                this.voiceChatbot.setUserAge(this.userAge);
                this.conversationState = 'conversation';
                break;
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
    }

    const chatApp = new ChatApp();
});
