'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Logger } from '@/middleware/logger';
import { 
  fetchNotifications, 
  FetchParams, 
  ApiResponse 
} from '@/services/notificationService';
import { 
  getTopPriorityNotifications, 
  Notification as BaseNotification 
} from '@/lib/priorityEngine';

export interface Notification extends BaseNotification {
  isNew: boolean;
}

const PAGE_SIZE = 10;
const SESSION_KEY = 'affordmed_viewed_ids';

export function useNotifications() {
  const CONTEXT = 'useNotifications';
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Stable snapshot of the priority inbox — order never changes after first load
  const [stablePriorityInbox, setStablePriorityInbox] = useState<Notification[]>([]);
  const prioritySnapshotTaken = useRef<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filters, setFilters] = useState<Omit<FetchParams, 'page' | 'limit'>>({});
  const [, setViewedIds] = useState<Set<string>>(new Set());
  const viewedIdsRef = useRef<Set<string>>(new Set());

  // Initialize viewed IDs from session storage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const idSet = new Set<string>(parsed);
          setViewedIds(idSet);
          viewedIdsRef.current = idSet;
          Logger.info(CONTEXT, `Restored ${parsed.length} viewed notification IDs from session storage`);
        }
      }
    } catch (e) {
      Logger.error(CONTEXT, 'Failed to restore viewed IDs from session storage', e);
    }
  }, []);

  // Fetch Global Priority Notifications (Unfiltered)
  const loadPriority = useCallback(async () => {
    try {
      // Fetch the first 10 without any type filters to find the global top priority
      const data = await fetchNotifications({ limit: 10 });
      const augmented = data.notifications.map(n => ({
        ...n,
        isNew: !viewedIdsRef.current.has(n.id)
      }));
      // Snapshot the priority order ONCE — rank all fetched items (read or unread)
      // and lock the order. Subsequent mark-as-read only toggles isNew in-place.
      if (!prioritySnapshotTaken.current) {
        prioritySnapshotTaken.current = true;
        const ranked = getTopPriorityNotifications(augmented, 10) as Notification[];
        setStablePriorityInbox(ranked);
      }
    } catch (err) {
      Logger.error(CONTEXT, 'Failed to load global priority notifications', err);
    }
  }, []); // Only fetch on mount or manual call

  // Fetch Main Feed (Filtered)
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    Logger.info(CONTEXT, `Fetching page ${page} with filters`, filters);

    try {
      const data: ApiResponse = await fetchNotifications({
        ...filters,
        page,
        limit: PAGE_SIZE,
      });

      const augmented = data.notifications.map(n => ({
        ...n,
        isNew: !viewedIdsRef.current.has(n.id)
      }));

      setNotifications(augmented);
      // Fallback: If API doesn't return total, assume at least 50 results to show pagination
      setTotalCount(data.total || 50);
      Logger.success(CONTEXT, `Loaded ${augmented.length} notifications for feed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(msg);
      Logger.error(CONTEXT, msg);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    loadPriority();
  }, [loadPriority]);

  // Priority Inbox — stable order, never re-sorted or filtered after snapshot
  // isNew flag updates in-place when markAsViewed is called
  const priorityInbox = stablePriorityInbox;

  // Mark as viewed
  const markAsViewed = useCallback((id: string) => {
    setViewedIds(prev => {
      if (prev.has(id)) return prev;
      
      const next = new Set(prev);
      next.add(id);
      viewedIdsRef.current = next;
      
      // Persist to session storage
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(next)));
        Logger.info(CONTEXT, `Marked notification ${id} as viewed and persisted to session storage`);
      } catch (e) {
        Logger.error(CONTEXT, `Failed to persist viewed ID ${id} to session storage`, e);
      }
      
      return next;
    });

    // Update isNew flag in-place — never remove or reorder the priority inbox
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isNew: false } : n));
    setStablePriorityInbox(prev => prev.map(n => n.id === id ? { ...n, isNew: false } : n));
  }, []);

  return {
    notifications,
    priorityInbox,
    loading,
    error,
    page,
    setPage,
    filters,
    setFilters,
    markAsViewed,
    totalCount,
    pageSize: PAGE_SIZE,
  };
}
