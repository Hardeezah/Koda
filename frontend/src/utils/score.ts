/**
 * Centralized trade-readiness score calculation.
 *
 * Used by DashboardScreen, LedgerScreen, and ExportScoreScreen so the
 * displayed score is consistent across the app.
 */

export interface ScoreInput {
  profile: {
    business_name?: string | null;
    business_type?: string | null;
    trade_type?: string | null;
    primary_category?: string | null;
    cac_number?: string | null;
  } | null;
  /** Number of compliant ledger entries. */
  compliantEntries: number;
  /** Total ledger entries (used to cap ledger points). */
  totalEntries: number;
}

export interface ScoreBreakdown {
  total: number;
  profilePoints: number;
  cacPoints: number;
  ledgerPoints: number;
  compliancePoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  nextTier?: string;
  pointsToNextTier?: number;
}

/**
 * Derive a 0-100 readiness score from profile + ledger data.
 */
export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const { profile, compliantEntries, totalEntries } = input;

  let profilePoints = 0;
  if (profile?.business_name) profilePoints += 10;
  if (profile?.business_type) profilePoints += 10;
  if (profile?.trade_type) profilePoints += 5;
  if (profile?.primary_category) profilePoints += 5;

  const cacPoints = profile?.cac_number ? 25 : 0;
  const ledgerPoints = Math.min(totalEntries * 5, 20);
  const compliancePoints = Math.min(compliantEntries * 5, 25);

  const total = Math.min(profilePoints + cacPoints + ledgerPoints + compliancePoints, 100);
  
  let tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
  let nextTier: string | undefined = 'Silver';
  let pointsToNextTier: number | undefined = 25 - total;

  if (total >= 75) {
    tier = 'Platinum';
    nextTier = undefined;
    pointsToNextTier = undefined;
  } else if (total >= 50) {
    tier = 'Gold';
    nextTier = 'Platinum';
    pointsToNextTier = 75 - total;
  } else if (total >= 25) {
    tier = 'Silver';
    nextTier = 'Gold';
    pointsToNextTier = 50 - total;
  }

  return { total, profilePoints, cacPoints, ledgerPoints, compliancePoints, tier, nextTier, pointsToNextTier };
}
