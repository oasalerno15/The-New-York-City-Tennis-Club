const STORAGE_KEY = 'smartcourt_wait_report_votes_v1';

export type WaitReportVoteKind = 'confirmed' | 'outdated';

function readStore(): Record<string, WaitReportVoteKind> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, WaitReportVoteKind>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, WaitReportVoteKind>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private mode
  }
}

export function getWaitReportVote(reportId: string): WaitReportVoteKind | null {
  const v = readStore()[reportId];
  return v === 'confirmed' || v === 'outdated' ? v : null;
}

export function setWaitReportVote(reportId: string, kind: WaitReportVoteKind) {
  const store = readStore();
  store[reportId] = kind;
  writeStore(store);
}
