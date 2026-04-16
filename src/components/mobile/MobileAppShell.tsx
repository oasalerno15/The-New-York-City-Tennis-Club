'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MobileTabBar, type MobileTab } from './MobileTabBar';
import { SignupSheetsPanel } from '@/components/mobile/signup-sheets/SignupSheetsPanel';
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
      <div className="min-h-dvh bg-white" aria-busy="true">
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!hasEnteredApp) {
    return (
      <div
        className="mobile-app-shell min-h-dvh flex flex-col bg-white text-[#1A1A1A]"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center space-y-5 text-center"
          >
            <h1
              className="w-full text-[clamp(1.5rem,5.2vw,1.9rem)] font-semibold leading-tight tracking-[0.02em] text-[#2D5A27]"
              style={{ fontFamily: 'var(--font-display-serif), Georgia, serif' }}
            >
              SmartCourtNYC
            </h1>
            <div className="flex flex-col space-y-3 text-[#1A1A1A]">
              <p className="text-lg font-semibold leading-snug text-balance sm:text-xl">
                Live wait times, real courts
              </p>
              <p className="text-sm leading-relaxed text-[#1A1A1A]/80 sm:text-[0.9375rem]">
                See what players are reporting and share what you see before you head out.
              </p>
            </div>
            <motion.button
              type="button"
              onClick={enterApp}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full rounded-xl bg-[#2D5A27] px-4 py-4 text-base font-semibold text-[#FFFDD0] shadow-md shadow-[#2D5A27]/20 transition active:bg-[#24481f]"
            >
              Start finding wait times
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app-shell flex min-h-dvh flex-col bg-white">
      {/* Content Area — min-h-0 so flex + overflow-y-auto can scroll on real devices */}
      <main
        className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pt-[env(safe-area-inset-top)]"
        style={{
          paddingBottom: contentPaddingBottom,
        }}
      >
        {activeTab === 'home' && (
          <div className="flex-1 bg-white px-4 pt-4">
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
          <div className="flex-1 px-4 py-6">
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

        {activeTab === 'sheets' && (
          <div className="flex min-h-0 flex-1 flex-col">
            <SignupSheetsPanel />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="flex-1 px-4 py-4">
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
          <div className="flex-1 px-4 py-6">
            <MoreSection isMobile />
          </div>
        )}
      </main>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

