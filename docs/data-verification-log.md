# RIPPLE Data Verification Log

No values have been entered into production datasets. Rows below record developer-reported checks against live sources on 2026-11-26 (see `docs/data-sources.md`). Values and units are exactly as printed, with no rounding or conversion.

## Figures

| Date checked | Figure id | Source entry | Value as printed | Unit | Reference period | Table/page ref | Day-count basis | Decision | Verifier |
|---|---|---|---|---|---|---|---|---|---|
| 2026-11-26 | Total oil flows | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | 20.9 | million barrels per day | 2025-01-01 to 2025-06-30 | Table 3, Strait of Hormuz, 1H25 | per-day average over 1H25; 181 = calendar length of period; daily observation coverage not established; no equality check | PROVISIONAL MVP oil baseline (mapping confirmed) - not entered in production dataset | Developer (reported 2026-11-26) |
| 2026-11-26 | Crude oil and condensate | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | 14.7 | million barrels per day | 2025-01-01 to 2025-06-30 | Table 3, Strait of Hormuz, 1H25 | per-day average over 1H25; 181 = calendar length of period; daily observation coverage not established; no equality check | Context only - not entered | Developer (reported 2026-11-26) |
| 2026-11-26 | Petroleum products | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | 6.1 | million barrels per day | 2025-01-01 to 2025-06-30 | Table 3, Strait of Hormuz, 1H25 | per-day average over 1H25; 181 = calendar length of period; daily observation coverage not established; no equality check | Context only - not entered | Developer (reported 2026-11-26) |
| 2026-11-26 | LNG flows | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | 11.4 | billion cubic feet per day | 2025-01-01 to 2025-06-30 | Table 3, Strait of Hormuz, 1H25 | per-day average over 1H25; 181 = calendar length of period; daily observation coverage not established; no equality check | PROVISIONAL MVP LNG baseline - not entered in production dataset | Developer (reported 2026-11-26) |

Note: the printed components (14.7 and 6.1) do not sum exactly to the printed total (20.9), probably source rounding. Never recompute the total.

## Licence and terms checks

| Date checked | Item | URL | Finding | Decision | Verifier |
|---|---|---|---|---|---|
| 2026-11-26 | EIA Copyrights and Reuse policy | https://www.eia.gov/about/copyrights_reuse.php | Reuse and distribution of EIA's own publications and data permitted, with requested attribution including publication date. Third-party protected materials may need separate permission. Table 3 is EIA analysis based on Vortexa tanker tracking data; whether it includes third-party-protected material is UNRESOLVED. | PENDING (redistribution conditional on the Vortexa question; attribution text is a draft) | Developer (reported 2026-11-26) |
| 2026-11-26 | IEA terms | https://www.iea.org/terms ; https://www.iea.org/terms/creative-commons-cc-licenses | CC licensing applies only to specifically identified CC-licensed material. Third-party components remain excluded. Non-CC material has additional restrictions. | Per-item licence determination PENDING | Developer (reported 2026-11-26) |
| 2026-11-26 | IEA Strait of Hormuz factsheet (last updated February 2026) | https://www.iea.org/about/strait-of-hormuz | Includes Kpler-derived third-party analysis. | Context only / excluded from dataset pending rights. No IEA figure entered. | Developer (reported 2026-11-26) |
| 2026-11-26 | UNCTAD Data Hub FAQ | https://unctadstat.unctad.org/EN/FAQ.html | Official indexed FAQ states Data Hub materials are available under CC BY 3.0 IGO with attribution. Full page access not confirmed; no dataset selected. | PENDING confirmation | Developer (reported 2026-11-26) |

## Decisions recorded 2026-11-26

| Date | Decision | Detail | Verifier |
|---|---|---|---|
| 2026-11-26 | 1. EIA date | Last updated 2026-03-03 (confirmed). Original publication date not established. For the eventual Source_Record publication-date field, the 'last updated' date must be labelled as such; field mapping decided in Task 3.2. | Developer (confirmed 2026-11-26) |
| 2026-11-26 | 2. Oil scope and mapping | EIA Table 3 oil figure covers crude oil, condensate and petroleum products. Total oil flows 20.9 million barrels per day is the provisional crude oil and petroleum liquids baseline. LNG 11.4 billion cubic feet per day preserved. Components 14.7 and 6.1 are context only, as printed. Rounding note stands. | Developer (confirmed 2026-11-26) |
| 2026-11-26 | 3. Day count | 181 is the calendar length of 1H25 (2025-01-01 to 2025-06-30, non-leap year), not established daily tracking coverage. Full daily coverage: not established. No date-range equality check applies to these figures. | Developer (confirmed 2026-11-26) |
| 2026-11-26 | 4. IEA | Contextual reference only; not intended for the MVP production dataset. Kpler third-party note and licensing findings retained. Outside Task 3.1 acceptance scope while documented. | Developer (confirmed 2026-11-26) |
| 2026-11-26 | 5. UNCTAD | Not intended for the MVP production dataset. Official indexed UNCTAD Data Hub pages state CC BY 3.0 IGO reuse with attribution; direct full-page access and a specific relevant dataset are not confirmed. Outside Task 3.1 acceptance scope while documented. | Developer (confirmed 2026-11-26) |
| 2026-11-26 | 6. EIA attribution | Approved draft wording, subject to unresolved Vortexa rights: "Source: U.S. Energy Information Administration (EIA), World Oil Transit Chokepoints, last updated 2026-03-03, Table 3 (EIA analysis based on Vortexa tanker tracking data). Retrieved 2026-11-26." | Developer (confirmed 2026-11-26) |

Still PENDING: Vortexa third-party redistribution clearance; economy-level dependency shares; qualitative and graph-edge evidence; archived source copies; final sign-off.