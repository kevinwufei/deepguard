import type { WorkerEnv } from "./worker-types";

/**
 * Global ENV singleton.
 * In Cloudflare Workers, this is initialized once per isolate from the
 * Workers env bindings (which are constant for all requests).
 */
export const ENV = {
  appId: "",
  cookieSecret: "default-secret-change-me",
  databaseUrl: "",
  oAuthServerUrl: "",
  ownerOpenId: "",
  isProduction: true,
  forgeApiUrl: "https://openrouter.ai/api",
  forgeApiKey: "",
  authEnabled: false,
  publicUrl: "",
  sightengineApiUser: "",
  sightengineApiSecret: "",
  illuminartyApiKey: "",
  hfApiKey: "",
  hfModelRepo: "",
  // Stripe
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  stripePriceIds: {
    pro_monthly: "",
    pro_yearly: "",
    business_monthly: "",
    business_yearly: "",
    enterprise_monthly: "",
    enterprise_yearly: "",
  } as Record<string, string>,
};

let _r2Bucket: R2Bucket | null = null;

/**
 * Called once when the worker starts to populate ENV from Workers bindings.
 * Workers env bindings are constant per deployment, so this is safe.
 */
export function initEnvFromWorker(env: WorkerEnv) {
  ENV.appId = env.VITE_APP_ID ?? "";
  ENV.cookieSecret = env.JWT_SECRET ?? "default-secret-change-me";
  ENV.databaseUrl = env.DATABASE_URL ?? "";
  ENV.oAuthServerUrl = env.OAUTH_SERVER_URL ?? "";
  ENV.ownerOpenId = env.OWNER_OPEN_ID ?? "";
  ENV.isProduction = (env.NODE_ENV ?? "production") === "production";
  ENV.forgeApiUrl = env.BUILT_IN_FORGE_API_URL ?? env.OPENROUTER_API_URL ?? env.OPENAI_API_URL ?? "https://openrouter.ai/api";
  ENV.forgeApiKey = env.BUILT_IN_FORGE_API_KEY ?? env.OPENROUTER_API_KEY ?? env.OPENAI_API_KEY ?? "";
  ENV.authEnabled = !!(env.OAUTH_SERVER_URL && env.VITE_APP_ID);
  ENV.publicUrl = env.PUBLIC_URL ?? "";
  ENV.sightengineApiUser = env.SIGHTENGINE_API_USER ?? "";
  ENV.sightengineApiSecret = env.SIGHTENGINE_API_SECRET ?? "";
  ENV.illuminartyApiKey = env.ILLUMINARTY_API_KEY ?? "";
  ENV.hfApiKey = env.HF_API_KEY ?? "";
  ENV.hfModelRepo = env.HF_MODEL_REPO ?? "";

  // Stripe
  ENV.stripeSecretKey = env.STRIPE_SECRET_KEY ?? "";
  ENV.stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET ?? "";
  ENV.stripePriceIds = {
    pro_monthly: env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    pro_yearly: env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    business_monthly: env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? "",
    business_yearly: env.STRIPE_BUSINESS_YEARLY_PRICE_ID ?? "",
    enterprise_monthly: env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? "",
    enterprise_yearly: env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID ?? "",
  };

  _r2Bucket = env.UPLOADS ?? null;
}

export function getR2Bucket(): R2Bucket {
  if (!_r2Bucket) throw new Error("R2 bucket not initialized. Call initEnvFromWorker first.");
  return _r2Bucket;
}
