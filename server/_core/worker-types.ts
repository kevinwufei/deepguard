/**
 * Cloudflare Workers environment bindings type definition.
 * All environment variables and bindings are defined here.
 */
export interface WorkerEnv {
  // Cloudflare R2 bucket for file uploads
  UPLOADS: R2Bucket;

  // Static assets binding for SPA routing
  ASSETS: Fetcher;

  // Database
  DATABASE_URL: string;

  // Auth
  JWT_SECRET: string;
  VITE_APP_ID: string;
  OAUTH_SERVER_URL: string;
  OWNER_OPEN_ID: string;
  OWNER_NAME: string;

  // LLM / AI APIs
  BUILT_IN_FORGE_API_URL: string;
  BUILT_IN_FORGE_API_KEY: string;
  OPENROUTER_API_URL: string;
  OPENROUTER_API_KEY: string;
  OPENAI_API_URL: string;
  OPENAI_API_KEY: string;

  // Detection APIs
  SIGHTENGINE_API_USER: string;
  SIGHTENGINE_API_SECRET: string;
  ILLUMINARTY_API_KEY: string;
  HF_API_KEY: string;
  HF_MODEL_REPO: string;

  // Frontend env vars
  VITE_APP_TITLE: string;
  VITE_OAUTH_PORTAL_URL: string;
  VITE_FRONTEND_FORGE_API_KEY: string;
  VITE_FRONTEND_FORGE_API_URL: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRO_MONTHLY_PRICE_ID: string;
  STRIPE_PRO_YEARLY_PRICE_ID: string;
  STRIPE_BUSINESS_MONTHLY_PRICE_ID: string;
  STRIPE_BUSINESS_YEARLY_PRICE_ID: string;
  STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: string;
  STRIPE_ENTERPRISE_YEARLY_PRICE_ID: string;

  // Misc
  NODE_ENV: string;
  CORS_ORIGIN: string;
  PUBLIC_URL: string;
}
