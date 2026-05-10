import type { SupabaseClient } from '@supabase/supabase-js';
import type { WaitTime } from '@/lib/supabase';
import { normalizeCourtNameFromDb } from '@/lib/waitTimesCourt';

type ApplyUpdate = (row: WaitTime) => void;
type Reload = () => void | Promise<void>;

/**
 * Subscribes to `wait_times` row changes. Applies UPDATE in place when the row is
 * already the latest for its court; INSERT/DELETE (or expired rows) trigger a debounced full reload.
 */
export function subscribeWaitTimesRealtime(
  client: SupabaseClient,
  applyUpdate: ApplyUpdate,
  reload: Reload
): () => void {
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const scheduleReload = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      void reload();
    }, 200);
  };

  const channel = client
    .channel(`wait_times_public_${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'wait_times' },
      (payload) => {
        const row = payload.new as WaitTime;
        const expires = new Date(row.expires_at).getTime();
        if (Number.isFinite(expires) && expires <= Date.now()) {
          scheduleReload();
          return;
        }
        applyUpdate(row);
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'wait_times' },
      () => {
        scheduleReload();
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'wait_times' },
      () => {
        scheduleReload();
      }
    )
    .subscribe();

  return () => {
    if (debounce) {
      clearTimeout(debounce);
      debounce = null;
    }
    void client.removeChannel(channel);
  };
}

/** Merge a realtime UPDATE into per-court state when it matches the visible report. */
export function mergeWaitTimeUpdateIntoCourts(
  prev: { [key: string]: WaitTime | null },
  row: WaitTime
): { [key: string]: WaitTime | null } {
  const key = normalizeCourtNameFromDb(row.court_name);
  if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev;
  const cur = prev[key];
  if (cur?.id !== row.id) return prev;
  return { ...prev, [key]: { ...cur, ...row } };
}
