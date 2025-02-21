// apiBridge.js - Handles all API calls for OpenAI and Deepgram

// Ensure API keys are injected during the build process
const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

/**
 * Transcribes an audio blob using Deepgram's Speech-to-Text (STT) API.
 * @param {Blob} audioBlob - The recorded audio data.
 * @returns {Promise<string>} - The transcribed text.
 */
export async function transcribeAudio(audioBlob) {
  if (!DEEPGRAM_API_KEY) {
    console.error("Deepgram API key is missing.");
    return "Error: Deepgram API key not found.";
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?language=en-US', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm'
      },
      body: audioBlob
    });

    if (!response.ok) throw new Error(`Deepgram STT failed: ${response.statusText}`);

    const data = await response.json();
    const transcript = data?.results?.channels[0]?.alternatives[0]?.transcript || 'No transcription available.';
    
    console.log("Deepgram STT Transcript:", transcript);
    return transcript;
  } catch (err) {
    console.error('Deepgram STT error:', err);
    return "Error transcribing audio.";
  }
}

/**
 * Synthesizes speech from text using Deepgram's Text-to-Speech (TTS) API.
 * @param {string} text - The text to be spoken.
 * @returns {Promise<string>} - A URL for the generated audio file.
 */
export async function speakText(text) {
  if (!text) return;
  if (!DEEPGRAM_API_KEY) {
    console.error("Deepgram API key is missing.");
    return "Error: Deepgram API key not found.";
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/speak', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
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

    if (!response.ok) throw new Error(`Deepgram TTS failed: ${response.statusText}`);

    const audioData = await response.blob();
    const audioUrl = URL.createObjectURL(audioData);
    
    console.log("Deepgram TTS Audio URL:", audioUrl);
    return audioUrl;
  } catch (err) {
    console.error('Deepgram TTS error:', err);
    return "Error generating speech.";
  }
}

/**
 * Sends a user's message to the OpenAI API and returns the chatbot's response.
 * @param {string} prompt - The user's message.
 * @returns {Promise<string>} - The chatbot's response.
 */
export async function getOpenAIResponse(prompt) {
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API key is missing.");
    return "Error: OpenAI API key not found.";
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error(`OpenAI API call failed: ${response.statusText}`);

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response generated.';
    
    console.log("OpenAI Response:", reply);
    return reply;
  } catch (err) {
    console.error('OpenAI error:', err);
    return "Error getting response from OpenAI.";
  }
}
