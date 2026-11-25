# RIPPLE Data Sources: Source and Licence Review (Task 3.1)

Status: IN PROGRESS - EIA, IEA and UNCTAD review decisions recorded 2026-11-26; Vortexa clearance, dependency evidence, archives and final sign-off pending. Task 3.1 is not complete.

Acceptance scope (decided 2026-11-26): EIA only, plus any dependency sources added later. IEA and UNCTAD are documented but not intended for the MVP production dataset, so they fall outside "every source intended for the dataset".

This file holds the review entries for every source intended for the RIPPLE dataset. Figures below are developer-reported; they were checked against the live source by the developer on 2026-11-26. None has been entered into a production dataset (entry belongs to Tasks 3.2/3.3 after Task 2.2's validator exists).

## Legend

| Tag | Meaning |
|---|---|
| CONFIRMED | Developer checked against the live source. A check date must be recorded. |
| LEAD | Located by web search on "not yet checked", NOT VERIFIED. |
| PENDING | Not yet located or not yet decided. Blank field. |

"Verified" means a figure was checked against the cited material. The app does not guarantee accuracy. Figures describe the stated reference period, not current conditions (Reference_Statement).

All CONFIRMED entries below are: developer-reported; checked against the live source by the developer on 2026-11-26.

## Procedure (per source)

1. Open the source. Capture exact title, publisher and URL.
2. Record publication date and retrieval date.
3. Identify the reporting period and whether it is a calendar year or another period.
4. Copy each original value and unit exactly (no rounding, no unit conversion). Record the table, figure or page reference.
5. Read methodology and definition notes: what "petroleum liquids" includes, whether LNG is reported in volume or energy units, whether figures are averages.
6. Read the terms of use. Record licence name and URL, attribution text, conditions, third-party-material exclusions, and whether redistribution in a public static open-source (MIT) repository bundle is permitted.
7. Decide Include or Exclude. An excluded source is recorded as excluded and its figures become "unavailable" (never substituted).
8. Record verifier and date.
9. Save an archived copy reference (web.archive.org snapshot URL or local PDF filename). Do not commit the copy if the licence forbids it.

Oil and LNG stay in their own units. Period_Day_Count: for per-year figures record the calendar-year leap status (365/366). For non-calendar periods record the verified day count and its basis (source statement, table note or page reference). Treat date-range equality as day count only where the source explicitly confirms full daily coverage.

## Source 1: US EIA "World Oil Transit Chokepoints" (primary candidate)

Status: PROVISIONAL MVP HISTORICAL BASELINES (oil and LNG). Not entered into production datasets. Verification_Status would be "verified" only once the remaining items are resolved.

| Field | Value | Status | Evidence/notes |
|---|---|---|---|
| Exact publication title | World Oil Transit Chokepoints | CONFIRMED (2026-11-26) | Developer-reported |
| Publisher | U.S. Energy Information Administration (EIA) | CONFIRMED (2026-11-26) | Developer-reported |
| URL | https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints | CONFIRMED (2026-11-26) | Developer's URL. Differs in capitalisation from the earlier lead (`world_oil_transit_Chokepoints`); the developer's form is used. |
| Alternate URL (earlier lead) | https://www.eia.gov/international/content/analysis/special_topics/world_oil_transit_chokepoints/ | LEAD | Not checked; superseded by the URL above |
| Last-updated date / original publication date | Last updated 2026-03-03 (confirmed). Original publication date not established. | CONFIRMED (2026-11-26) | For the eventual Source_Record publication-date field, the "last updated" date must be labelled as such; field mapping decided in Task 3.2. |
| Retrieval date | 2026-11-26 | CONFIRMED | |
| Reference period start / end | 2025-01-01 to 2025-06-30 ("1H25") | CONFIRMED (2026-11-26) | |
| Calendar year? | No. Half-year (1H25) | CONFIRMED | 2025 is not a leap year |
| Period day count | 181 calendar days | CONFIRMED (2026-11-26) | 181 is the calendar length of 1H25 (2025-01-01 to 2025-06-30, non-leap year): 31+28+31+30+31+30 = 181. It is not independently established daily tracking coverage. |
| Time basis | Per day (average daily flow over 1H25) | CONFIRMED | periodDayCount not required for per-day observations under the schema |
| Full daily coverage | Not established. No date-range equality check applies to these figures. | CONFIRMED (2026-11-26) | Decision recorded by developer. Do not assert that all 181 days had complete observations. |
| Units (oil) | million barrels per day | CONFIRMED (2026-11-26) | |
| Units (LNG) | billion cubic feet per day | CONFIRMED (2026-11-26) | No conversion to oil units |
| Methodology | EIA analysis based on Vortexa tanker tracking data | CONFIRMED (2026-11-26) | See third-party risk under Source 2 |
| Licence | EIA Copyrights and Reuse policy (reuse and distribution permitted with requested attribution, per developer review) | CONFIRMED (2026-11-26) | See Source 2. Not described as "public domain". |
| Attribution requirement | Source attribution including date requested | CONFIRMED (2026-11-26) | Wording approved as draft 2026-11-26 (see Source 2), subject to unresolved Vortexa rights |
| Redistribution in static bundle permitted | PENDING | PENDING | Likely permitted for EIA's own figures; conditional on the Vortexa third-party question |
| Third-party material exclusions | Policy warns third-party protected material may need separate permission | CONFIRMED (2026-11-26) | Applicability to Table 3 unresolved |
| Verification_Status | PENDING | PENDING | |
| Verification date | 2026-11-26 (figures checked by developer) | CONFIRMED | Final status PENDING |
| Oil scope | Table 3 oil figure covers crude oil, condensate and petroleum products | CONFIRMED (2026-11-26) | Total oil flows (20.9 million barrels per day) is the provisional crude oil and petroleum liquids baseline; mapping confirmed by developer |
| Statement value checked against publication | Table 3 values below | CONFIRMED (2026-11-26) | Reference_Statement wording not recorded here |
| Archive reference | PENDING | PENDING | |
| Decision (Include/Exclude) | PROVISIONAL MVP baselines (oil total, LNG); components context only | CONFIRMED (2026-11-26) | Not entered in production dataset. Final status depends on the Vortexa clearance (PENDING). |

### Table 3, Strait of Hormuz, 1H25 (values exactly as printed)

| Printed line | Value as printed | Unit as printed | Status |
|---|---|---|---|
| Total oil flows | 20.9 | million barrels per day | CONFIRMED (2026-11-26); provisional crude oil and petroleum liquids baseline |
| Crude oil and condensate | 14.7 | million barrels per day | CONFIRMED (2026-11-26); context only |
| Petroleum products | 6.1 | million barrels per day | CONFIRMED (2026-11-26); context only |
| LNG flows | 11.4 | billion cubic feet per day | CONFIRMED (2026-11-26); provisional LNG baseline |

Notes (no new figures):

- The printed components (14.7 and 6.1) do not sum exactly to the printed total (20.9), probably source rounding. Record exactly as printed. The app must never recompute the total.
- Mapping CONFIRMED (developer, 2026-11-26): the Table 3 oil figure covers crude oil, condensate and petroleum products. "Total oil flows" (20.9 million barrels per day) is the provisional crude oil and petroleum liquids Baseline_Transit_Flow. The components (14.7 crude oil and condensate; 6.1 petroleum products) are context only, as printed.
- LNG stays in billion cubic feet per day. No conversion to oil units.
- The reference period ends 2025-06-30. At 2026-11-26 it is more than 12 months old, so the Older_Period_Notice will display (expected).
- 1H25 predates the 2026 conflict-related disruption discussed in more recent EIA material, which supports its use as a historical baseline. The Reference_Statement applies: figures describe the stated period, not current conditions.
- Provisional status: oil total and LNG are provisional MVP baselines; components are context only. Entry belongs to Tasks 3.2/3.3.
- Day count: 181 is the calendar length of 1H25, not established daily observation coverage. No equality check applies.

### EIA related context (optional, not primary)

Each would be its own Source_Record if used. All fields PENDING except the URL leads.

| Item | URL | Status |
|---|---|---|
| Today in Energy (Hormuz) | https://www.eia.gov/todayinenergy/detail.php?id=61002 | LEAD |
| Today in Energy | https://www.eia.gov/todayinenergy/detail.php?id=39932 | LEAD |
| Today in Energy | https://www.eia.gov/todayinenergy/detail.php?id=32352 | LEAD |

## Source 2: EIA Copyrights and Reuse policy (licence review for Source 1)

| Field | Value | Status | Evidence/notes |
|---|---|---|---|
| URL | https://www.eia.gov/about/copyrights_reuse.php | CONFIRMED (2026-11-26) | Developer-reported |
| Finding | EIA permits reuse and distribution of its own publications and data, with requested source attribution including publication date. The policy warns that third-party protected materials may need separate permission. | CONFIRMED (2026-11-26) | Developer-reported summary; exact policy wording not recorded here |
| Licence field text | "EIA Copyrights and Reuse policy (reuse and distribution permitted with requested attribution, per developer review)" | CONFIRMED | Do not claim "public domain" beyond what was reported |
| Redistribution in public MIT-licensed static bundle | Likely permitted for EIA's own figures; CONDITIONAL on the third-party question below | PENDING | |

### Third-party risk (UNRESOLVED)

Table 3 figures are EIA analysis based on Vortexa tanker-tracking data. It is UNRESOLVED whether these derived figures are EIA's own data covered by the reuse policy, or include third-party-protected material that needs Vortexa permission.

Mitigation options (decision PENDING):

- Reuse only EIA's published aggregate figures, never Vortexa raw data.
- Attribute as EIA with the publication date, and note "EIA analysis based on Vortexa tanker tracking data".
- Do not reproduce EIA charts or graphics, or anything marked third-party.
- Ask EIA if uncertain.

### Attribution text (approved draft wording, 2026-11-26; subject to unresolved Vortexa rights)

"Source: U.S. Energy Information Administration (EIA), World Oil Transit Chokepoints, last updated 2026-03-03, Table 3 (EIA analysis based on Vortexa tanker tracking data). Retrieved 2026-11-26."

## Source 3: IEA Strait of Hormuz factsheet (supplementary; context only)

Status (decided 2026-11-26): CONTEXTUAL REFERENCE ONLY - NOT INTENDED FOR INCLUSION IN THE MVP PRODUCTION DATASET. Therefore outside the Task 3.1 acceptance scope, while remaining documented.

| Field | Value | Status | Evidence/notes |
|---|---|---|---|
| Exact publication title | PENDING | PENDING | |
| Publisher | International Energy Agency (IEA) | PENDING | Not stated in the developer report |
| URL | https://www.iea.org/about/strait-of-hormuz | CONFIRMED (2026-11-26) | Developer's URL |
| Superseded lead URLs | https://www.iea.org/about/oil-security-and-emergency-response/strait-of-hormuz ; https://iea.blob.core.windows.net/assets/c8248eba-8689-46d9-ae4b-b858b59c0f1c/StraitofHormuz2026-Factsheet.pdf | LEAD (superseded) | Not used |
| Publication date | Last updated February 2026 (day not recorded) | CONFIRMED (2026-11-26) | |
| Retrieval date | 2026-11-26 | CONFIRMED | |
| Reference period / units | PENDING | PENDING | No IEA figure is to be entered |
| Third-party content | Includes Kpler-derived analysis | CONFIRMED (2026-11-26) | Third-party |
| Decision | NOT approved for reproduction of its third-party data or graphics without applicable rights verification | CONFIRMED (2026-11-26) | Status: context only / excluded from dataset pending rights. No IEA figure is entered. |
| Archive reference | PENDING | PENDING | |

### IEA licensing

| Field | Value | Status | Evidence/notes |
|---|---|---|---|
| URLs | https://www.iea.org/terms ; https://www.iea.org/terms/creative-commons-cc-licenses | CONFIRMED (2026-11-26) | Developer-reported |
| Finding | CC licensing applies only to specifically identified CC-licensed material. Third-party components remain excluded. Non-CC material has additional restrictions. | CONFIRMED (2026-11-26) | |
| Per-item licence determination for any future IEA use | PENDING (only needed if IEA use is later reconsidered) | PENDING | IEA is not intended for the MVP dataset |
| Earlier terms leads | https://www.iea.org/terms/terms-of-use-for-non-cc-material ; https://www.iea.org/terms/rights-requests | LEAD | Not checked |
| Possible use | Per-economy dependency statements (qualitative) | PENDING | Not decided |

## Source 4: UNCTAD Data Hub (supplementary: dependencies and context)

Status (decided 2026-11-26): NOT INTENDED FOR THE MVP PRODUCTION DATASET. Official indexed UNCTAD Data Hub pages state CC BY 3.0 IGO reuse with attribution; direct full-page access and a specific relevant dataset are not confirmed. Outside the Task 3.1 acceptance scope, while documented.

| Field | Value | Status | Evidence/notes |
|---|---|---|---|
| Exact publication/dataset title | PENDING | PENDING | No dataset selected |
| Publisher | UNCTAD | PENDING | Not stated in the developer report |
| URL (Data Hub FAQ) | https://unctadstat.unctad.org/EN/FAQ.html | LEAD | Earlier description was an unverified search snippet; replaced by the licence entry below |
| Licence | CC BY 3.0 IGO (per indexed FAQ text; full page not confirmed) | PENDING | The official indexed FAQ states Data Hub materials are available under CC BY 3.0 IGO with attribution. Full-page access not confirmed. Needs confirmation. |
| Attribution requirement | Attribution (per indexed FAQ text) | PENDING | Exact wording not recorded |
| URL (specific dataset) | PENDING | PENDING | |
| Publication date | PENDING | PENDING | |
| Retrieval date | PENDING | PENDING | |
| Reference period start / end | PENDING | PENDING | |
| Units / values | PENDING | PENDING | |
| Redistribution in static bundle permitted | PENDING | PENDING | |
| Verification_Status / date / statement | PENDING | PENDING | |
| Archive reference | PENDING | PENDING | |
| Decision (Include/Exclude) | Not intended for MVP production dataset | CONFIRMED (2026-11-26) | |

## Per-figure checklist (template; copy one per figure)

Intended figures: crude oil and petroleum liquids Hormuz transit baseline (Task 3.2); LNG Hormuz transit baseline (Task 3.3); each economy x commodity dependency share or qualitative dependency (Task 3.4); graph edges (Task 15.1, later). Dependency shares, qualitative dependencies, graph relationships and undecided reuse decisions are all PENDING.

| Field | Value |
|---|---|
| Figure id | PENDING |
| Source entry | PENDING |
| Value as printed | PENDING |
| Unit as printed | PENDING |
| Time basis (e.g. per day, per year, average) | PENDING |
| Reference period start / end | PENDING |
| Calendar year? Leap status (365/366), or non-calendar day count | PENDING (EIA 1H25: not a calendar year; 181 = calendar length of the period, non-leap 2025) |
| Day-count basis (source statement / table note / page ref) | PENDING (EIA 1H25: per-day average over 1H25; 181 = calendar length of period; daily observation coverage not established; no equality check) |
| Table / page reference | PENDING |
| Methodology note | PENDING |
| Licence permits inclusion (Y/N/PENDING) | PENDING |
| Attribution text | PENDING |
| Verified by | PENDING |
| Verification date | PENDING |
| Decision (Include / Exclude -> unavailable) | PENDING |

Log each checked figure in `docs/data-verification-log.md`.

## Risks and points to check

- Third-party data: Table 3 rests on Vortexa tanker tracking data. Redistribution rights for these derived figures are unresolved.
- Reference-period choice: 1H25 is a historical baseline that predates the 2026 disruption. The dataset must state the period and must not imply current conditions. The period is more than 12 months old at 2026-11-26, so the Older_Period_Notice displays.
- Rounding: printed components do not sum to the printed total. Never recompute.
- Mapping: resolved 2026-11-26. "Total oil flows" is the provisional oil baseline.
- Full daily coverage is not established. No date-range equality check applies, and 181 must not be read as complete daily observations.
- Original EIA publication date is not established; only "last updated 2026-03-03" is confirmed.
- Revisions between EIA editions, and preliminary versus final figures.
- Mixed units: oil in million barrels per day, LNG in billion cubic feet per day. No conversion.
- Country-share availability may be nil. Qualitative-only dependency is acceptable.
- Licence exclusion: the figure becomes "unavailable", not substituted.
- IEA factsheet contains Kpler-derived third-party analysis, so it is excluded from the dataset pending rights.
- UNCTAD licence rests on indexed FAQ text only.
- Keep archive evidence for each checked figure.

## Remaining to satisfy Task 3.1 acceptance

Acceptance scope is now EIA only, plus any dependency sources added later.

- (a) OPEN: Vortexa third-party redistribution clearance. The attribution wording is approved as draft, subject to this clearance.
- (b) RESOLVED, except the original EIA publication date, which is not established. Only "last updated 2026-03-03" is confirmed; its labelling in the Source_Record is decided in Task 3.2. Oil mapping confirmed (total oil flows 20.9 is the provisional baseline).
- (c) RESOLVED: full daily coverage not established; no equality check applies.
- (d) RESOLVED: IEA is not intended for the dataset (contextual reference only).
- (e) RESOLVED: UNCTAD is not intended for the dataset.
- (f) OPEN: identify and review dependency sources for Task 3.4, or record none, plus qualitative and graph-edge evidence. Economy-level dependency shares remain PENDING.
- (g) OPEN: archived copies for each relied-upon page.
- (h) OPEN: final dated sign-off.

## Completion criteria for Task 3.1

Developer reviews the actual publications and terms of use of the Candidate_Sources and records in this file, for each: exact publication title, publisher, URL, publication date, reference period, units, licence, attribution requirement, and whether redistribution of the needed figure in a static bundle is permitted. A figure is entered only after individual verification against the source, dated, and checked for reuse permissions. A source whose licence does not permit inclusion is recorded as excluded and its figures become "unavailable". Acceptance: every source intended for the dataset has a completed, dated review entry. (Requirements 4.1, 4.2, 4.9.)

## Sign-off

Reviewed by: Developer (partial, 2026-11-26); final sign-off PENDING
Date: PENDING
