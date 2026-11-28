/**
 * DemoDatasetProvider (Task 2.9; Req 22.2, 22.12): loads the Demo_Dataset only while `mode` is
 * 'demo'. Historical mode is 'idle' with no request. A successful result is cached, so returning to
 * demo mode does not refetch; a failed load is retried on the next switch to demo. Results that
 * arrive after the mode left demo are ignored. Not mounted yet (Task 5.9).
 */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppMode } from '../config/constants';
import { DEMO_IDLE, DEMO_LOADING, loadDemoDataset } from './demoLoader';
import type { DemoLoadOptions, DemoState } from './demoLoader';

const DemoContext = createContext<DemoState>(DEMO_IDLE);

export function DemoDatasetProvider({
  mode,
  children,
  options,
}: {
  mode: AppMode;
  children: ReactNode;
  options?: DemoLoadOptions;
}) {
  const [result, setResult] = useState<DemoState | null>(null);

  useEffect(() => {
    if (mode !== 'demo' || result?.status === 'ready') return;
    let cancelled = false;
    setResult(null); // drop a previous error so the retry shows 'loading'
    loadDemoDataset(options).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
    // Re-runs on mode change only; `options` is a test seam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const state: DemoState = mode !== 'demo' ? DEMO_IDLE : (result ?? DEMO_LOADING);
  return <DemoContext.Provider value={state}>{children}</DemoContext.Provider>;
}

export function useDemoDataset(): DemoState {
  return useContext(DemoContext);
}
