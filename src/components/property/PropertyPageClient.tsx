"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { propertyMetadata } from "@/data/listings";
import { useNormalizedReviews } from "@/hooks/useNormalizedReviews";
import { useReviewApprovals } from "@/hooks/useReviewApprovals";
import type { NormalizedListing, NormalizedReview } from "@/types/reviews";

interface PropertyPageClientProps {
  listingId: string;
}

export function PropertyPageClient({ listingId }: PropertyPageClientProps) {
  const { data, listings, isLoading, error } = useNormalizedReviews({ listingId, sort: "recent" });
  const { isApproved, approvals, isReady } = useReviewApprovals();

  const listing = useMemo(
    () => listings.find((item) => item.listingId === listingId) ?? null,
    [listings, listingId],
  );
  const property = propertyMetadata[listingId];
  const approvedReviews = useMemo(() => {
    if (!listing) {
      return [];
    }
    return listing.reviews.filter((review) => isApproved(listingId, review.id));
  }, [listing, listingId, isApproved]);

  const highlightCategories = listing ? getHighlightCategories(listing) : [];
  const latestReview = listing?.reviews[0];
  const dataSource = data?.summary.dataSource ?? "mock-data";
  const upstreamError = data?.upstreamError ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Flex Living
          </Link>
          <Link
            href="/"
            className="rounded-full border border-emerald-400/40 px-4 py-2 text-xs uppercase text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
          >
            Manage in dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
        {property ? (
          <Hero property={property} listing={listing} latestReview={latestReview} />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-slate-200">
            Listing configuration not found for ID {listingId}.
          </div>
        )}

        {upstreamError ? (
          <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-xs text-blue-100">
            Showing curated reviews from the staged dataset while the Hostaway API is unavailable ({upstreamError}).
          </div>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-xl shadow-emerald-500/10">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Guest love notes</h2>
                <p className="text-sm text-slate-300">
                  Every testimonial is hand-picked by the Flex Living operations team.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span>Overall</span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-200">
                  {listing?.averageRating?.toFixed(1) ?? "-"} / 10
                </span>
              </div>
            </div>

            <SentimentHighlights categories={highlightCategories} dataSource={dataSource} />

            <div className="flex flex-col gap-4">
              {isLoading ? (
                <p className="text-sm text-slate-300">Loading reviews...</p>
              ) : error ? (
                <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>
              ) : !isReady ? (
                <p className="text-sm text-slate-300">Syncing approved reviews...</p>
              ) : approvedReviews.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-300">
                  No reviews have been published yet. Head back to the dashboard to feature a standout stay.
                </div>
              ) : (
                approvedReviews.map((review) => <ReviewCard key={review.id} review={review} />)
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-5">
            <PropertySnapshot listing={listing} property={property} approvals={approvals[listingId]?.length ?? 0} />
            <ConfidenceBanner listing={listing} totalApproved={approvedReviews.length} />
          </aside>
        </section>
      </main>
    </div>
  );
}

interface HeroProps {
  property: (typeof propertyMetadata)[string];
  listing: NormalizedListing | null;
  latestReview: NormalizedReview | undefined;
}

function Hero({ property, listing, latestReview }: HeroProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-emerald-500/10">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative min-h-[360px]">
          <Image
            src={property.heroImage}
            alt={property.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/30" />
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-4 p-6 text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Flex Living Signature</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{property.name}</h1>
              <p className="text-sm text-slate-200">
                {property.city} | {property.headline}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                {listing?.averageRating?.toFixed(1) ?? "-"} / 10 overall satisfaction
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                {listing?.totalReviews ?? 0} verified stays
              </span>
              {latestReview ? (
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                  Latest feedback {formatDate(latestReview.submittedAt)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6 text-sm text-slate-200">
          <p>{property.description}</p>
          <Highlights title="Highlights" items={property.highlights} />
          <Highlights title="Amenities" items={property.amenities} compact />
          <Highlights title="Sleeping arrangements" items={property.sleepingArrangements} numbered />
          <Link
            href="#availability"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Check availability
          </Link>
        </div>
      </div>
    </section>
  );
}

interface HighlightsProps {
  title: string;
  items: string[];
  compact?: boolean;
  numbered?: boolean;
}

function Highlights({ title, items, compact = false, numbered = false }: HighlightsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{title}</h2>
      <ul className={`mt-2 ${compact ? "flex flex-wrap gap-2 text-xs" : "grid gap-2"}`}>
        {items.map((item, index) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
            <span>
              {numbered ? `${index + 1}. ` : ""}
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SentimentHighlightsProps {
  categories: Array<{ key: string; label: string; score: number }>;
  dataSource: string;
}

function SentimentHighlights({ categories, dataSource }: SentimentHighlightsProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">What guests rave about</h3>
        <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Source: {dataSource}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <div key={category.key} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{category.label}</p>
            <p className="mt-1 text-lg font-semibold text-white">{category.score.toFixed(1)} / 10</p>
            <p className="text-[11px] text-slate-500">Average sentiment</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PropertySnapshotProps {
  listing: NormalizedListing | null;
  property: (typeof propertyMetadata)[string] | undefined;
  approvals: number;
}

function PropertySnapshot({ listing, property, approvals }: PropertySnapshotProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-200">
      <h3 className="text-lg font-semibold text-white">Property snapshot</h3>
      <ul className="mt-4 grid gap-3 text-xs">
        <li>
          <span className="block text-slate-400">Address</span>
          {property?.address ?? "-"}
        </li>
        <li>
          <span className="block text-slate-400">Curated reviews live</span>
          {approvals}
        </li>
        <li>
          <span className="block text-slate-400">Latest review</span>
          {listing?.lastReviewDate ? formatDate(listing.lastReviewDate) : "No data"}
        </li>
      </ul>
    </div>
  );
}

interface ConfidenceBannerProps {
  listing: NormalizedListing | null;
  totalApproved: number;
}

function ConfidenceBanner({ listing, totalApproved }: ConfidenceBannerProps) {
  const limitedData = (listing?.totalReviews ?? 0) < 5;

  return (
    <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
      <h3 className="text-lg font-semibold text-emerald-100">Guest experience confidence</h3>
      <p className="mt-3 text-xs">
        {limitedData
          ? "We are actively gathering more feedback for this stay. Expect additional quotes soon."
          : "Backed by consistently high satisfaction scores across recent stays."}
      </p>
      <p className="mt-3 text-xs text-emerald-200">{totalApproved} reviews currently showcased on the property page.</p>
    </div>
  );
}

interface ReviewCardProps {
  review: NormalizedReview;
}

function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-white">{review.guestName}</p>
          <p className="text-xs text-slate-400">
            Stayed on {review.stayDate ? formatDate(review.stayDate) : formatDate(review.submittedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-white/10 px-3 py-1">{review.channel}</span>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">
            {review.rating !== null ? `${review.rating.toFixed(1)} / 10` : "Unrated"}
          </span>
        </div>
      </div>
      {review.publicReview ? <p className="mt-3 text-sm text-slate-100">{review.publicReview}</p> : null}
      {review.categories.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
          {review.categories.map((category) => (
            <li key={category.key} className="rounded-full bg-white/5 px-3 py-1">
              {category.label}: {category.rating !== null ? category.rating.toFixed(1) : "-"}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function getHighlightCategories(listing: NormalizedListing, limit = 3) {
  return Object.entries(listing.categoryAverages)
    .filter(([, score]) => typeof score === "number")
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, score]) => ({ key, label: toTitleCase(key.replace(/_/g, " ")), score }));
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(parsed));
}
