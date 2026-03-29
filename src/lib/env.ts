type AiProvider = "google" | "openai";
type PersistenceMode = "local" | "mongodb";
type AudioStorageMode = "local" | "s3";

type RuntimeConfig = {
  prodEnabled: boolean;
  aiProvider: AiProvider;
  persistenceMode: PersistenceMode;
  audioStorageMode: AudioStorageMode;
  jobQueueEnabled: boolean;
  redisUrl?: string;
};

const PLACEHOLDER_VALUES = new Set([
  "your_google_api_key_here",
  "your_openai_api_key_here",
]);

let validatedInStrictMode = false;

function parseBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }

  throw new Error(`${name} must be "true" or "false"`);
}

function parseAiProvider(): AiProvider {
  const raw = process.env.AI_PROVIDER?.toLowerCase();
  if (!raw) {
    return "google";
  }
  if (raw === "google" || raw === "openai") {
    return raw;
  }

  throw new Error("AI_PROVIDER must be either \"google\" or \"openai\"");
}

function parsePersistenceMode(prodEnabled: boolean): PersistenceMode {
  const raw = process.env.RECORDINGS_PERSISTENCE_MODE;
  if (!raw) {
    return prodEnabled ? "mongodb" : "local";
  }
  if (raw === "local" || raw === "mongodb") {
    return raw;
  }

  throw new Error(
    "RECORDINGS_PERSISTENCE_MODE must be either \"local\" or \"mongodb\""
  );
}

function parseAudioStorageMode(prodEnabled: boolean): AudioStorageMode {
  const raw = process.env.AUDIO_STORAGE_MODE;
  if (!raw) {
    return prodEnabled ? "s3" : "local";
  }
  if (raw === "local" || raw === "s3") {
    return raw;
  }

  throw new Error("AUDIO_STORAGE_MODE must be either \"local\" or \"s3\"");
}

function requireNonPlaceholderEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || PLACEHOLDER_VALUES.has(value)) {
    throw new Error(`${name} is required and must not be a placeholder value`);
  }

  return value;
}

export function getRuntimeConfig(): RuntimeConfig {
  const prodEnabled = parseBoolean("PROD", false);
  const aiProvider = parseAiProvider();
  const persistenceMode = parsePersistenceMode(prodEnabled);
  const audioStorageMode = parseAudioStorageMode(prodEnabled);
  const jobQueueEnabled = parseBoolean("ENABLE_JOB_QUEUE", false);
  const redisUrl = process.env.REDIS_URL?.trim();

  return {
    prodEnabled,
    aiProvider,
    persistenceMode,
    audioStorageMode,
    jobQueueEnabled,
    redisUrl,
  };
}

export function assertRuntimeConfig(options?: { strict?: boolean }): RuntimeConfig {
  const strict = options?.strict ?? false;
  if (strict && validatedInStrictMode) {
    return getRuntimeConfig();
  }

  const config = getRuntimeConfig();

  if (config.jobQueueEnabled && !config.redisUrl) {
    throw new Error("REDIS_URL is required when ENABLE_JOB_QUEUE=true");
  }

  if (strict) {
    if (config.aiProvider === "google") {
      requireNonPlaceholderEnv("GOOGLE_API_KEY");
    } else {
      requireNonPlaceholderEnv("OPENAI_API_KEY");
    }

    if (config.persistenceMode === "mongodb") {
      requireNonPlaceholderEnv("DATABASE_URL");
    }

    if (config.audioStorageMode === "s3") {
      requireNonPlaceholderEnv("AWS_S3_BUCKET");
      requireNonPlaceholderEnv("AWS_S3_REGION");
    }

    validatedInStrictMode = true;
  }

  return config;
}