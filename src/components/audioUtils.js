export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
    this.onDataAvailable = null;
  }

  async startRecording() {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    try {
      // Request microphone access with specific audio constraints
      const constraints = {
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
          volume: 1.0
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Configure MediaRecorder with options
      const options = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      this.isRecording = true;

      // Set up event listeners
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          if (this.onDataAvailable) {
            this.onDataAvailable(event.data);
          }
        }
      });

      this.mediaRecorder.addEventListener('error', (error) => {
        console.error('MediaRecorder error:', error);
        this.cleanup();
      });

      // Start recording with 10ms time slices for more frequent data availability
      this.mediaRecorder.start(10);
      
      return true;
    } catch (error) {
      this.cleanup();
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found');
      }
      throw error;
    }
  }

  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('No active recording to stop');
    }

    return new Promise((resolve, reject) => {
      try {
        const stopTimeout = setTimeout(() => {
          reject(new Error('Recording stop timeout'));
          this.cleanup();
        }, 3000);

        this.mediaRecorder.addEventListener('stop', () => {
          clearTimeout(stopTimeout);
          const audioBlob = new Blob(this.audioChunks, { type: this.getSupportedMimeType() });
          this.cleanup();
          resolve(audioBlob);
        }, { once: true });

        this.mediaRecorder.stop();
      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  pauseRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.mediaRecorder = null;
    this.stream = null;
    this.isRecording = false;
    this.audioChunks = [];
  }

  getSupportedMimeType() {
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return 'audio/webm'; // Fallback
  }

  getRecordingState() {
    return {
      isRecording: this.isRecording,
      state: this.mediaRecorder ? this.mediaRecorder.state : 'inactive'
    };
  }

  // Convert audio blob to base64 string
  static async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get audio duration from blob
  static async getAudioDuration(blob) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(blob);
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      audio.onerror = reject;
    });
  }
}
