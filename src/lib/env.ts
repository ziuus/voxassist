type AiProvider = "google" | "openai" | "groq";
type PersistenceMode = "local" | "mongodb";
type AudioStorageMode = "local" | "s3";

type RuntimeConfig = {
  prodEnabled: boolean;
  aiProvider: AiProvider;
  persistenceMode: PersistenceMode;
  audioStorageMode: AudioStorageMode;
  jobQueueEnabled: boolean;
  redisUrl?: string;
  googleApiKey?: string;
  openaiApiKey?: string;
  databaseUrl?: string;
  awsS3Bucket?: string;
  awsS3Region?: string;
};

const PLACEHOLDER_VALUES = new Set([
  "your_google_api_key_here",
  "your_openai_api_key_here",
]);

function parseBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  return raw === "true";
}

function parseAiProvider(): AiProvider {
  const raw = process.env.AI_PROVIDER?.toLowerCase();
  if (raw === "openai") return "openai";
  if (raw === "groq") return "groq";
  return "google"; // default
}

function parsePersistenceMode(prodEnabled: boolean): PersistenceMode {
  const raw = process.env.RECORDINGS_PERSISTENCE_MODE;
  if (raw === "mongodb") return "mongodb";
  if (raw === "local") return "local";
  return prodEnabled ? "mongodb" : "local";
}

function parseAudioStorageMode(prodEnabled: boolean): AudioStorageMode {
  const raw = process.env.AUDIO_STORAGE_MODE;
  if (raw === "s3") return "s3";
  if (raw === "local") return "local";
  return prodEnabled ? "s3" : "local";
}

function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value || PLACEHOLDER_VALUES.has(value)) {
    return undefined;
  }
  return value;
}

export function getRuntimeConfig(): RuntimeConfig {
  const prodEnabled = parseBoolean("PROD", false);
  const aiProvider = parseAiProvider();
  const persistenceMode = parsePersistenceMode(prodEnabled);
  const audioStorageMode = parseAudioStorageMode(prodEnabled);
  const jobQueueEnabled = parseBoolean("ENABLE_JOB_QUEUE", false);

  return {
    prodEnabled,
    aiProvider,
    persistenceMode,
    audioStorageMode,
    jobQueueEnabled,
    redisUrl: getEnv("REDIS_URL"),
    googleApiKey: getEnv("GOOGLE_API_KEY"),
    openaiApiKey: getEnv("OPENAI_API_KEY"),
    databaseUrl: getEnv("DATABASE_URL"),
    awsS3Bucket: getEnv("AWS_S3_BUCKET"),
    awsS3Region: getEnv("AWS_S3_REGION"),
  };
}

// Check if required features are available
export function getFeatureStatus() {
  const config = getRuntimeConfig();
  return {
    aiAvailable: !!(config.aiProvider === "google" ? config.googleApiKey : config.openaiApiKey),
    databaseAvailable: !!config.databaseUrl,
    s3Available: !!(config.awsS3Bucket && config.awsS3Region),
    redisAvailable: !!config.redisUrl,
  };
}