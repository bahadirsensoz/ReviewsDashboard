export type ReviewDataSource = "hostaway-api" | "mock-data";

export interface HostawayCategoryRating {
  category: string;
  rating: number | null;
}

export interface HostawayReview {
  id: number;
  listingId: number;
  listingName: string;
  channel: string;
  type: string;
  status: string;
  rating: number | null;
  publicReview: string | null;
  privateReview?: string | null;
  reviewCategory?: HostawayCategoryRating[];
  submittedAt: string;
  guestName?: string | null;
  stayDate?: string | null;
  language?: string | null;
}

export interface NormalizedCategoryRating {
  key: string;
  label: string;
  rating: number | null;
  ratingOutOfFive: number | null;
}

export interface NormalizedReview {
  id: string;
  listingId: string;
  listingName: string;
  channel: string;
  type: string;
  status: string;
  rating: number | null;
  ratingOutOfFive: number | null;
  categories: NormalizedCategoryRating[];
  submittedAt: string;
  guestName: string;
  publicReview: string | null;
  privateReview: string | null;
  stayDate: string | null;
}

export interface ListingTimeSeriesPoint {
  period: string;
  averageRating: number | null;
  reviewCount: number;
}

export interface ListingRatingDistribution {
  low: number;
  adequate: number;
  good: number;
  great: number;
  exceptional: number;
}

export interface NormalizedListing {
  listingId: string;
  listingName: string;
  channel: string;
  totalReviews: number;
  averageRating: number | null;
  averageRatingOutOfFive: number | null;
  categoryAverages: Record<string, number>;
  lastReviewDate: string | null;
  ratingDistribution: ListingRatingDistribution;
  timeSeries: ListingTimeSeriesPoint[];
  reviews: NormalizedReview[];
}

export interface NormalizedReviewResponse {
  listings: NormalizedListing[];
  summary: {
    totalListings: number;
    totalReviews: number;
    channels: string[];
    generatedAt: string;
    dataSource: ReviewDataSource;
    filters: {
      startDate: string | null;
      endDate: string | null;
    };
  };
  upstreamError?: string | null;
}
