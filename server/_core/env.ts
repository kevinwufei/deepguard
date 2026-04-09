export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "default-secret-change-me",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // LLM: support OpenRouter, OpenAI, or any OpenAI-compatible API
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? process.env.OPENROUTER_API_URL ?? process.env.OPENAI_API_URL ?? "https://openrouter.ai/api",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  // Auth is optional - if not configured, app works without login
  authEnabled: !!(process.env.OAUTH_SERVER_URL && process.env.VITE_APP_ID),
};
