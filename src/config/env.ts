export interface HostawayEnvConfig {
  accountId?: string;
  apiKey?: string;
  baseUrl: string;
  reviewsEndpoint: string;
}

export function loadHostawayConfig(): HostawayEnvConfig {
  const baseUrl = process.env.HOSTAWAY_API_BASE ?? "https://api.hostaway.com";
  const endpoint = process.env.HOSTAWAY_REVIEWS_ENDPOINT ?? "/v1/reviews";

  return {
    accountId: process.env.HOSTAWAY_ACCOUNT_ID,
    apiKey: process.env.HOSTAWAY_API_KEY,
    baseUrl,
    reviewsEndpoint: endpoint,
  } satisfies HostawayEnvConfig;
}
