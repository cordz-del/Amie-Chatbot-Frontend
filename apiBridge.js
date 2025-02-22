import axios from 'axios';

// API endpoints
const OPENAI_API_ENDPOINT = process.env.REACT_APP_OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
const WHISPER_API_ENDPOINT = process.env.REACT_APP_WHISPER_API_ENDPOINT || 'https://api.openai.com/v1/audio/transcriptions';
const ELEVENLABS_API_ENDPOINT = process.env.REACT_APP_ELEVENLABS_API_ENDPOINT || 'https://api.elevenlabs.io/v1/text-to-speech';

// API Keys
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.REACT_APP_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.REACT_APP_ELEVENLABS_VOICE_ID;

// Error messages
const ERROR_MESSAGES = {
    MISSING_OPENAI_KEY: 'OpenAI API key is not configured',
    MISSING_ELEVENLABS_KEY: 'ElevenLabs API key is not configured',
    TRANSCRIPTION_ERROR: 'Failed to transcribe audio',
    AI_RESPONSE_ERROR: 'Failed to get AI response',
    TTS_ERROR: 'Failed to convert text to speech'
};

// Validate API keys
if (!OPENAI_API_KEY) console.error(ERROR_MESSAGES.MISSING_OPENAI_KEY);
if (!ELEVENLABS_API_KEY) console.error(ERROR_MESSAGES.MISSING_ELEVENLABS_KEY);

/**
 * Transcribes audio using OpenAI's Whisper API
 * @param {Blob} audioBlob - The audio blob to transcribe
 * @returns {Promise<string>} The transcribed text
 */
export const transcribeAudio = async (audioBlob) => {
    try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');

        const response = await axios.post(WHISPER_API_ENDPOINT, formData, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'multipart/form-data',
            }
        });

        return response.data.text;
    } catch (error) {
        console.error('Transcription error:', error);
        throw new Error(`${ERROR_MESSAGES.TRANSCRIPTION_ERROR}: ${error.response?.data?.error?.message || error.message}`);
    }
};

/**
 * Gets response from OpenAI's GPT model
 * @param {string} userMessage - The user's message
 * @param {Object} options - Optional parameters
 * @param {string} options.systemPrompt - Custom system prompt
 * @param {number} options.maxTokens - Maximum tokens in response
 * @returns {Promise<string>} The AI's response
 */
export const getOpenAIResponse = async (userMessage, options = {}) => {
    const {
        systemPrompt = 'You are Amie, a helpful and friendly AI assistant for children. Provide clear, concise, and age-appropriate responses.',
        maxTokens = 150
    } = options;

    try {
        const response = await axios.post(OPENAI_API_ENDPOINT, {
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: maxTokens,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error(`${ERROR_MESSAGES.AI_RESPONSE_ERROR}: ${error.response?.data?.error?.message || error.message}`);
    }
};

/**
 * Converts text to speech using ElevenLabs API
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Optional parameters
 * @param {number} options.stability - Voice stability (0-1)
 * @param {number} options.similarityBoost - Voice similarity boost (0-1)
 * @returns {Promise<string>} URL of the generated audio
 */
export const speakText = async (text, options = {}) => {
    const {
        stability = 0.5,
        similarityBoost = 0.5
    } = options;

    try {
        const response = await axios.post(
            `${ELEVENLABS_API_ENDPOINT}/${ELEVENLABS_VOICE_ID}`,
            {
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability,
                    similarity_boost: similarityBoost,
                    style: 0.5,
                    use_speaker_boost: true
                }
            },
            {
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                },
                responseType: 'blob'
            }
        );

        return URL.createObjectURL(response.data);
    } catch (error) {
        console.error('ElevenLabs API error:', error);
        throw new Error(`${ERROR_MESSAGES.TTS_ERROR}: ${error.response?.data?.error?.message || error.message}`);
    }
};

/**
 * Checks API configuration status
 * @returns {Object} Status of each API configuration
 */
export const checkAPIConfiguration = () => ({
    openai: !!OPENAI_API_KEY,
    elevenlabs: !!ELEVENLABS_API_KEY,
    voiceId: !!ELEVENLABS_VOICE_ID
});

/**
 * Cleans up audio URL resources
 * @param {string} audioUrl - The URL to revoke
 */
export const cleanupAudioUrl = (audioUrl) => {
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
    }
};

// Configure axios interceptors for consistent error handling
axios.interceptors.response.use(
    response => response,
    error => {
        console.error('API Request Failed:', {
            endpoint: error.config.url,
            status: error.response?.status,
            message: error.response?.data?.error?.message || error.message
        });

        throw new Error(
            error.response?.data?.error?.message || 
            'An error occurred while processing your request. Please try again.'
        );
    }
);
