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

  // Show loading overlay
  const showLoading = () => {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
  };

  // Hide loading overlay
  const hideLoading = () => {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  };

  // Show error message modal
  const showError = (message) => {
    if (errorModal && errorMessage) {
      errorMessage.textContent = message;
      errorModal.style.display = 'block';
    }
  };

  // Append a new message to the chat area
  const addMessageToChat = (message, isUser = false) => {
    if (chatMessages) {
      const messageDiv = document.createElement('div');
      messageDiv.className = isUser ? 'user-message' : 'ai-message';
      messageDiv.textContent = message;
      chatMessages.appendChild(messageDiv);
      // Auto-scroll to the bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  };

  // Send a message to the /chat endpoint
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
      console.error('Error sending message:', error);
      showError('Failed to get response from server');
      return null;
    }
  };

  // Start audio recording using the MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      isRecording = true;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
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

  // Stop audio recording and clean up the stream
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      // Stop all audio tracks to release the microphone
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      isRecording = false;
      if (recordingStatus) recordingStatus.textContent = 'Processing...';
      if (recordingIndicator) recordingIndicator.style.display = 'none';
      if (startButton) startButton.disabled = false;
      if (stopButton) stopButton.disabled = true;
    }
  };

  // Process the recorded audio by sending it to the /transcribe endpoint
  const processAudio = async (audioBlob) => {
    try {
      showLoading();
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      if (data.success && data.transcript) {
        // Display the user's transcribed message
        addMessageToChat(data.transcript, true);
        // Send the transcript to get the AI response
        const aiResponse = await sendMessage(data.transcript);
        if (aiResponse) {
          addMessageToChat(aiResponse, false);
          // Here you could also trigger TTS for the AI response if needed
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

  // Set up event listeners for the Start and Stop buttons
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

    // Initially disable the Stop button
    stopButton.disabled = true;
  }

  // Check for microphone support in the browser
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError('Your browser does not support audio recording');
    if (startButton) startButton.disabled = true;
  }
});
