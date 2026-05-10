import type { SupabaseClient } from '@supabase/supabase-js';
import { formatSupabaseError } from '@/lib/supabase';
import type { WaitReportVoteKind } from '@/lib/waitTimeReportVotes';

export async function incrementWaitTimeFlag(
  client: SupabaseClient,
  reportId: string,
  kind: WaitReportVoteKind
): Promise<void> {
  const column = kind === 'confirmed' ? 'confirmed_count' : 'outdated_count';
  const { data: row, error: fetchError } = await client
    .from('wait_times')
    .select('confirmed_count, outdated_count')
    .eq('id', reportId)
    .single();

  if (fetchError) throw fetchError;
  const current = (row?.[column] as number | null | undefined) ?? 0;

  const { error: updateError } = await client
    .from('wait_times')
    .update({ [column]: current + 1 })
    .eq('id', reportId);

  if (updateError) throw updateError;
}

export function alertFlagError(error: unknown) {
  alert(`Could not save flag: ${formatSupabaseError(error)}`);
}
