import type { StatusLevel } from '../components/StatusChip'

/**
 * How a finding's severity and an officer's decision map onto the reserved
 * status palette.
 *
 * One place, because these appear on the filings list, the filing detail, the
 * worklist and the taxpayer file, and a severity that reads HIGH on one screen
 * and MEDIUM on another is the sort of inconsistency nobody reports and
 * everybody stops trusting.
 */
const SEVERITY: Record<string, StatusLevel> = {
  CRITICAL: 'critical',
  HIGH: 'serious',
  MEDIUM: 'warning',
  LOW: 'warning',
  ADVISORY: 'unknown',
}

export function severityLevel(severity: string): StatusLevel {
  return SEVERITY[severity] ?? 'unknown'
}

/** What an officer concluded about a filing, in words rather than a code. */
export const DISPOSITION_LABEL: Record<string, string> = {
  OPEN: 'Still looking',
  NO_ACTION: 'Nothing to do',
  WATCH: 'Watch',
  ESCALATE: 'Escalated',
}

const DISPOSITION: Record<string, StatusLevel> = {
  // "Still looking" is deliberately not good, not bad: it is unfinished, and
  // an unfinished review should not read as a clean one.
  OPEN: 'unknown',
  NO_ACTION: 'good',
  WATCH: 'warning',
  ESCALATE: 'critical',
}

export function dispositionLevel(disposition: string): StatusLevel {
  return DISPOSITION[disposition] ?? 'unknown'
}
