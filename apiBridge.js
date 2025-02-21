// apiBridge.js

// Ensure your build process injects these environment variables at build time.
const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

/**
 * Transcribes an audio blob using Deepgram's STT API.
 * @param {Blob} audioBlob - The recorded audio data.
 * @returns {Promise<string>} - The transcript text.
 */
export async function transcribeAudio(audioBlob) {
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
    return transcript;
  } catch (err) {
    console.error('Transcription error:', err);
    throw err;
  }
}

/**
 * Synthesizes speech from text using Deepgram's TTS (Alloy) API.
 * @param {string} text - The text to be spoken.
 * @returns {Promise<string>} - A URL for the synthesized audio.
 */
export async function speakText(text) {
  if (!text) return;
  try {
    const ttsResponse = await fetch('https://api.deepgram.com/v1/speak', {
      method: 'POST',
      headers: {
        'Authorization': 'Token ' + DEEPGRAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model: 'aura-asteria-en',  // Using Deepgram Alloy voice model
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
    return audioUrl;
  } catch (err) {
    console.error('TTS error:', err);
    throw err;
  }
}

/**
 * Sends a prompt to the OpenAI API (ChatGPT) and returns the response.
 * @param {string} prompt - The user's message or prompt.
 * @returns {Promise<string>} - The chatbot's reply.
 */
export async function getOpenAIResponse(prompt) {
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
    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return reply;
  } catch (err) {
    console.error('OpenAI error:', err);
    throw err;
  }
}
