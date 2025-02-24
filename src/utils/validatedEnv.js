export const validateEnvironmentVariables = () => {
  const requiredVars = [
    'VITE_OPENAI_API_KEY',
    'VITE_ELEVENLABS_API_KEY',
    'VITE_ELEVENLABS_VOICE_ID',
    'VITE_BACKEND_URL'
  ];

  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  return true;
};
