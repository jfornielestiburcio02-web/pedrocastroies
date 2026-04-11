'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  onSnapshot,
  Query,
  DocumentData
} from 'firebase/firestore';

export function useCollection<T = DocumentData>(
  query: Query<T> | null
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // 🔥 MEMOIZACIÓN OBLIGATORIA
  const memoizedQuery = useMemo(() => query, [query]);

  useEffect(() => {
    if (!memoizedQuery) return;

    setLoading(true);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const results: any[] = [];

        snapshot.forEach((doc) => {
          results.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setData(results);
        setLoading(false);
      },
      (err) => {
        console.error("🔥 Firestore error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [memoizedQuery]);

  return { data, loading, error };
}