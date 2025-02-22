document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startButton = document.getElementById('startChat');
    const stopButton = document.getElementById('stopChat');
    const chatMessages = document.getElementById('chat-messages');
    const recordingStatus = document.getElementById('status-text');
    const recordingIndicator = document.getElementById('recording-indicator');
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    const closeErrorButton = document.getElementById('close-error');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    // Close error modal when clicking the close button
    if (closeErrorButton) {
        closeErrorButton.addEventListener('click', () => {
            errorModal.style.display = 'none';
        });
    }

    // Function to show loading overlay
    const showLoading = () => {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    };

    // Function to hide loading overlay
    const hideLoading = () => {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    };

    // Function to show error message
    const showError = (message) => {
        if (errorModal && errorMessage) {
            errorMessage.textContent = message;
            errorModal.style.display = 'block';
        }
    };

    // Function to add message to chat
    const addMessageToChat = (message, isUser = false) => {
        if (chatMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.className = isUser ? 'user-message' : 'ai-message';
            messageDiv.textContent = message;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    // Function to send message to chat endpoint
    const sendMessage = async (message) => {
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to get response from server');
            return null;
        }
    };

    // Function to start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            isRecording = true;

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await processAudio(audioBlob);
            };

            mediaRecorder.start();
            if (recordingStatus) recordingStatus.textContent = 'Recording...';
            if (recordingIndicator) recordingIndicator.style.display = 'block';
            if (startButton) startButton.disabled = true;
            if (stopButton) stopButton.disabled = false;
        } catch (error) {
            console.error('Error starting recording:', error);
            showError('Could not access microphone. Please ensure you have granted permission.');
        }
    };

    // Function to stop recording
    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            isRecording = false;
            if (recordingStatus) recordingStatus.textContent = 'Processing...';
            if (recordingIndicator) recordingIndicator.style.display = 'none';
            if (startButton) startButton.disabled = false;
            if (stopButton) stopButton.disabled = true;
        }
    };

    // Function to process recorded audio
    const processAudio = async (audioBlob) => {
        try {
            showLoading();
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch('/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data = await response.json();
            if (data.success && data.transcript) {
                addMessageToChat(data.transcript, true);
                const aiResponse = await sendMessage(data.transcript);
                if (aiResponse) {
                    addMessageToChat(aiResponse, false);
                }
            }
        } catch (error) {
            console.error('Error processing audio:', error);
            showError('Failed to process audio');
        } finally {
            hideLoading();
            if (recordingStatus) recordingStatus.textContent = 'Ready';
        }
    };

    // Initialize buttons and event listeners
    if (startButton && stopButton) {
        startButton.addEventListener('click', () => {
            if (!isRecording) {
                startRecording();
            }
        });

        stopButton.addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
            }
        });

        // Initially disable stop button
        stopButton.disabled = true;
    }

    // Check if browser supports required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('Your browser does not support audio recording');
        if (startButton) startButton.disabled = true;
    }
});
