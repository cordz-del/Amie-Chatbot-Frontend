// voiceChatbot.js - Handles voice interaction with Deepgram STT & TTS, and OpenAI
import { transcribeAudio, speakText, getOpenAIResponse, cleanupAudioUrl } from "./apiBridge.js";

class VoiceChatbot {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isProcessing = false;
        this.audioContext = null;
        this.audioAnalyser = null;
        this.visualizerCanvas = null;
        this.canvasContext = null;
        this.animationFrameId = null;
        this.stream = null;
    }

    /**
     * Initializes the voice chatbot and sets up audio visualization
     */
    initialize() {
        this.setupAudioContext();
        this.setupVisualizer();
        this.attachEventListeners();
    }

    /**
     * Sets up the Web Audio API context
     */
    setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioAnalyser = this.audioContext.createAnalyser();
        this.audioAnalyser.fftSize = 256;
    }

    /**
     * Sets up the audio visualizer
     */
    setupVisualizer() {
        this.visualizerCanvas = document.getElementById('audio-visualizer');
        if (this.visualizerCanvas) {
            this.canvasContext = this.visualizerCanvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    }

    /**
     * Attaches event listeners to DOM elements
     */
    attachEventListeners() {
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');

        if (startButton) startButton.addEventListener('click', () => this.startVoiceChat());
        if (stopButton) stopButton.addEventListener('click', () => this.stopVoiceChat());
    }

    /**
     * Starts voice recording for Speech-to-Text processing
     */
    async startVoiceChat() {
        if (this.isProcessing) {
            console.log("Already processing audio...");
            return;
        }

        const statusEl = document.getElementById("status");
        const startButton = document.getElementById("startButton");
        const stopButton = document.getElementById("stopButton");
        const recordingIndicator = document.getElementById("recording-indicator");

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.setupAudioVisualization(this.stream);

            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(this.stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                await this.processRecording(statusEl);
            };

            // Start recording
            this.mediaRecorder.start();
            statusEl.textContent = "Listening...";
            startButton.disabled = true;
            stopButton.disabled = false;
            recordingIndicator?.classList.add('active');
            this.startVisualization();

        } catch (error) {
            console.error("Microphone access error:", error);
            this.handleError("Microphone access denied.", statusEl);
        }
    }

    /**
     * Processes the recorded audio
     * @param {HTMLElement} statusEl - Status element for updating UI
     */
    async processRecording(statusEl) {
        this.isProcessing = true;
        this.stopVisualization();
        
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        try {
            // Step 1: Transcribe audio
            statusEl.textContent = "Transcribing...";
            const transcript = await transcribeAudio(audioBlob);
            
            if (!transcript?.trim()) {
                this.handleError("No speech detected.", statusEl);
                return;
            }

            // Update chat with user's message
            this.updateChatWindow("You", transcript);

            // Step 2: Get AI response
            statusEl.textContent = "Thinking...";
            const aiResponse = await getOpenAIResponse(transcript);
            this.updateChatWindow("Amie", aiResponse);

            // Step 3: Convert to speech and play
            await this.handleSpeechResponse(aiResponse, statusEl);

        } catch (error) {
            console.error("Error in voice chat flow:", error);
            this.handleError("Error processing chat.", statusEl);
        }
    }

    /**
     * Handles the text-to-speech conversion and playback
     * @param {string} text - Text to convert to speech
     * @param {HTMLElement} statusEl - Status element for updating UI
     */
    async handleSpeechResponse(text, statusEl) {
        statusEl.textContent = "Speaking...";
        try {
            const audioUrl = await speakText(text);
            const audioElement = new Audio(audioUrl);
            
            audioElement.addEventListener('ended', () => {
                statusEl.textContent = "Ready";
                this.isProcessing = false;
                cleanupAudioUrl(audioUrl);
            });

            audioElement.addEventListener('error', (e) => {
                console.error("Audio playback error:", e);
                this.handleError("Error playing audio", statusEl);
            });

            await audioElement.play();

        } catch (error) {
            console.error("TTS or playback error:", error);
            this.handleError("Error with speech synthesis", statusEl);
        }
    }

    /**
     * Stops voice recording
     */
    stopVoiceChat() {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            console.warn("No active recording session.");
            return;
        }

        const startButton = document.getElementById("startButton");
        const stopButton = document.getElementById("stopButton");
        const statusEl = document.getElementById("status");
        const recordingIndicator = document.getElementById("recording-indicator");

        try {
            this.mediaRecorder.stop();
            startButton.disabled = false;
            stopButton.disabled = true;
            statusEl.textContent = "Processing...";
            recordingIndicator?.classList.remove('active');
        } catch (error) {
            console.error("Error stopping recording:", error);
            this.handleError("Error stopping recording", statusEl);
        }
    }

    /**
     * Updates the chat window with a new message
     * @param {string} sender - Message sender
     * @param {string} message - Message content
     */
    updateChatWindow(sender, message) {
        const chatHistory = document.getElementById("chat-history");
        if (!chatHistory) {
            console.error("Chat history container not found.");
            return;
        }

        const messageElement = document.createElement("div");
        messageElement.className = `message ${sender.toLowerCase()}`;
        
        const messageContent = document.createElement("p");
        messageContent.className = "message-text";
        messageContent.innerHTML = `<strong>${sender}:</strong> ${message}`;
        
        const timestamp = document.createElement("div");
        timestamp.className = "message-timestamp";
        timestamp.textContent = new Date().toLocaleTimeString();
        
        messageElement.appendChild(messageContent);
        messageElement.appendChild(timestamp);
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    /**
     * Handles error states and updates UI
     * @param {string} message - Error message
     * @param {HTMLElement} statusEl - Status element
     */
    handleError(message, statusEl) {
        console.error(message);
        if (statusEl) statusEl.textContent = message;
        this.isProcessing = false;
        
        const startButton = document.getElementById("startButton");
        const stopButton = document.getElementById("stopButton");
        const recordingIndicator = document.getElementById("recording-indicator");
        
        if (startButton) startButton.disabled = false;
        if (stopButton) stopButton.disabled = true;
        if (recordingIndicator) recordingIndicator.classList.remove('active');
    }

    /**
     * Sets up audio visualization from microphone stream
     * @param {MediaStream} stream - Microphone media stream
     */
    setupAudioVisualization(stream) {
        if (!this.audioContext || !this.audioAnalyser) return;
        
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.audioAnalyser);
    }

    /**
     * Starts the audio visualization animation
     */
    startVisualization() {
        if (!this.canvasContext || !this.audioAnalyser) return;

        const bufferLength = this.audioAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const width = this.visualizerCanvas.width;
        const height = this.visualizerCanvas.height;
        const barWidth = (width / bufferLength) * 2.5;

        const renderFrame = () => {
            this.animationFrameId = requestAnimationFrame(renderFrame);
            this.audioAnalyser.getByteFrequencyData(dataArray);
            
            this.canvasContext.fillStyle = '#000000';
            this.canvasContext.fillRect(0, 0, width, height);

            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * height;
                
                const gradient = this.canvasContext.createLinearGradient(0, height, 0, height - barHeight);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                
                this.canvasContext.fillStyle = gradient;
                this.canvasContext.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        renderFrame();
    }

    /**
     * Stops the audio visualization
     */
    stopVisualization() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Resizes the visualizer canvas
     */
    resizeCanvas() {
        if (!this.visualizerCanvas) return;
        
        this.visualizerCanvas.width = this.visualizerCanvas.offsetWidth;
        this.visualizerCanvas.height = this.visualizerCanvas.offsetHeight;
    }
}

// Create and export a singleton instance
const voiceChatbot = new VoiceChatbot();
export default voiceChatbot;
