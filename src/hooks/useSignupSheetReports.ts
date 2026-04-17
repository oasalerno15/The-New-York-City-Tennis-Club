'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, formatSupabaseError, type SignupSheetReport } from '@/lib/supabase';
import {
  SIGNUP_SHEET_COURTS,
  type SignupSheetBorough,
  type SignupSheetStatus,
} from '@/data/signupSheetCourts';

const BUCKET = 'signup-sheet-photos';
const TABLE = 'signup_sheet_reports';

const HOURS_MS = 8 * 60 * 60 * 1000;

function emptyLatestMap(): Record<string, SignupSheetReport | null> {
  return Object.fromEntries(SIGNUP_SHEET_COURTS.map((c) => [c.name, null])) as Record<
    string,
    SignupSheetReport | null
  >;
}

/** `crypto.randomUUID()` is not available on non-secure origins (e.g. http:// phone-on-LAN). */
function newStorageObjectId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function inferImageContentType(file: File): string {
  if (file.type && file.type.startsWith('image/')) return file.type;
  const n = file.name.toLowerCase();
  if (n.endsWith('.heic') || n.endsWith('.heif')) return 'image/heic';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

function extForStoragePath(file: File): string {
  const t = inferImageContentType(file);
  if (t === 'image/png') return 'png';
  if (t === 'image/webp') return 'webp';
  if (t === 'image/heic' || t === 'image/heif') return 'heic';
  if (t === 'image/gif') return 'gif';
  return 'jpg';
}

type UploadPhotoResult = { url: string | null; error?: string };

async function uploadSignupPhoto(file: File): Promise<UploadPhotoResult> {
  if (!supabase) return { url: null, error: 'Supabase is not configured' };
  const ext = extForStoragePath(file);
  const path = `${newStorageObjectId()}.${ext}`;
  const contentType = inferImageContentType(file);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType,
  });
  if (error) {
    console.warn('signup photo upload:', error.message);
    return { url: null, error: error.message };
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export function useSignupSheetReports() {
  const [latestByCourt, setLatestByCourt] = useState<Record<string, SignupSheetReport | null>>(
    () => emptyLatestMap()
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const configured = useMemo(() => Boolean(supabase), []);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLatestByCourt(emptyLatestMap());
      setLoading(false);
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const next = emptyLatestMap();
      const allowed = new Set(SIGNUP_SHEET_COURTS.map((c) => c.name));
      for (const row of data ?? []) {
        const r = row as SignupSheetReport;
        if (!allowed.has(r.court_name) || next[r.court_name]) continue;
        next[r.court_name] = r;
      }
      setLatestByCourt(next);
    } catch (e) {
      console.warn('signup_sheet_reports load:', e);
      setLatestByCourt(emptyLatestMap());
      setSubmitError(formatSupabaseError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitReport = useCallback(
    async (
      courtName: string,
      borough: SignupSheetBorough,
      status: SignupSheetStatus,
      photo?: File | null
    ): Promise<boolean> => {
      if (!supabase) {
        alert('Reporting is not configured. Add Supabase environment variables.');
        return false;
      }
      setSubmitting(true);
      setSubmitError(null);
      try {
        let photoUrl: string | null = null;
        if (photo && photo.size > 0) {
          const uploaded = await uploadSignupPhoto(photo);
          if (uploaded.url) {
            photoUrl = uploaded.url;
          } else if (uploaded.error) {
            const submitWithout =
              typeof window !== 'undefined' &&
              window.confirm(
                `Photo didn’t upload (${uploaded.error}). Submit this report without a photo?`
              );
            if (!submitWithout) {
              return false;
            }
          }
        }
        const expiresAt = new Date(Date.now() + HOURS_MS).toISOString();
        const { error } = await supabase.from(TABLE).insert({
          court_name: courtName,
          borough,
          status,
          photo_url: photoUrl,
          expires_at: expiresAt,
        });
        if (error) throw error;
        await refresh();
        return true;
      } catch (e) {
        const msg = formatSupabaseError(e);
        setSubmitError(msg);
        alert(`Could not submit report. ${msg}`);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh]
  );

  return {
    latestByCourt,
    loading,
    submitting,
    submitError,
    configured,
    refresh,
    submitReport,
  };
}
