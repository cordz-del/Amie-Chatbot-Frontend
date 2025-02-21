// voiceChatbot.js

// Environment variables (ensure these are injected at build time)
const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// UI Elements – Ensure these exist in your index.html
const statusEl = document.getElementById('status');
const transcriptEl = document.getElementById('transcript');
const recordBtn = document.getElementById('record');
const stopBtn = document.getElementById('stop');

let mediaRecorder;
let audioChunks = [];

// Request microphone access and initialize MediaRecorder
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    statusEl.textContent = 'Microphone ready';
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.addEventListener('dataavailable', event => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });
    mediaRecorder.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      // First, transcribe the recorded audio
      transcribeAudio(audioBlob)
        .then(transcript => {
          // Display the transcript in the chat history
          transcriptEl.textContent = transcript;
          if (transcript) {
            // Send the transcript to OpenAI for a chatbot reply
            return getOpenAIResponse(transcript);
          } else {
            throw new Error("No transcript generated");
          }
        })
        .then(aiResponse => {
          // Append AI response to the transcript area and speak it
          transcriptEl.textContent += "\nAmie: " + aiResponse;
          return speakText(aiResponse);
        })
        .catch(err => {
          console.error(err);
          statusEl.textContent = "Error during processing";
        });
    });
  })
  .catch(err => {
    console.error('Microphone error:', err);
    statusEl.textContent = 'Error accessing microphone';
  });

// Event listeners for control buttons
recordBtn.addEventListener('click', () => {
  if (!mediaRecorder) return;
  audioChunks = [];
  transcriptEl.textContent = '';
  statusEl.textContent = 'Recording...';
  mediaRecorder.start(250); // Collect audio in 250ms chunks
  recordBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  if (!mediaRecorder) return;
  statusEl.textContent = 'Stopping...';
  mediaRecorder.stop();
  recordBtn.disabled = false;
  stopBtn.disabled = true;
});

// Function: Transcribe audio using Deepgram STT
async function transcribeAudio(audioBlob) {
  statusEl.textContent = 'Transcribing...';
  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?language=en-US', {
      method: 'POST',
      headers: {
        'Authorization': 'Token ' + DEEPGRAM_API_KEY,
        'Content-Type': 'audio/webm'
      },
      body: audioBlob
    });
    const data = await response.json();
    const transcript = data?.results?.channels[0]?.alternatives[0]?.transcript || '';
    statusEl.textContent = transcript ? 'Transcription complete' : 'No speech detected';
    return transcript;
  } catch (err) {
    console.error('Transcription error:', err);
    statusEl.textContent = 'Transcription error';
    throw err;
  }
}

// Function: Convert text to speech using Deepgram TTS (Alloy)
async function speakText(text) {
  if (!text) return;
  statusEl.textContent = 'Synthesizing speech...';
  try {
    const ttsResponse = await fetch('https://api.deepgram.com/v1/speak', {
      method: 'POST',
      headers: {
        'Authorization': 'Token ' + DEEPGRAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model: 'aura-asteria-en',  // Deepgram Alloy voice model
        encoding: 'linear16',
        sample_rate: 22050,
        output: 'wav'
      })
    });
    if (!ttsResponse.ok) {
      throw new Error(`TTS failed: ${ttsResponse.status}`);
    }
    const audioData = await ttsResponse.blob();
    const audioUrl = URL.createObjectURL(audioData);
    const audioElement = new Audio(audioUrl);
    audioElement.play();
    statusEl.textContent = 'Playing response...';
    audioElement.onended = () => {
      URL.revokeObjectURL(audioUrl);
      statusEl.textContent = 'Ready';
    };
  } catch (err) {
    console.error('TTS error:', err);
    statusEl.textContent = 'TTS error';
    throw err;
  }
}

// Function: Get a response from OpenAI Chat API
async function getOpenAIResponse(prompt) {
  statusEl.textContent = 'Generating response...';
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      })
    });
    const data = await response.json();
    const aiReply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    statusEl.textContent = 'Response generated';
    return aiReply;
  } catch (err) {
    console.error('OpenAI error:', err);
    statusEl.textContent = 'OpenAI error';
    throw err;
  }
}
