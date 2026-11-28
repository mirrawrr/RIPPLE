/**
 * Formula text and input lists exposed for the UI (Req 7.10). Pure data.
 * Class_Label kinds use the shared CLASS_LABELS values.
 */
import { CLASS_LABELS, type ClassLabel } from '../config/constants';

export interface FormulaInputDescriptor {
  /** Name of the engine input field. */
  field: string;
  /** Glossary name of the input. */
  term: string;
  classLabel: ClassLabel;
}

export interface FormulaDescriptor {
  text: string;
  inputs: readonly FormulaInputDescriptor[];
  resultClassLabel: ClassLabel;
}

const baselineTransitFlow: FormulaInputDescriptor = {
  field: 'baselineTransitFlow',
  term: 'Baseline_Transit_Flow',
  classLabel: CLASS_LABELS.historical,
};
const periodDayCount: FormulaInputDescriptor = {
  field: 'periodDayCount',
  term: 'Period_Day_Count',
  classLabel: CLASS_LABELS.hypothetical,
};
const baselineDailyFlow: FormulaInputDescriptor = {
  field: 'baselineDailyFlow',
  term: 'Baseline_Daily_Flow',
  classLabel: CLASS_LABELS.calculated,
};
const magnitude: FormulaInputDescriptor = {
  field: 'magnitudePercent',
  term: 'Disruption_Magnitude',
  classLabel: CLASS_LABELS.hypothetical,
};
const duration: FormulaInputDescriptor = {
  field: 'durationDays',
  term: 'Disruption_Duration',
  classLabel: CLASS_LABELS.hypothetical,
};
const dailyReduced: FormulaInputDescriptor = {
  field: 'dailyReducedFlow',
  term: 'daily Hypothetically_Reduced_Flow',
  classLabel: CLASS_LABELS.calculated,
};
const share: FormulaInputDescriptor = {
  field: 'chokepointTransitImportSharePercent',
  term: 'chokepoint-transit import share',
  classLabel: CLASS_LABELS.historical,
};

export const FORMULAS = {
  /** Annual_To_Daily_Step (per-year time basis only). */
  annualToDailyStep: {
    text: 'Baseline_Daily_Flow = Baseline_Transit_Flow / Period_Day_Count',
    inputs: [baselineTransitFlow, periodDayCount],
    resultClassLabel: CLASS_LABELS.calculated,
  },
  /** Per-day time basis: used as is, no normalisation step. */
  baselineDailyPassthrough: {
    text: 'Baseline_Daily_Flow = Baseline_Transit_Flow',
    inputs: [baselineTransitFlow],
    resultClassLabel: CLASS_LABELS.calculated,
  },
  dailyReducedFlow: {
    text: 'daily Hypothetically_Reduced_Flow = Baseline_Daily_Flow x Disruption_Magnitude / 100',
    inputs: [baselineDailyFlow, magnitude],
    resultClassLabel: CLASS_LABELS.calculated,
  },
  cumulativeReducedFlow: {
    text: 'cumulative Hypothetically_Reduced_Flow = daily Hypothetically_Reduced_Flow x Disruption_Duration',
    inputs: [dailyReduced, duration],
    resultClassLabel: CLASS_LABELS.calculated,
  },
  scenarioExposureIndex: {
    text: 'Scenario_Exposure_Index = chokepoint-transit import share x Disruption_Magnitude / 100',
    inputs: [share, magnitude],
    resultClassLabel: CLASS_LABELS.calculated,
  },
} as const satisfies Record<string, FormulaDescriptor>;

/** Modelling limitation shown with every calculated outcome (Req 7.14). */
export const ENGINE_ASSUMPTIONS = ['zero rerouting', 'zero pipeline bypass', 'zero stock drawdown'] as const;
