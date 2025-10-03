'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ApprovalState = Record<string, string[]>;

const STORAGE_KEY = 'flex-living:approved-reviews:v1';

function parseStorage(value: string | null): ApprovalState {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as ApprovalState;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.warn('Unable to parse approval storage payload', error);
  }

  return {};
}

export function useReviewApprovals() {
  const [approvals, setApprovals] = useState<ApprovalState>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const initial = parseStorage(window.localStorage.getItem(STORAGE_KEY));
    setApprovals(initial);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(approvals));
  }, [approvals, isReady]);

  const isApproved = useCallback(
    (listingId: string, reviewId: string) => {
      const approvedList = approvals[listingId] ?? [];
      return approvedList.includes(reviewId);
    },
    [approvals]
  );

  const setApproval = useCallback(
    (listingId: string, reviewId: string, approved: boolean) => {
      setApprovals((previous) => {
        const listingApprovals = new Set(previous[listingId] ?? []);
        if (approved) {
          listingApprovals.add(reviewId);
        } else {
          listingApprovals.delete(reviewId);
        }

        return {
          ...previous,
          [listingId]: Array.from(listingApprovals),
        };
      });
    },
    []
  );

  const toggleApproval = useCallback(
    (listingId: string, reviewId: string) => {
      setApprovals((previous) => {
        const listingApprovals = new Set(previous[listingId] ?? []);
        if (listingApprovals.has(reviewId)) {
          listingApprovals.delete(reviewId);
        } else {
          listingApprovals.add(reviewId);
        }

        return {
          ...previous,
          [listingId]: Array.from(listingApprovals),
        };
      });
    },
    []
  );

  const approvedCount = useMemo(() => {
    return Object.values(approvals).reduce((acc, ids) => acc + ids.length, 0);
  }, [approvals]);

  return {
    approvals,
    approvedCount,
    isReady,
    isApproved,
    setApproval,
    toggleApproval,
  };
}

