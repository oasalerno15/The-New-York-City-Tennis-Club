'use client';

import { useCallback, useEffect, useState } from 'react';
import type { WaitTime } from '@/lib/supabase';
import { getWaitReportVote, setWaitReportVote, type WaitReportVoteKind } from '@/lib/waitTimeReportVotes';

const GREEN_FLAG_BTN = '#1a3d1f';
const RED_FLAG_BTN = '#9b3d3d';

function countsFromReport(report: WaitTime) {
  const confirmed = report.confirmed_count ?? 0;
  const outdated = report.outdated_count ?? 0;
  return { confirmed, outdated };
}

function isWaitReportLowCredibility(report: WaitTime): boolean {
  const { confirmed, outdated } = countsFromReport(report);
  return outdated >= 2 && outdated >= 2 * confirmed;
}

function flagCountLine(confirmed: number, outdated: number): string | null {
  if (confirmed > 0 && outdated === 0) {
    return confirmed === 1
      ? '✅ 1 player confirmed this'
      : `✅ ${confirmed} players confirmed this`;
  }
  if (outdated > 0 && confirmed === 0) {
    return `🚩 ${outdated} outdated`;
  }
  if (confirmed > 0 && outdated > 0) {
    return `✅ ${confirmed} confirmed · 🚩 ${outdated} outdated`;
  }
  return null;
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

  useEffect(() => {
    if (!report?.id) {
      setVote(null);
      return;
    }
    setVote(getWaitReportVote(report.id));
  }, [report?.id]);

  const handleFlag = useCallback(
    async (kind: WaitReportVoteKind) => {
      if (!report?.id || vote !== null || flagging !== null) return;
      setFlagging(kind);
      try {
        await onFlag(report.id, kind);
        setWaitReportVote(report.id, kind);
        setVote(kind);
      } finally {
        setFlagging(null);
      }
    },
    [report?.id, vote, flagging, onFlag]
  );

  const lowCred =
    report !== null && isWaitReportLowCredibility(report);
  const { confirmed, outdated } = report ? countsFromReport(report) : { confirmed: 0, outdated: 0 };
  const countLine = report ? flagCountLine(confirmed, outdated) : null;
  const buttonsDisabled = vote !== null || flagging !== null;

  return (
    <div
      className={`${cardClassName} ${lowCred ? 'border-gray-300 bg-gray-100/90 opacity-80' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-lg font-semibold ${lowCred ? 'text-gray-500' : titleClassName}`}>
          {courtName}
        </h4>
        <div
          className={`w-3 h-3 min-w-[12px] min-h-[12px] ${
            report && !lowCred
              ? getStatusColor(getStatusFromWaitTime(report.wait_time))
              : 'bg-gray-400'
          } rounded-full`}
        />
      </div>

      {lowCred && report ? (
        <p className="text-xs font-medium text-gray-500">This report may not be credible</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {report ? (
              <>
                <p className="text-gray-700 font-medium">{report.wait_time}</p>
                {report.comment && report.comment.trim() !== '' ? (
                  commentQuoted ? (
                    <p className="text-sm text-gray-600 italic">&ldquo;{report.comment}&rdquo;</p>
                  ) : (
                    <p className="text-sm italic text-gray-600">{report.comment}</p>
                  )
                ) : null}
                <p className="text-sm text-gray-500">
                  Updated {formatTimeDifference(new Date(report.created_at).getTime())}
                </p>
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
                  🟢 Still accurate
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
                  🔴 Outdated
                </button>
              </div>
              {countLine ? (
                <p className="text-[11px] leading-snug text-gray-600">{countLine}</p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
