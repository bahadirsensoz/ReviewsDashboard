export type { HostawayQueryParams } from "@/lib/hostaway.types";

import { hostawayMockReviews } from "@/data/hostaway-mock";
import { fetchHostawayReviewsFromApi } from "@/lib/hostaway-client";
import type { HostawayQueryParams } from "@/lib/hostaway.types";
import {
  type HostawayReview,
  type NormalizedCategoryRating,
  type NormalizedListing,
  type NormalizedReview,
  type NormalizedReviewResponse,
  type ReviewDataSource,
} from "@/types/reviews";

const DEFAULT_CHANNEL_FALLBACK = "hostaway";

export interface FetchHostawayReviewsResult {
  reviews: HostawayReview[];
  source: ReviewDataSource;
  error?: string;
}

export async function fetchHostawayReviews(
  params: HostawayQueryParams = {}
): Promise<FetchHostawayReviewsResult> {
  let upstreamError: string | undefined;

  try {
    const remoteReviews = await fetchHostawayReviewsFromApi(params);
    if (Array.isArray(remoteReviews) && remoteReviews.length > 0) {
      return {
        reviews: filterReviewsByParams(remoteReviews, params),
        source: "hostaway-api",
      } satisfies FetchHostawayReviewsResult;
    }

    upstreamError = Array.isArray(remoteReviews)
      ? "Hostaway API returned no reviews"
      : "Hostaway API did not respond";
  } catch (error) {
    upstreamError = error instanceof Error ? error.message : "Unknown Hostaway error";
  }

  return {
    reviews: filterReviewsByParams(hostawayMockReviews, params),
    source: "mock-data",
    error: upstreamError,
  } satisfies FetchHostawayReviewsResult;
}

export function normalizeHostawayReviews(
  reviews: HostawayReview[],
  params: HostawayQueryParams = {},
  source: ReviewDataSource = "mock-data",
  upstreamError: string | null = null
): NormalizedReviewResponse {
  const filteredReviews = filterReviewsByParams(reviews, params);

  const listingMap = new Map<
    string,
    NormalizedListing & {
      _categoryTotals: Record<string, { total: number; count: number }>;
      _timeSeriesBuckets: MutableTimeSeries;
    }
  >();
  const uniqueChannels = new Set<string>();

  filteredReviews.forEach((review) => {
    const normalizedReview = mapToNormalizedReview(review);
    const listingKey = normalizedReview.listingId;
    uniqueChannels.add(normalizedReview.channel);

    if (!listingMap.has(listingKey)) {
      listingMap.set(listingKey, {
        listingId: normalizedReview.listingId,
        listingName: normalizedReview.listingName,
        channel: DEFAULT_CHANNEL_FALLBACK,
        totalReviews: 0,
        averageRating: null,
        averageRatingOutOfFive: null,
        categoryAverages: {},
        lastReviewDate: null,
        ratingDistribution: {
          low: 0,
          adequate: 0,
          good: 0,
          great: 0,
          exceptional: 0,
        },
        timeSeries: [],
        reviews: [],
        _categoryTotals: {},
        _timeSeriesBuckets: [],
      });
    }

    const listing = listingMap.get(listingKey)!;
    listing.reviews.push(normalizedReview);
    listing.totalReviews += 1;

    if (normalizedReview.rating !== null) {
      updateDistribution(listing.ratingDistribution, normalizedReview.rating);
    }

    if (normalizedReview.submittedAt) {
      listing.lastReviewDate = computeLatestDate(listing.lastReviewDate, normalizedReview.submittedAt);
      addToTimeSeries(listing._timeSeriesBuckets, normalizedReview.submittedAt, normalizedReview.rating);
    }

    normalizedReview.categories.forEach((category) => {
      const key = category.key;
      if (!listing._categoryTotals[key]) {
        listing._categoryTotals[key] = { total: 0, count: 0 };
      }

      if (typeof category.rating === "number") {
        listing._categoryTotals[key].total += category.rating;
        listing._categoryTotals[key].count += 1;
      }
    });
  });

  const listings = Array.from(listingMap.values()).map((listing) => {
    const ratedReviews = listing.reviews.filter((review) => typeof review.rating === "number");
    const overallAverage = ratedReviews.length
      ? ratedReviews.reduce((acc, review) => acc + (review.rating ?? 0), 0) / ratedReviews.length
      : null;

    const averageOutOfFive = typeof overallAverage === "number" ? roundTo(overallAverage / 2, 2) : null;

    const categoryAverages: Record<string, number> = {};
    Object.entries(listing._categoryTotals).forEach(([key, stats]) => {
      if (stats.count > 0) {
        categoryAverages[key] = roundTo(stats.total / stats.count, 2);
      }
    });

    return {
      listingId: listing.listingId,
      listingName: listing.listingName,
      channel: listing.channel,
      totalReviews: listing.totalReviews,
      averageRating: overallAverage !== null ? roundTo(overallAverage, 2) : null,
      averageRatingOutOfFive: averageOutOfFive,
      categoryAverages,
      lastReviewDate: listing.lastReviewDate,
      ratingDistribution: listing.ratingDistribution,
      timeSeries: consolidateTimeSeries(listing._timeSeriesBuckets),
      reviews: listing.reviews.sort((a, b) => (a.submittedAt > b.submittedAt ? -1 : 1)),
    } satisfies NormalizedListing;
  });

  listings.sort((a, b) => {
    const aScore = a.averageRating ?? -Infinity;
    const bScore = b.averageRating ?? -Infinity;
    return bScore - aScore;
  });

  return {
    listings,
    summary: {
      totalListings: listings.length,
      totalReviews: filteredReviews.length,
      channels: Array.from(uniqueChannels.values()).sort(),
      generatedAt: new Date().toISOString(),
      dataSource: source,
      filters: {
        startDate: params.startDate ?? null,
        endDate: params.endDate ?? null,
      },
    },
    upstreamError: upstreamError ?? undefined,
  } satisfies NormalizedReviewResponse;
}

function filterReviewsByParams(reviews: HostawayReview[], params: HostawayQueryParams): HostawayReview[] {
  return reviews.filter((review) => {
    if (params.listingId && String(review.listingId) !== String(params.listingId)) {
      return false;
    }

    if (params.channel && review.channel && review.channel.toLowerCase() !== params.channel.toLowerCase()) {
      return false;
    }

    if (!params.startDate && !params.endDate) {
      return true;
    }

    const submittedTime = Date.parse(review.submittedAt);
    if (!Number.isFinite(submittedTime)) {
      return false;
    }

    if (params.startDate && submittedTime < Date.parse(params.startDate)) {
      return false;
    }

    if (params.endDate && submittedTime > Date.parse(params.endDate)) {
      return false;
    }

    return true;
  });
}

type MutableTimeSeries = Array<{ period: string; values: number[] }>;

function mapToNormalizedReview(review: HostawayReview): NormalizedReview {
  const rating = typeof review.rating === "number" ? roundTo(review.rating, 2) : null;
  const categories: NormalizedCategoryRating[] = (review.reviewCategory ?? []).map((category) => {
    const ratingValue = typeof category.rating === "number" ? roundTo(category.rating, 2) : null;
    return {
      key: category.category,
      label: toTitleCase(category.category.replace(/_/g, " ")),
      rating: ratingValue,
      ratingOutOfFive: ratingValue !== null ? roundTo(ratingValue / 2, 2) : null,
    } satisfies NormalizedCategoryRating;
  });

  const submittedAt = toISOString(review.submittedAt);

  return {
    id: String(review.id),
    listingId: String(review.listingId),
    listingName: review.listingName,
    channel: review.channel ?? DEFAULT_CHANNEL_FALLBACK,
    type: review.type,
    status: review.status,
    rating,
    ratingOutOfFive: rating !== null ? roundTo(rating / 2, 2) : null,
    categories,
    submittedAt,
    guestName: review.guestName ?? "Guest",
    publicReview: review.publicReview,
    privateReview: review.privateReview ?? null,
    stayDate: review.stayDate ? toISOString(review.stayDate) : null,
  } satisfies NormalizedReview;
}

function toISOString(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Date(parsed).toISOString();
}

function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function toTitleCase(input: string): string {
  return input
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function computeLatestDate(current: string | null, next: string | null): string | null {
  if (!next) {
    return current;
  }

  if (!current) {
    return next;
  }

  return new Date(next).getTime() > new Date(current).getTime() ? next : current;
}

function updateDistribution(distribution: NormalizedListing["ratingDistribution"], rating: number): void {
  (Object.keys(SCORE_BINS) as Array<keyof typeof SCORE_BINS>).forEach((key) => {
    if (SCORE_BINS[key](rating)) {
      distribution[key] += 1;
    }
  });
}

function addToTimeSeries(timeSeries: MutableTimeSeries, submittedAt: string, rating: number | null): void {
  const parsed = Date.parse(submittedAt);
  if (Number.isNaN(parsed)) {
    return;
  }

  const date = new Date(parsed);
  const period = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  const existing = timeSeries.find((item) => item.period === period);

  if (!existing) {
    timeSeries.push({ period, values: [] });
  }

  const bucket = timeSeries.find((item) => item.period === period)!;
  if (typeof rating === "number") {
    bucket.values.push(rating);
  }
}

function consolidateTimeSeries(timeSeries: MutableTimeSeries): NormalizedListing["timeSeries"] {
  return timeSeries
    .map((entry) => {
      const average = entry.values.length
        ? entry.values.reduce((acc, value) => acc + value, 0) / entry.values.length
        : null;

      return {
        period: entry.period,
        averageRating: average !== null ? roundTo(average, 2) : null,
        reviewCount: entry.values.length,
      };
    })
    .sort((a, b) => (a.period > b.period ? 1 : -1));
}

const SCORE_BINS = {
  low: (score: number) => score < 5,
  adequate: (score: number) => score >= 5 && score < 7,
  good: (score: number) => score >= 7 && score < 8.5,
  great: (score: number) => score >= 8.5 && score < 9.5,
  exceptional: (score: number) => score >= 9.5,
};
