'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

import { type NormalizedListing, type NormalizedReviewResponse } from "@/types/reviews";

export type ReviewSortOption = "score_desc" | "score_asc" | "recent";

export interface ReviewFilters {
  channel?: string;
  listingId?: string;
  minRating?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sort?: ReviewSortOption;
}

interface UseNormalizedReviewsResult {
  data: NormalizedReviewResponse | null;
  listings: NormalizedListing[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNormalizedReviews(filters: ReviewFilters): UseNormalizedReviewsResult {
  const [data, setData] = useState<NormalizedReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshToken, setRefreshToken] = useState<number>(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.channel && filters.channel !== "all") {
      params.set("channel", filters.channel);
    }
    if (filters.listingId) {
      params.set("listingId", filters.listingId);
    }
    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }
    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }
    const serialized = params.toString();
    return serialized.length > 0 ? `?${serialized}` : "";
  }, [filters.channel, filters.listingId, filters.startDate, filters.endDate]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const endpoint = `/api/reviews/hostaway${queryString}`;
        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Hostaway request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as NormalizedReviewResponse;
        setData(payload);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to fetch normalized reviews", err);
        setError("Unable to load reviews. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [queryString, refreshToken]);

  const listings = useMemo(() => {
    if (!data) {
      return [];
    }

    const minRating = filters.minRating ?? 0;
    const categoryFilter = filters.category && filters.category !== "all" ? filters.category : null;
    const searchTerm = (filters.search ?? "").trim().toLowerCase();
    const sort = filters.sort ?? "score_desc";

    const filtered = data.listings
      .map((listing) => ({ ...listing }))
      .filter((listing) => {
        if (filters.listingId && listing.listingId !== filters.listingId) {
          return false;
        }

        if (minRating > 0 && (listing.averageRating ?? 0) < minRating) {
          return false;
        }

        if (categoryFilter) {
          const categoryAverage = listing.categoryAverages[categoryFilter];
          if (typeof categoryAverage === "number" && categoryAverage < minRating) {
            return false;
          }
        }

        if (searchTerm.length > 1) {
          const match = listing.reviews.some((review) => {
            const haystack = `${review.guestName} ${review.publicReview ?? ""} ${review.privateReview ?? ""}`.toLowerCase();
            return haystack.includes(searchTerm);
          });
          return match;
        }

        return true;
      })
      .map((listing) => ({
        ...listing,
        reviews: listing.reviews.filter((review) => {
          if (categoryFilter) {
            const categoryMatch = review.categories.some((category) => category.key === categoryFilter);
            if (!categoryMatch) {
              return false;
            }
          }

          if (minRating > 0 && (review.rating ?? 0) < minRating) {
            return false;
          }

          if (searchTerm.length > 1) {
            const reviewText = `${review.guestName} ${review.publicReview ?? ""} ${review.privateReview ?? ""}`.toLowerCase();
            if (!reviewText.includes(searchTerm)) {
              return false;
            }
          }

          return true;
        }),
      }));

    return filtered.sort((a, b) => {
      if (sort === "recent") {
        const aDate = a.lastReviewDate ? Date.parse(a.lastReviewDate) : 0;
        const bDate = b.lastReviewDate ? Date.parse(b.lastReviewDate) : 0;
        return bDate - aDate;
      }

      const aScore = a.averageRating ?? 0;
      const bScore = b.averageRating ?? 0;
      return sort === "score_asc" ? aScore - bScore : bScore - aScore;
    });
  }, [data, filters.listingId, filters.minRating, filters.category, filters.search, filters.sort]);

  const refetch = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  return {
    data,
    listings,
    isLoading,
    error,
    refetch,
  };
}

