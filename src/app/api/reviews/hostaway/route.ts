import { NextRequest, NextResponse } from "next/server";

import {
  fetchHostawayReviews,
  type HostawayQueryParams,
  normalizeHostawayReviews,
} from "@/lib/hostaway";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = extractQueryParams(request);
    const { reviews, source, error } = await fetchHostawayReviews(params);
    const normalized = normalizeHostawayReviews(reviews, params, source, error ?? null);

    return NextResponse.json(normalized, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to process Hostaway reviews", error);
    return NextResponse.json(
      {
        message: "Unable to load Hostaway reviews.",
      },
      {
        status: 500,
      }
    );
  }
}

function extractQueryParams(request: NextRequest): HostawayQueryParams {
  const { searchParams } = request.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const listingId = searchParams.get("listingId");
  const channel = searchParams.get("channel");

  return {
    startDate: isValidDate(startDate) ? startDate ?? undefined : undefined,
    endDate: isValidDate(endDate) ? endDate ?? undefined : undefined,
    listingId: listingId ?? undefined,
    channel: channel ?? undefined,
  } satisfies HostawayQueryParams;
}

function isValidDate(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}
