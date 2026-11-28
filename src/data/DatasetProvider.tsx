/**
 * DatasetProvider (Task 2.5; Req 16.2, 16.7): loads the Curated_Dataset once on mount and exposes
 * `{ status, dataset, fileErrors, ... }` through context. No UI. Thin wrapper over loadCuratedDataset.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { loadCuratedDataset } from './loader';
import type { LoadOptions, LoadResult } from './loader';

export type DatasetState = { status: 'loading' } | LoadResult;

/** Context value; `status: 'loading'` until the first load settles. */
export const LOADING_STATE: DatasetState = { status: 'loading' };

const DatasetContext = createContext<DatasetState>(LOADING_STATE);

export function DatasetProvider({ children, options }: { children: ReactNode; options?: LoadOptions }) {
  const [state, setState] = useState<DatasetState>(LOADING_STATE);

  useEffect(() => {
    let cancelled = false;
    loadCuratedDataset(options).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
    // Loads once on mount (Req 16.2).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <DatasetContext.Provider value={state}>{children}</DatasetContext.Provider>;
}

export function useDataset(): DatasetState {
  return useContext(DatasetContext);
}
