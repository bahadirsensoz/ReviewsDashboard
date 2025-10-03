"use client";

import Link from "next/link";
import {
  Children,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { propertyMetadata } from "@/data/listings";
import { useNormalizedReviews, type ReviewFilters } from "@/hooks/useNormalizedReviews";
import { useReviewApprovals } from "@/hooks/useReviewApprovals";
import {
  type NormalizedListing,
  type NormalizedReview,
  type ReviewDataSource,
} from "@/types/reviews";

const defaultFilters: ReviewFilters = {
  channel: "all",
  minRating: 0,
  category: "all",
  sort: "score_desc",
};

const dataSourceCopy: Record<ReviewDataSource, { label: string; description: string }> = {
  "hostaway-api": {
    label: "Hostaway sandbox",
    description: "Live data pulled from the Hostaway Reviews API",
  },
  "mock-data": {
    label: "Staged dataset",
    description: "Productised sample data while the API is unavailable",
  },
};

export default function Dashboard() {
  const [filters, setFilters] = useState<ReviewFilters>(defaultFilters);
  const { data, listings, isLoading, error, refetch } = useNormalizedReviews(filters);
  const { approvals, approvedCount, toggleApproval, isApproved, isReady } = useReviewApprovals();
  const [activeListingId, setActiveListingId] = useState<string | null>(null);

  useEffect(() => {
    if (listings.length === 0) {
      setActiveListingId(null);
      return;
    }

    if (!activeListingId || !listings.some((listing) => listing.listingId === activeListingId)) {
      setActiveListingId(listings[0].listingId);
    }
  }, [listings, activeListingId]);

  const activeListing = useMemo(
    () => listings.find((listing) => listing.listingId === activeListingId) ?? null,
    [listings, activeListingId],
  );

  const categoryOptions = useMemo(() => {
    if (!data) {
      return ["all"];
    }

    const categories = new Set<string>();
    data.listings.forEach((listing) => {
      Object.keys(listing.categoryAverages).forEach((category) => categories.add(category));
    });

    return ["all", ...Array.from(categories.values()).sort()];
  }, [data]);

  const summary = data?.summary;
  const focusAreas = deriveFocusAreas(activeListing);
  const recurringIssues = deriveRecurringIssues(activeListing);
  const trend = deriveTrend(activeListing);
  const generatedAt = summary?.generatedAt ? formatDateTime(summary.generatedAt) : null;
  const dataSourceMeta = summary ? dataSourceCopy[summary.dataSource] : dataSourceCopy["mock-data"];

  const handleFilterChange = <K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    refetch();
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 pb-20 pt-12">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-emerald-500/10 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Flex Living Operations</p>
                <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Reviews Intelligence Console</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-300">
                  Real-time insight into guest sentiment, portfolio performance, and curated testimonials.
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <DataSourceBadge
                  label={dataSourceMeta.label}
                  description={dataSourceMeta.description}
                  source={summary?.dataSource ?? "mock-data"}
                />
                {generatedAt ? (
                  <p className="text-xs text-slate-400">Last refreshed {generatedAt}</p>
                ) : null}</div>
            </div>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Managed portfolio" value={summary?.totalListings ?? 0} subtitle="Active listings" />
              <SummaryCard
                label="Reviews analysed"
                value={summary?.totalReviews ?? 0}
                subtitle="Across selected filters"
              />
              <SummaryCard
                label="Approved for web"
                value={approvedCount}
                subtitle={isReady ? "Live on property pages" : "Syncing approvals"}
              />
              <SummaryCard
                label="Active channels"
                value={summary?.channels.length ?? 0}
                subtitle={summary?.channels.join(", ") || "Channel mapping pending"}
              />
            </section>
            {data?.upstreamError ? (
              <InfoCallout>
                Using the staged dataset while the Hostaway API is unavailable ({data.upstreamError}).
              </InfoCallout>
            ) : null}
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-emerald-500/10">
          <Filters
            filters={filters}
            onChange={handleFilterChange}
            onReset={resetFilters}
            categories={categoryOptions}
            channels={summary?.channels ?? []}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <PortfolioPanel
            listings={listings}
            approvals={approvals}
            isLoading={isLoading}
            error={error}
            activeListingId={activeListingId}
            onSelectListing={setActiveListingId}
          />

          <ListingDetailPanel
            listing={activeListing}
            approvals={approvals}
            toggleApproval={toggleApproval}
            isApproved={isApproved}
            isReady={isReady}
            focusAreas={focusAreas}
            recurringIssues={recurringIssues}
            trend={trend}
            filters={filters}
          />
        </section>
      </div>
    </div>
  );
}

interface DataSourceBadgeProps {
  label: string;
  description: string;
  source: ReviewDataSource;
}

function DataSourceBadge({ label, description, source }: DataSourceBadgeProps) {
  const isLive = source === "hostaway-api";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isLive ? "bg-emerald-500/20 text-emerald-200" : "bg-blue-500/10 text-blue-200"
        }`}
    >
      <span className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-400" : "bg-blue-400"}`} aria-hidden />
      {label}
      <span className="hidden text-[11px] font-normal text-slate-300 sm:inline">? {description}</span>
    </span>
  );
}

interface FiltersProps {
  filters: ReviewFilters;
  onChange: <K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) => void;
  onReset: () => void;
  categories: string[];
  channels: string[];
}

function Filters({ filters, onChange, onReset, categories, channels }: FiltersProps) {
  return (
    <form className="flex flex-col gap-6" aria-label="Review filters">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-white"
        >
          Reset
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
        <FilterField label="Channel" htmlFor="filter-channel">
          <select
            id="filter-channel"
            value={filters.channel ?? "all"}
            onChange={(event) => onChange("channel", event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          >
            <option value="all">All</option>
            {channels.map((channelOption) => (
              <option key={channelOption} value={channelOption}>
                {channelOption}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Category" htmlFor="filter-category">
          <select
            id="filter-category"
            value={filters.category ?? "all"}
            onChange={(event) => onChange("category", event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All" : toTitleCase(category.replace(/_/g, " "))}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Minimum score" htmlFor="filter-rating">
          <div className="flex items-center gap-3">
            <input
              id="filter-rating"
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={filters.minRating ?? 0}
              onChange={(event) => onChange("minRating", Number(event.target.value))}
              className="w-full accent-emerald-400"
            />
            <span className="w-12 text-sm font-semibold text-white">{filters.minRating ?? 0}</span>
          </div>
        </FilterField>
        <FilterField label="Sort" htmlFor="filter-sort">
          <select
            id="filter-sort"
            value={filters.sort ?? "score_desc"}
            onChange={(event) => onChange("sort", event.target.value as ReviewFilters["sort"])}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          >
            <option value="score_desc">Top performing</option>
            <option value="score_asc">Needs attention</option>
            <option value="recent">Most recent</option>
          </select>
        </FilterField>
        <FilterField label="Search insights" htmlFor="filter-search" className="md:col-span-3 xl:col-span-2">
          <input
            id="filter-search"
            type="search"
            placeholder="Guest name, theme, or keyword"
            value={filters.search ?? ""}
            onChange={(event) => onChange("search", event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </FilterField>
        <FilterField label="From" htmlFor="filter-start">
          <input
            id="filter-start"
            type="date"
            value={filters.startDate ?? ""}
            onChange={(event) => onChange("startDate", event.target.value || undefined)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </FilterField>
        <FilterField label="To" htmlFor="filter-end">
          <input
            id="filter-end"
            type="date"
            value={filters.endDate ?? ""}
            onChange={(event) => onChange("endDate", event.target.value || undefined)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </FilterField>
      </div>
    </form>
  );
}

interface PortfolioPanelProps {
  listings: NormalizedListing[];
  approvals: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
  activeListingId: string | null;
  onSelectListing: (listingId: string) => void;
}

function PortfolioPanel({ listings, approvals, isLoading, error, activeListingId, onSelectListing }: PortfolioPanelProps) {
  return (
    <aside className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Portfolio</h2>
        <span className="text-xs text-slate-500">{listings.length} properties</span>
      </div>
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <SkeletonCard message="Loading portfolio" />
        ) : error ? (
          <ErrorCallout message={error} />
        ) : listings.length === 0 ? (
          <EmptyState message="No properties meet the current filters." />
        ) : (
          listings.map((listing) => {
            const property = propertyMetadata[listing.listingId];
            const approvedForListing = approvals[listing.listingId]?.length ?? 0;
            const isActive = listing.listingId === activeListingId;
            return (
              <button
                key={listing.listingId}
                type="button"
                onClick={() => onSelectListing(listing.listingId)}
                className={`group rounded-2xl border px-4 py-3 text-left transition ${isActive
                    ? "border-emerald-400/80 bg-emerald-500/15"
                    : "border-white/10 bg-white/[0.03] hover:border-emerald-400/50 hover:bg-white/[0.05]"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{listing.listingName}</p>
                    <p className="text-xs text-slate-400">
                      {property?.city ?? `Listing ID ${listing.listingId}`}
                    </p>
                  </div>
                  {approvedForListing > 0 ? (
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {approvedForListing} live
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-2 py-1 font-semibold text-white">
                      {listing.averageRating?.toFixed(1) ?? "-"}
                    </span>
                    <span>{listing.totalReviews} reviews</span>
                  </div>
                  <span>{listing.lastReviewDate ? formatDate(listing.lastReviewDate) : "No recent data"}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}

interface ListingDetailPanelProps {
  listing: NormalizedListing | null;
  approvals: Record<string, string[]>;
  toggleApproval: (listingId: string, reviewId: string) => void;
  isApproved: (listingId: string, reviewId: string) => boolean;
  isReady: boolean;
  focusAreas: Array<{ key: string; label: string; score: number }>;
  recurringIssues: Array<{ key: string; label: string; count: number }>;
  trend: { delta: number } | null;
  filters: ReviewFilters;
}

function ListingDetailPanel({
  listing,
  approvals,
  toggleApproval,
  isApproved,
  isReady,
  focusAreas,
  recurringIssues,
  trend,
  filters,
}: ListingDetailPanelProps) {
  const privateNotes = (listing?.reviews ?? [])
    .filter((review) => review.privateReview)
    .map((review) => ({
      id: review.id,
      guestName: review.guestName,
      submittedAt: review.submittedAt,
      privateReview: review.privateReview ?? "",
    }));
  if (!listing) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
        Choose a property to deep-dive into guest sentiment.
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-emerald-500/10">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">{listing.listingName}</h2>
          <p className="text-sm text-slate-300">
            Average rating {listing.averageRating?.toFixed(1) ?? "-"} / 10 | {listing.totalReviews} reviews
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          {trend ? (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${trend.delta >= 0 ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"}`}
            >
              {trend.delta >= 0 ? "Trending up" : "Trending down"}
              <span className="font-normal text-slate-200">
                {trend.delta >= 0 ? "+" : ""}
                {trend.delta.toFixed(1)} pts vs previous period
              </span>
            </span>
          ) : null}
          <Link
            href={`/properties/${listing.listingId}`}
            className="inline-flex items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/30"
          >
            View public page
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(Object.entries(listing.categoryAverages) as Array<[string, number]>).map(([category, score]) => (
          <div key={category} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {toTitleCase(category.replace(/_/g, " "))}
            </p>
            <p className="mt-3 text-xl font-semibold text-white">{score.toFixed(1)}</p>
            <p className="text-xs text-slate-400">Average category score</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <InsightPanel title="Focus areas" emptyMessage="All categories are scoring above 8. Keep it up!">
          {focusAreas.map((item) => (
            <li key={item.key} className="flex items-center justify-between rounded-xl bg-rose-500/10 px-3 py-2">
              <span className="text-sm text-rose-100">{item.label}</span>
              <span className="text-sm font-semibold text-rose-200">{item.score.toFixed(1)}</span>
            </li>
          ))}
        </InsightPanel>
        <InsightPanel title="Recurring themes" emptyMessage="No recurring issues detected in recent reviews.">
          {recurringIssues.map((item) => (
            <li key={item.key} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span className="text-sm text-slate-200">{item.label}</span>
              <span className="text-xs text-slate-400">{item.count} mentions</span>
            </li>
          ))}
        </InsightPanel>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Guest reviews</h3>
            <p className="text-xs text-slate-400">
              Toggle the stories you want to publish on the property page.
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
            {approvals[listing.listingId]?.length ?? 0} selected
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {listing.reviews.length === 0 ? (
            <EmptyState message="No reviews match the current filters." />
          ) : (
            listing.reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isApproved={isApproved(listing.listingId, review.id)}
                onToggle={() => toggleApproval(listing.listingId, review.id)}
                disabled={!isReady}
              />
            ))
          )}
        </div>
      </div>

      {privateNotes.length > 0 ? (
        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <h3 className="text-lg font-semibold text-amber-100">Manager-only feedback</h3>
          <p className="mt-2 text-xs">Guests shared the following private notes for operations awareness.</p>
          <ul className="mt-3 flex flex-col gap-3">
            {privateNotes.map((note) => (
              <li key={note.id} className="rounded-2xl border border-amber-400/30 bg-amber-950/30 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em]">{note.guestName}</span>
                  <span className="text-[11px] text-amber-200">{formatDate(note.submittedAt)}</span>
                  <p className="mt-1 text-sm text-amber-50">{note.privateReview}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
        <h3 className="text-lg font-semibold text-white">Monthly sentiment</h3>
        <p className="text-xs text-slate-400">
          Filtered by current selection ({filters.startDate ? `from ${filters.startDate}` : "all time"}).
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {listing.timeSeries.length === 0 ? (
            <p className="text-sm text-slate-400">Not enough data to display a trend yet.</p>
          ) : (
            listing.timeSeries.map((point) => (
              <div key={point.period} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{point.period}</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {point.averageRating !== null ? point.averageRating.toFixed(1) : "-"}
                </p>
                <p className="text-xs text-slate-400">{point.reviewCount} reviews</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

interface SummaryCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
}

function SummaryCard({ label, value, subtitle }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-inner shadow-slate-900/60">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

interface FilterFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

function FilterField({ label, htmlFor, children, className }: FilterFieldProps) {
  return (
    <label htmlFor={htmlFor} className={`flex flex-col gap-2 text-xs text-slate-400 ${className ?? ""}`}>
      <span className="font-semibold uppercase tracking-[0.25em]">{label}</span>
      {children}
    </label>
  );
}

interface InsightPanelProps {
  title: string;
  emptyMessage: string;
  children: ReactNode;
}

function InsightPanel({ title, emptyMessage, children }: InsightPanelProps) {
  const items = Children.toArray(children);
  const hasContent = items.length > 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
        {hasContent ? items : <li className="text-xs text-slate-500">{emptyMessage}</li>}
      </ul>
    </div>
  );
}

interface ReviewCardProps {
  review: NormalizedReview;
  isApproved: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function ReviewCard({ review, isApproved, onToggle, disabled }: ReviewCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-emerald-400/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{review.guestName}</p>
          <p className="text-xs text-slate-400">
            {review.channel} | {formatDate(review.submittedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
            {review.rating !== null ? `${review.rating.toFixed(1)} / 10` : "Unrated"}
          </span>
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isApproved
                ? "bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40"
                : "border border-white/20 text-slate-200 hover:border-emerald-300"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {isApproved ? "Approved" : "Approve"}
          </button>
        </div>
      </div>
      {review.publicReview ? (
        <p className="mt-3 text-sm text-slate-100">{review.publicReview}</p>
      ) : (
        <p className="mt-3 text-sm italic text-slate-400">No public review text submitted.</p>
      )}
      {review.categories.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
          {review.categories.map((category) => (
            <span key={category.key} className="rounded-full bg-white/5 px-3 py-1">
              {category.label}: {category.rating !== null ? category.rating.toFixed(1) : "-"}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

interface UtilityCardProps {
  message: string;
}

function EmptyState({ message }: UtilityCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

function ErrorCallout({ message }: UtilityCardProps) {
  return (
    <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-6 text-center text-sm text-rose-100">
      {message}
    </div>
  );
}

function SkeletonCard({ message }: UtilityCardProps) {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

interface InfoCalloutProps {
  children: ReactNode;
}

function InfoCallout({ children }: InfoCalloutProps) {
  return (
    <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-xs text-blue-100">
      {children}
    </div>
  );
}

function deriveFocusAreas(listing: NormalizedListing | null) {
  if (!listing) {
    return [] as Array<{ key: string; label: string; score: number }>;
  }

  const entries = (Object.entries(listing.categoryAverages) as Array<[string, number]>)
    .filter(([, score]) => typeof score === "number" && score < 8)
    .map(([key, score]) => ({
      key,
      label: toTitleCase(key.replace(/_/g, " ")),
      score,
    }))
    .sort((a, b) => a.score - b.score);

  return entries.slice(0, 4);
}

function deriveRecurringIssues(listing: NormalizedListing | null) {
  if (!listing) {
    return [] as Array<{ key: string; label: string; count: number }>;
  }

  const counts = new Map<string, { key: string; label: string; count: number }>();

  listing.reviews.forEach((review) => {
    review.categories.forEach((category) => {
      if (category.rating !== null && category.rating <= 7) {
        const existing = counts.get(category.key) ?? { key: category.key, label: category.label, count: 0 };
        existing.count += 1;
        counts.set(category.key, existing);
      }
    });
  });

  return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 4);
}

function deriveTrend(listing: NormalizedListing | null) {
  if (!listing || listing.timeSeries.length < 2) {
    return null as { delta: number } | null;
  }

  const sorted = [...listing.timeSeries].sort((a, b) => a.period.localeCompare(b.period));
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  if (latest.averageRating === null || previous.averageRating === null) {
    return null;
  }

  return {
    delta: latest.averageRating - previous.averageRating,
  };
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

function formatDateTime(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(parsed));
}








