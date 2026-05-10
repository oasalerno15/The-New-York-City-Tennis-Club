'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WaitTime } from '@/lib/supabase';
import { getWaitReportVote, setWaitReportVote, type WaitReportVoteKind } from '@/lib/waitTimeReportVotes';

const GREEN_FLAG_BTN = '#1a3d1f';
const RED_FLAG_BTN = '#9b3d3d';
const GREEN_FLAG_ICON = '#1a3d1f';
const RED_FLAG_ICON = '#9b3d3d';

function MiniFlag({ fill }: { fill: string }) {
  return (
    <svg width="12" height="13" viewBox="0 0 12 13" className="shrink-0" aria-hidden>
      <line x1="1.25" y1="12.5" x2="1.25" y2="1" stroke={fill} strokeWidth="1.35" strokeLinecap="round" />
      <path d="M2.2 1.8 L2.2 7.8 L10.2 4.3 Z" fill={fill} />
    </svg>
  );
}

function countsFromReport(report: WaitTime) {
  const confirmed = report.confirmed_count ?? 0;
  const outdated = report.outdated_count ?? 0;
  return { confirmed, outdated };
}

function isLowCredibilityCounts(confirmed: number, outdated: number): boolean {
  return outdated >= 2 && outdated >= 2 * confirmed;
}

export interface LiveUpdateCourtCardProps {
  courtName: string;
  report: WaitTime | null;
  getStatusFromWaitTime: (waitTime: string) => string;
  getStatusColor: (status: string) => string;
  formatTimeDifference: (timestamp: number) => string;
  onFlag: (reportId: string, kind: WaitReportVoteKind) => Promise<void>;
  /** Outer card classes (border, background, padding). */
  cardClassName: string;
  /** Court title color / weight. */
  titleClassName: string;
  /** Mobile live tab uses plain italic comments; desktop uses curly quotes. */
  commentQuoted?: boolean;
}

export function LiveUpdateCourtCard({
  courtName,
  report,
  getStatusFromWaitTime,
  getStatusColor,
  formatTimeDifference,
  onFlag,
  cardClassName,
  titleClassName,
  commentQuoted = true,
}: LiveUpdateCourtCardProps) {
  const [vote, setVote] = useState<WaitReportVoteKind | null>(null);
  const [flagging, setFlagging] = useState<WaitReportVoteKind | null>(null);
  /** Shown counts until parent `report` reflects the server after a vote. */
  const [optimisticDelta, setOptimisticDelta] = useState({ confirmed: 0, outdated: 0 });
  const lastServerCounts = useRef<{ id: string; confirmed: number; outdated: number } | null>(null);

  useEffect(() => {
    if (!report?.id) {
      setVote(null);
      return;
    }
    setVote(getWaitReportVote(report.id));
  }, [report?.id]);

  useEffect(() => {
    if (!report?.id) {
      setOptimisticDelta({ confirmed: 0, outdated: 0 });
      lastServerCounts.current = null;
      return;
    }
    const confirmed = report.confirmed_count ?? 0;
    const outdated = report.outdated_count ?? 0;
    const prev = lastServerCounts.current;
    if (!prev || prev.id !== report.id) {
      setOptimisticDelta({ confirmed: 0, outdated: 0 });
      lastServerCounts.current = { id: report.id, confirmed, outdated };
      return;
    }
    if (prev.confirmed !== confirmed || prev.outdated !== outdated) {
      setOptimisticDelta({ confirmed: 0, outdated: 0 });
      lastServerCounts.current = { id: report.id, confirmed, outdated };
    }
  }, [report?.id, report?.confirmed_count, report?.outdated_count]);

  const handleFlag = useCallback(
    async (kind: WaitReportVoteKind) => {
      if (!report?.id || vote !== null || flagging !== null) return;
      setFlagging(kind);
      try {
        await onFlag(report.id, kind);
        setWaitReportVote(report.id, kind);
        setVote(kind);
        setOptimisticDelta((d) =>
          kind === 'confirmed'
            ? { ...d, confirmed: d.confirmed + 1 }
            : { ...d, outdated: d.outdated + 1 }
        );
      } finally {
        setFlagging(null);
      }
    },
    [report?.id, vote, flagging, onFlag]
  );

  const base = report ? countsFromReport(report) : { confirmed: 0, outdated: 0 };
  const confirmed = base.confirmed + optimisticDelta.confirmed;
  const outdated = base.outdated + optimisticDelta.outdated;
  const lowCred = report !== null && isLowCredibilityCounts(confirmed, outdated);
  const buttonsDisabled = vote !== null || flagging !== null;

  return (
    <div
      className={`${cardClassName} ${lowCred ? 'border-gray-300 bg-gray-100/90 opacity-80' : ''}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4
          className={`min-w-0 flex-1 text-lg font-semibold ${lowCred ? 'text-gray-500' : titleClassName}`}
        >
          {courtName}
        </h4>
        <div className="flex shrink-0 items-center gap-2.5">
          {report ? (
            <>
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                  lowCred ? 'text-gray-500' : 'text-[#1a3d1f]'
                }`}
                title="Accurate votes"
              >
                <MiniFlag fill={lowCred ? '#9ca3af' : GREEN_FLAG_ICON} />
                {confirmed}
              </span>
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                  lowCred ? 'text-gray-500' : 'text-[#9b3d3d]'
                }`}
                title="Inaccurate votes"
              >
                <MiniFlag fill={lowCred ? '#9ca3af' : RED_FLAG_ICON} />
                {outdated}
              </span>
            </>
          ) : null}
          <div
            className={`h-4 w-4 min-h-[16px] min-w-[16px] shrink-0 ${
              report && !lowCred
                ? getStatusColor(getStatusFromWaitTime(report.wait_time))
                : 'bg-gray-400'
            } rounded-full`}
            title="Wait time status"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {report ? (
          <>
            <p className={`font-medium ${lowCred ? 'text-gray-500' : 'text-gray-700'}`}>
              {report.wait_time}
            </p>
            {report.comment && report.comment.trim() !== '' ? (
              commentQuoted ? (
                <p className={`text-sm italic ${lowCred ? 'text-gray-500' : 'text-gray-600'}`}>
                  &ldquo;{report.comment}&rdquo;
                </p>
              ) : (
                <p className={`text-sm italic ${lowCred ? 'text-gray-500' : 'text-gray-600'}`}>
                  {report.comment}
                </p>
              )
            ) : null}
            <p className={`text-sm ${lowCred ? 'text-gray-500' : 'text-gray-500'}`}>
              Updated {formatTimeDifference(new Date(report.created_at).getTime())}
            </p>
            {lowCred ? (
              <p className="text-xs font-medium text-gray-500">
                This report may not be credible — flagged by{' '}
                {outdated === 1 ? '1 player' : `${outdated} players`}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-gray-400 font-medium">No wait time reported</p>
            <p className="text-sm text-gray-400">Be the first to report!</p>
          </>
        )}
      </div>

      {report ? (
        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={buttonsDisabled}
              onClick={() => void handleFlag('confirmed')}
              className={`rounded-md px-2 py-1 text-[11px] font-medium leading-tight text-white transition-opacity ${
                buttonsDisabled ? 'cursor-not-allowed opacity-45' : 'hover:opacity-90'
              }`}
              style={{ backgroundColor: GREEN_FLAG_BTN }}
            >
              🟢 Accurate
            </button>
            <button
              type="button"
              disabled={buttonsDisabled}
              onClick={() => void handleFlag('outdated')}
              className={`rounded-md border border-red-900/15 px-2 py-1 text-[11px] font-medium leading-tight text-white transition-opacity ${
                buttonsDisabled ? 'cursor-not-allowed opacity-45' : 'hover:opacity-90'
              }`}
              style={{ backgroundColor: RED_FLAG_BTN }}
            >
              🔴 Inaccurate
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
