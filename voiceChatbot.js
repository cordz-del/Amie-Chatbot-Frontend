// Replace with your Deepgram API key
const DEEPGRAM_API_KEY process.env.DEEPGRAM_API_KEY

// UI Elements
const statusEl = document.getElementById('status');
const transcriptEl = document.getElementById('transcript');
const recordBtn = document.getElementById('record');
const stopBtn = document.getElementById('stop');

let mediaRecorder;
let audioChunks = [];

// Request microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    statusEl.textContent = 'Microphone ready';
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.addEventListener('dataavailable', event => {
      if (event.data.size > 0) audioChunks.push(event.data);
    });
    mediaRecorder.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      transcribeAudio(audioBlob);
    });
  })
  .catch(err => {
    console.error('Microphone error:', err);
    statusEl.textContent = 'Error accessing microphone';
  });

// Control buttons
recordBtn.addEventListener('click', () => {
  if (!mediaRecorder) return;
  audioChunks = [];
  transcriptEl.textContent = '';
  statusEl.textContent = 'Recording...';
  mediaRecorder.start(250);
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
    transcriptEl.textContent = transcript;
    statusEl.textContent = transcript ? 'Transcription complete' : 'No speech detected';
    if (transcript) speakText(transcript);
  } catch (err) {
    console.error('Transcription error:', err);
    statusEl.textContent = 'Transcription error';
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
        'Authorization': 'Token ' +process.env.DEEPGRAM_AAPI_KEY
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model: 'aura-asteria-en',  // using Deepgram Alloy voice model
        encoding: 'linear16',
        sample_rate: 22050,
        output: 'wav'
      })
    });
    if (!ttsResponse.ok) throw new Error(`TTS failed: ${ttsResponse.status}`);
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
  }
}
