'use client';

import { useState, useEffect } from 'react';
import { supabase, type WaitTime } from '@/lib/supabase';

export function useWaitTimes() {
  const [waitTimes, setWaitTimes] = useState<{ [key: string]: WaitTime | null }>({
    'Hudson River Park Courts': null,
    'Pier 42': null,
    'Brian Watkins Courts': null,
  });
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const getStatusFromWaitTime = (waitTime: string) => {
    if (waitTime.includes('Less than 1 hour')) return 'green';
    if (waitTime.includes('1-2 hours')) return 'yellow';
    if (waitTime.includes('2-3 hours')) return 'orange';
    if (waitTime.includes('More than 3 hours')) return 'red';
    return 'gray';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'orange':
        return 'bg-orange-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimeDifference = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) !== 1 ? 's' : ''} ago`;
  };

  const loadWaitTimes = async () => {
    try {
      setLoading(true);
      if (!supabase) {
        setWaitTimes({ 'Hudson River Park Courts': null, 'Pier 42': null, 'Brian Watkins Courts': null });
        return;
      }
      const { data, error } = await supabase
        .from('wait_times')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        const courtWaitTimes: { [key: string]: WaitTime | null } = {
          'Hudson River Park Courts': null,
          'Pier 42': null,
          'Brian Watkins Courts': null,
        };
        setWaitTimes(courtWaitTimes);
        return;
      }

      const courtWaitTimes: { [key: string]: WaitTime | null } = {
        'Hudson River Park Courts': null,
        'Pier 42': null,
        'Brian Watkins Courts': null,
      };

      data?.forEach((wt) => {
        if (courtWaitTimes.hasOwnProperty(wt.court_name) && !courtWaitTimes[wt.court_name]) {
          courtWaitTimes[wt.court_name] = wt;
        }
      });

      setWaitTimes(courtWaitTimes);
    } catch {
      setWaitTimes({
        'Hudson River Park Courts': null,
        'Pier 42': null,
        'Brian Watkins Courts': null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportWaitTime = async (
    courtName: string,
    waitTime: string,
    comment: string = ''
  ) => {
    if (!waitTime || waitTime === 'Select wait time...') {
      alert('Please select a wait time before reporting');
      return;
    }
    if (!supabase) {
      alert('Wait times are not configured. Add Supabase env vars to enable.');
      return;
    }
    setReporting(courtName);
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const { error } = await supabase.from('wait_times').insert({
        court_name: courtName,
        wait_time: waitTime,
        comment: comment || '',
        expires_at: expiresAt.toISOString(),
      });
      if (error) throw error;
      setReportSuccess(courtName);
      setTimeout(() => setReportSuccess(null), 3000);
      await loadWaitTimes();
    } catch (error) {
      console.error('Error reporting wait time:', error);
      alert(
        error instanceof Error
          ? `Failed: ${error.message}`
          : 'Failed to report. Check your connection.'
      );
    } finally {
      setReporting(null);
    }
  };

  useEffect(() => {
    loadWaitTimes();
    const client = supabase;
    if (client) {
      const run = async () => {
        try {
          await client.from('wait_times').delete().lt('expires_at', new Date().toISOString());
        } catch {
          // Ignore cleanup errors
        }
      };
      run();
    }
  }, []);

  return {
    waitTimes,
    loading,
    reporting,
    reportSuccess,
    getStatusFromWaitTime,
    getStatusColor,
    formatTimeDifference,
    handleReportWaitTime,
    loadWaitTimes,
  };
}
