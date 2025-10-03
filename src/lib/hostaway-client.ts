import { loadHostawayConfig } from "@/config/env";
import type { HostawayQueryParams } from "@/lib/hostaway.types";
import type { HostawayReview } from "@/types/reviews";

type HostawayApiResponse = {
  status?: string;
  result?: unknown;
  results?: unknown;
  data?: unknown;
  items?: unknown;
};

const debugHostaway = process.env.NEXT_PUBLIC_DEBUG_HOSTAWAY === "true";

export async function fetchHostawayReviewsFromApi(
  params: HostawayQueryParams
): Promise<HostawayReview[] | null> {
  const config = loadHostawayConfig();
  const { accountId, apiKey, baseUrl, reviewsEndpoint } = config;

  if (!accountId || !apiKey) {
    return null;
  }

  if (debugHostaway && process.env.NODE_ENV !== "production") {
    const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 4)}�${apiKey.slice(-4)}` : apiKey;
    console.log("[Hostaway] Using credentials", { accountId, apiKey: maskedKey });
  }

  const requestUrl = buildRequestUrl(baseUrl, reviewsEndpoint, accountId, params);

  if (debugHostaway && process.env.NODE_ENV !== "production") {
    console.log("[Hostaway] Requesting", requestUrl);
  }

  try {
    const response = await fetch(requestUrl, {
      headers: buildRequestHeaders(accountId, apiKey),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Hostaway API request failed", response.status, response.statusText);
      return null;
    }

    const payload = (await response.json()) as HostawayApiResponse;
    const rawItems = extractItems(payload);

    if (!Array.isArray(rawItems)) {
      return [];
    }

    const reviews: HostawayReview[] = rawItems
      .map((item, index) => mapToHostawayReview(item, index))
      .filter((item): item is HostawayReview => item !== null);

    return reviews;
  } catch (error) {
    console.error("Unable to reach Hostaway API", error);
    return null;
  }
}

function buildRequestUrl(
  baseUrl: string,
  endpoint: string,
  accountId: string,
  params: HostawayQueryParams
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedEndpoint = endpoint.startsWith("http")
    ? endpoint
    : `${normalizedBase}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const url = new URL(normalizedEndpoint);
  url.searchParams.set("accountId", accountId);

  if (params.startDate) {
    url.searchParams.set("startDate", params.startDate);
  }

  if (params.endDate) {
    url.searchParams.set("endDate", params.endDate);
  }

  if (params.listingId) {
    url.searchParams.set("listingId", params.listingId);
  }

  if (params.channel) {
    url.searchParams.set("channel", params.channel);
  }

  return url.toString();
}

function buildRequestHeaders(accountId: string, apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Hostaway-API-Key": apiKey,
    "X-Hostaway-Account-Id": accountId,
    Accept: "application/json",
  };
}

function extractItems(payload: HostawayApiResponse): unknown {
  if (Array.isArray(payload.result)) {
    return payload.result;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return null;
}

function mapToHostawayReview(raw: unknown, fallbackIndex: number): HostawayReview | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  const listingId = resolveNumber(
    record.listingId ?? record.listing_id ?? (record.listing as Record<string, unknown>)?.id
  );

  if (listingId === null) {
    return null;
  }

  const ratingValue = resolveNumber(record.rating ?? record.score ?? record.overall);
  const submittedAt =
    resolveString(record.submittedAt ?? record.submitted_at ?? record.createdAt ?? record.created_at) ??
    new Date().toISOString();

  const guestName = resolveString(record.guestName ?? record.guest_name ?? record.reviewerName ?? record.author);
  const publicReview = resolveString(
    record.publicReview ?? record.public_review ?? record.comment ?? record.publicComment ?? record.public_comment
  );
  const privateReview = resolveString(
    record.privateReview ?? record.private_review ?? record.privateComment ?? record.private_comment
  );

  const reviewCategory = resolveCategories(
    record.reviewCategory ?? record.reviewCategories ?? record.categories ?? record.scores
  );

  const listingName =
    resolveString(
      record.listingName ??
        record.listing_name ??
        (record.listing as Record<string, unknown>)?.name ??
        (record.listing as Record<string, unknown>)?.listingName
    ) ?? `Listing ${listingId}`;

  const idCandidate = resolveNumber(record.id ?? record.reviewId ?? record.review_id ?? record.externalId);
  const reviewId = idCandidate ?? Number(`${Date.now()}${fallbackIndex}`);

  return {
    id: reviewId,
    listingId,
    listingName,
    channel: resolveString(record.channel ?? record.source ?? record.platform) ?? "hostaway",
    type: resolveString(record.type ?? record.reviewType) ?? "guest-to-host",
    status: resolveString(record.status) ?? "published",
    rating: ratingValue,
    publicReview,
    privateReview,
    reviewCategory,
    submittedAt,
    guestName: guestName ?? "Guest",
    stayDate: resolveString(record.stayDate ?? record.stay_date ?? record.arrivalDate ?? record.arrival_date),
    language: resolveString(record.language),
  };
}

function resolveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function resolveString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

function resolveCategories(input: unknown): HostawayReview["reviewCategory"] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const categoryName = resolveString(record.category ?? record.name ?? record.key);
      if (!categoryName) {
        return null;
      }

      const ratingValue = resolveNumber(record.rating ?? record.score ?? record.value ?? record.points);
      return {
        category: categoryName,
        rating: ratingValue,
      };
    })
    .filter((item): item is { category: string; rating: number | null } => item !== null);
}



