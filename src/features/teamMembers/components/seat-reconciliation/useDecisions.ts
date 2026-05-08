import { useCallback, useState } from 'react';

export type Decision =
  | { kind: 'reassign'; toUserId: number }
  | { kind: 'cancel' };

export type DecisionMap = Map<number, Decision>;

export function useDecisions() {
  const [decisions, setDecisions] = useState<DecisionMap>(() => new Map());

  const decide = useCallback((appointmentId: number, decision: Decision | null) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      if (decision === null) {
        next.delete(appointmentId);
      } else {
        next.set(appointmentId, decision);
      }
      return next;
    });
  }, []);

  const decideMany = useCallback(
    (appointmentIds: number[], decision: Decision | null) => {
      setDecisions((prev) => {
        const next = new Map(prev);
        for (const id of appointmentIds) {
          if (decision === null) next.delete(id);
          else next.set(id, decision);
        }
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => setDecisions(new Map()), []);

  return { decisions, decide, decideMany, reset, setDecisions };
}
