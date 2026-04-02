'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MobileTabBar, type MobileTab } from './MobileTabBar';
import { WaitTimesSection } from '@/components/blocks/WaitTimesSection';
import { CourtFinderSection } from '@/components/blocks/CourtFinderSection';
import { MoreSection } from '@/components/blocks/MoreSection';
import { useWaitTimes } from '@/hooks/useWaitTimes';

const MOBILE_ENTERED_KEY = 'pedro-mobile-entered';

export function MobileAppShell() {
  const {
    waitTimes,
    getStatusFromWaitTime,
    getStatusColor,
    formatTimeDifference,
    handleReportWaitTime,
    reporting,
    reportSuccess,
  } = useWaitTimes();
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [selectedBoroughs, setSelectedBoroughs] = useState<string[]>([]);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [selectedPermitStatuses, setSelectedPermitStatuses] = useState<string[]>([]);

  /** After landing CTA; persisted for this browser tab session only */
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const contentPaddingBottom = 'calc(80px + env(safe-area-inset-bottom))';

  useEffect(() => {
    try {
      setHasEnteredApp(sessionStorage.getItem(MOBILE_ENTERED_KEY) === '1');
    } catch {
      setHasEnteredApp(false);
    } finally {
      setSessionReady(true);
    }
  }, []);

  const enterApp = useCallback(() => {
    try {
      sessionStorage.setItem(MOBILE_ENTERED_KEY, '1');
    } catch {
      /* private mode */
    }
    setHasEnteredApp(true);
  }, []);

  if (!sessionReady) {
    return (
      <div
        className="min-h-dvh bg-[#1B3A2E]"
        aria-busy="true"
      >
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!hasEnteredApp) {
    return (
      <div
        className="mobile-app-shell min-h-dvh flex flex-col bg-[#1B3A2E] text-white"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-8 bg-gradient-to-b from-[#1B3A2E] via-[#234d3c] to-[#2d5c48] min-h-0 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, white 0, transparent 45%),
                radial-gradient(circle at 80% 70%, white 0, transparent 40%)`,
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-md space-y-6"
          >
            <div className="flex justify-center px-2">
              <Image
                src="/logo.png"
                alt="NYC Tennis Club"
                width={320}
                height={320}
                priority
                className="h-36 w-auto max-h-[28vh] max-w-[min(100%,280px)] object-contain object-center drop-shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
              />
            </div>
            <h1 className="text-3xl font-bold leading-tight text-balance sm:text-4xl">
              Live wait times, real courts
            </h1>
            <p className="text-base text-white/85 leading-relaxed">
              See what players are reporting and share what you see before you head out.
            </p>
            <motion.button
              type="button"
              onClick={enterApp}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full rounded-2xl bg-white px-6 py-4 text-base font-semibold text-[#1B3A2E] shadow-lg shadow-black/15 transition active:bg-white/90"
            >
              Start finding wait times
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app-shell min-h-screen flex flex-col bg-white">
      {/* Content Area — no top marketing bar; safe area for notch / home indicator */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden pt-[env(safe-area-inset-top)]"
        style={{
          paddingBottom: contentPaddingBottom,
          minHeight: '100dvh',
        }}
      >
        {activeTab === 'home' && (
          <div className="bg-white px-4 pt-4">
            <WaitTimesSection
              waitTimes={waitTimes}
              getStatusFromWaitTime={getStatusFromWaitTime}
              getStatusColor={getStatusColor}
              formatTimeDifference={formatTimeDifference}
              handleReportWaitTime={handleReportWaitTime}
              reporting={reporting}
              reportSuccess={reportSuccess}
            />
          </div>
        )}

        {activeTab === 'courts' && (
          <div className="px-4 py-6">
            <CourtFinderSection
              selectedBoroughs={selectedBoroughs}
              selectedSurfaces={selectedSurfaces}
              selectedPermitStatuses={selectedPermitStatuses}
              onBoroughChange={(borough, checked) =>
                setSelectedBoroughs((prev) =>
                  checked ? [...prev, borough] : prev.filter((b) => b !== borough)
                )
              }
              onSurfaceChange={(surface, checked) =>
                setSelectedSurfaces((prev) =>
                  checked ? [...prev, surface] : prev.filter((s) => s !== surface)
                )
              }
              onPermitStatusChange={(permit, checked) =>
                setSelectedPermitStatuses((prev) =>
                  checked ? [...prev, permit] : prev.filter((p) => p !== permit)
                )
              }
              filtersCollapsed={filtersCollapsed}
              onFiltersCollapsedChange={setFiltersCollapsed}
              isMobile
            />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="px-4 py-4">
            <CourtFinderSection
              selectedBoroughs={selectedBoroughs}
              selectedSurfaces={selectedSurfaces}
              selectedPermitStatuses={selectedPermitStatuses}
              onBoroughChange={(borough, checked) =>
                setSelectedBoroughs((prev) =>
                  checked ? [...prev, borough] : prev.filter((b) => b !== borough)
                )
              }
              onSurfaceChange={(surface, checked) =>
                setSelectedSurfaces((prev) =>
                  checked ? [...prev, surface] : prev.filter((s) => s !== surface)
                )
              }
              onPermitStatusChange={(permit, checked) =>
                setSelectedPermitStatuses((prev) =>
                  checked ? [...prev, permit] : prev.filter((p) => p !== permit)
                )
              }
              filtersCollapsed={filtersCollapsed}
              onFiltersCollapsedChange={setFiltersCollapsed}
              isMobile
              mapOnly
            />
          </div>
        )}

        {activeTab === 'more' && (
          <div className="px-4 py-6">
            <MoreSection isMobile />
          </div>
        )}
      </main>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

