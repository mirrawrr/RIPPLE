# RIPPLE Data Sources: Source and Licence Review (Task 3.1)

Status: COMPLETE (2026-11-27) under the Kiroween MVP link-only approach. Open risks: Vortexa redistribution rights (deferred), archive contents not verified, 'last updated' vs publication-date schema mapping (Task 3.2), demonstration mode not approved.

Earlier status (2026-11-27, superseded by final sign-off): REVIEW READY FOR SIGN-OFF - link-only fallback adopted 2026-11-27; Vortexa rights unresolved (deferred); final developer sign-off pending. Task 3.1 is not complete.

Earlier status (2026-11-26, superseded): EIA baselines and dependency candidates recorded; Vortexa clearance deferred (unresolved); embed-vs-link decision, dependency verification details, archives and final sign-off pending.

Developer decisions approved 2026-11-27 for the Kiroween MVP are recorded in "Decisions approved 2026-11-27" below. The source review date remains 2026-11-26.

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

> **IMPORTANT - INTERNAL VERIFICATION RECORD, NOT A REDISTRIBUTION.** The EIA figures in this section are recorded here only as internal verification records of what the developer checked. This is not a redistribution of the data. The values must NOT be copied into `public/data` (or any bundled dataset) until redistribution rights are resolved.
>
> **RESIDUAL RISK (not a permission):** the repository is public, so these docs are publicly visible. Recording the figures here does not grant or confirm any right to redistribute them. Redistribution status of every EIA figure below: **UNRESOLVED - not embedded (link-only)**.

Status: LINK-ONLY (developer-approved 2026-11-27). The earlier "provisional MVP historical baselines" are NOT embedded in any dataset. Not entered into production datasets. Verification_Status stays PENDING because Vortexa rights are unresolved.

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
| Redistribution in static bundle permitted | NOT CONFIRMED -> not embedded (link-only) | RESOLVED for MVP (developer-approved 2026-11-27) | Likely permitted for EIA's own figures, but conditional on the unresolved Vortexa third-party question. Treated as not permitted for the MVP. |
| Third-party material exclusions | Policy warns third-party protected material may need separate permission | CONFIRMED (2026-11-26) | Applicability to Table 3 unresolved |
| Verification_Status | PENDING | PENDING | |
| Verification date | 2026-11-26 (figures checked by developer) | CONFIRMED | Final status PENDING |
| Oil scope | Table 3 oil figure covers crude oil, condensate and petroleum products | CONFIRMED (2026-11-26) | Total oil flows (20.9 million barrels per day) is the provisional crude oil and petroleum liquids baseline; mapping confirmed by developer |
| Statement value checked against publication | Table 3 values below | CONFIRMED (2026-11-26) | Reference_Statement wording not recorded here |
| Archive reference | http://web.archive.org/web/20261123162907/https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints (snapshot timestamp 2026-11-23 16:29:07 UTC) | PARTIAL (checked 2026-11-27) | Existence verified via the Wayback availability API. Snapshot CONTENT not yet checked against the developer's review (e.g. last updated 2026-03-03 and the same Table 3 figures). |
| Decision (Include/Exclude) | Figures NOT embedded - link-only fallback (redistribution unresolved). Earlier 2026-11-26 decision was provisional MVP baselines (oil total, LNG), components context only. | SUPERSEDED / developer-approved 2026-11-27 | Not entered in production dataset. Figures become "unavailable" with a link to the EIA report. |

### Table 3, Strait of Hormuz, 1H25 (values exactly as printed)

Redistribution status of every value in this table: UNRESOLVED - not embedded (link-only). Internal verification record only; do not copy into `public/data`.

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
- Provisional status (superseded 2026-11-27): oil total and LNG were provisional MVP baselines; components context only. Under the link-only fallback none is embedded. Tasks 3.2/3.3 may include EIA Source_Record citation/link metadata only if it contains no restricted figures (decision for those tasks).
- Day count: 181 is the calendar length of 1H25, not established daily observation coverage. No equality check applies.

### Source 1 - dependency candidates (1H25; source-backed, NOT production-ready)

Recorded 2026-11-26, developer-reported; interpretations and location confirmed 2026-11-27 against the official World Oil Transit Chokepoints report, Strait of Hormuz section, 1H25. Same publication as Source 1 (last updated 2026-03-03). Wording and values are recorded exactly as reported. Redistribution status of every value below: UNRESOLVED - not embedded (link-only).

| Candidate | Wording/value as reported | Wording/value status | Reference period | Table/figure/page ref | Interpretation (confirmed 2026-11-27) | Decision |
|---|---|---|---|---|---|---|
| C1 | 89% of crude oil and condensate transiting the Strait of Hormuz went to Asian markets | CONFIRMED (developer-reported 2026-11-26) | 1H25 (2025-01-01 to 2025-06-30); wording "1H25" per developer confirmation 2026-11-27 | Strait of Hormuz section, immediately before Figure 4 and Table 3 | Share of crude oil and condensate transit destined for Asian markets | Dependency candidate - not entered (link-only) |
| C2 | China, India, Japan and South Korea together accounted for 74% of those flows | CONFIRMED (developer-reported 2026-11-26) | As C1 | As C1 | Combined share of ALL Hormuz crude oil and condensate flows destined for China, India, Japan and South Korea. NOT 74% of Asia-bound flows. Not assignable to any individual country. | Dependency candidate - not entered (link-only) |
| C3 | Approximately 7% of US crude oil and condensate imports came from Persian Gulf countries through Hormuz; approximately 0.4 million barrels per day | CONFIRMED (developer-reported 2026-11-26; 0.4 million b/d added 2026-11-27) | As C1 | As C1 | U.S. crude oil and condensate imports originating in Persian Gulf countries and moving through Hormuz, approximately 0.4 million barrels per day | Dependency candidate - not entered (link-only) |

Classification: all three are SOURCE-BACKED DEPENDENCY CANDIDATES, not production-ready dataset records. None has been entered into any dataset. Under link-only none will be entered for the MVP.

Three concepts that must stay distinct:

- Destination share: the share of Hormuz crude oil and condensate flows going to a destination (C1 89% and C2 74%). This is NOT an economy's import dependency and must not be entered as `chokepointTransitImportSharePercent`.
- Import dependency: the share of an economy's imports of a commodity that transit the chokepoint. C3 (US, about 7%) is the closest candidate. Notes: it is approximate ("Approximately" is kept); it covers crude oil and condensate only, not the total-oil baseline scope (crude oil, condensate and petroleum products), so a commodity-scope mapping decision is PENDING; the wording "from Persian Gulf countries through Hormuz" must be checked against the schema's meaning before any entry (Task 3.4).
- Scenario_Exposure_Index: a hypothetical, calculated indicator from a verified import-dependency percentage and the user's disruption magnitude. It is never sourced and is never a destination share.

C2 base ambiguity: RESOLVED 2026-11-27 (developer-confirmed). 74% is the combined share of all Hormuz crude oil and condensate flows destined for China, India, Japan and South Korea, not 74% of Asia-bound flows. Do not split 74% into per-country shares or assign it to any individual country; no per-country values exist in the record.

C1 and C2 are destination-flow measures and stay separate from C3, an economy import-dependency measure. C3 commodity-scope mapping and the schema-meaning check remain open for Task 3.4, but are moot for the MVP under link-only (not entered).

Possible future use (PENDING, Tasks 3.4 and 15.1): qualitative documented dependencies or graph-edge evidence for China, India, Japan, South Korea (and "Asian markets"), and a candidate quantified US crude share. All are subject to verification, scope mapping and redistribution clearance.

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
| Redistribution in public MIT-licensed static bundle | Likely permitted for EIA's own figures; CONDITIONAL on the third-party question below. Not confirmed -> not embedded (link-only). | RESOLVED for MVP (link-only, 2026-11-27) | |
| Archive reference | http://web.archive.org/web/20261117025557/https://www.eia.gov/about/copyrights_reuse.php (snapshot timestamp 2026-11-17 02:55:57 UTC) | PARTIAL (checked 2026-11-27) | Existence verified via the Wayback availability API. Snapshot CONTENT not yet checked against the developer's review. |

### Third-party risk (UNRESOLVED)

Table 3 figures are EIA analysis based on Vortexa tanker-tracking data. It is UNRESOLVED whether these derived figures are EIA's own data covered by the reuse policy, or include third-party-protected material that needs Vortexa permission.

Mitigation options (decision PENDING):

- Reuse only EIA's published aggregate figures, never Vortexa raw data.
- Attribute as EIA with the publication date, and note "EIA analysis based on Vortexa tanker tracking data".
- Do not reproduce EIA charts or graphics, or anything marked third-party.
- Ask EIA if uncertain.

### Vortexa and licensing decisions (developer-reported, 2026-11-26)

3. Deferral: for the hackathon MVP, contacting EIA about redistribution of Vortexa-derived aggregates is DEFERRED to the post-hackathon expansion phase.
4. Status: third-party (Vortexa) redistribution rights remain UNRESOLVED. Hackathon or non-commercial status does not automatically grant permission to reuse restricted materials.
5. Primary reference: EIA remains the primary historical reference, with its source URLs, reference periods and the approved draft attribution. Do not reproduce proprietary Vortexa records, third-party maps or charts.
6. Compliant fallback (documented plan): if aggregate redistribution rights cannot be confirmed, the app links users to EIA's original report rather than embedding restricted data in public datasets. Affected figures would be shown as unavailable in the dataset with a link to the EIA source, consistent with the spec rule that excluded figures become "unavailable", not substituted.
   - Whether the MVP embeds the EIA aggregates or uses the link-only fallback: RESOLVED 2026-11-27 - link-only (see "Decisions approved 2026-11-27").
7. Task 3.1 remains incomplete (final sign-off pending).

### Attribution text (approved draft wording, 2026-11-26; subject to unresolved Vortexa rights)

"Source: U.S. Energy Information Administration (EIA), World Oil Transit Chokepoints, last updated 2026-03-03, Table 3 (EIA analysis based on Vortexa tanker tracking data). Retrieved 2026-11-26."

## Decisions approved 2026-11-27 (developer-approved; Kiroween MVP)

The source review date remains 2026-11-26.

1. **Link-only fallback adopted** for EIA-derived historical transit aggregates until redistribution rights are clarified. The values (20.9 million b/d total oil flows, 14.7, 6.1, 11.4 Bcf/d LNG, and the 89% / 74% / approximately 7% / approximately 0.4 million b/d figures) are NOT embedded in `public/data`, and no third-party material is bundled. This supersedes the earlier "embed vs link PENDING" item: RESOLVED - link-only. For Tasks 3.2/3.3: the MVP dataset may include EIA Source_Record citation/link metadata only if it contains no restricted figures (decision for those tasks).
2. **Internal records only.** EIA published figures, citation, reference period and units stay in these internal verification docs, each marked "Redistribution status: UNRESOLVED - not embedded (link-only)". These docs are not a redistribution of the data. RESIDUAL RISK (not a permission): the repository is public, so these docs are publicly visible.
3. **Interpretations confirmed** against the official report (Strait of Hormuz section, 1H25) and recorded in the C1-C3 table: 89% is the share destined for Asian markets; 74% is the combined share of ALL Hormuz crude oil and condensate flows destined for China, India, Japan and South Korea (not of Asia-bound flows; C2 ambiguity RESOLVED); approximately 7% is U.S. crude oil and condensate imports from Persian Gulf countries through Hormuz, approximately 0.4 million barrels per day. Location: the Strait of Hormuz section immediately before Figure 4 and Table 3. Period wording: "1H25". C3 scope mapping and schema-meaning check remain open for Task 3.4 and are moot for the MVP.
4. **Separation of measures.** Destination-flow measures (C1, C2) stay separate from economy import-dependency measures (C3). 74% is never assigned to an individual country.
5. **Synthetic data.** Clearly labelled synthetic data is allowed in tests. An explicitly identified illustrative demonstration mode is approved in principle; spec change required before implementation (it is not in the approved requirements.md/design.md). It must be clearly labelled synthetic/illustrative, never the Historical Class_Label, and never presented as historical observations or as calculated outcomes of historical data.
6. **Unavailable states.** Where historical baselines are unavailable, the production app shows the approved wording "Source unavailable" (Req 4.10) and the Overview's text indicator that the value is unavailable (Req 2.3). The engine returns "not calculable" naming the missing input (Req 7.15), never a supposedly historical result. Consequence under link-only: the MVP production build shows the oil and LNG baselines as unavailable with a link to EIA's report; Scenario Lab Hypothetically_Reduced_Flow results for real data are "not calculable"; Scenario_Exposure_Index lists are empty. Consequence noted; developer to confirm acceptance.
7. **Archive check (2026-11-27)** via the Internet Archive Wayback Machine availability API (https://archive.org/wayback/available). Snapshots exist at:
   - http://web.archive.org/web/20261123162907/https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints (2026-11-23 16:29:07 UTC)
   - http://web.archive.org/web/20261117025557/https://www.eia.gov/about/copyrights_reuse.php (2026-11-17 02:55:57 UTC)
   Snapshot existence verified via the availability API; snapshot CONTENT not yet checked against the developer's review (e.g. last updated 2026-03-03 and the same Table 3 figures). Status PARTIAL. IEA and UNCTAD pages not checked (not intended for the dataset; optional). Original URLs and retrieval date 2026-11-26 unchanged.
8. **EIA rights inquiry deferred** to post-hackathon. Preserved as an UNRESOLVED RISK, not a permission.

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

Candidate entries (EIA 1H25 dependency candidates; filled from developer report 2026-11-26; unspecified fields PENDING):

| Field | C1 | C2 | C3 |
|---|---|---|---|
| Figure id | Hormuz crude/condensate to Asian markets | China, India, Japan, South Korea combined share | US crude/condensate imports via Hormuz |
| Source entry | Source 1 | Source 1 | Source 1 |
| Value as printed | 89% | 74% | Approximately 7% |
| Unit as printed | percent (share of Hormuz crude oil and condensate flows) | percent ("of those flows"; base ambiguity PENDING) | percent (share of US crude oil and condensate imports) |
| Concept | Destination share | Destination share | Import dependency candidate |
| Reference period | 1H25 per developer; exact wording PENDING | same | same |
| Day-count basis | n/a (share, not a flow) | n/a | n/a |
| Table / page reference | Strait of Hormuz section, immediately before Figure 4 and Table 3 (confirmed 2026-11-27) | same | same |
| Licence permits inclusion | PENDING (Vortexa); not embedded (link-only) | same | same |
| Verified by / date | Developer (reported 2026-11-26; interpretation confirmed 2026-11-27) | same | same |
| Decision | Dependency candidate - not entered (link-only) | same | same (approximately 0.4 million barrels per day recorded) |

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
- Destination share confusion: C1 (89%) and C2 (74%) are shares of Hormuz flows, not economy import dependencies. Never enter them as `chokepointTransitImportSharePercent`.
- C2 base ambiguity: RESOLVED 2026-11-27 (74% of all Hormuz crude/condensate flows). Never split into per-country shares.
- C3 scope and wording: approximate, crude oil and condensate only (not the total-oil scope), and "from Persian Gulf countries through Hormuz" must be checked against the schema's meaning (Task 3.4; moot for the MVP under link-only).
- Public repository: these docs are publicly visible, so recorded EIA figures are a residual risk, not a permission.
- Link-only consequence: baselines unavailable, real-data Hypothetically_Reduced_Flow results "not calculable", Scenario_Exposure_Index lists empty (developer to confirm acceptance).
- Scenario_Exposure_Index must never be presented as sourced data.
- Vortexa rights remain unresolved; hackathon or non-commercial status does not grant permission. Embed vs link-only fallback is undecided and blocks Tasks 3.2/3.3.

## Remaining to satisfy Task 3.1 acceptance

Acceptance scope is now EIA only, plus any dependency sources added later.

- (a) DEFERRED / UNRESOLVED RISK: Vortexa third-party redistribution clearance is deferred to the post-hackathon expansion phase. The attribution wording is approved as draft, subject to this clearance. Handled for the MVP via the link-only fallback (adopted 2026-11-27).
- (b) RESOLVED, except the original EIA publication date, which is not established. Only "last updated 2026-03-03" is confirmed; its labelling in the Source_Record is decided in Task 3.2. Oil mapping confirmed (total oil flows 20.9 is the provisional baseline).
- (c) RESOLVED: full daily coverage not established; no equality check applies.
- (d) RESOLVED: IEA is not intended for the dataset (contextual reference only).
- (e) RESOLVED: UNCTAD is not intended for the dataset.
- (f) RESOLVED for MVP: under link-only no dependency values are entered. C1-C3 are recorded with confirmed location, period wording and interpretation (C2 ambiguity resolved). C3 scope mapping and schema-meaning check are moot for the MVP and left to Task 3.4. Other dependency sources, qualitative and graph-edge evidence remain PENDING and are not needed for the MVP.
- (g) PARTIAL: snapshot existence verified 2026-11-27 for the EIA report and EIA reuse policy pages; snapshot content check recommended before sign-off (not strictly blocking). IEA and UNCTAD not checked (optional).
- (h) RESOLVED - final developer sign-off 2026-11-27 (link-only approach).
- Open risks (not acceptance criteria): (a) Vortexa redistribution rights (deferred) and (g) archive snapshot contents not verified.

## Completion criteria for Task 3.1

Developer reviews the actual publications and terms of use of the Candidate_Sources and records in this file, for each: exact publication title, publisher, URL, publication date, reference period, units, licence, attribution requirement, and whether redistribution of the needed figure in a static bundle is permitted. A figure is entered only after individual verification against the source, dated, and checked for reuse permissions. A source whose licence does not permit inclusion is recorded as excluded and its figures become "unavailable". Acceptance: every source intended for the dataset has a completed, dated review entry. (Requirements 4.1, 4.2, 4.9.)

## Task 3.1 acceptance review (2026-11-27)

Evaluation against the exact tasks.md criteria.

**(i)** "Developer reviews the actual publications and terms of use of the Candidate_Sources and records in docs/data-sources.md, for each: exact publication title, publisher, URL, publication date, reference period, units, licence, attribution requirement, and whether redistribution of the needed figure in a static bundle is permitted."
- EIA: title, publisher, URL, reference period, units, licence (EIA reuse policy) and attribution (approved draft) are recorded. Publication date: only "last updated 2026-03-03" is established; the original date is not established and the field is recorded with that labelling. Redistribution answer: not confirmed -> not embedded (link-only). IEA and UNCTAD: reviewed and excluded.
- Status: SATISFIED for review content, subject to the developer accepting "last updated" as the recorded date.

**(ii)** "A source whose licence does not permit inclusion is recorded as excluded and its figures become 'unavailable' (not substituted)."
- SATISFIED via link-only: EIA figures are excluded from the bundle and shown as unavailable; IEA and UNCTAD are excluded.

**(iii)** "every source intended for the dataset has a completed, dated review entry."
- Intended source: EIA (citation/link metadata only, if any). The entry is dated (review 2026-11-26, decisions 2026-11-27).
- OUTSTANDING: final dated developer sign-off (item h).
- Archives (item g) are part of the documented procedure, not an explicit acceptance criterion. Existence is verified; a content check is recommended before sign-off but is not strictly blocking.

**Dependency sources (item f):** under link-only no dependency values are entered. The Task 3.4 MVP outcome is qualitative-only or none, which the spec allows. Any qualitative dependency entered later needs its own verified, redistributable Source_Record. Flag for Task 3.4: whether paraphrasing EIA text (without figures) is acceptable.

Conclusion: Task 3.1 can be completed once the developer gives the final dated sign-off (and confirms acceptance of the 'last updated' date and the link-only product consequence). No other acceptance criterion is unmet.

## Final source-review decision (2026-11-27)

Recorded from the developer's final decision. Adds no figures.

1. **EIA date.** 2026-03-03 is accepted as the verified "Last updated" date ONLY. It is not the original publication date, which is not established. Keep this distinction. **Flag for Task 3.2:** the Source_Record schema field `publicationDate` (Req 4.2) has no separate "last updated" field. Task 3.2 must decide how to represent a "last updated" date without presenting it as the original publication date (for example a schema addition such as a date-kind/label field, or another approved approach). Under link-only no EIA figure is entered, but any EIA citation Source_Record would hit this.
2. **Link-only approved.** Link-only treatment of the Vortexa-derived EIA aggregates is APPROVED for the hackathon MVP. No such figures may be embedded in public production datasets under this decision.
3. **IEA and UNCTAD** remain excluded from MVP production data.
4. **Attribution wording** is approved for the documented source references. This is NOT clearance of third-party redistribution rights.
5. **Vortexa licensing question** remains UNRESOLVED, preserved for post-hackathon follow-up.
6. **Archive snapshots** are IDENTIFIED BUT NOT CONTENT-VERIFIED. Their contents have not been checked.
7. **Consequence accepted.** Under link-only, historical calculations are unavailable in the production MVP: baselines are shown as unavailable with a link to EIA; Hypothetically_Reduced_Flow is "not calculable" for real data; Scenario_Exposure_Index lists are empty. The developer accepts this. A separate, explicitly illustrative demonstration mode is PROPOSED but NOT APPROVED in the existing specifications (it would need a requirements/design change).

## Final acceptance check (2026-11-27)

| tasks.md Task 3.1 criterion | Evidence |
|---|---|
| Fields recorded for each source: title, publisher, URL, publication date, reference period, units, licence, attribution, redistribution permitted? | EIA: all recorded. The date field records the reviewed edition's "last updated 2026-03-03", labelled as such; the original publication date is "not established". The criterion names "publication date" and does not require an original publication date; this interpretation was accepted by the developer 2026-11-27. Redistribution recorded as not confirmed. IEA and UNCTAD: reviewed and recorded as excluded. |
| Excluded sources' figures become "unavailable", not substituted | Satisfied. Link-only for EIA; IEA and UNCTAD excluded. |
| Every source intended for the dataset has a completed, dated review entry | EIA review entry dated 2026-11-26, decisions 2026-11-27, final sign-off 2026-11-27. |
| Archive content verification and third-party permissions | Not Task 3.1 acceptance criteria. Recorded as open risks. |

Conclusion: All Task 3.1 acceptance criteria are satisfied under the link-only approach.

## Sign-off

Reviewed by: Developer (partial, 2026-11-26)
Decisions approved: Developer, 2026-11-27
Final sign-off: Developer, 2026-11-27 (link-only approach)
Date: 2026-11-27
