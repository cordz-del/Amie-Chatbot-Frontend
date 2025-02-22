class VoiceChatbot {
    constructor(apiBridge) {
        this.apiBridge = apiBridge;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.setupSpeechRecognition();
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error('Speech recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript;
            this.onSpeechResult(text);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.recognition.start();
            }
        };
    }

    async onSpeechResult(text) {
        try {
            // Process the speech input and get AI response
            const response = await this.processUserInput(text);
            
            // Synthesize and play the response
            await this.speakResponse(response);
            
            // Emit the result for UI updates
            this.onResult && this.onResult(text, response);
        } catch (error) {
            console.error('Error processing speech:', error);
        }
    }

    async processUserInput(text) {
        try {
            const response = await this.apiBridge.sendToOpenAI(text, {
                age: this.userAge || 25, // Default age if not set
                context: this.conversationContext || 'general'
            });
            return response;
        } catch (error) {
            console.error('Error processing input:', error);
            return "I'm sorry, I'm having trouble processing your request right now.";
        }
    }

    async speakResponse(text) {
        try {
            const audioBlob = await this.apiBridge.synthesizeSpeech(text);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            await audio.play();
        } catch (error) {
            console.error('Error speaking response:', error);
        }
    }

    startListening() {
        if (!this.recognition) {
            console.error('Speech recognition not initialized');
            return;
        }
        this.isListening = true;
        this.recognition.start();
    }

    stopListening() {
        if (!this.recognition) return;
        this.isListening = false;
        this.recognition.stop();
    }

    setUserAge(age) {
        this.userAge = age;
    }

    setConversationContext(context) {
        this.conversationContext = context;
    }

    setResultCallback(callback) {
        this.onResult = callback;
    }
}

export default VoiceChatbot;
