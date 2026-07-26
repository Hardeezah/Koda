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

  return { total, profilePoints, cacPoints, ledgerPoints, compliancePoints };
}
