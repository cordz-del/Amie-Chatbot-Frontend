document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        startButton: document.getElementById('startChat'),
        stopButton: document.getElementById('stopChat'),
        chatMessages: document.getElementById('chat-messages'),
        recordingStatus: document.getElementById('status-text'),
        recordingIndicator: document.getElementById('recording-indicator'),
        loadingOverlay: document.getElementById('loading-overlay'),
        errorModal: document.getElementById('error-modal'),
        errorMessage: document.getElementById('error-message')
    };

    // State management
    const state = {
        mediaRecorder: null,
        audioChunks: [],
        isRecording: false,
        isProcessing: false
    };

    // Configuration
    const config = {
        audio: { 
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
        },
        maxRecordingDuration: 60000 // 60 seconds
    };

    /**
     * Initialize the application
     */
    function init() {
        if (!navigator.mediaDevices?.getUserMedia) {
            showError('Your browser does not support audio recording');
            elements.startButton.disabled = true;
            return;
        }

        setupEventListeners();
        updateUIState();
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        elements.startButton.addEventListener('click', startRecording);
        elements.stopButton.addEventListener('click', stopRecording);
        window.closeErrorModal = closeErrorModal;
    }

    /**
     * Start audio recording
     */
    async function startRecording() {
        if (state.isProcessing || state.isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: config.audio 
            });
            
            state.mediaRecorder = new MediaRecorder(stream);
            state.audioChunks = [];
            state.isRecording = true;

            state.mediaRecorder.ondataavailable = handleDataAvailable;
            state.mediaRecorder.onstop = processRecording;

            // Set recording timeout
            setTimeout(() => {
                if (state.isRecording) {
                    stopRecording();
                }
            }, config.maxRecordingDuration);

            // Start recording
            state.mediaRecorder.start();
            updateUIState('recording');
            addMessage('Recording started...', 'user');

        } catch (error) {
            console.error('Recording error:', error);
            showError('Error accessing microphone. Please ensure you have granted permission.');
        }
    }

    /**
     * Stop audio recording
     */
    function stopRecording() {
        if (!state.mediaRecorder || !state.isRecording) return;

        state.isRecording = false;
        state.mediaRecorder.stop();
        state.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        updateUIState('processing');
    }

    /**
     * Handle audio data availability
     * @param {BlobEvent} event 
     */
    function handleDataAvailable(event) {
        if (event.data.size > 0) {
            state.audioChunks.push(event.data);
        }
    }

    /**
     * Process recorded audio
     */
    async function processRecording() {
        showLoading(true);
        state.isProcessing = true;

        try {
            const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
            const response = await sendAudioToServer(audioBlob);
            
            if (response?.text) {
                addMessage(response.text, 'bot');
            }

        } catch (error) {
            console.error('Processing error:', error);
            showError('Error processing audio. Please try again.');
        } finally {
            state.isProcessing = false;
            showLoading(false);
            updateUIState('ready');
        }
    }

    /**
     * Send audio to server for processing
     * @param {Blob} audioBlob 
     * @returns {Promise<Object>}
     */
    async function sendAudioToServer(audioBlob) {
        // TODO: Implement actual server communication
        // This is a placeholder that simulates server processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const responses = [
            "I understand how you're feeling. Would you like to talk more about that?",
            "That sounds challenging. How does that make you feel?",
            "I'm here to listen and help. Can you tell me more?",
            "Your emotions are valid. Let's explore this together.",
            "Thank you for sharing that with me. How can I support you?"
        ];

        return {
            text: responses[Math.floor(Math.random() * responses.length)]
        };
    }

    /**
     * Add message to chat window
     * @param {string} text 
     * @param {string} type 
     */
    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${type}-message`);
        
        const timestamp = new Date().toLocaleTimeString();
        messageDiv.innerHTML = `
            <span class="message-text">${text}</span>
            <span class="message-timestamp">${timestamp}</span>
        `;
        
        elements.chatMessages.appendChild(messageDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    /**
     * Update UI state
     * @param {string} state 
     */
    function updateUIState(state = 'ready') {
        const states = {
            ready: {
                startButton: false,
                stopButton: true,
                statusText: 'Click \'Start Chat\' to begin',
                indicator: false
            },
            recording: {
                startButton: true,
                stopButton: false,
                statusText: 'Recording...',
                indicator: true
            },
            processing: {
                startButton: true,
                stopButton: true,
                statusText: 'Processing...',
                indicator: false
            }
        };

        const currentState = states[state];
        elements.startButton.disabled = currentState.startButton;
        elements.stopButton.disabled = currentState.stopButton;
        elements.recordingStatus.textContent = currentState.statusText;
        elements.recordingIndicator.classList.toggle('active', currentState.indicator);
    }

    /**
     * Show/hide loading overlay
     * @param {boolean} show 
     */
    function showLoading(show) {
        elements.loadingOverlay.classList.toggle('hidden', !show);
    }

    /**
     * Show error message
     * @param {string} message 
     */
    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorModal.classList.remove('hidden');
    }

    /**
     * Close error modal
     */
    function closeErrorModal() {
        elements.errorModal.classList.add('hidden');
    }

    // Initialize the application
    init();
});
