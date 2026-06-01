import { supabase } from '@/lib/supabase';

/**
 * Counts for landing page trust stats. Requires migration 008_public_landing_stats.sql.
 */
export async function getLandingStats() {
  const { data, error } = await supabase.rpc('get_landing_stats');

  if (!error && data && typeof data === 'object') {
    return {
      verifiedDoctors: Number(data.verified_doctors) || 0,
      moms: Number(data.moms) || 0,
    };
  }

  // Fallback if RPC not deployed yet: verified doctors are readable by anon via RLS
  const { count, error: doctorsError } = await supabase
    .from('doctors')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true);

  if (doctorsError) throw doctorsError;

  return {
    verifiedDoctors: count ?? 0,
    moms: null,
  };
}
