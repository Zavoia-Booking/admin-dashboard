import type {
  EligibleStaffMember,
  OffboardPreviewAppointment,
} from '../../api';

export type EligibleStaffMap = Record<number, EligibleStaffMember[]>;

/**
 * Staff (by userId) that can take over a single appointment, given the current selection.
 * The map is keyed by appointment id and already accounts for service-location capability +
 * availability per slot. We still re-filter by `selectedSet` to handle stale selection state.
 */
export function eligibleFor(
  apt: OffboardPreviewAppointment,
  selectedSet: Set<number>,
  eligibleStaffMap: EligibleStaffMap,
): number[] {
  const candidates = eligibleStaffMap[apt.id] ?? [];
  return candidates
    .filter((c) => !selectedSet.has(c.userId))
    .map((c) => c.userId);
}

/**
 * Number of `appts` for which `candidateId` is eligible.
 */
export function coverageFor(
  candidateId: number,
  appts: OffboardPreviewAppointment[],
  selectedSet: Set<number>,
  eligibleStaffMap: EligibleStaffMap,
): number {
  let count = 0;
  for (const apt of appts) {
    if (eligibleFor(apt, selectedSet, eligibleStaffMap).includes(candidateId)) {
      count++;
    }
  }
  return count;
}

/**
 * Set of staff (by userId) eligible for EVERY appointment in `appts`.
 */
export function intersectionEligible(
  appts: OffboardPreviewAppointment[],
  selectedSet: Set<number>,
  eligibleStaffMap: EligibleStaffMap,
): Set<number> {
  if (appts.length === 0) return new Set();
  let acc: Set<number> | null = null;
  for (const apt of appts) {
    const eligible = new Set(eligibleFor(apt, selectedSet, eligibleStaffMap));
    if (acc === null) {
      acc = eligible;
    } else {
      const current: Set<number> = acc;
      acc = new Set(Array.from(current).filter((id: number) => eligible.has(id)));
    }
    if (acc.size === 0) return acc;
  }
  return acc ?? new Set();
}

/**
 * Distinct candidate users across all appts (eligible for at least one), sorted by
 * coverage descending.
 */
export function candidateCoverage(
  appts: OffboardPreviewAppointment[],
  selectedSet: Set<number>,
  eligibleStaffMap: EligibleStaffMap,
): Array<{ member: EligibleStaffMember; coverage: number }> {
  const seen = new Map<number, EligibleStaffMember>();
  for (const apt of appts) {
    for (const candidate of eligibleStaffMap[apt.id] ?? []) {
      if (selectedSet.has(candidate.userId)) continue;
      if (!seen.has(candidate.userId)) seen.set(candidate.userId, candidate);
    }
  }
  return Array.from(seen.values())
    .map((member) => ({
      member,
      coverage: coverageFor(member.userId, appts, selectedSet, eligibleStaffMap),
    }))
    .sort((a, b) => b.coverage - a.coverage);
}
