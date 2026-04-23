'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CornerUpLeft,
  ChevronDown,
  ChevronRight,
  Camera,
  X,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSignupSheetReports } from '@/hooks/useSignupSheetReports';
import {
  SIGNUP_SHEET_BOROUGHS,
  SIGNUP_SHEET_STATUS_BUTTON_CLASS,
  SIGNUP_SHEET_STATUS_LABEL,
  SIGNUP_SHEET_STATUS_ORDER,
  courtsByBorough,
  signupStatusDotClass,
  type SignupSheetBorough,
  type SignupSheetCourt,
  type SignupSheetStatus,
} from '@/data/signupSheetCourts';
import type { SignupSheetReport } from '@/lib/supabase';

function formatReportTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type View = 'list' | 'detail' | 'report';

export function SignupSheetsPanel() {
  const {
    latestByCourt,
    loading,
    submitting,
    submitError,
    configured,
    submitReport,
    refresh,
  } = useSignupSheetReports();
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<SignupSheetCourt | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<SignupSheetBorough, boolean>>({
    Manhattan: true,
    Brooklyn: false,
    Queens: false,
  });
  const [reportStatus, setReportStatus] = useState<SignupSheetStatus | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const openDetail = (court: SignupSheetCourt) => {
    setSelected(court);
    setView('detail');
  };

  const openReport = () => {
    setReportStatus(null);
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setView('report');
  };

  const goBack = () => {
    if (view === 'report') {
      setView('detail');
      return;
    }
    if (view === 'detail') {
      setSelected(null);
      setView('list');
      return;
    }
  };

  const toggleBorough = (b: SignupSheetBorough) => {
    setExpanded((prev) => ({ ...prev, [b]: !prev[b] }));
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSubmitReport = async () => {
    if (!selected || !reportStatus) {
      alert('Pick a status first.');
      return;
    }
    const ok = await submitReport(selected.name, selected.borough, reportStatus, photoFile);
    if (ok) {
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setReportStatus(null);
      setView('detail');
    }
  };

  const reportForSelected: SignupSheetReport | null = selected
    ? latestByCourt[selected.name]
    : null;

  function SubHeader({ title }: { title: string }) {
    return (
      <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 bg-[#2D5A27] px-4 py-3 text-[#FFFDD0] shadow-md">
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2D5A27] shadow-sm active:bg-white/90"
          aria-label="Back"
        >
          <CornerUpLeft className="h-5 w-5" />
        </button>
        <h1
          className="min-w-0 flex-1 text-base font-semibold leading-tight tracking-wide"
          style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
        >
          {title}
        </h1>
      </header>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="shrink-0 bg-[#2D5A27] px-4 pb-4 pt-2 text-[#FFFDD0]">
              <div className="flex items-center gap-2 pt-2">
                <ClipboardList className="h-7 w-7 opacity-90" aria-hidden />
                <h1
                  className="text-xl font-semibold tracking-wide"
                  style={{ fontFamily: 'var(--font-display-serif), Georgia, serif' }}
                >
                  Sign Up Sheets
                </h1>
              </div>
              <p className="mt-2 text-sm leading-snug text-[#FFFDD0]/90">
                Same-day morning lines at select NYC courts. Reports expire after 8 hours.
              </p>
              {!configured && (
                <p className="mt-2 rounded-lg bg-amber-500/20 px-3 py-2 text-xs text-amber-100">
                  Connect Supabase to load and share live reports.
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4 pb-6">
              {submitError ? (
                <p
                  role="alert"
                  className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950"
                >
                  {submitError}
                </p>
              ) : null}
              {loading && (
                <p className="text-center text-sm text-gray-500">Loading reports…</p>
              )}
              {!loading && (
                <button
                  type="button"
                  onClick={() => refresh()}
                  className="mb-2 w-full rounded-xl border border-[#2D5A27]/30 bg-white/60 py-2 text-sm font-medium text-[#2D5A27] shadow-sm backdrop-blur-sm active:bg-[#2D5A27]/5"
                >
                  Refresh
                </button>
              )}
              {SIGNUP_SHEET_BOROUGHS.map((borough) => {
                const courts = courtsByBorough(borough);
                const isOpen = expanded[borough];
                return (
                  <div
                    key={borough}
                    className="overflow-hidden rounded-xl border-2 border-[#2D5A27]/35 bg-white/50 shadow-sm backdrop-blur-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleBorough(borough)}
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left active:bg-gray-50"
                    >
                      <span className="text-base font-semibold text-[#2D5A27]">{borough}</span>
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 shrink-0 text-[#2D5A27]" />
                      ) : (
                        <ChevronRight className="h-5 w-5 shrink-0 text-[#2D5A27]" />
                      )}
                    </button>
                    {isOpen && (
                      <ul className="divide-y divide-gray-100 border-t border-gray-100">
                        {courts.map((court) => {
                          const r = latestByCourt[court.name];
                          return (
                            <li key={court.name}>
                              <button
                                type="button"
                                onClick={() => openDetail(court)}
                                className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-[#2D5A27]/5"
                              >
                                <span
                                  className={cn(
                                    'mt-1.5 h-3 w-3 shrink-0 rounded-full',
                                    r
                                      ? signupStatusDotClass(r.status)
                                      : 'bg-gray-400'
                                  )}
                                  aria-hidden
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="font-medium text-[#2D5A27]">{court.name}</span>
                                  {r ? (
                                    <span className="mt-0.5 block text-xs text-gray-500">
                                      {SIGNUP_SHEET_STATUS_LABEL[r.status]} ·{' '}
                                      {formatReportTime(r.created_at)}
                                    </span>
                                  ) : (
                                    <span className="mt-0.5 block text-xs text-gray-400">
                                      No recent report
                                    </span>
                                  )}
                                </span>
                                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {view === 'detail' && selected && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SubHeader title={selected.name} />
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {submitError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950"
                >
                  {submitError}
                </p>
              ) : null}
              <div className="rounded-xl border-2 border-[#2D5A27]/35 bg-white/50 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Current status
                  </span>
                  {reportForSelected ? (
                    <span
                      className={cn(
                        'h-4 w-4 shrink-0 rounded-full',
                        signupStatusDotClass(reportForSelected.status)
                      )}
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full bg-gray-400" />
                  )}
                </div>
                {reportForSelected ? (
                  <>
                    <p className="mt-2 text-lg font-semibold text-[#2D5A27]">
                      {SIGNUP_SHEET_STATUS_LABEL[reportForSelected.status]}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Last reported {formatReportTime(reportForSelected.created_at)}
                    </p>
                    {reportForSelected.photo_url ? (
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(reportForSelected.photo_url)}
                        className="mt-4 block w-full overflow-hidden rounded-lg border border-[#2D5A27]/25 bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#2D5A27] backdrop-blur-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={reportForSelected.photo_url}
                          alt="Sign up sheet"
                          className="h-48 w-full object-cover"
                        />
                        <span className="block py-2 text-center text-xs font-medium text-[#2D5A27]">
                          Tap to enlarge
                        </span>
                      </button>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    No recent reports — be the first to report
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={openReport}
                className="w-full rounded-2xl bg-[#2D5A27] py-4 text-base font-semibold text-[#FFFDD0] shadow-lg active:bg-[#24481f]"
              >
                Report Now
              </button>
            </div>
          </motion.div>
        )}

        {view === 'report' && selected && (
          <motion.div
            key="report"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SubHeader title="Report status" />
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-8">
              {submitError ? (
                <p
                  role="alert"
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950"
                >
                  {submitError}
                </p>
              ) : null}
              <p className="text-sm text-gray-600">{selected.name}</p>
              <div className="space-y-3">
                {SIGNUP_SHEET_STATUS_ORDER.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setReportStatus(st)}
                    className={cn(
                      'w-full rounded-2xl border-2 py-4 text-center text-base font-semibold shadow-sm transition active:scale-[0.99]',
                      SIGNUP_SHEET_STATUS_BUTTON_CLASS[st],
                      reportStatus === st ? 'ring-4 ring-offset-2' : 'opacity-95'
                    )}
                  >
                    {SIGNUP_SHEET_STATUS_LABEL[st]}
                  </button>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={onPickPhoto}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#2D5A27]/35 bg-white/55 py-4 text-base font-medium text-[#2D5A27] backdrop-blur-sm active:bg-[#2D5A27]/5"
              >
                <Camera className="h-5 w-5" />
                Photo (optional)
              </button>
              {photoPreview ? (
                <div className="relative overflow-hidden rounded-xl border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="" className="max-h-56 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      URL.revokeObjectURL(photoPreview);
                      setPhotoPreview(null);
                    }}
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Remove photo"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                disabled={submitting || !reportStatus}
                onClick={handleSubmitReport}
                className={cn(
                  'w-full rounded-2xl py-4 text-base font-semibold text-white shadow-lg',
                  submitting || !reportStatus
                    ? 'bg-gray-400'
                    : 'bg-[#2D5A27] text-[#FFFDD0] active:bg-[#24481f]'
                )}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxUrl ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Photo"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="Close"
            >
              <X className="h-7 w-7" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Sign up sheet full size"
              className="max-h-[90dvh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
