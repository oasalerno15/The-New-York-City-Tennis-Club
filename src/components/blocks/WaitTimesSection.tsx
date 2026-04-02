'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { WaitTime } from '@/lib/supabase';

interface WaitTimesSectionProps {
  waitTimes: { [key: string]: WaitTime | null };
  getStatusFromWaitTime: (waitTime: string) => string;
  getStatusColor: (status: string) => string;
  formatTimeDifference: (timestamp: number) => string;
  handleReportWaitTime: (courtName: string, waitTime: string, comment: string) => Promise<void>;
  reporting: string | null;
  reportSuccess: string | null;
}

const COURT_NAMES = ['Hudson River Park Courts', 'Pier 42', 'Brian Watkins Tennis Courts'] as const;

export function WaitTimesSection({
  waitTimes,
  getStatusFromWaitTime,
  getStatusColor,
  formatTimeDifference,
  handleReportWaitTime,
  reporting,
  reportSuccess,
}: WaitTimesSectionProps) {
  const hudsonSelectRef = useRef<HTMLSelectElement>(null);
  const hudsonCommentRef = useRef<HTMLInputElement>(null);
  const pierSelectRef = useRef<HTMLSelectElement>(null);
  const pierCommentRef = useRef<HTMLInputElement>(null);
  const brianSelectRef = useRef<HTMLSelectElement>(null);
  const brianCommentRef = useRef<HTMLInputElement>(null);

  const refs = {
    'Hudson River Park Courts': { select: hudsonSelectRef, comment: hudsonCommentRef },
    'Pier 42': { select: pierSelectRef, comment: pierCommentRef },
    'Brian Watkins Tennis Courts': { select: brianSelectRef, comment: brianCommentRef },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="mb-16 md:mb-24"
    >
      <style jsx global>{`
        @keyframes livePulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .live-indicator { animation: livePulse 2s ease-in-out infinite; }
        .live-dot { animation: livePulse 1.5s ease-in-out infinite; }
      `}</style>

      <motion.h2
        id="wait-times"
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-12 md:mb-20 text-gray-800 dark:text-white"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        NYC Courts-Live Status
      </motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
        {/* Report Wait Time - Left Side */}
        <motion.div
          className="space-y-4 md:space-y-6"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-white">
              Report Wait Time
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full live-dot" />
              <span className="text-sm font-bold text-red-500 live-indicator">LIVE</span>
            </div>
          </div>

          <div className="space-y-4">
            {COURT_NAMES.map((courtName) => (
              <div
                key={courtName}
                className="bg-white border-2 border-[#1B3A2E] rounded-lg p-4 hover:shadow-lg transition-all duration-300 min-h-[44px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-[#1B3A2E]">{courtName}</h4>
                  <div
                    className={`w-3 h-3 min-w-[12px] min-h-[12px] ${
                      waitTimes[courtName]
                        ? getStatusColor(getStatusFromWaitTime(waitTimes[courtName]!.wait_time))
                        : 'bg-gray-500'
                    } rounded-full`}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <select
                      className="flex-1 min-w-0 px-2 py-2 border-2 border-[#1B3A2E] rounded-lg bg-white text-sm focus:outline-none focus:border-[#1B3A2E] focus:ring-2 focus:ring-[#1B3A2E] focus:ring-opacity-20 min-h-[44px]"
                      defaultValue={waitTimes[courtName]?.wait_time || 'Select wait time...'}
                      ref={refs[courtName].select}
                    >
                      <option value="Select wait time...">Select wait time...</option>
                      <option value="Less than 1 hour">Less than 1 hour</option>
                      <option value="1-2 hours">1-2 hours</option>
                      <option value="2-3 hours">2-3 hours</option>
                      <option value="More than 3 hours">More than 3 hours</option>
                    </select>
                    <button
                      onClick={() =>
                        handleReportWaitTime(
                          courtName,
                          refs[courtName].select.current?.value || '',
                          refs[courtName].comment.current?.value || ''
                        )
                      }
                      disabled={reporting === courtName}
                      className={`px-2 py-2 rounded-lg font-medium transition-all duration-300 text-xs whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                        reporting === courtName
                          ? 'bg-gray-400 cursor-not-allowed'
                          : reportSuccess === courtName
                            ? 'bg-green-600 text-white scale-105'
                            : 'bg-[#1B3A2E] text-white hover:bg-[#1B3A2E]/90 hover:scale-105'
                      }`}
                    >
                      {reporting === courtName
                        ? 'Reporting...'
                        : reportSuccess === courtName
                          ? '✓ Reported!'
                          : 'Report'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Leave a comment about the wait time..."
                    className="w-full px-3 py-2 border-2 border-[#1B3A2E] rounded-lg bg-white text-sm focus:outline-none focus:border-[#1B3A2E] focus:ring-2 focus:ring-[#1B3A2E] focus:ring-opacity-20 min-h-[44px]"
                    ref={refs[courtName].comment}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live Updates - Right Side */}
        <motion.div
          className="space-y-4 md:space-y-6"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-white">
              Live Updates
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full live-dot" />
              <span className="text-sm font-bold text-red-500 live-indicator">LIVE</span>
            </div>
          </div>

          <div className="space-y-4">
            {COURT_NAMES.map((courtName) => (
              <div
                key={courtName}
                className="bg-white border-2 border-[#1B3A2E] rounded-lg p-4 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-[#1B3A2E]">{courtName}</h4>
                  <div
                    className={`w-3 h-3 ${
                      waitTimes[courtName]
                        ? getStatusColor(getStatusFromWaitTime(waitTimes[courtName]!.wait_time))
                        : 'bg-gray-500'
                    } rounded-full`}
                  />
                </div>
                <div className="space-y-2">
                  {waitTimes[courtName] ? (
                    <>
                      <p className="text-gray-700 font-medium">{waitTimes[courtName]!.wait_time}</p>
                      <p className="text-sm text-gray-500">
                        Updated{' '}
                        {formatTimeDifference(new Date(waitTimes[courtName]!.created_at).getTime())}
                      </p>
                      {waitTimes[courtName]!.comment &&
                      waitTimes[courtName]!.comment!.trim() !== '' ? (
                        <p className="text-sm text-gray-600 italic">
                          &ldquo;{waitTimes[courtName]!.comment}&rdquo;
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
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
