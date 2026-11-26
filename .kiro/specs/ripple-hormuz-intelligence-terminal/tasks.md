# Implementation Plan: RIPPLE Hormuz Intelligence Terminal

## Overview

Implementation language: TypeScript (React 18, Vite, Zod, MapLibre GL JS, Vitest, fast-check, Playwright, axe-core), as fixed by the design.

The plan follows the approved build order (Requirement 20.3) in four phases. Each phase is a group of top-level tasks whose titles start with the phase label:

- **Phase 1 - Foundation** (tasks 1 to 6): project setup, dataset schemas and validation pipeline, verified source records, Scenario_Engine with property tests, shared scenario state and routing.
- **Phase 2 - Complete MVP** (tasks 7 to 14): the four connected Views (Overview, Explore, Scenario Lab, Intelligence Brief), map, charts, Evidence_Panel, full user journey.
- **Phase 3 - Competitive polish** (tasks 15 to 18): Dependency_Graph, visual design and responsive layout, accessibility audit, documentation, deployment readiness, performance measurement.
- **Phase 4 - Stretch** (task 19, all sub-tasks optional) and **Submission** (tasks 20 and 21).

**Requirement 22 (Illustrative Demo Mode).** Its foundations (schemas and constants 2.6, separation checks 2.7, demo dataset file 2.8, demo loader 2.9, mode codec 4.20, mode state 5.8) may run in the Phase 1 and early Phase 2 waves. The demo user interface follows the Historical four-View journey: the toggle and banner (5.9) and the demo branches inside 7.6, 7.7, 8.1, 9.4, 10.1 and 12.1 are added only after the Historical path of each View is finished. Demo branches exist only for the Overview, Scenario Lab, Evidence_Panel and Intelligence_Brief, plus the banner on all four Views. Explore is unchanged (map data stays Curated_Dataset only). The Scenario_Engine is unchanged and mode-unaware.

Rules that apply to every task:

- **Data integrity (mandatory).** Real-world figures, source details, country shares, dependencies and map or graph facts are entered into the Curated_Dataset only by the developer, after checking each value, unit, reference period, publication and licence against the cited source. An implementing agent must never invent, estimate, interpolate or recall such values from memory. Where verified data cannot be found, the outcome of the task is a qualitative-only record or an explicit "unavailable" state (Requirements 4.6 to 4.8, 12.3), never a placeholder number. The Demo_Dataset (Requirement 22) is the only place an agent may author numeric values, because they are synthetic, round and fictional, and carry no real source, and it holds no EIA, IEA, UNCTAD, Vortexa, Kpler or OPEC figure or aggregate.
- **Synthetic data placement.** Synthetic data lives only in `tests/` (fixtures) or in the single, validated `public/data/demo/demo-dataset.json` (Requirement 22). No synthetic value enters any other `public/data/` file, and Historical mode never loads, displays or calculates with demo values.
- **Continuous requirements.** Requirements 4, 12, 14 and 18 are addressed in every phase for the features that phase delivers: sources, labels, accessibility checks and tests ship with the feature, not after it.
- **Optional marker.** Only Phase 4 items and truly non-core extras carry `*`. Calculation property tests, data verification, schema tests and accessibility checks are mandatory.
- **Recorded user decisions.** Licence: MIT. Hosting: Cloudflare Pages (primary). Basemap: MapTiler Cloud is the preferred candidate only, not approved until verified (task 11.3). Sources: the US EIA "World Oil Transit Chokepoints" publication is the primary candidate for historical Hormuz oil and LNG transit figures; IEA and UNCTAD are supplementary candidates for documented dependencies and context. No real-world value is entered until it is individually verified against its source, dated, and checked for reuse permissions. Task 3.1 approved link-only treatment of the EIA transit aggregates: they are not packaged in production datasets, historical baselines show as unavailable with a link to EIA, and IEA and UNCTAD stay excluded from MVP production data.
- **Commit and deploy continuously.** The repository is public from task 1.4 and the Cloudflare Pages deployment runs from task 5.7. Each milestone and checkpoint ends with a commit and push, and each checkpoint confirms the Cloudflare deployment still works.
- **No performance claim** appears in the README, UI or submission material until the measurement in task 17.3 is recorded (Requirement 16.6).

## Tasks

- [x] 1. Phase 1 - Project foundation and tooling
  - [x] 1.1 Scaffold the Vite + React + TypeScript project
    - Create the Vite project with strict TypeScript, React Router, Zod, maplibre-gl, Vitest, fast-check, Playwright and `@axe-core/playwright` as dependencies, with `npm run` scripts for `dev`, `build`, `test` (single run) and `test:e2e`.
    - Create the folder layout: `src/{config,data,domain,engine,state,components,views}`, `tests/{properties,e2e}`, `scripts/`, `docs/`, `public/data/`.
    - Acceptance: `npm run build` and `npm test` both run to completion on an empty app.
    - Prerequisites: none.
    - _Requirements: 16.1, 16.2, 20.8_
    - _Design: Architecture, Technology choices_

  - [x] 1.2 Repository hygiene and licence
    - Add `.gitignore` with no rule matching `.kiro` or any file inside it, and confirm with `git check-ignore -v .kiro/specs/ripple-hormuz-intelligence-terminal/tasks.md` returning nothing.
    - Add `LICENSE` containing the full text of the MIT License (user decision), with the copyright holder and year filled in by the developer.
    - Acceptance: `.kiro` is trackable and `LICENSE` is the complete MIT License text.
    - Prerequisites: 1.1.
    - _Requirements: 19.1, 19.4_
    - _Design: Static Deployment and Routing (repository structure note)_

  - [x] 1.3 Create the shared constants and exact-copy module
    - Create `src/config/constants.ts` exporting: scenario defaults (25, 7, `both`) and ranges (0-100, 1-365), `STALE_THRESHOLD_MONTHS = 12`, `TOP_N_EXPOSURE = 5`, and the exact strings Reference_Statement, Scenario_Exposure_Disclaimer, Older_Period_Notice, Qualitative_Label, tagline, and the Class_Label names.
    - Acceptance: every exact string matches the requirements glossary character for character; no other module hard-codes these strings.
    - Prerequisites: 1.1.
    - _Requirements: 2.1, 5.1, 5.2, 5.3, 12.5, 12.9, 12.10, 8.2_
    - _Design: Architecture (stale threshold), Cross-view consistency and content rules_

  - [x] 1.4 Initialise Git and publish the public GitHub repository early
    - Run `git init` (if not already a repository) and confirm that `.gitignore` does not ignore `.kiro` or `.kiro/specs/` (`git check-ignore -v` on `requirements.md`, `design.md` and `tasks.md` returns nothing).
    - Make an early first commit containing the `.kiro` specifications, the MIT `LICENSE` and `.gitignore` (plus the scaffold from 1.1).
    - Create the public GitHub repository, add the remote and push. The developer performs any authentication.
    - Set the convention: commit and push after each completed milestone and at every checkpoint (6, 14, 18, 21).
    - Acceptance: the public repository shows the `.kiro` specs, `LICENSE` and `.gitignore` on the default branch.
    - Prerequisites: 1.2.
    - _Requirements: 19.1, 19.2, 19.4_
    - _Design: Static Deployment and Routing (repository structure note)_

- [ ] 2. Phase 1 - Dataset schemas and validation pipeline
  - [x] 2.1 Implement the Zod dataset schemas
    - In `src/data/schema.ts`, implement the schemas from the design: branded ids, `SourceRecordSchema`, `HistoricalObservationSchema`, `DependencyShareSchema`, strict `QualitativeDependencySchema`, `GraphEdgeSchema`, graph nodes, `CuratedDatasetSchema`, and the schema-version file schema. Export inferred TypeScript types.
    - Acceptance: types compile; a qualitative record with an extra numeric key is rejected by the strict schema.
    - Prerequisites: 1.1.
    - _Requirements: 4.2, 4.4, 4.6, 4.8, 4.13, 9.2, 17.1, 17.2_
    - _Design: Key module interfaces (Dataset schema), Data Models_

  - [x] 2.2 Implement `scripts/validate-dataset.ts` and wire it as `prebuild`
    - Implement the cross-record checks from the design pipeline: every `sourceRecordIds` reference resolves to a verified Source_Record, per-year observations have `periodDayCount` consistent with leap-year status, graph edges resolve to nodes and have sources, no date later than `buildDate`, `end >= start`, all referenced ids declared, no economy/commodity/chokepoint appearing in both shares and qualitative records, supported `schemaVersion` allow-list.
    - Export the validation functions so tests can call them directly. On any violation, print one line per violation (record id and field), exit non-zero and write no `dist/` output.
    - Acceptance: a known-bad fixture makes the script exit non-zero; an empty-but-valid dataset passes.
    - Prerequisites: 2.1.
    - _Requirements: 4.3, 4.11, 4.12, 4.14, 9.3, 17.2_
    - _Design: Build-time validation pipeline, Error Handling (build-time rows)_

  - [ ] 2.3 Write property test for the schema validator
    - **Property 17: Dataset schema validator field detection**
    - Generate valid records, then delete or corrupt one required field (missing, wrong type, malformed date, out-of-range); assert the validator names exactly that field and record id, and reports nothing for the uncorrupted record. At least 100 runs.
    - Place in `tests/properties/p17-schema-validator.test.ts`.
    - **Validates: Requirements 4.3, 4.11, 4.14, 9.3**
    - Prerequisites: 2.2, 4.6.

  - [ ] 2.4 Write schema and build-pipeline unit tests
    - Cover each violation class: missing field, wrong type, bad date order, future date, unverified status, missing `periodDayCount`, wrong leap-year count, dangling graph edge, unsourced edge, unsupported or missing `schemaVersion`.
    - Add an integration test that runs `validate-dataset.ts` against one known-bad fixture under `tests/fixtures/` and asserts a non-zero exit, the offending record id in the output, and no output directory.
    - **Validates: Requirements 4.3, 4.11, 4.14, 9.3, 17.2, 18.5**
    - Prerequisites: 2.2.

  - [ ] 2.5 Implement the dataset loader and `DatasetProvider`
    - Fetch each dataset file separately using `import.meta.env.BASE_URL`, validate with the Zod schemas, and expose `{ status, dataset, fileErrors }` per file.
    - Required observations without a Source_Record are excluded from engine input and flagged as "Source unavailable". An unreadable version or build date yields "Dataset version unavailable".
    - The Curated loader never fetches anything under `/data/demo/` (demo loading is task 2.9).
    - Acceptance: a failing file produces an error naming that file while other files stay available (tested with mocked fetch).
    - Prerequisites: 2.1, 1.3.
    - _Requirements: 4.10, 12.11, 16.7, 22.2_
    - _Design: DatasetProvider, Data flow summary, Error Handling_

  - [x] 2.6 Add the demo constants, schemas and demo generators
    - Add to `src/config/constants.ts`: the exact Demo strings (Demo_Banner_Text, Demo_Data_Notice, Demo_No_Source_Text, Demo_Reference_Statement, Demo_Brief_Header, Demo_Brief_Footer, Demo_Title_Prefix and document-title prefix, Mode_Toggle labels, Mode_Announcements, Demo_Marker, `ILLUSTRATIVE_LABEL`), `DEMO_ID_PREFIX = 'demo-'`, `APP_MODES`, `DEFAULT_APP_MODE = 'historical'`. `CLASS_LABELS` and `ClassLabel` are not modified. Extend `constants.test.ts` so the new exact strings also appear verbatim in `requirements.md` and are included in the "no hard-coded copies" scan.
    - Add `DemoFlowSchema`, `DemoDependencyShareSchema` and `DemoDatasetSchema` to `src/data/schema.ts` as additive exports (`CuratedDatasetSchema` and its record schemas are not modified). Add `tests/schema/demo-schema.test.ts` and `tests/generators.demo.ts` (valid Demo_Dataset arbitraries).
    - Acceptance: existing schema and constants tests pass unmodified in behaviour; a demo record with `sourceRecordIds` or `verificationStatus` is rejected; a Curated observation with a `synthetic` key is rejected.
    - Prerequisites: 2.1, 1.3.
    - _Requirements: 22.1, 22.6, 22.7, 22.8, 22.10_
    - _Design: Illustrative Demo Mode, Data Models (Demo_Dataset)_

  - [ ] 2.7 Implement the demo separation checks and their property test
    - In `scripts/validate-dataset.ts`, add exported functions for D1 (Curated is clean), D2 (demo file parses), D3 (demo content rules: `demo-` ids, "(fictional)" economies, "demo" units, multiples of 10, no forbidden source names, no `synthetic` key in any JSON outside `public/data/demo/`) and D5 (demo references resolve and no id is shared with the Curated_Dataset). Any failure exits non-zero, writes no `dist/` output, and names the record id and field. Before 2.8, the validator tolerates the demo file being absent: absence passes and is logged as "demo dataset not present" (D1 and the Curated-side part of D3, the `synthetic` key scan, still run). Once the file exists, the validator validates its contents with `DemoDatasetSchema` and enforces D2, D3 and D5. Add a unit test for each of the two states (absent passes with the log line; present and invalid fails).
    - Add unit tests with known-bad fixtures under `tests/fixtures/`.
    - Write the Property 20 test in `tests/properties/p20-dataset-separation.test.ts` (at least 100 runs, tagged `// Feature: ripple-hormuz-intelligence-terminal, Property 20`).
    - **Property 20: Dataset separation**
    - **Validates: Requirements 22.10, 22.11**
    - Prerequisites: 2.2, 2.6, 4.6.
    - _Requirements: 22.10, 22.11, 18.9_
    - _Design: Build-time validation pipeline (Demo separation checks), Correctness Property 20_

  - [ ] 2.8 Author the Demo_Dataset file
    - Create `public/data/demo/demo-dataset.json` with exactly the approved content in the design (Data Models, Demo_Dataset): one chokepoint, two commodities, flows 1000 per day and 73000 per year (365 days), economies "Demo Economy A (fictional)" to "Demo Economy D (fictional)", oil shares 80, 50, 20, LNG shares 60, 30, and a one-sentence fictional assumption per record that names no real publisher.
    - Record in `docs/data-sources.md` that the demo file is synthetic, fictional and contains no third-party figure.
    - Acceptance: validation now runs against the present file: `scripts/validate-dataset.ts` (D1, D2, D3, D5) passes with the log no longer reporting "demo dataset not present", a deliberately corrupted copy of the file under `tests/fixtures/` still fails, and no other `public/data/` file changes.
    - Prerequisites: 2.7.
    - _Requirements: 22.10_
    - _Design: Data Models (Demo_Dataset, approved demo content)_

  - [ ] 2.9 Implement the demo dataset loader and `DemoDatasetProvider`
    - In new files under `src/data/` (mounting is done in 5.9): fetch `demo/demo-dataset.json` only when invoked in demo mode (URL from `import.meta.env.BASE_URL`), validate with `DemoDatasetSchema`, and expose `{ status: 'idle' | 'loading' | 'ready' | 'error', demo, file }`. On failure the error names `demo/demo-dataset.json`. The loader reads no Curated value and the Curated loader never calls it.
    - Add unit tests with mocked fetch: idle and zero requests in Historical mode, ready in demo mode, a failed fetch and a schema failure each produce an error naming the file.
    - Prerequisites: 2.5, 2.6, 2.8.
    - _Requirements: 22.2, 22.12_
    - _Design: Illustrative Demo Mode (structure), Error Handling (demo file)_

- [ ] 3. Phase 1 - Source licensing and verified data (MANDATORY, developer-verified)
  - [x] 3.1 Source and licence review (mandatory)
    - Developer reviews the actual publications and terms of use of the Candidate_Sources and records in `docs/data-sources.md`, for each: exact publication title, publisher, URL, publication date, reference period, units, licence, attribution requirement, and whether redistribution of the needed figure in a static bundle is permitted.
    - Primary candidate: the US EIA "World Oil Transit Chokepoints" publication, for verified historical Hormuz oil and LNG transit figures. Supplementary candidates: IEA and UNCTAD, for documented dependencies and context. A figure from any of them is entered only after it is individually verified against the source, dated, and checked for reuse permissions.
    - A source whose licence does not permit inclusion is recorded as excluded and its figures become "unavailable" (not substituted).
    - Acceptance: every source intended for the dataset has a completed, dated review entry.
    - Prerequisites: none.
    - _Requirements: 4.1, 4.2, 4.9_
    - _Design: Meaning of "verified", Technical Trade-offs and Risks (licence terms)_

  - [ ] 3.2 Enter the EIA citation and link record; no crude oil and petroleum liquids baseline value (mandatory)
    - Follows the Task 3.1 link-only decision (`docs/data-sources.md`, "Final source-review decision (2026-11-27)"). The EIA transit aggregates recorded there are not redistributable under that decision, so no Historical_Observation for the oil baseline is entered, and no transit aggregate value is packaged in any production dataset.
    - Permitted entry: citation, source-link and reviewed-metadata Source_Records only, for example one EIA Source_Record for "World Oil Transit Chokepoints" holding title, publisher, URL, last-updated date, reference period, units, licence and attribution wording as approved in 3.1, and `verificationStatus`. The record contains no transit aggregate value, and no `historical-observations.json` entry is added for the oil baseline.
    - Dates: keep the original publication date and the verified last-updated date distinct. 2026-03-03 is the last-updated date only; the original publication date is not established. Do not invent a missing date and do not present the last-updated date as a publication date.
    - Prerequisite sub-step (schema adjustment, approved before entry): `SourceRecordSchema` currently requires `publicationDate` and has no way to label a date as "last updated", so this record cannot be entered faithfully today. The developer approves a schema adjustment before any entry (proposed: optional `publicationDate` plus a date-kind or last-updated field, with the Evidence_Panel label "Last updated", and the "not available" label of Requirements 10.4 and 10.5 for a missing publication date). The proposal is recorded in the design (Data Models, "Last-updated dates", status PENDING approval). Requirement 4.2 does not list a publication date, so no criterion change is expected. If a requirement wording change proves unavoidable, it is proposed here and reported, not edited silently. This task does not implement the schema change; the approved adjustment is implemented under its own approved change before the record is entered.
    - The state of the oil baseline is "unavailable" in Historical_Mode: the Overview shows "Source unavailable" with the EIA link (Requirements 2.3, 4.10), and the engine reports "not calculable" (Requirement 7.15).
    - The agent must not supply, recall or estimate any figure.
    - Acceptance: `scripts/validate-dataset.ts` passes; no transit aggregate value appears anywhere under `public/data/`; `docs/data-verification-log.md` references the Task 3.1 link-only decision and lists the Source_Record, the date kind, and the date checked.
    - Prerequisites: 2.2, 3.1.
    - _Requirements: 2.3, 4.2, 4.4, 4.5, 4.10, 4.13, 4.14, 10.4, 10.5, 12.2_
    - _Design: Dataset file layout, Build-time validation pipeline, Data Models (Last-updated dates)_

  - [ ] 3.3 Represent the unavailable oil and LNG baselines and link the EIA citation (mandatory)
    - Under the Task 3.1 link-only decision, no Historical_Observation is entered for the LNG baseline or the oil baseline. Both historical baselines are represented by the approved unavailable-state behaviour: the Overview text indicator (Requirement 2.3), "Source unavailable" (Requirement 4.10) and "not calculable" (Requirement 7.15).
    - Provide the EIA citation and source link through the Source_Record from 3.2, without embedding the restricted aggregates recorded in `docs/data-sources.md` (Table 3). No conversion between oil and LNG units is entered, and no unit is invented for a missing value.
    - Do not silently substitute illustrative values. Demo_Dataset values never appear in Historical_Mode (Requirement 22.2); the demo file is not touched by this task.
    - Acceptance: with the real dataset, Historical_Mode shows the unavailable state for both baselines, with the EIA link; validation passes; `docs/data-verification-log.md` records the decision for each baseline.
    - Prerequisites: 3.2 (same data files).
    - _Requirements: 2.3, 4.2, 4.4, 4.5, 4.10, 4.13, 4.14, 7.7, 7.15, 22.2_
    - _Design: Dataset file layout, Illustrative Demo Mode (Historical mode unchanged)_

  - [ ] 3.4 Verify dependency shares or record qualitative-only dependencies (mandatory)
    - Include only evidence-supported dependencies, consistent with the schema's denominator (the share of an economy's imports of the commodity that transit the chokepoint, `chokepointTransitImportSharePercent`) and the commodity scope (oil and LNG for the Strait of Hormuz).
    - Keep destination-flow percentages (the share of Hormuz flows going to destinations) separate from economy import-dependency shares. A destination share is never entered as `chokepointTransitImportSharePercent`.
    - Under the Task 3.1 link-only decision, no EIA-derived numeric share is entered. IEA and UNCTAD remain excluded from MVP production data. Any qualitative dependency needs its own verified, redistributable Source_Record and wording supported by that source (including a decision on whether paraphrasing is acceptable, flagged in `docs/data-sources.md`). No numerical share and no qualitative statement is invented, estimated, interpolated or copied from another economy, commodity or period.
    - If no record qualifies, preserve the unavailable or empty state. Zero quantified economies and zero qualitative dependencies are both acceptable outcomes (Requirements 7.17, 8.4, 11.5).
    - Entries, if any, go into `public/data/dependency-shares.json` (numeric, only with a verified Source_Record giving publication, observation period, unit and value for that exact economy and commodity) or `public/data/qualitative-dependencies.json` (words only).
    - Acceptance: validation passes; no economy appears in both files for the same commodity and chokepoint; `docs/data-verification-log.md` records each decision, including "none qualify" if that is the outcome.
    - Prerequisites: 3.3.
    - _Requirements: 4.6, 4.7, 4.8, 7.17, 8.4, 11.5, 12.3_
    - _Design: Dataset file layout, Build-time validation pipeline (step 3)_

  - [ ] 3.5 Create dataset release metadata
    - Write `public/data/schema-version.json` with `schemaVersion` and `buildDate`, and add a script step that refreshes `buildDate` and the dataset version identifier at build time.
    - Acceptance: version identifier and build date are readable by the loader and shown by the footer later.
    - Prerequisites: 2.1.
    - _Requirements: 12.7, 17.2_
    - _Design: Dataset file layout_

- [ ] 4. Phase 1 - Scenario input validation, URL codec and Scenario_Engine
  - [x] 4.1 Implement Scenario_Input_Validation
    - In `src/domain/validation.ts`, implement `validateIntegerInRange` and `validateCommodityScope` per the design, with the exact error text `"<label> must be a whole number from <min> to <max>."`.
    - Rules: trim, reject internal whitespace, accept leading zeros, reject empty, `+`, letters, decimals such as `5.0`, negatives and out-of-range values.
    - Prerequisites: 1.3.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_
    - _Design: Key module interfaces (Scenario_Input_Validation)_

  - [ ] 4.2 Write property test for input validation
    - **Property 12: Scenario input validation accept/reject**
    - Valid strings (optionally padded, zero-prefixed) are accepted and normalised; invalid-case strings are rejected with the exact message. At least 100 runs.
    - Place in `tests/properties/p12-validation.test.ts`.
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - Prerequisites: 4.1, 4.6.

  - [ ] 4.3 Implement the URL codec
    - In `src/domain/urlCodec.ts`, implement `encodeScenarioToSearchParams` and `decodeScenarioFromSearchParams` using parameters `m`, `d`, `c`. Decoding uses 4.1 validation, replaces invalid fields with defaults, keeps valid ones, and returns `corrections` naming each corrected parameter and its default. Encoding is canonical and normalisation is idempotent.
    - Prerequisites: 4.1, 1.3.
    - _Requirements: 1.4, 1.5, 6.10_
    - _Design: Key module interfaces (URL codec), Scenario query parameters and state/URL synchronisation_

  - [ ] 4.4 Write property test for the URL round trip
    - **Property 13: Active Scenario URL round-trip**
    - decode(encode(s)) deeply equals s with zero corrections; encode(decode(encode(s))) equals encode(s). At least 100 runs.
    - Place in `tests/properties/p13-url-roundtrip.test.ts`.
    - **Validates: Requirements 6.10, 18.3**
    - Prerequisites: 4.3, 4.6.

  - [ ] 4.5 Write shared validation test cases for control input and URL parameters
    - Create `tests/validation.cases.ts` with one table of cases (valid, padded, `007`, empty, `+5`, `5.0`, `-1`, `101`, `0` duration, internal whitespace, bad scope) and unit tests that run the table through `validateIntegerInRange`/`validateCommodityScope` and through `decodeScenarioFromSearchParams` with identical expectations. The control tests in 9.2 import the same table.
    - **Validates: Requirements 6.1 to 6.4, 6.10, 18.4**
    - Prerequisites: 4.3.

  - [x] 4.6 Create shared fast-check generators
    - In `tests/generators.ts`, define reusable arbitraries: magnitude (0-100), duration (1-365), scope, `FlowInput` (per-day and per-year branches with `periodDayCount`), `DependencyShareInput`, valid and invalid numeric strings, dataset records, date pairs.
    - Prerequisites: 1.1.
    - _Requirements: 18.2, 18.3_
    - _Design: Testing Strategy (property-based tests)_

  - [ ] 4.7 Implement the Scenario_Engine
    - In `src/engine/`, implement `calculate(input: EngineInput): EngineResult` per the design: baseline daily flow derivation (Annual_To_Daily_Step), daily and cumulative Hypothetically_Reduced_Flow, Scenario_Exposure_Index, unit passthrough, per-commodity results with no combined entry, `not-calculable` results naming missing inputs, defensive range rejection, empty exposure list when no Quantified_Economy.
    - The engine imports no dataset, DOM or network code and contains no literal `hormuz`, `oil` or `lng` identifiers. It exposes the formula text and input list needed by the UI for transparency.
    - Prerequisites: 1.3.
    - _Requirements: 7.1 to 7.9, 7.11, 7.12, 7.14 to 7.18, 17.3, 17.4_
    - _Design: Key module interfaces (Scenario_Engine), Extensibility (engine independence)_

  - [ ] 4.8 Write property test for baseline daily flow derivation
    - **Property 1: Baseline daily flow derivation**
    - Place in `tests/properties/p01-baseline-daily.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.1, 7.2**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.9 Write property test for the Hypothetically_Reduced_Flow pipeline
    - **Property 2: Hypothetically Reduced Flow pipeline**
    - Place in `tests/properties/p02-reduced-flow.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.3, 7.4**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.10 Write property test for the Scenario_Exposure_Index formula
    - **Property 3: Scenario Exposure Index formula**
    - Place in `tests/properties/p03-exposure-index.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.5**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.11 Write property test for commodity separation
    - **Property 4: Commodity separation**
    - Place in `tests/properties/p04-commodity-separation.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.6**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.12 Write property test for unit passthrough
    - **Property 5: Unit passthrough**
    - Place in `tests/properties/p05-unit-passthrough.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.7**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.13 Write property test for determinism
    - **Property 6: Determinism**
    - Place in `tests/properties/p06-determinism.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.8**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.14 Write property test for output bounds
    - **Property 7: Output bounds**
    - Place in `tests/properties/p07-output-bounds.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.11, 7.12, 18.2**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.15 Write property test for monotonicity
    - **Property 8: Monotonicity**
    - Place in `tests/properties/p08-monotonicity.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.13, 18.2**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.16 Write property test for missing-input handling
    - **Property 9: Missing-input handling**
    - Place in `tests/properties/p09-missing-input.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.15, 7.18**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.17 Write property test for out-of-range rejection
    - **Property 10: Out-of-range defensive rejection**
    - Place in `tests/properties/p10-out-of-range.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.16**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.18 Write property test for Quantified_Economy absence independence
    - **Property 11: Quantified Economy absence independence**
    - Place in `tests/properties/p11-no-economy.test.ts`; at least 100 runs.
    - **Validates: Requirements 7.17**
    - Prerequisites: 4.7, 4.6.

  - [ ] 4.19 Write exact-output engine unit tests
    - Using synthetic fixtures (not real figures), assert exact outputs for fixed inputs covering Requirement 7 criteria 1 to 6, 11 to 13, 17 and 18, including 365 versus 366 day counts, magnitude 0 and 100, both-commodity scope and zero economies.
    - Add one test spying on `fetch` and `Math.random` and asserting zero calls during a run.
    - **Validates: Requirements 7.1 to 7.6, 7.9, 7.11 to 7.13, 7.17, 7.18, 18.1**
    - Prerequisites: 4.7.

  - [ ] 4.20 Implement the App_Mode codec with its property and unit tests
    - In `src/domain/urlCodec.ts`, add `validateAppMode` (exact, case-sensitive), `encodeAppStateToSearchParams` and `decodeAppStateFromSearchParams` per the design (`AppState` is scenario plus mode). They call the task 4.3 functions and leave them unchanged. Encoding writes `mode=demo` only for demo mode and omits `mode` for historical; decoding accepts `historical` and `demo`, replaces any other value with `historical`, keeps every valid parameter, and returns one correction naming `mode` and its default.
    - Write the Property 19 test in `tests/properties/p19-app-state-roundtrip.test.ts` (at least 100 runs, tagged `// Feature: ripple-hormuz-intelligence-terminal, Property 19`).
    - Write codec unit tests in `tests/mode-codec.test.ts`, one separate case per rule of Requirement 22.13 that the codec owns: `mode=demo` is written in demo mode; the parameter is omitted in Historical mode; `mode` absent, `historical` and `demo` decode without correction; `Demo`, empty and unknown values are replaced with `historical`; every valid scenario parameter is kept unchanged when `mode` is invalid; exactly one correction is returned and it names `mode` and its default `historical`.
    - Reducers are not touched here (mode state is task 5.8).
    - **Property 19: App state URL round-trip**
    - **Validates: Requirements 22.13**
    - Prerequisites: 4.3, 2.6, 4.6.
    - _Requirements: 22.13, 6.10, 18.9_
    - _Design: Key module interfaces (App mode), Scenario query parameters and state/URL synchronisation, Correctness Property 19_

- [ ] 5. Phase 1 - Shared scenario state and routing foundation
  - [ ] 5.1 Implement `ScenarioProvider` (Context and reducer)
    - In `src/state/`, implement the reducer with `setMagnitude`, `setDuration`, `setScope`, `reset`. Reset restores 25 / 7 / `both` and clears control errors. The reducer is pure and has no DOM or network access.
    - Prerequisites: 4.1, 1.3.
    - _Requirements: 1.3, 5.5, 5.7_
    - _Design: ScenarioProvider, Architecture (shared state)_

  - [ ] 5.2 Write reducer unit tests
    - Cover reset defaults, error clearing, rejected input retaining the last valid value, and that view switching never mutates scenario fields.
    - **Validates: Requirements 1.3, 5.7, 6.5**
    - Prerequisites: 5.1.

  - [ ] 5.3 Implement the URL sync hook
    - Two-way bridge between the reducer and `useSearchParams`: decode and normalise on mount, write only when the normalised string differs, always with `replace: true` for scenario edits, `push` for View changes, ignore its own writes, re-parse on external location changes, and queue correction notices.
    - Prerequisites: 5.1, 4.3.
    - _Requirements: 1.4, 1.5, 6.10_
    - _Design: Scenario query parameters and state/URL synchronisation (loop prevention)_

  - [ ] 5.4 Write URL sync unit tests
    - Assert normalisation idempotence, no extra history entry per scenario edit, correct handling of back/forward and manual URL edits, correction notice for each bad parameter, and no write loops.
    - **Validates: Requirements 1.4, 1.5, 6.10**
    - Prerequisites: 5.3.

  - [ ] 5.5 Build the router and AppShell skeleton
    - Create `createBrowserRouter` routes for four Views with placeholder content, a catch-all that renders the Overview with a not-found notice naming the path and keeping valid params, `NavigationBar` (links built from the current Active_Scenario, `aria-current="page"`), `SkipLink`, `Header` with Analysis_Date and Reference_Statement, `Footer` with dataset version, Build_Date and licence roll-up (or "Dataset version unavailable"), and one polite `LiveRegion` announcing View changes. One `h1`, and one header, nav, main and footer per View.
    - Wire `DatasetProvider` and `ScenarioProvider` above the router outlet.
    - Prerequisites: 5.3, 2.5, 3.5.
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 12.7, 12.10, 12.11, 14.3, 14.5, 14.6, 14.8_
    - _Design: Component tree, Component responsibilities, Accessibility_

  - [ ] 5.6 Set up Playwright and axe, and scan the shell
    - Configure Playwright and a reusable axe helper that fails on any WCAG 2.2 A/AA violation. Add a spec asserting the shell on each placeholder View: landmarks once each, one `h1`, skip link first focusable, nav `aria-current`, and zero axe violations.
    - **Validates: Requirements 14.1, 14.5, 14.6, 18.6**
    - Prerequisites: 5.5.

  - [ ] 5.7 Early Cloudflare Pages deployment checkpoint
    - Connect the GitHub repository from 1.4 to Cloudflare Pages (primary host). Record in `docs/deployment.md` the build command (`npm run build`), output directory (`dist`), and Node version (set explicitly, for example through a `NODE_VERSION` variable or `.nvmrc`), and deploy the placeholder shell.
    - SPA behaviour is configured for Cloudflare Pages specifically: rely on the default Pages SPA fallback, which applies when the build output has no top-level `404.html`. The primary build output must contain no top-level `404.html`. Do not add a catch-all `_redirects` rule unless testing on the deployed site shows it is needed. If it is needed, use only the documented `/* /index.html 200` form and record the reason in `docs/deployment.md`.
    - On the deployed URL, verify for each of the four routes (the paths used by the router in 5.5): direct link loads, page refresh keeps the route, and an unknown path shows the Overview with the not-found notice naming the path. Verify that scenario query parameters (`m`, `d`, `c`) survive a refresh and that invalid values are corrected with a notice.
    - Deployment continues throughout development: every later checkpoint pushes and confirms the deployment still works.
    - Acceptance: the deployed URL passes all checks above and `docs/deployment.md` records the settings and results with the date.
    - Prerequisites: 5.5, 1.4.
    - _Requirements: 1.2, 1.4, 1.7, 16.2, 16.3_
    - _Design: Static Deployment and Routing_

  - [ ] 5.8 Implement `ModeProvider` and the pure mode reducer with unit tests
    - In `src/state/`, implement `AppMode` state (default `'historical'`) with one action, `setMode`. Scenario actions, `reset` and View changes never change it. The reducer is pure. Mounting and URL sync are done in 5.9.
    - Write reducer unit tests: default is `historical`; `setMode` changes only the mode; for any sequence of `setMagnitude`, `setDuration`, `setScope`, `reset` and View changes the mode is unchanged; a mode change leaves every Active_Scenario value unchanged.
    - **Validates: Requirements 22.1, 22.3**
    - Prerequisites: 2.6, 5.1.
    - _Requirements: 22.1, 22.3, 18.9_
    - _Design: Illustrative Demo Mode (structure), Component responsibilities (`ModeProvider`)_

  - [ ] 5.9 Implement mode URL sync, `ModeToggle` and `ModeBanner`
    - Mount `ModeProvider` and `DemoDatasetProvider` in the app above the router outlet, and make the URL sync hook carry `AppState` through the 4.20 codec: `mode` is read on load and on location changes, corrected with a notice and live-region announcement when invalid, written with `replace` (no history entry on a mode change), and carried in every `NavLink` and call-to-action from state. Add no browser storage.
    - Build `ModeToggle` (header `<button>`, visible text is its accessible name, labels per Requirement 22.4) and announce the matching Mode_Announcement through the existing live region. Build `ModeBanner` (inside `<header>`, `role="region"` with an `aria-label`, sticky, non-dismissible, dashed 2 px border, Demo_Banner_Text, and a "Return to Historical mode" button that sets Historical mode and moves focus to `ModeToggle`). The header shows the Demo_Reference_Statement in demo mode (through the shared `ReferenceStatement` component from 7.7).
    - Write unit tests: toggle name and keyboard operation, banner present on all four Views only in demo mode and absent in Historical mode, banner return control and focus, no history entry per mode change, Historical session makes zero requests to `/data/demo/`, and demo-load failure keeps demo mode with the named-file error.
    - Write one separate test per rule of Requirement 22.13 owned here: (a) `mode` is carried in every Navigation_Bar link; (b) `mode` is carried in every call-to-action; (c) no browser storage is read or written (local storage, session storage and cookies are spied and untouched); (d) an invalid `mode` is replaced with `historical`, keeping every valid parameter; (e) a notice naming `mode` and its default is displayed; (f) that notice is announced through the live region. Add a test that, in demo mode, the document title begins with "[Illustrative demo] " and that the title prefix is removed on return to Historical mode (Requirement 22.7).
    - Prerequisites: 5.3, 5.5, 5.8, 4.20, 2.9, 7.7.
    - _Requirements: 22.1, 22.3, 22.4, 22.5, 22.8, 22.12, 22.13, 22.16_
    - _Design: Component tree, Component responsibilities (`ModeToggle`, `ModeBanner`, URL sync hook), Accessibility (mode toggle and banner), Static Deployment and Routing (query parameters)_

- [ ] 6. Checkpoint - Phase 1 review
  - Run unit, property and schema tests and `npm run build`; start the app and click through the four placeholder Views, confirm the scenario survives navigation and the URL updates without extra history entries.
  - Review `docs/data-verification-log.md` for completeness.
  - Commit and push the milestone, then confirm the Cloudflare Pages deployment still works on all four routes.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Phase 2 - View-model layer, ranking and shared display components
  - [ ] 7.1 Implement formatters and Observation_Age
    - In `src/domain/`, implement `formatQuantity`, `formatReferencePeriod`, `formatObservationAge` ("reference period ended N years and M months before the analysis date"), `formatClassLabel`, and `computeObservationAge` with a stale flag that is true only when age in months strictly exceeds `STALE_THRESHOLD_MONTHS`.
    - Prerequisites: 1.3.
    - _Requirements: 12.1, 12.8, 12.9_
    - _Design: Cross-view consistency and content rules_

  - [ ] 7.2 Write property test for Observation_Age and staleness
    - **Property 16: Observation age and staleness**
    - Place in `tests/properties/p16-observation-age.test.ts`; at least 100 runs.
    - **Validates: Requirements 12.8, 12.9**
    - Prerequisites: 7.1, 4.6.

  - [ ] 7.3 Implement exposure ranking and qualitative filtering
    - In `src/domain/ranking.ts`, sort exposure results by descending index then ascending `economyName`, cap at 5, never add entries, and keep Qualitative_Dependencies out of every ranked or chart model.
    - Prerequisites: 4.7.
    - _Requirements: 8.2, 8.3, 11.3, 11.4_
    - _Design: Correctness Properties 14 and 15_

  - [ ] 7.4 Write property test for ranking order and truncation
    - **Property 14: Exposure ranking order and truncation**
    - Place in `tests/properties/p14-ranking.test.ts`; at least 100 runs.
    - **Validates: Requirements 8.2, 11.3**
    - Prerequisites: 7.3, 4.6.

  - [ ] 7.5 Write property test for qualitative dependency numeric exclusion
    - **Property 15: Qualitative dependency numeric exclusion**
    - Place in `tests/properties/p15-qualitative-exclusion.test.ts`; at least 100 runs.
    - **Validates: Requirements 8.3, 9.7**
    - Prerequisites: 7.3, 4.6.

  - [ ] 7.6 Implement `selectViewModel`
    - In `src/domain/viewModel.ts`, derive from dataset, Active_Scenario and Analysis_Date every displayed source title, reference period, Observation_Age, unit, Period_Day_Count, Class_Label, assumption, and Evidence_Panel reference, keyed by `commodityId` with no combined entry. Run `calculate` and pass through its result. All Views read from this module.
    - Complete and test the Historical branch first. Then make the selector mode-aware: `selectViewModel({ mode, dataset, demo, scenario, analysisDate })` returns a discriminated union. The demo branch maps `DemoFlow` to `FlowInput` and `DemoDependencyShare` to `DependencyShareInput` through the fixed table `{ 'demo-oil': 'oil', 'demo-lng': 'lng' }`, calls the unchanged `calculate()` with no mode indicator, types its labels as `'Illustrative' | 'Hypothetical' | 'Calculated'` and the Historical labels as `ClassLabel`, adds the Demo_Marker to every Hypothetical and Calculated figure, supplies Demo_No_Source_Text, the Demo_Title_Prefix for chart titles and data-table captions, and the "Illustrative demo." announcement prefix (at most 150 characters), and yields `demoStatus` `'loading' | 'error'` with "Demo data unavailable" figures when the demo data is not ready. The demo branch never reads a Curated baseline or share.
    - Write unit tests for the demo branch, one separate test per rule of Requirements 22.6 and 22.7 (each independently failing): (a) every figure has exactly one label; (b) synthetic baseline flows and share inputs are "Illustrative"; (c) scenario parameters and the Period_Day_Count are "Hypothetical"; (d) Scenario_Engine outputs are "Calculated"; (e) the label "Historical" never appears; (f) the Demo_Marker is adjacent to every "Hypothetical" and "Calculated" figure; (g) Demo_No_Source_Text accompanies each synthetic input; (h) no Observation_Age; (i) no Older_Period_Notice; (j) no Source_Record title; (k) chart titles and data-table captions begin with the Demo_Title_Prefix; (l) each result announcement begins with "Illustrative demo." and is at most 150 characters including the prefix. Also assert engine output identical to calling `calculate()` directly.
    - Write the Property 18 test in `tests/properties/p18-historical-no-synthetic.test.ts` (at least 100 runs, tagged `// Feature: ripple-hormuz-intelligence-terminal, Property 18`), using `tests/generators.demo.ts` from 2.6.
    - **Property 18: Historical mode never displays a synthetic value**
    - **Validates: Requirements 22.2**
    - Prerequisites: 7.1, 7.3, 2.5, 4.7, 2.6.
    - _Requirements: 7.10, 12.1, 12.12, 22.2, 22.6, 22.7, 22.9, 22.12_
    - _Design: Cross-view consistency and content rules (single derived view-model layer, demo labelling table), Illustrative Demo Mode (structure), Correctness Property 18_

  - [ ] 7.7 Build shared display components
    - Create `ClassLabel`, `ExposureDisclaimer` (the only way an index value is rendered), `ReferenceStatement`, `ObservationAgeNote` (with Older_Period_Notice, no accuracy wording), `SourceUnavailable`, and `LicenceAttribution`.
    - Add the `Illustrative` variant to `ClassLabel` (rendered only from demo view-model labels), a separate `DemoMarker` component (not a Class_Label), and make `ReferenceStatement` mode-aware (Demo_Reference_Statement in demo mode).
    - Acceptance: a figure cannot be rendered without exactly one Class_Label; an index cannot render without the disclaimer; `Illustrative` cannot be passed from a Historical view-model.
    - Prerequisites: 7.1, 1.3, 2.6.
    - _Requirements: 4.9, 4.10, 12.1, 12.5, 12.8, 12.9, 22.6, 22.8_
    - _Design: Cross-view consistency and content rules_

  - [ ] 7.8 Write the copy lint test
    - Scan UI strings and rendered text of all four Views for forbidden terms ("loss", "shortfall", "at risk of losing", predictive "impact") and for currency or price figures; fail with the offending string. Allow-list dataset-sourced titles by id.
    - Render each View in both modes. In demo mode also assert the Demo_Banner_Text is present on all four Views. For the Overview, Scenario Lab, Evidence_Panel and Brief rendered in demo mode, assert as separate cases (Requirement 22.6): the label "Historical" is absent; no Observation_Age text; no Older_Period_Notice; no Source_Record title; every "Hypothetical" and "Calculated" figure has an adjacent Demo_Marker; every synthetic input has Demo_No_Source_Text; each figure has exactly one label of the permitted set.
    - **Validates: Requirements 12.4, 12.6, 22.5, 22.6, 22.16**
    - Prerequisites: 8.1, 9.4, 11.5, 12.1, 5.9.

- [ ] 8. Phase 2 - Overview View
  - [ ] 8.1 Implement `OverviewView`
    - Show RIPPLE name, tagline, MVP-scope statement, Reference_Statement, per-commodity Baseline_Transit_Flow (value, own unit and time basis, "Historical" label, Source_Record title, reference period, Observation_Age and Older_Period_Notice where stale), 25-words-or-fewer definitions of the three Class_Labels visible without interaction, the static-data statement, and call-to-action links to Explore and Scenario Lab that keep the scenario.
    - Missing items render a text "unavailable" indicator and never a number without its label and source title. In Historical mode this stays "Source unavailable" and never shows a demo value.
    - After the Historical path is complete: add the demo branch (reads the demo view-model): "Illustrative" baselines with Demo_No_Source_Text, no Observation_Age, Older_Period_Notice or source title, the Demo_Reference_Statement, and a definition of the Illustrative_Label of 25 words or fewer added to the class definitions.
    - Prerequisites: 7.6, 7.7, 5.5, 3.3, 5.8, 2.9.
    - _Requirements: 2.1 to 2.6, 12.8, 12.9, 22.2, 22.6, 22.8_
    - _Design: OverviewView, Error Handling_

  - [ ] 8.2 Write Overview tests
    - Unit tests: all fields shown with fixture data; unavailable states; definitions word limit; CTA navigation keeps scenario. Add an axe scan of the Overview. Add demo-branch cases: labels, no Historical label, definition of 25 words or fewer, and Historical mode unchanged.
    - **Validates: Requirements 2.1 to 2.6, 14.1, 22.6, 22.8**
    - Prerequisites: 8.1, 5.6.

- [ ] 9. Phase 2 - Scenario Lab, controls and charts
  - [ ] 9.1 Implement `ScenarioControls`
    - Magnitude and duration text inputs with the exact labels, scope radio group (oil, LNG, both), reset button, "Hypothetical" label beside each control, and the always-visible hypothetical-reduction statement.
    - Invalid input keeps the rejected text visible, retains the last valid value, shows the exact error message, sets `aria-invalid` and `aria-describedby`, announces via the live region, and clears all three on the next valid entry.
    - Prerequisites: 5.5, 5.1, 4.1.
    - _Requirements: 5.1 to 5.8, 6.5 to 6.9, 14.7, 14.12_
    - _Design: ScenarioControls, Error Handling (control rejection)_

  - [ ] 9.2 Write control tests
    - Run the shared table from `tests/validation.cases.ts` against the controls, and test the aria wiring, announcement, recovery, reset and labels.
    - **Validates: Requirements 5.4, 6.5 to 6.9, 18.4**
    - Prerequisites: 9.1, 4.5.

  - [ ] 9.3 Build SVG chart components with data tables
    - Hand-rolled `FlowChart` (baseline daily versus reduced daily flow) and `ExposureChart` (ranked, at most 5, no padding). Each has axis labels with quantity and unit, a Class_Label, a non-colour cue (pattern, shape or text label) and an always-present parallel data table. Exposure charts show the disclaimer. A commodity with no Quantified_Economy shows the "no verified country-level data" message and no empty axes. Chart titles and table captions are supplied as text by the view-model, so the demo prefix is applied by 7.6 and needs no mode logic here.
    - Prerequisites: 7.7.
    - _Requirements: 8.1, 8.2, 8.4, 8.6, 8.7, 8.8, 14.10, 22.7_
    - _Design: Architecture (charts), CommodityResultPanel_

  - [ ] 9.4 Implement `CommodityResultPanel` and `ScenarioLabView`
    - One panel per commodity in scope, each showing formulas, every input with Class_Label, unit and source, Period_Day_Count as "Hypothetical" (365 or 366 stated), Baseline_Daily_Flow as "Calculated", daily and cumulative reduced flow as "Calculated", `not calculable` messages naming missing inputs, charts from 9.3, and no combined oil and LNG value.
    - Announce a result summary of at most 150 characters per recalculation, each commodity separately in its own unit.
    - After the Historical path is complete: add the demo branch. Inputs show "Illustrative" with Demo_No_Source_Text, the Period_Day_Count and scenario parameters show "Hypothetical" with the Demo_Marker, outputs show "Calculated" with the Demo_Marker, and each result announcement starts with "Illustrative demo." and stays within 150 characters including the prefix. A demo-load failure shows "Demo data unavailable" in place of each demo figure and never a Curated value.
    - Prerequisites: 9.1, 9.3, 7.6, 5.8, 2.9.
    - _Requirements: 5.5, 7.1, 7.6, 7.10, 8.1, 8.2, 8.5, 14.9, 22.6, 22.7, 22.12_
    - _Design: CommodityResultPanel, ScenarioLabView_

  - [ ] 9.5 Write Scenario Lab tests
    - Using synthetic fixtures: formulas and labels shown, chart data tables match engine output, no merged commodity text or series, no-economy message, not-calculable state, summary length at most 150 characters, charts update on scenario change. Add demo-branch cases: demo title prefix, labels and markers, announcement prefix and length, and the "Demo data unavailable" state.
    - **Validates: Requirements 7.6, 7.10, 8.1 to 8.8, 14.9, 22.6, 22.7, 22.12**
    - Prerequisites: 9.4.

- [ ] 10. Phase 2 - Evidence Panel
  - [ ] 10.1 Implement `EvidencePanel` and focus context
    - Open and close controls in Explore, Scenario Lab and Brief. Focused-item mode shows Source_Records (publisher, title, publication date, reference period, units, licence and attribution, Verification_Status, link opening in a new tab), assumptions, reference periods with Observation_Age, and limitations. Empty categories show an explicit "none recorded" statement. General mode shows the full limitations list (all items of Requirement 10.8, including no rerouting, stock drawdown or bypass assumption) and all Source_Records. Missing publication date or period shows "not available". Closing returns focus to the opener, or the View `h1`.
    - After the Historical path is complete: add the demo branch for a Demo_Dataset item (from the demo view-model): the Demo_Data_Notice, Demo_No_Source_Text in place of Source_Records, the item's fictional assumptions, the Requirement 10.8 limitations plus "synthetic data" and "fictional economies", and no Verification_Status, licence, attribution, source link or Observation_Age. A map feature in focus keeps the Curated behaviour.
    - Prerequisites: 5.5, 7.6, 7.7.
    - _Requirements: 4.9, 7.14, 10.1 to 10.9, 22.14_
    - _Design: EvidencePanel, Accessibility (focus management)_

  - [ ] 10.2 Write Evidence Panel tests
    - Cover both modes, empty-category statements, missing-field labels, link target and unchanged scenario, limitation list contents, focus return including opener removed, and an axe scan with the panel open. Add the demo-item cases (what is shown and what is absent).
    - **Validates: Requirements 10.1 to 10.9, 14.1, 22.14**
    - Prerequisites: 10.1, 5.6.

  - [ ] 10.3 Connect the Evidence Panel to Scenario Lab outputs
    - Make each Calculated_Outcome and chart focusable so that focusing it sets the Evidence_Panel item, including the zero-rerouting limitation.
    - Prerequisites: 9.4, 10.1.
    - _Requirements: 7.14, 10.2_
    - _Design: Component responsibilities (EvidencePanel)_

- [ ] 11. Phase 2 - Explore View, map and basemap verification
  - [ ] 11.1 Extend the schema and validator for map features
    - Add a `MapFeature` schema (id, name, feature type, layer, GeoJSON geometry, optional figures with Class_Label, `sourceRecordIds` that may be empty, `illustrative` flag required for shipping lanes) and a `public/data/map-features.json` loader entry. Extend the validator for referential checks. Update schema tests to cover the new record type.
    - Prerequisites: 2.2, 2.4.
    - _Requirements: 3.3, 3.5, 3.6, 4.3, 17.1_
    - _Design: Dataset file layout, Build-time validation pipeline_

  - [ ] 11.2 Verify and enter map feature data (mandatory, developer-verified)
    - Developer creates geometry for the four layers (corridor, coastlines and states, export terminals, illustrative shipping lanes) from sources whose licences permit redistribution (each source individually verified, dated and checked for reuse permissions; nothing is entered from memory), recording the source and licence for each in `public/data/source-records.json` and `docs/data-verification-log.md`.
    - Terminal names and locations are entered only after verification against the cited source. Shipping lanes are flagged illustrative. Features without a verified source are allowed and show "No Source_Records available".
    - Acceptance: validation passes; no live vessel data is present.
    - Prerequisites: 11.1, 3.4.
    - _Requirements: 3.3, 3.5, 3.6, 3.7, 4.2, 4.9_
    - _Design: MapComponent, Error Handling (map feature without Source_Record)_

  - [ ] 11.3 Select and verify the basemap provider (mandatory)
    - MapTiler Cloud, with a suitable dark map style, is the preferred candidate. It is not approved until the developer has verified and recorded in `docs/map-provider.md` (using the completion checklist): free-tier conditions, required attribution, API-key restrictions (domain or HTTP referrer restriction, and the fact that a key in a static client is public), usage limits, and suitability for a public non-commercial hackathon demo. If any check fails, evaluate other providers against the six criteria in the design.
    - Record the choice, style URL, date the terms were read and the clause quoted or linked. Create `src/config/basemap.ts` (style URL, attribution, timeout) so the provider stays configurable. The API key comes from a build-time environment variable and is restricted to the deployed Cloudflare Pages origin and local development origin.
    - No public demonstration tile server is assumed to permit production use.
    - Acceptance: every checklist item except the deployed-origin check and blocked-tiles test is ticked (those two are ticked in 13.3 and 20.2).
    - Prerequisites: 1.1.
    - _Requirements: 3.1, 3.9, 16.3_
    - _Design: Basemap provider selection and map completion gate_

  - [ ] 11.4 Implement `MapComponent`
    - MapLibre map with an initial view containing the corridor, zoom limited to 5 to 12, mouse, touch and keyboard pan and zoom, four layer toggles, feature selection, and the "Illustrative route, not live vessel position" label while lanes are visible. Single Tab stop with Tab or Escape exit. Tile error or missing WebGL shows a notice naming which failed, keeps layers on a plain background when WebGL exists, and keeps the text alternative visible. Loads only bundled geometry and the basemap.
    - Prerequisites: 11.3, 11.1.
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.9, 14.11_
    - _Design: MapComponent, Accessibility (map keyboard)_

  - [ ] 11.5 Implement `ExploreView`, `FeatureDetailCard` and `MapTextAlternative`
    - Detail card shows name, type and Class_Label for each figure; selection updates the Evidence_Panel. `MapTextAlternative` always lists every feature name and type for assistive technology and is visible when the map cannot render.
    - Prerequisites: 11.4, 11.2, 10.1.
    - _Requirements: 3.4, 3.5, 3.8, 14.10_
    - _Design: FeatureDetailCard, MapTextAlternative_

  - [ ] 11.6 Write Explore unit tests
    - Layer toggle state, feature selection and detail card, evidence update, no-source notice, label visibility, WebGL-unavailable and tile-failure fallbacks using fixtures and mocks.
    - **Validates: Requirements 3.3 to 3.9**
    - Prerequisites: 11.5.

- [ ] 12. Phase 2 - Intelligence Brief
  - [ ] 12.1 Implement `IntelligenceBriefView`
    - Read-only structured summary: every scenario parameter labelled "Hypothetical"; per-commodity daily and cumulative reduced flow labelled "Calculated" with no combined volume; ranked Quantified_Economies (at most 5, disclaimer shown); a section under the Qualitative_Label for all Qualitative_Dependencies with no numeric value; a no-data notice per commodity without economies; Baseline_Transit_Flow details including Period_Day_Count and Baseline_Daily_Flow; all Source_Records, assumptions, limitations and the Reference_Statement with nothing truncated; Analysis_Date, Build_Date and dataset version. Neutral language only. Includes the Evidence_Panel open control.
    - After the Historical path is complete: add the demo branch. It begins with the Demo_Brief_Header, ends with the Demo_Brief_Footer, shows the demo labelling, replaces the Qualitative section with "No qualitative dependencies are defined in the demo data.", and keeps the zero-economy notice. Print and copy-link (Phase 4) carry the header, footer and `mode=demo`.
    - Prerequisites: 7.6, 7.3, 10.1, 7.7.
    - _Requirements: 11.1 to 11.9, 10.1, 12.5, 22.6, 22.15_
    - _Design: IntelligenceBriefView_

  - [ ] 12.2 Write Intelligence Brief tests
    - Check each section against fixtures, including zero-economy, qualitative-only and not-calculable cases, no combined volume, no truncation, and no prediction wording. Add the demo-branch cases (header, footer, labelling, qualitative statement).
    - **Validates: Requirements 11.1 to 11.9, 22.15**
    - Prerequisites: 12.1.

- [ ] 13. Phase 2 - End-to-end journey and accessibility gates
  - [ ] 13.1 Write the end-to-end user journey tests
    - Overview, then Explore (toggle layer, select feature, open Evidence_Panel), Scenario Lab (set a non-default scenario), Intelligence Brief. Assert every Active_Scenario field equals the value set on every View, and repeat the journey keyboard-only (Tab order, map focus entry and exit, skip link).
    - **Validates: Requirements 1.3, 18.7, 14.3, 14.11**
    - Prerequisites: 8.1, 9.4, 10.3, 11.5, 12.1, 5.6.

  - [ ] 13.2 Write per-View axe scans for the complete MVP
    - Scan all four Views plus the Evidence_Panel open and the focused map; any A/AA violation fails the run.
    - **Validates: Requirements 14.1, 18.6**
    - Prerequisites: 8.1, 9.4, 10.3, 11.5, 12.1, 5.6.

  - [ ] 13.3 Write the map failure end-to-end test
    - Run with WebGL disabled and with tiles blocked; assert the notice names the right failure, the text alternative is visible and the rest of the app works. Tick the blocked-tiles item in `docs/map-provider.md`.
    - **Validates: Requirements 3.8, 3.9**
    - Prerequisites: 11.5, 5.6.

  - [ ] 13.4 Write the demo-mode end-to-end and axe tests
    - In `tests/e2e/demo-mode.spec.ts` (small): toggle into demo mode by keyboard and back through the banner return control (focus lands on the toggle), banner visible on all four Views, `?mode=demo` reload, scenario and View preserved across the toggle, invalid `mode` notice, an axe scan of each View in demo mode (zero A/AA violations), and zero requests to `/data/demo/` during a full Historical journey.
    - **Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5, 22.13, 14.1, 18.6, 18.9**
    - Prerequisites: 8.1, 9.4, 10.3, 11.5, 12.1, 5.9, 5.6.
    - _Requirements: 22.1 to 22.5, 22.13, 22.16_
    - _Design: Testing Strategy (end-to-end), Accessibility (mode toggle and banner)_

- [ ] 14. Checkpoint - Phase 2 MVP review
  - Run the full test suite (unit, property, e2e, axe) and `npm run build`; run the app and walk the five-step user journey by hand.
  - Review that the four-View journey is complete before Phase 3 work is started (Requirement 20.7). This is a review hold point, and the Phase 3 tasks follow it in the waves.
  - Toggle between the modes by hand and confirm Historical mode shows "Source unavailable" where data is missing (never a demo value), and demo mode shows the banner on all four Views with the Explore map unchanged.
  - Commit and push the milestone, then confirm the Cloudflare Pages deployment still works (routes, refresh, scenario parameters, map and dataset loading).
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Phase 3 - Dependency graph
  - [ ] 15.1 Verify and enter graph nodes and edges (mandatory, developer-verified)
    - Developer enters nodes (maritime transport, commodity, industry, economy) and edges into `public/data/graph-nodes.json` and `graph-edges.json`. Documented dependencies come from sources individually verified, dated and checked for reuse permissions (IEA and UNCTAD are supplementary candidates alongside US EIA). Every edge needs a verified Source_Record and a relationship description that is a documented dependency; causal or probability wording is entered only if the cited source states it. Every Qualitative_Dependency from 3.4 gets a node and a sourced edge.
    - If a dependency has no verified source it is omitted. Acceptance: validation passes.
    - Prerequisites: 3.4, 11.2.
    - _Requirements: 9.1, 9.2, 9.3, 9.7, 9.10, 12.3_
    - _Design: Data Models (graph schema), Build-time validation pipeline_

  - [ ] 15.2 Build the Dependency_Graph components
    - Fixed-layout SVG renderer and the parallel text list with identical selection behaviour. Selecting a node highlights one-hop edges and neighbours; selecting an edge shows its relationship and sources in the Evidence_Panel. Arrow-key and Tab movement, Enter or Space to select, visible focus ring. Quantified economy nodes show the Scenario_Exposure_Index per commodity with "Calculated" and the disclaimer; other economy nodes show the Qualitative_Label and description with no number.
    - Prerequisites: 7.6, 10.1, 7.7.
    - _Requirements: 9.1, 9.4 to 9.10, 14.7, 14.10_
    - _Design: DependencyGraphSection, Accessibility (keyboard graph)_

  - [ ] 15.3 Integrate the graph into the Scenario Lab
    - Add `DependencyGraphSection` to `ScenarioLabView`, driven by the Active_Scenario and engine result, with Evidence_Panel focus wiring.
    - Prerequisites: 15.1, 15.2, 10.3.
    - _Requirements: 9.4, 9.5, 9.6_
    - _Design: Component tree (ScenarioLabView)_

  - [ ] 15.4 Write graph tests
    - Unit tests for one-hop highlighting, qualitative nodes without numbers, exposure update on scenario change, list and graph selection parity; Playwright keyboard test and axe scan of the focused graph.
    - **Validates: Requirements 9.4 to 9.10, 14.1**
    - Prerequisites: 15.3, 5.6.

- [ ] 16. Phase 3 - Visual design, responsive layout and accessibility audit
  - [ ] 16.1 Implement the dark terminal theme
    - CSS tokens: background at or below 0.05 relative luminance, amber and cyan as the only accents, 16 px or larger body text with 1.4 or more line height, 2 px or thicker focus ring at 3:1 contrast, a single `prefers-reduced-motion` gate for non-essential animation. Original identity (no Bloomberg or film branding).
    - Prerequisites: 13.1, 13.2.
    - _Requirements: 13.1 to 13.5, 14.2, 14.4_
    - _Design: Accessibility (color, contrast, motion)_

  - [ ] 16.2 Implement the responsive layout
    - Single column below 768 px with the Evidence_Panel as a dismissible drawer closed by default; side panel without overlap at 768 px and above; at least 44 by 44 px targets for coarse pointers; no horizontal scrollbar from 320 to 2560 px.
    - Prerequisites: 16.1.
    - _Requirements: 15.1 to 15.4_
    - _Design: Component tree (EvidencePanel drawer vs side panel)_

  - [ ] 16.3 Write responsive tests
    - Playwright at 320, 768 and 2560 px: no horizontal scroll, drawer default state, panel placement, and target sizes with a coarse-pointer emulation.
    - **Validates: Requirements 15.1 to 15.4**
    - Prerequisites: 16.2.

  - [ ] 16.4 Run the contrast and focus audit
    - Add automated checks of text and component contrast in each state and of focus visibility; run a manual keyboard and screen reader pass on every View and record the result in `docs/accessibility-check.md`. Fix findings.
    - **Validates: Requirements 14.1, 14.2, 14.4, 14.5**
    - Prerequisites: 16.2.

- [ ] 17. Phase 3 - Deployment readiness, performance, documentation and repository
  - [ ] 17.1 Harden the already-running static deployment
    - The Cloudflare Pages deployment from 5.7 already exists. Re-verify it with the full application: the primary build output has no top-level `404.html`, there is no `_redirects` catch-all unless 5.7 recorded the reason for one, a single base-path constant (`/` for Cloudflare Pages) is shared by Vite `base`, React Router `basename` and dataset fetch URLs, and the Cloudflare Pages Node version and build settings in `docs/deployment.md` are current.
    - Confirm `prebuild` validation blocks a bad dataset, and that deep links, refresh, unknown routes and scenario parameters, dataset files and map tiles work on the deployed site.
    - Optional secondary configuration (not part of the primary deployment output): document in `docs/deployment.md` a GitHub Pages variant that uses a `/<repo>/` base path and a post-build copy of `index.html` to `404.html`, enabled only by a separate build script such as `build:ghpages`. The default `npm run build` never produces `404.html`.
    - Prerequisites: 5.7, 13.1.
    - _Requirements: 1.2, 1.7, 16.2, 16.3_
    - _Design: Static Deployment and Routing_

  - [ ] 17.2 Add performance measurement scripts
    - Scripts for: view navigation time; engine recalculation at the 95th percentile over 100 consecutive changes; Overview display time on 4x CPU throttling with a 9 Mbps, 170 ms round-trip profile and empty cache. Output includes method, environment and date.
    - Prerequisites: 17.1, 16.2.
    - _Requirements: 16.4, 16.5_
    - _Design: Technical Trade-offs and Risks (performance targets)_

  - [ ] 17.3 Run and record performance measurements (developer)
    - Run the scripts and write results, method, environment and date to `docs/performance.md`, including targets that are missed. No performance claim is made anywhere until this is recorded.
    - Prerequisites: 17.2.
    - _Requirements: 16.4, 16.5, 16.6_
    - _Design: Technical Trade-offs and Risks_

  - [ ] 17.4 Final data and licence audit (mandatory, developer)
    - Developer re-checks every figure in `public/data/` (outside `demo/`) against its cited source and licence, confirms each Source_Record's attribution text is displayed in the UI, and confirms no figure lacks a Class_Label or source. Confirm that no `synthetic` key exists in any file outside `public/data/demo/` and that `public/data/demo/demo-dataset.json` holds no third-party figure (the 2.7 checks pass). Confirm that no EIA transit aggregate value appears anywhere in `public/data/` (link-only decision of 3.1). Record the sign-off date in `docs/data-verification-log.md`.
    - Acceptance includes: the demo dataset is present and valid in the production build (`dist/data/demo/demo-dataset.json` exists and passes D1, D2, D3 and D5). Because the demo file ships in production, absence is a failure at this stage: if the validator has no option that fails on a missing demo file, add a small one (for example a strict flag enabled for the production build and CI) and a unit test for it, since the tolerance in 2.7 applies only until 2.8.
    - Prerequisites: 15.1, 11.2, 3.4, 2.7, 2.8.
    - _Requirements: 4.1 to 4.9, 12.1, 12.3, 22.10, 22.11_
    - _Design: Meaning of "verified"_

  - [ ] 17.5 Write the README
    - Headings for: description of RIPPLE, Frankenstein theme connection, how Kiro was used (specs, steering, hooks), setup instructions that run without undocumented steps, the licence (MIT), and the data source list. Include dataset version, each source's reference period and licence, the Reference_Statement, all limitations from Requirement 10.8, basemap attribution, and measured performance only as recorded in `docs/performance.md`.
    - Add a judging note, after the Historical description: Historical mode is the default, Illustrative demo mode uses synthetic and fictional data only, and it opens with `?mode=demo` or the header toggle.
    - Prerequisites: 17.3, 17.4, 11.3, 17.1, 5.9.
    - _Requirements: 19.3, 19.5, 19.6, 19.7, 19.8, 16.6_
    - _Design: Static Deployment and Routing_

  - [ ] 17.6 Repository audit, CI and polish
    - The repository was created and pushed in 1.4. Audit that `.kiro` (with non-empty `requirements.md`, `design.md`, `tasks.md`), `README.md` and the MIT `LICENSE` are committed and not ignored, and that the repository is public.
    - Add a CI workflow running validation, unit, property, e2e and axe tests with a non-zero exit on failure; tidy repository metadata (description, topics, link to the demo URL).
    - Prerequisites: 17.5, 1.4.
    - _Requirements: 18.8, 19.1, 19.2, 19.4_
    - _Design: Testing Strategy (CI gating)_

- [ ] 18. Checkpoint - Phase 3 review
  - Run the full CI suite and a production build on a static preview; verify deep links, the graph, the responsive layouts, the README checklist and `docs/performance.md`.
  - Commit and push the milestone, then confirm the Cloudflare Pages deployment still works.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Phase 4 - Stretch enhancements (optional; start only after Phases 1 to 3 are complete)
  - [ ]* 19.1 Advanced graph search
    - Case-insensitive substring node search, select on confirmation, "no matching node" message that keeps the current selection.
    - _Requirements: 21.1_
    - Prerequisites: 15.4.

  - [ ]* 19.2 Print layout for the Intelligence Brief
    - Print stylesheet containing all content of Requirement 11.1 to 11.8 with Class_Labels retained. In demo mode the print output carries the Demo_Brief_Header and Demo_Brief_Footer.
    - _Requirements: 21.2, 22.15_
    - Prerequisites: 12.2.

  - [ ]* 19.3 Copy-link control
    - Copy a URL restoring the Active_Scenario (and `mode=demo` in demo mode); on failure show the full URL as selectable text with a notice.
    - _Requirements: 21.3, 22.15_
    - Prerequisites: 19.2.

  - [ ]* 19.4 Escape and outside-tap closing for the drawer
    - Close the Evidence_Panel drawer on Escape or outside tap and return focus to the opener.
    - _Requirements: 21.4_
    - Prerequisites: 16.3.

  - [ ]* 19.5 Extended charts
    - Raise the exposure chart limit from 5 to 10 economies behind a single constant, keeping the no-padding rule.
    - _Requirements: 21.6_
    - Prerequisites: 9.5.

- [ ] 20. Kiroween submission
  - [ ] 20.1 Write the submission checklist
    - Create `docs/submission-checklist.md` listing each submission item with a done box and evidence link: public repository, `.kiro` committed, MIT licence, README headings, working demo URL, demo video script, data verification sign-off, accessibility check, performance record, and basemap checklist complete.
    - Prerequisites: 17.6, 18 checkpoint complete.
    - _Requirements: 19.1 to 19.7, 20.7_
    - _Design: Static Deployment and Routing_

  - [ ] 20.2 Prepare the public demo
    - The Cloudflare Pages deployment from 5.7 is already running. Developer confirms the latest commit is deployed, opens the public URL in a clean browser profile, verifies direct links, refresh, dataset loading, tile loading, API-key origin restriction and attribution from the deployed origin, ticks the deployed-origin item in `docs/map-provider.md`, adds the URL to the README, and writes `docs/demo-script.md` for the five-step journey.
    - Prerequisites: 20.1, 17.1.
    - _Requirements: 16.2, 16.3, 19.3_
    - _Design: Static Deployment and Routing, Basemap provider selection and map completion gate_

- [ ] 21. Final checkpoint - Ensure all tests pass
  - Confirm `docs/submission-checklist.md` is fully ticked, commit and push, and confirm the Cloudflare Pages demo URL works before submitting.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped without affecting the MVP; only Phase 4 items are marked optional.
- Property tests for Properties 1 to 20 are mandatory (never marked optional), each in its own file, with at least 100 runs and a `// Feature: ripple-hormuz-intelligence-terminal, Property N` comment. Properties 1 to 17 are separate sub-tasks. To keep the plan lean, Properties 18, 19 and 20 are written inside the tasks that build their subject: 18 in 7.6 (view-model), 19 in 4.20 (mode codec), 20 in 2.7 (separation checks).
- Requirement 22 (Illustrative Demo Mode): foundations 2.6 to 2.9, 4.20 and 5.8 may run in the Phase 1 waves, and the demo UI (5.9 and the demo branches in 7.6, 7.7, 8.1, 9.4, 10.1, 12.1) follows the Historical four-View journey. Demo labelling and mode preservation are covered by the view-model, copy-lint and mode-reducer unit tests (7.6, 7.8, 5.8) rather than separate property tasks. Explore has no demo branch. The Scenario_Engine is unchanged.
- Synthetic data lives only in `tests/` fixtures or the single `public/data/demo/demo-dataset.json`; the demo file ships in the production deployment; the mode is held only in the URL (`mode=demo`) with no saved preference.
- Data tasks (3.2 to 3.4, 11.2, 15.1, 17.4) require the developer to check values against the cited publication. The outcome may be qualitative-only records or nothing; that is a valid and complete result.
- User decisions recorded: MIT licence (1.2, 17.5), Cloudflare Pages as primary host (5.7, 17.1, 20.2), MapTiler Cloud as preferred but unapproved basemap candidate (11.3), US EIA "World Oil Transit Chokepoints" as primary source with IEA and UNCTAD supplementary (3.1 to 3.4).
- Decisions still open: whether MapTiler Cloud passes the verification in 11.3, and whether verified country shares exist (3.4).
- Dependency notes: 1.4 follows 1.2 and precedes the dataset work; 5.7 follows 5.5 and 1.4; 17.1 builds on 5.7; 17.6 builds on 1.4; 20.2 builds on 17.1.
- Main risks: no verified country-level shares (the app then shows qualitative dependencies only), a source licence blocking redistribution, basemap terms, and the solo-developer schedule (the Phase 3 graph and polish can slip without breaking the MVP).
- Each phase checkpoint is a review hold point where the app is run, tested and reviewed, not a dependency gate unless a task lists it as a prerequisite.
- Checkpoints 6 and 18 are listed in waves after some tasks of later phases; the dependency graph does not make those tasks wait for them, so they are review hold points, not dependency gates.
- Link-only data decision (Task 3.1): no EIA transit aggregate value is packaged in production data. Tasks 3.2 to 3.4 therefore enter citation and link records and unavailable or empty states only. The Source_Record schema adjustment needed for the EIA last-updated date is a pending approval in Task 3.2 (design, Data Models, "Last-updated dates").

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1", "3.1", "4.1", "4.6"] },
    { "id": 2, "tasks": ["1.4", "2.2", "2.5", "2.6", "3.5", "4.2", "4.3", "4.7"] },
    { "id": 3, "tasks": ["2.3", "2.4", "2.7", "3.2", "4.4", "4.5", "4.8", "4.9", "4.10", "4.11", "4.12", "4.13", "4.14", "4.15", "4.16", "4.17", "4.18", "4.19", "4.20", "5.1", "7.1", "7.3"] },
    { "id": 4, "tasks": ["2.8", "3.3", "5.2", "5.3", "5.8", "7.2", "7.4", "7.5", "7.7"] },
    { "id": 5, "tasks": ["2.9", "3.4", "5.4", "5.5", "7.6"] },
    { "id": 6, "tasks": ["5.6", "5.7", "5.9", "8.1", "9.1", "9.3", "10.1", "11.1", "11.3"] },
    { "id": 7, "tasks": ["6"] },
    { "id": 8, "tasks": ["8.2", "9.2", "9.4", "10.2", "11.2", "11.4", "12.1"] },
    { "id": 9, "tasks": ["9.5", "10.3", "11.5", "12.2"] },
    { "id": 10, "tasks": ["7.8", "11.6", "13.1", "13.2", "13.3", "13.4"] },
    { "id": 11, "tasks": ["14"] },
    { "id": 12, "tasks": ["15.1", "15.2", "16.1", "17.1"] },
    { "id": 13, "tasks": ["15.3", "16.2", "17.2", "17.4"] },
    { "id": 14, "tasks": ["15.4", "16.3", "16.4", "17.3"] },
    { "id": 15, "tasks": ["17.5"] },
    { "id": 16, "tasks": ["17.6", "19.1", "19.2", "19.4", "19.5"] },
    { "id": 17, "tasks": ["18"] },
    { "id": 18, "tasks": ["19.3", "20.1"] },
    { "id": 19, "tasks": ["20.2"] },
    { "id": 20, "tasks": ["21"] }
  ]
}
```
