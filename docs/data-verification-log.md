# RIPPLE Data Verification Log

No values have been entered into production datasets. Rows below record developer-reported checks against live sources on 2026-11-26 (see `docs/data-sources.md`). Values and units are exactly as printed, with no rounding or conversion.

## Figures

| Date checked | Figure id | Source entry | Value as printed | Unit | Reference period | Table/page ref | Day-count basis | Decision | Verifier |
|---|---|---|---|---|---|---|---|---|---|
| 2026-11-26 | Total oil flows | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | 20.9 | million barrels per day | 2025-01-01 to 2025-06-30 | Table 3, Strait of Hormuz, 1H25 | per-day average over 1H25; 181 = calendar length of period; daily observation coverage not established; no equality check | Not embedded - link-only fallback (redistribution unresolved). Mapping confirmed 2026-11-26 (provisional oil baseline). | Developer (reported 2026-11-26) |
| 2026-11-26 | Crude oil and condensate | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | 14.7 | million barrels per day | 2025-01-01 to 2025-06-30 | Table 3, Strait of Hormuz, 1H25 | per-day average over 1H25; 181 = calendar length of period; daily observation coverage not established; no equality check | Not embedded - link-only fallback (redistribution unresolved). Context only. | Developer (reported 2026-11-26) |
| 2026-11-26 | Petroleum products | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | 6.1 | million barrels per day | 2025-01-01 to 2025-06-30 | Table 3, Strait of Hormuz, 1H25 | per-day average over 1H25; 181 = calendar length of period; daily observation coverage not established; no equality check | Not embedded - link-only fallback (redistribution unresolved). Context only. | Developer (reported 2026-11-26) |
| 2026-11-26 | LNG flows | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | 11.4 | billion cubic feet per day | 2025-01-01 to 2025-06-30 | Table 3, Strait of Hormuz, 1H25 | per-day average over 1H25; 181 = calendar length of period; daily observation coverage not established; no equality check | Not embedded - link-only fallback (redistribution unresolved) | Developer (reported 2026-11-26) |

Dependency candidates (EIA 1H25; same publication as above; wording exactly as developer-reported; none entered in any dataset):

| Date checked | Figure id | Source entry | Value as printed | Unit | Reference period | Table/page ref | Day-count basis | Decision | Verifier |
|---|---|---|---|---|---|---|---|---|---|
| 2026-11-26 | C1: crude oil and condensate transiting Hormuz to Asian markets (destination share) | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | 89% of crude oil and condensate transiting the Strait of Hormuz went to Asian markets | percent | 1H25 (wording confirmed 2026-11-27) | Strait of Hormuz section, immediately before Figure 4 and Table 3 | n/a (share, not a flow) | Dependency candidate - not entered (link-only). Interpretation (2026-11-27): share of crude oil and condensate transit destined for Asian markets. | Developer (reported 2026-11-26; confirmed 2026-11-27) |
| 2026-11-26 | C2: China, India, Japan, South Korea combined (destination share) | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | China, India, Japan and South Korea together accounted for 74% of those flows | percent | 1H25 (wording confirmed 2026-11-27) | Strait of Hormuz section, immediately before Figure 4 and Table 3 | n/a (share, not a flow) | Dependency candidate - not entered (link-only). Base RESOLVED 2026-11-27: 74% is the combined share of ALL Hormuz crude oil and condensate flows destined for China, India, Japan and South Korea, not of Asia-bound flows. Not assigned to any individual country. | Developer (reported 2026-11-26; confirmed 2026-11-27) |
| 2026-11-26 | C3: US crude oil and condensate imports via Hormuz (import dependency candidate) | Source 1: EIA World Oil Transit Chokepoints (last updated 2026-03-03) | Approximately 7% of US crude oil and condensate imports came from Persian Gulf countries through Hormuz | percent | 1H25 (wording confirmed 2026-11-27) | Strait of Hormuz section, immediately before Figure 4 and Table 3 | n/a (share, not a flow) | Dependency candidate - not entered (link-only). Interpretation (2026-11-27): U.S. crude oil and condensate imports originating in Persian Gulf countries and moving through Hormuz, approximately 0.4 million barrels per day. Commodity-scope mapping and schema-meaning check open for Task 3.4; moot for the MVP. | Developer (reported 2026-11-26; confirmed 2026-11-27) |

Note: C1 and C2 are destination shares, not import dependencies, and must not be entered as `chokepointTransitImportSharePercent`. No per-country split of 74% exists.

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
| 2026-11-26 | 7. Vortexa deferral | For the hackathon MVP, contacting EIA about redistribution of Vortexa-derived aggregates is DEFERRED to the post-hackathon expansion phase. | Developer (confirmed 2026-11-26) |
| 2026-11-26 | 8. Vortexa rights status | Third-party (Vortexa) redistribution rights remain UNRESOLVED. Hackathon or non-commercial status does not automatically grant permission to reuse restricted materials. | Developer (confirmed 2026-11-26) |
| 2026-11-26 | 9. EIA primary reference | EIA remains the primary historical reference, with its URLs, reference periods and the approved draft attribution. Do not reproduce proprietary Vortexa records, third-party maps or charts. | Developer (confirmed 2026-11-26) |
| 2026-11-26 | 10. Compliant fallback | If aggregate redistribution rights cannot be confirmed, link users to EIA's original report rather than embedding restricted data in public datasets; affected figures are shown as unavailable with a link to the EIA source. Whether the MVP embeds the EIA aggregates or uses link-only is PENDING and must be decided before Tasks 3.2/3.3 enter data. | Developer (confirmed 2026-11-26) |
| 2026-11-26 | 11. Dependency candidates | Three EIA 1H25 findings (89%, 74%, approximately 7%) classified as source-backed dependency candidates, not production-ready, not entered. Destination share, import dependency and Scenario_Exposure_Index kept distinct. Task 3.1 remains incomplete. | Developer (confirmed 2026-11-26) |

## Archive checks

| Date checked | Item | Snapshot URL | Snapshot timestamp (UTC) | Status | Verifier |
|---|---|---|---|---|---|
| 2026-11-27 | EIA World Oil Transit Chokepoints | http://web.archive.org/web/20261123162907/https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints | 2026-11-23 16:29:07 | PARTIAL. Existence verified via the Wayback Machine availability API (https://archive.org/wayback/available). Snapshot CONTENT not yet checked against the developer's review (e.g. last updated 2026-03-03 and the same Table 3 figures). | Developer (reported 2026-11-27) |
| 2026-11-27 | EIA Copyrights and Reuse policy | http://web.archive.org/web/20261117025557/https://www.eia.gov/about/copyrights_reuse.php | 2026-11-17 02:55:57 | PARTIAL. Existence verified via the availability API. Snapshot content not yet checked. | Developer (reported 2026-11-27) |

IEA and UNCTAD pages were not checked (not intended for the dataset; optional). Original URLs and retrieval date 2026-11-26 are unchanged.

## Decisions approved 2026-11-27 (Kiroween MVP)

The source review date remains 2026-11-26.

| Date | Decision | Detail | Verifier |
|---|---|---|---|
| 2026-11-27 | 1. Link-only fallback | Adopted for EIA-derived historical transit aggregates until redistribution rights are clarified. The values (20.9 million b/d, 14.7, 6.1, 11.4 Bcf/d, 89%, 74%, approximately 7%, approximately 0.4 million b/d) are NOT embedded in public/data and no third-party material is bundled. Supersedes "embed vs link PENDING": RESOLVED - link-only. Tasks 3.2/3.3 may include EIA Source_Record citation/link metadata only if it contains no restricted figures (their decision). | Developer (approved 2026-11-27) |
| 2026-11-27 | 2. Internal records only | EIA figures, citation, reference period and units stay in the internal verification docs, each with "Redistribution status: UNRESOLVED - not embedded (link-only)". The docs are not a redistribution and the values must not be copied into public/data until rights are resolved. RESIDUAL RISK (not a permission): the repository is public, so these docs are publicly visible. | Developer (approved 2026-11-27) |
| 2026-11-27 | 3. Interpretations confirmed | Against the official report, Strait of Hormuz section, 1H25: 89% = share of crude oil and condensate transit destined for Asian markets; 74% = combined share of ALL Hormuz crude oil and condensate flows destined for China, India, Japan and South Korea (C2 ambiguity RESOLVED); approximately 7% = U.S. crude oil and condensate imports from Persian Gulf countries through Hormuz, approximately 0.4 million barrels per day. Location: section immediately before Figure 4 and Table 3. Period wording "1H25". C3 scope mapping and schema-meaning check open for Task 3.4, moot for the MVP. | Developer (approved 2026-11-27) |
| 2026-11-27 | 4. Separation of measures | Destination-flow measures (C1, C2) stay separate from economy import-dependency measures (C3). 74% is not assigned to any individual country. | Developer (approved 2026-11-27) |
| 2026-11-27 | 5. Synthetic data | Clearly labelled synthetic data allowed in tests. Illustrative demonstration mode: approved in principle; spec change required before implementation (not in approved requirements.md/design.md). Must be labelled synthetic/illustrative, never the Historical Class_Label, never presented as historical observations or calculated outcomes of historical data. | Developer (approved 2026-11-27) |
| 2026-11-27 | 6. Unavailable states | Production app shows "Source unavailable" (Req 4.10) and the Overview text indicator (Req 2.3); the engine returns "not calculable" naming the missing input (Req 7.15), never a supposedly historical result. Consequence: oil and LNG baselines shown as unavailable with a link to EIA's report; Scenario Lab Hypothetically_Reduced_Flow results for real data are "not calculable"; Scenario_Exposure_Index lists are empty. Consequence noted; developer to confirm acceptance. | Developer (approved 2026-11-27; acceptance of consequence to be confirmed) |
| 2026-11-27 | 7. Archive check | See "Archive checks" above. Status PARTIAL: existence verified, content check recommended before sign-off. | Developer (reported 2026-11-27) |
| 2026-11-27 | 8. EIA rights inquiry | Deferred to post-hackathon. Preserved as an UNRESOLVED RISK, not a permission. | Developer (approved 2026-11-27) |

Earlier status (2026-11-27, superseded by the final decision below): REVIEW READY FOR SIGN-OFF. Final developer dated sign-off and acceptance of the "last updated" date and the link-only product consequence were PENDING.

## Final source-review decision (2026-11-27)

Status: COMPLETE (2026-11-27) under the Kiroween MVP link-only approach. Open risks: Vortexa redistribution rights (deferred), archive contents not verified, 'last updated' vs publication-date schema mapping (Task 3.2), demonstration mode not approved.

| Date | Decision | Detail | Verifier |
|---|---|---|---|
| 2026-11-27 | F1. EIA date | 2026-03-03 accepted as the verified "Last updated" date ONLY, not the original publication date (not established). Flag for Task 3.2: Source_Record `publicationDate` (Req 4.2) has no separate "last updated" field; Task 3.2 must decide how to represent it without misrepresenting it as the original publication date (e.g. a date-kind/label field or another approved approach). | Developer (final decision 2026-11-27) |
| 2026-11-27 | F2. Link-only approved | Link-only treatment of the Vortexa-derived EIA aggregates approved for the hackathon MVP. No such figures embedded in public production datasets. | Developer (final decision 2026-11-27) |
| 2026-11-27 | F3. IEA and UNCTAD | Remain excluded from MVP production data. | Developer (final decision 2026-11-27) |
| 2026-11-27 | F4. Attribution wording | Approved for the documented source references. NOT clearance of third-party redistribution rights. | Developer (final decision 2026-11-27) |
| 2026-11-27 | F5. Vortexa licensing | Remains UNRESOLVED; preserved for post-hackathon follow-up. | Developer (final decision 2026-11-27) |
| 2026-11-27 | F6. Archive snapshots | Identified but NOT content-verified. | Developer (final decision 2026-11-27) |
| 2026-11-27 | F7. Link-only consequence | Baselines unavailable with a link to EIA; Hypothetically_Reduced_Flow "not calculable" for real data; Scenario_Exposure_Index lists empty. Developer accepts. Illustrative demonstration mode PROPOSED, NOT APPROVED in the existing specifications (needs requirements/design change). | Developer (final decision 2026-11-27) |
| 2026-11-27 | Final sign-off | All Task 3.1 acceptance criteria satisfied under the link-only approach (see "Final acceptance check" in `docs/data-sources.md`). | Developer, 2026-11-27 (link-only approach) |

Still open (risks, not acceptance criteria): Vortexa third-party redistribution clearance (deferred, unresolved risk); archive snapshot content check; Task 3.4 scope mapping and schema-meaning check for C3 (moot for MVP); qualitative and graph-edge evidence (not needed for MVP); 'last updated' vs publication-date schema mapping (Task 3.2); demonstration mode not approved in the specifications.