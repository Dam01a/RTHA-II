import { useCallback, useEffect, useState } from "react";
import {
  addHealthMetric,
  deleteHealthMetric,
  subscribeHealthMetrics,
  updateHealthMetric,
} from "../lib/healthMetrics";
import type { HealthMetric, HealthMetricInput } from "../types/health";

export function useHealthMetrics(uid: string | undefined) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setMetrics([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeHealthMetrics(
      uid,
      (list) => {
        setMetrics(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  const add = useCallback(
    async (input: HealthMetricInput) => {
      if (!uid) return;
      await addHealthMetric(uid, input);
    },
    [uid]
  );

  const update = useCallback(
    async (metricId: string, patch: Partial<HealthMetricInput>) => {
      if (!uid) return;
      await updateHealthMetric(uid, metricId, patch);
    },
    [uid]
  );

  const remove = useCallback(
    async (metricId: string) => {
      if (!uid) return;
      await deleteHealthMetric(uid, metricId);
    },
    [uid]
  );

  return {
    metrics,
    loading,
    error,
    addHealthMetric: add,
    updateHealthMetric: update,
    deleteHealthMetric: remove,
  };
}
