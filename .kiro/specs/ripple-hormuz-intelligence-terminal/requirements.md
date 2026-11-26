# Requirements Document

## Introduction

RIPPLE ("One event. A thousand consequences.") is an interactive geopolitical intelligence and scenario-analysis web application built for the Kiroween 2026 Frankenstein hackathon. The long-term vision is a global platform that combines geospatial visualisation, international trade data, dependency analysis, and evidence-based research. The hackathon MVP covers only the Strait of Hormuz, crude oil (including petroleum liquids), and LNG.

The MVP lets a user explore the strait on a map, review dated historical oil and LNG transit figures, set a hypothetical percentage reduction in baseline transit flow for a hypothetical duration, see transparent deterministic calculations computed separately for each commodity in its own unit, and inspect the evidence behind every figure. The visual direction is an immersive, credible, premium dark geopolitical intelligence terminal with interactive maritime geography, trade relationships, and transparent scenario analysis, using an original identity. The application uses a curated, verified, static dataset. It contains no live shipping data, no predictions, no economic losses, and no forecasts.

Every figure shown to the user belongs to exactly one of three classes: Historical Observation, Hypothetical Assumption, or Calculated Outcome. The interface labels each figure with its class. In the optional Illustrative_Demo_Mode, synthetic inputs carry the fourth label "Illustrative" instead of "Historical", and every Hypothetical or Calculated figure also carries the Demo_Marker. Illustrative_Demo_Mode is never the default.

All figures describe a stated historical reference period. They are not a claim about current conditions or current flows.

The MVP targets a solo developer, uses React, TypeScript, and MapLibre GL JS, and must be achievable before the Kiroween submission deadline.

### Priority Markers

Each requirement carries one priority marker:

- **MVP-Core**: Required for the complete MVP user journey.
- **MVP-Supporting**: Required for the MVP, but not on the critical path of the user journey.
- **Stretch**: Built only after every MVP-Core and MVP-Supporting requirement is complete.

### MVP User Journey

The four-View workflow (Overview, Explore, Scenario Lab, Intelligence Brief) is the highest priority of the MVP. It is built and completed before the Dependency_Graph, visual polish, responsive layout, performance measurement, and all Stretch items. The MVP delivers one complete, functioning user journey before any other work:

1. **Overview**: The user reads the orientation, the reference-period statement, and the historical baseline figures for oil and LNG.
2. **Explore map**: The user opens the map, toggles layers, and selects a feature to see its details and sources.
3. **Scenario Lab**: The user keeps or changes the hypothetical reduction (default 25%) and duration (default 7 days), with oil and LNG selected by default, and sees separate calculations, results, and charts for oil and for LNG.
4. **Evidence**: The user opens the Evidence_Panel and inspects the sources, assumptions, reference periods, and limitations behind any figure.
5. **Intelligence Brief**: The user opens the Intelligence_Brief and reads a structured summary of the Active_Scenario, its calculations, and its evidence.

## Glossary

- **RIPPLE**: The web application described in this document.
- **Terminal**: The RIPPLE user interface as a whole, including all four Views.
- **View**: One of four top-level screens: Overview, Explore, Scenario Lab, Intelligence Brief.
- **Navigation_Bar**: The control that switches between Views.
- **Chokepoint_Id**: The unique identifier of a maritime chokepoint in the Curated_Dataset. The MVP contains one value, for the Strait of Hormuz.
- **Commodity_Id**: The unique identifier of a commodity in the Curated_Dataset. The MVP contains two values: crude oil (including petroleum liquids) and LNG.
- **Commodity_Scope**: The selection of crude oil, LNG, or both. URL values are `oil`, `lng`, and `both`.
- **Active_Scenario**: The single current set of scenario parameters (Disruption_Magnitude, Disruption_Duration, and Commodity_Scope) shared by all Views.
- **Disruption_Magnitude**: A hypothetical percentage reduction in baseline transit flow through the Strait of Hormuz, as a whole number from 0 to 100. It is not a measurement of any reduction in actual physical capacity.
- **Disruption_Duration**: A hypothetical length of time, as a whole number of days from 1 to 365, over which the hypothetical reduction is applied.
- **Scenario_Input_Validation**: The single canonical rule set for numeric scenario input defined in Requirement 6, applied to the Scenario Lab controls, URL parameters, and error announcements.
- **Scenario_Engine**: The deterministic calculation module that computes Calculated Outcomes from a scenario input and Curated_Dataset records. Its interface is independent of any specific chokepoint or commodity.
- **Curated_Dataset**: The static, version-controlled, schema-versioned data bundled with RIPPLE, containing Source_Records, Historical_Observations, Qualitative_Dependencies, and dependency graph definitions. It never contains a Synthetic_Record and is distinct from the Demo_Dataset.
- **Schema_Version**: The version identifier of the Curated_Dataset schema, stored in the Curated_Dataset.
- **Candidate_Source**: A publisher proposed as a possible authoritative source but not yet confirmed. The Candidate_Sources are the International Energy Agency (IEA), the US Energy Information Administration (EIA), and the United Nations Trade and Development (UNCTAD).
- **Source_Record**: A Curated_Dataset entry identifying a publication by publisher, title, URL, publication date, data reference period, units, retrieval date, usage licence, attribution requirement, Verification_Status, and verification date.
- **Verification_Status**: A field on each Source_Record and each Historical_Observation with the value "verified" or "unverified". The value "verified" records that the figure was checked against the cited publication.
- **Map_Component**: The MapLibre GL JS interactive map of the Strait of Hormuz and surrounding region.
- **Dependency_Graph**: The small, source-backed interactive node-and-edge graph connecting the Strait of Hormuz route to maritime transport, commodities, industries, and import-dependent economies.
- **Graph_Node**: An entity in the Dependency_Graph (maritime transport, commodity, industry, or import-dependent economy).
- **Graph_Edge**: A directed link between two Graph_Nodes, backed by at least one Source_Record.
- **Evidence_Panel**: The UI panel listing Source_Records, assumptions, data reference periods, and modelling limitations for the item in focus.
- **Intelligence_Brief**: The View that presents a structured summary of the Active_Scenario, its calculations, and its evidence.
- **Historical_Observation**: A figure taken from a Source_Record, displayed with its data reference period and unit.
- **Hypothetical_Assumption**: A user-set or fixed modelling input that is not an observation, including the Period_Day_Count.
- **Calculated_Outcome**: A figure produced by the Scenario_Engine from Historical_Observations and Hypothetical_Assumptions.
- **Baseline_Transit_Flow**: The Historical_Observation of transit flow through the Strait of Hormuz for one commodity, in the unit and time basis (per day or per year) used by its Source_Record.
- **Baseline_Daily_Flow**: The Baseline_Transit_Flow expressed per day, in the commodity's own unit. It equals the Baseline_Transit_Flow when the Source_Record is per day, and equals the Calculated result of the Annual_To_Daily_Step when the Source_Record is per year.
- **Period_Day_Count**: The number of days used as the divisor in the Annual_To_Daily_Step. For a calendar-year Historical_Observation it is 365 or 366 (leap year) according to the reference year; for any other reporting period it is the verified number of days represented by the source period. It is recorded in the Curated_Dataset, is a modelling assumption, and carries Class_Label "Hypothetical".
- **Annual_To_Daily_Step**: The documented, deterministic arithmetic step that divides a per-year Baseline_Transit_Flow by the Period_Day_Count. The Period_Day_Count is the modelling assumption (Class_Label "Hypothetical"); the resulting Baseline_Daily_Flow is the calculated result (Class_Label "Calculated").
- **Hypothetically_Reduced_Flow**: The Calculated_Outcome equal to Baseline_Daily_Flow multiplied by Disruption_Magnitude divided by 100 (daily figure), or that daily figure multiplied by Disruption_Duration in days (cumulative figure), in the commodity's own unit. It describes a hypothetical reduction in transit flow, not a measurement of physical capacity.
- **Scenario_Exposure_Index**: A hypothetical, simplified indicator calculated from a verified dependency percentage and a user-selected Disruption_Magnitude. For one Quantified_Economy and one commodity, it equals the verified percentage share of that economy's imports of the commodity that transit the Strait of Hormuz, multiplied by Disruption_Magnitude divided by 100. It is never presented as an expected loss of supply, a realised economic impact, or a forecast.
- **Scenario_Exposure_Disclaimer**: The exact text "Simplified, illustrative dependency indicator. Not a prediction of supply loss, economic damage, or commodity price changes."
- **Quantified_Economy**: An import-dependent economy for which the Curated_Dataset holds, for a commodity, a verified Source_Record containing a Hormuz-transit import share with its publication, observation period, unit, and value.
- **Qualitative_Dependency**: A documented dependency of an economy on a commodity transiting the Strait of Hormuz, described in words, backed by a verified Source_Record, and holding no numeric share.
- **Qualitative_Label**: The exact text "Qualitative documented dependency - not quantified".
- **Class_Label**: The visible text tag "Historical", "Hypothetical", or "Calculated" attached to a figure, or, only in Illustrative_Demo_Mode, "Illustrative".
- **App_Mode**: The user-selected operating mode of the Terminal, either Historical_Mode or Illustrative_Demo_Mode. It is not part of the Active_Scenario. URL parameter `mode`.
- **Historical_Mode**: The default App_Mode (URL value `historical`). It uses only the Curated_Dataset.
- **Illustrative_Demo_Mode**: An App_Mode (URL value `demo`) selected only by explicit user action or by `mode=demo` in the URL. It uses only the Demo_Dataset.
- **Demo_Dataset**: The static, schema-versioned file `public/data/demo/demo-dataset.json`, containing only Synthetic_Records, fictional declarations, and fictional assumptions. It is separate from the Curated_Dataset and ships in the production deployment.
- **Synthetic_Record**: A Demo_Dataset record with `synthetic: true`. It has no Source_Record, no Verification_Status, no reference period, and no publisher.
- **Illustrative_Label**: The exact text "Illustrative". It is the fourth Class_Label, permitted only in Illustrative_Demo_Mode, and applied to synthetic baseline flow inputs and synthetic dependency share inputs.
- **Demo_Marker**: The exact text "Illustrative demo". It is not a Class_Label.
- **Mode_Toggle**: The header control that switches the App_Mode. Its labels are "Switch to Illustrative demo mode" (in Historical_Mode) and "Return to Historical mode" (in Illustrative_Demo_Mode).
- **Demo_Banner**: The persistent region that contains the Demo_Banner_Text and a control labelled "Return to Historical mode".
- **Demo_Banner_Text**: The exact text "ILLUSTRATIVE DEMO MODE - synthetic data and fictional assumptions. Not historical, not current, not a prediction."
- **Demo_Data_Notice**: The exact text "Synthetic illustrative data for demonstration only. No Source_Record exists for these values. They are not Historical Observations and make no claim about any real flow, economy, or dependency."
- **Demo_No_Source_Text**: The exact text "No Source_Record - synthetic illustrative value".
- **Demo_Reference_Statement**: The exact text "Demo figures have no reference period. They describe no real conditions, flows, or economies."
- **Demo_Brief_Header**: The exact text "ILLUSTRATIVE DEMO BRIEF - synthetic data, not historical or predictive".
- **Demo_Brief_Footer**: The exact text "End of illustrative demo brief. Every figure above is synthetic and fictional."
- **Demo_Title_Prefix**: The exact text "Illustrative demo - ", used before chart titles and data-table captions. The document title uses the prefix "[Illustrative demo] ".
- **Mode_Announcements**: The exact texts "Illustrative demo mode on. Figures are synthetic and not historical." and "Historical mode on."
- **Analysis_Date**: The date, in YYYY-MM-DD format, on which the user views or generates the analysis, displayed in the UI.
- **Build_Date**: The date, in YYYY-MM-DD format, on which the Curated_Dataset version was built.
- **Observation_Age**: The elapsed time, in whole years and months, between the end of a Historical_Observation's data reference period and the Analysis_Date.
- **Stale_Threshold**: A configurable constant, default 12 months, to be confirmed by the user, above which an Observation_Age triggers the Older_Period_Notice. The threshold identifies an older reference period only. It does not indicate that the data is inaccurate, and the observation remains usable.
- **Older_Period_Notice**: The exact text "Older reference period - check it is still appropriate for your purpose."
- **Reference_Statement**: The exact text "Figures describe the stated reference period. They are not a claim about current conditions or current flows."
- **Continuous_Requirements**: The requirements that apply in every build phase: Requirements 4, 12, 14, and 18. Each phase must satisfy their criteria for the features that phase delivers.
- **Future_Modules**: The post-Kiroween modules named in Requirement 17: additional chokepoints, aviation, trade flows, DOMINO consequence modelling, and PARADOX evidence analysis. None is implemented in the MVP.
- **Performance_Targets**: The measurable targets defined in Requirement 16: 300 ms view navigation, 50 ms scenario calculation, and 4-second load.

## Requirements

### Requirement 1: Application Shell and Navigation

**Priority:** MVP-Core

**User Story:** As an analyst, I want to move between Overview, Explore, Scenario Lab, and Intelligence Brief without losing my scenario, so that I can work across views in one session.

#### Acceptance Criteria

1. THE Terminal SHALL provide exactly four Views named Overview, Explore, Scenario Lab, and Intelligence Brief, each reachable from the Navigation_Bar by a single selection and displayed without a full page reload.
2. THE Terminal SHALL assign each View a distinct URL path so that the View can be bookmarked and, when the URL is reloaded, display the same View.
3. WHEN the user switches Views, THE Terminal SHALL preserve every Active_Scenario parameter value and the App_Mode unchanged.
4. WHEN the Terminal loads a URL containing Active_Scenario parameters, THE Terminal SHALL initialise the Active_Scenario from those parameters using Scenario_Input_Validation (Requirement 6 criterion 10).
5. WHEN the Active_Scenario changes, THE Terminal SHALL update the URL to reflect all current Active_Scenario parameter values without adding a new browser history entry for each change.
6. WHILE a View is the current View, THE Terminal SHALL indicate it in the Navigation_Bar using distinct visual styling and the `aria-current="page"` attribute, and SHALL apply neither indication to any other View.
7. IF the user opens a URL path that does not match any of the four Views, THEN THE Terminal SHALL display the Overview, retain valid Active_Scenario parameters, and display a notice that the requested path was not found.

### Requirement 2: Overview View

**Priority:** MVP-Core

**User Story:** As a first-time visitor, I want a concise orientation to the Strait of Hormuz and RIPPLE, so that I understand what is shown and where to go next.

#### Acceptance Criteria

1. WHEN the Overview loads, THE Overview SHALL display the RIPPLE name, the tagline "One event. A thousand consequences.", a statement that the MVP covers only the Strait of Hormuz, oil, and LNG, and the Reference_Statement (in Illustrative_Demo_Mode, the Demo_Reference_Statement).
2. WHILE Historical_Mode is active, WHEN the Overview loads, THE Overview SHALL display, separately for crude oil and for LNG, the Baseline_Transit_Flow with its numeric value, its own unit and time basis, Class_Label "Historical", Source_Record title, data reference period, and Observation_Age.
3. WHILE Historical_Mode is active, IF a Baseline_Transit_Flow, Source_Record title, or data reference period is unavailable for a commodity, THEN THE Overview SHALL display a text indicator stating that the value is unavailable in place of the missing item, SHALL continue to display all other Overview content, and SHALL NOT display a numeric value without its Class_Label and Source_Record title.
4. WHEN the Overview loads, THE Overview SHALL display a definition of each of the three figure classes (Historical, Hypothetical, Calculated) in no more than 25 words per class, readable without hover, click, or expansion.
5. WHEN the Overview loads, THE Overview SHALL display a statement that RIPPLE uses curated static data, includes no live vessel tracking, and provides no forecasts.
6. WHEN the user activates a call-to-action on the Overview, THE Terminal SHALL navigate to the Explore View or the Scenario Lab View as labelled on that call-to-action, and SHALL keep the Active_Scenario unchanged.

### Requirement 3: Interactive Geographic Map

**Priority:** MVP-Core

**User Story:** As an analyst, I want to explore the Strait of Hormuz on an interactive map, so that I can see the geography of the chokepoint and its surroundings.

#### Acceptance Criteria

1. WHEN the Explore View loads, THE Map_Component SHALL render the Strait of Hormuz region using MapLibre GL JS with an initial view that contains the full transit corridor.
2. THE Map_Component SHALL support pan and zoom by mouse, touch, and keyboard (arrow keys pan, "+" and "-" zoom) and SHALL limit zoom to a range of 5 to 12.
3. THE Map_Component SHALL display curated features as four separately toggleable layers: the Strait of Hormuz transit corridor, the adjacent coastlines and states, major oil and LNG export terminals within the region, and illustrative shipping lane geometry.
4. WHEN the user selects a map feature, THE Map_Component SHALL display a detail card containing the feature name, the feature type, and the Class_Label for each figure shown on the card.
5. WHEN the user selects a map feature, THE Evidence_Panel SHALL display that feature's Source_Records, or, IF the feature has none, a notice that no Source_Records are available for that feature.
6. WHILE the shipping lane layer is visible, THE Map_Component SHALL display the label "Illustrative route, not live vessel position" on the shipping lane geometry.
7. THE Map_Component SHALL load only bundled Curated_Dataset geometry and a basemap, and SHALL NOT display vessel positions from any live source.
8. THE Explore View SHALL provide a text alternative listing the name and feature type of every curated feature, available at all times to assistive technology and visible when the map cannot render.
9. IF the basemap tiles fail to load or the browser does not support WebGL, THEN THE Explore View SHALL display a notice stating which of the two failed, SHALL display the text alternative from criterion 8, and, WHEN WebGL is supported, SHALL keep the curated feature layers visible on a plain background.

### Requirement 4: Data Sources and Verification

**Priority:** MVP-Core

**User Story:** As an analyst, I want every figure drawn from a verified, dated, licensed source, so that I can rely on the data and its terms of use.

#### Acceptance Criteria

1. THE Curated_Dataset SHALL treat the IEA, the US EIA, and UNCTAD as Candidate_Sources only, and SHALL NOT include any figure from a Candidate_Source until criterion 2 is satisfied for that figure.
2. THE Curated_Dataset SHALL record, for each Source_Record before any figure from it is included: the exact publication title, publisher, and URL; the observation or reference period (start date and end date); the units; the usage licence and any attribution requirement; the Verification_Status; the verification date; and a statement that the figure's value was checked against the cited publication.
3. IF any figure in the Curated_Dataset lacks a Verification_Status of "verified", or its Source_Record lacks any field listed in criterion 2, THEN THE build SHALL fail, report the record identifier and field name, and produce no build output.
4. THE Curated_Dataset SHALL include, for each Historical_Observation, a numeric value, a unit, a time basis (per day or per year), a data reference period expressed as a start date and an end date, and at least one Source_Record, with all dates in ISO 8601 calendar-date format.
5. THE Curated_Dataset SHALL include a Baseline_Transit_Flow for crude oil and petroleum liquids and a Baseline_Transit_Flow for LNG, each retained in the unit and time basis stated by its verified Source_Record, with no conversion applied.
6. THE Curated_Dataset SHALL include a Hormuz-transit import share for an economy and commodity only WHEN a verified Source_Record provides the publication, observation period, unit, and value for that economy and commodity.
7. THE Curated_Dataset SHALL contain no country-level value that is invented, estimated, interpolated, or back-filled from another economy, commodity, or period.
8. WHERE verified country-level data is unavailable for an economy and commodity, THE Curated_Dataset MAY instead include a Qualitative_Dependency for that economy and commodity, backed by a verified Source_Record and holding no numeric value.
9. THE Terminal SHALL display the Source_Record's licence and attribution requirement wherever the Source_Record is displayed.
10. IF a required Historical_Observation lacks a Source_Record in the Curated_Dataset, THEN THE Terminal SHALL display "Source unavailable" in place of the value and SHALL exclude that observation from Scenario_Engine calculations.
11. IF any Curated_Dataset record is missing a required field, contains a value that violates the schema (wrong type, out-of-range value, or malformed date), has a publication date or retrieval date later than the Build_Date, or has a data reference period whose end date precedes its start date, THEN THE build SHALL fail, report the record identifier and field name for each violation, and produce no build output.
12. WHEN the build runs, THE build SHALL validate the Curated_Dataset against its schema before producing any build output.
13. THE Curated_Dataset SHALL record, for each per-year Baseline_Transit_Flow, the Period_Day_Count: 365 or 366 for a calendar-year data reference period (with the reference year and a leap-year indicator), or the verified number of days represented by the source period for any other reporting period.
14. IF a per-year Baseline_Transit_Flow lacks a Period_Day_Count, or a calendar-year Period_Day_Count does not match the leap-year status of its reference year, THEN THE build SHALL fail, report the record identifier and field name, and produce no build output.

### Requirement 5: Scenario Parameter Controls

**Priority:** MVP-Core

**User Story:** As an analyst, I want to set a hypothetical percentage reduction and duration, so that I can test scenarios of different size and length.

#### Acceptance Criteria

1. THE Scenario Lab SHALL provide a control for Disruption_Magnitude, labelled "Hypothetical percentage reduction in baseline transit flow", with a default of 25.
2. THE Scenario Lab SHALL provide a control for Disruption_Duration, labelled "Hypothetical duration (days)", with a default of 7.
3. THE Scenario Lab SHALL provide a Commodity_Scope selector with exactly three options (crude oil, LNG, and both) and a default of both.
4. THE Scenario Lab SHALL apply Scenario_Input_Validation (Requirement 6) to the Disruption_Magnitude and Disruption_Duration controls.
5. WHEN the user sets any scenario control to a valid value, THE Terminal SHALL update the Active_Scenario and refresh all displayed Calculated_Outcomes.
6. THE Scenario Lab SHALL display the Class_Label "Hypothetical" adjacent to each of Disruption_Magnitude, Disruption_Duration, and Commodity_Scope at all times.
7. WHEN the user activates the reset control, THE Terminal SHALL set Disruption_Magnitude to 25, Disruption_Duration to 7 days, and Commodity_Scope to both, clear any control error messages, and refresh all displayed Calculated_Outcomes.
8. THE Scenario Lab SHALL display, at all times while scenario controls are visible, a statement that Disruption_Magnitude is a hypothetical percentage reduction in baseline transit flow, not a measured reduction in physical capacity, and that the scenario does not predict any event.

### Requirement 6: Scenario Input Validation

**Priority:** MVP-Core

**User Story:** As an analyst, I want one consistent set of input rules across controls, URLs, and assistive technology, so that invalid input always behaves the same way.

#### Acceptance Criteria

1. THE Scenario_Input_Validation SHALL accept Disruption_Magnitude only as a whole number from 0 to 100 inclusive, and Disruption_Duration only as a whole number from 1 to 365 inclusive.
2. WHEN a numeric input is received, THE Scenario_Input_Validation SHALL remove leading and trailing whitespace before evaluating the value, and SHALL treat whitespace inside the value as invalid.
3. WHEN a numeric input consists of digits with leading zeros and is otherwise valid (for example "007"), THE Scenario_Input_Validation SHALL accept the value and interpret it as the whole number without the leading zeros.
4. IF a numeric input is empty after whitespace removal, is non-numeric (including a "+" sign or any letter or symbol), contains a decimal separator (including "5.0"), or is outside the range in criterion 1 (including negative values), THEN THE Scenario_Input_Validation SHALL reject the value.
5. WHEN a numeric input is rejected in a Scenario Lab control, THE Scenario Lab SHALL retain the last valid value in the Active_Scenario, leave the displayed Calculated_Outcomes unchanged, and keep the rejected text visible in the control.
6. WHEN a numeric input is rejected, THE Scenario Lab SHALL display a text error message that names the control and states the allowed range, in the form "<control name> must be a whole number from <minimum> to <maximum>."
7. WHILE a control shows an error message, THE Scenario Lab SHALL set `aria-invalid="true"` on the control and reference the error message element in the control's `aria-describedby`.
8. WHEN an error message is displayed, THE Terminal SHALL announce the error message text through a live region.
9. WHEN the user next enters a valid value in a control that shows an error message, THE Scenario Lab SHALL remove the error message, remove `aria-invalid`, and remove the `aria-describedby` reference to the error message.
10. IF a URL parameter for Disruption_Magnitude, Disruption_Duration, or Commodity_Scope is rejected by criteria 1 to 4 (or is not one of `oil`, `lng`, `both` for Commodity_Scope), THEN THE Terminal SHALL replace that parameter with its default value, keep every valid parameter unchanged, display a notice naming each corrected parameter and its default value, and announce that notice through a live region. The same rule applies to the `mode` parameter as specified in Requirement 22 criterion 13.

### Requirement 7: Transparent Deterministic Calculations

**Priority:** MVP-Core

**User Story:** As an analyst, I want to see exactly how the hypothetically reduced flow and the Scenario_Exposure_Index are calculated for each commodity in its own unit, so that I can verify and trust the outputs.

#### Acceptance Criteria

1. WHEN the Baseline_Transit_Flow for a commodity has a per-year time basis, THE Scenario_Engine SHALL compute the Baseline_Daily_Flow as the Baseline_Transit_Flow divided by the Period_Day_Count recorded in the Curated_Dataset, and THE Scenario Lab SHALL display the Period_Day_Count as a modelling assumption with Class_Label "Hypothetical" (stating, for a calendar-year period, the reference year and whether it has 365 or 366 days) and SHALL display the resulting Baseline_Daily_Flow as a calculated result with Class_Label "Calculated".
2. WHEN the Baseline_Transit_Flow for a commodity has a per-day time basis, THE Scenario_Engine SHALL use it as the Baseline_Daily_Flow without any normalisation step.
3. WHEN an Active_Scenario is evaluated, THE Scenario_Engine SHALL compute, for each commodity in the Commodity_Scope, the daily Hypothetically_Reduced_Flow as Baseline_Daily_Flow × Disruption_Magnitude ÷ 100, in the commodity's own unit per day.
4. WHEN an Active_Scenario is evaluated, THE Scenario_Engine SHALL compute, for each commodity in the Commodity_Scope, the cumulative Hypothetically_Reduced_Flow as the daily Hypothetically_Reduced_Flow × Disruption_Duration in days, in the commodity's own unit.
5. WHEN an Active_Scenario is evaluated, THE Scenario_Engine SHALL compute, for each Quantified_Economy and each commodity in the Commodity_Scope, Scenario_Exposure_Index as the verified Hormuz-transit import share (a percentage from 0 to 100) × Disruption_Magnitude ÷ 100, expressed as a percentage.
6. WHEN the Commodity_Scope contains both commodities, THE Scenario_Engine SHALL return separate calculations and separate result values for each commodity, and THE Terminal SHALL NOT display any value that adds or combines oil and LNG quantities into one volume.
7. THE Scenario_Engine SHALL apply no unit conversion by default and SHALL NOT silently change any source unit, and, WHERE a unit conversion is configured in the Curated_Dataset, THE Terminal SHALL display the conversion explicitly, with the conversion factor, its Source_Record, and both units next to every converted value.
8. WHEN the Scenario_Engine is run twice with identical Active_Scenario and Curated_Dataset inputs, THE Scenario_Engine SHALL return outputs that are exactly equal in every numeric value and label.
9. THE Scenario_Engine SHALL complete every calculation with zero network requests and zero random-number calls.
10. WHEN a Calculated_Outcome is displayed, THE Scenario Lab SHALL display its formula, each input value with its Class_Label, unit, and source, and the resulting value with its unit and Class_Label "Calculated".
11. WHEN Disruption_Magnitude is 0, THE Scenario_Engine SHALL return 0 for every daily Hypothetically_Reduced_Flow, cumulative Hypothetically_Reduced_Flow, and Scenario_Exposure_Index value.
12. WHEN Disruption_Magnitude is 100, THE Scenario_Engine SHALL return a daily Hypothetically_Reduced_Flow equal to the Baseline_Daily_Flow and a Scenario_Exposure_Index equal to the verified Hormuz-transit import share.
13. WHEN Disruption_Magnitude or Disruption_Duration is increased with all other inputs unchanged, THE Scenario_Engine SHALL return a cumulative Hypothetically_Reduced_Flow that is greater than or equal to the previous value.
14. THE Scenario_Engine SHALL assume zero rerouting, zero pipeline bypass, and zero stock drawdown, and THE Evidence_Panel SHALL list this assumption as a modelling limitation whenever a Calculated_Outcome is displayed.
15. IF a required input to a calculation is unavailable, THEN THE Scenario_Engine SHALL return a "not calculable" result that names each missing input, SHALL return no numeric value for that calculation, and SHALL leave calculations whose inputs are all available unaffected.
16. IF Disruption_Magnitude or Disruption_Duration is outside the range in Requirement 6 criterion 1, THEN THE Scenario_Engine SHALL return a "not calculable" result identifying the invalid input and SHALL return no numeric value.
17. IF no Quantified_Economy exists for a commodity in the Commodity_Scope, THEN THE Scenario_Engine SHALL return an empty Scenario_Exposure_Index list for that commodity and SHALL still return the Hypothetically_Reduced_Flow results for that commodity.
18. IF a per-year Baseline_Transit_Flow has no Period_Day_Count, THEN THE Scenario_Engine SHALL return a "not calculable" result naming the Period_Day_Count as the missing input and SHALL NOT substitute a default day count.

### Requirement 8: Data Visualisations

**Priority:** MVP-Core

**User Story:** As an analyst, I want separate charts per commodity, so that I can compare results without mixing incompatible units.

#### Acceptance Criteria

1. WHEN an Active_Scenario is evaluated, THE Scenario Lab SHALL display, for each commodity in the Commodity_Scope, one chart of Baseline_Daily_Flow and daily Hypothetically_Reduced_Flow in that commodity's own unit per day, and SHALL display a separate chart for each commodity.
2. WHEN an Active_Scenario is evaluated, THE Scenario Lab SHALL display, for each commodity in the Commodity_Scope that has at least one Quantified_Economy, one chart of Scenario_Exposure_Index by Quantified_Economy, ranked in descending order of Scenario_Exposure_Index with ties broken by economy name in ascending alphabetical order, showing at most the 5 highest values, and, IF fewer than five verified country-level observations exist, showing only the available values without fabricating, estimating, or padding any value to fill the chart.
3. THE Scenario Lab SHALL exclude every Qualitative_Dependency from the quantitative charts and rankings only, because a Qualitative_Dependency holds no numeric value; Qualitative_Dependencies remain visible in the Dependency_Graph (Requirement 9 criterion 7) and the Intelligence_Brief (Requirement 11 criterion 4).
4. IF a commodity has no Quantified_Economy, THEN THE Scenario Lab SHALL display, in place of that commodity's Scenario_Exposure_Index chart, a message stating that no verified country-level data is available for that commodity, and SHALL NOT display empty axes.
5. WHEN the Active_Scenario changes, THE Terminal SHALL update all charts to reflect the new Active_Scenario.
6. THE Terminal SHALL provide each chart with a text alternative available to assistive technology, including a data table listing every plotted value with its category label and unit.
7. THE Terminal SHALL label each chart axis with a quantity name and unit, SHALL label each chart with its Class_Label, and SHALL label each Scenario_Exposure_Index chart with the Scenario_Exposure_Disclaimer.
8. THE Terminal SHALL distinguish chart series using at least one non-colour cue (shape, pattern, or text label) in addition to colour.

### Requirement 9: Interactive Dependency Graph (Simplified MVP)

**Priority:** MVP-Supporting

**User Story:** As an analyst, I want an interactive graph linking maritime transport, commodities, industries, and import-dependent economies, so that I can trace how documented dependencies connect.

#### Acceptance Criteria

1. THE Dependency_Graph SHALL contain Graph_Nodes of exactly four types (maritime transport, commodity, industry, and import-dependent economy), and SHALL assign each Graph_Node exactly one type. A small, source-backed network showing the Strait of Hormuz route, oil, LNG, industries, and documented import-dependent economies satisfies this requirement; no larger network is required.
2. THE Curated_Dataset SHALL define each Graph_Edge with a source node, a target node, a relationship description, and at least one verified Source_Record, where the source node and target node each reference an existing Graph_Node.
3. IF a Graph_Edge has zero Source_Records or references a non-existent Graph_Node, THEN THE build SHALL fail, identify the offending Graph_Edge, and produce no deployable artifact.
4. WHEN the user selects a Graph_Node, THE Dependency_Graph SHALL highlight that node, its directly connected edges (one hop), and the nodes at the other end of those edges, and THE Evidence_Panel SHALL display the Source_Records for the selected node and its directly connected edges.
5. WHEN the user selects a Graph_Edge, THE Evidence_Panel SHALL display that edge's relationship description and all of its Source_Records.
6. WHEN the Active_Scenario changes, THE Dependency_Graph SHALL update each Quantified_Economy node to show its Scenario_Exposure_Index value per commodity with Class_Label "Calculated" and the Scenario_Exposure_Disclaimer.
7. THE Dependency_Graph SHALL include a node and a sourced edge for every Qualitative_Dependency, whether or not any country-level quantitative share exists, and SHALL display, on each economy node that is not a Quantified_Economy for a commodity, the Qualitative_Label and the Qualitative_Dependency description, and SHALL display no numeric exposure value on that node for that commodity.
8. WHILE the Dependency_Graph has keyboard focus, THE Dependency_Graph SHALL let the user move focus between Graph_Nodes with the arrow keys or Tab, SHALL select the focused Graph_Node or Graph_Edge with the Enter or Space key, and SHALL show a visible focus indicator on the focused element.
9. THE Dependency_Graph SHALL provide a text-list alternative that lists every Graph_Node with its type and every Graph_Edge with its source node, target node, and relationship description, and that supports the same selection behaviour as criteria 4 and 5.
10. THE Dependency_Graph SHALL describe each Graph_Edge as a documented dependency and SHALL NOT display causal wording (such as "causes" or "leads to") or probability values for a Graph_Edge unless the cited Source_Records contain that claim.

### Requirement 10: Evidence Panel

**Priority:** MVP-Core

**User Story:** As an analyst, I want an evidence panel showing sources, assumptions, data dates, and limitations, so that I can judge how far to trust what I see.

#### Acceptance Criteria

1. WHEN the user activates the Evidence_Panel open control in the Explore, Scenario Lab, or Intelligence Brief View, THE Evidence_Panel SHALL open and display its content in that View.
2. WHEN the user focuses an item (map feature, graph node, graph edge, or Calculated_Outcome) while the Evidence_Panel is open, THE Evidence_Panel SHALL display that item's Source_Records, Hypothetical_Assumptions, data reference periods with Observation_Age, and modelling limitations.
3. IF the focused item has no Source_Records or no Hypothetical_Assumptions, THEN THE Evidence_Panel SHALL display a statement for each empty category indicating that none are recorded for that item, and SHALL still display the item's data reference periods and modelling limitations.
4. THE Evidence_Panel SHALL display, for each Source_Record, its publisher, title, publication date, data reference period, units, licence and attribution requirement, Verification_Status, and a link to the source URL.
5. IF a Source_Record has no publication date or no data reference period, THEN THE Evidence_Panel SHALL display a label indicating that the value is not available in place of the missing field.
6. WHEN the user activates a Source_Record link, THE Evidence_Panel SHALL open the external source in a new browser tab or window, and THE Terminal SHALL keep the Active_Scenario unchanged in the original tab.
7. WHILE no item is focused, THE Evidence_Panel SHALL display the general modelling limitations and the full list of Source_Records.
8. THE Evidence_Panel SHALL list all of these modelling limitations: static historical data, hypothetical percentage reduction rather than measured capacity, no rerouting or stock drawdown, no price or economic modelling, no live vessel data, no prediction of events, and the Scenario_Exposure_Disclaimer.
9. WHEN the user activates the Evidence_Panel close control, THE Evidence_Panel SHALL close and return keyboard focus to the element that opened it, or to the View's main heading IF that element is no longer present.

### Requirement 11: Intelligence Brief

**Priority:** MVP-Core

**User Story:** As an analyst, I want a structured brief of my active scenario, so that I can review its results and evidence.

#### Acceptance Criteria

1. WHEN the user opens the Intelligence_Brief, THE Intelligence_Brief SHALL present every Active_Scenario parameter with its name and value, each labelled with Class_Label "Hypothetical".
2. WHEN the user opens the Intelligence_Brief, THE Intelligence_Brief SHALL present, separately for each commodity in the Commodity_Scope, the daily and cumulative Hypothetically_Reduced_Flow in that commodity's own unit, labelled "Calculated", and SHALL NOT present any combined oil and LNG volume.
3. WHEN the user opens the Intelligence_Brief, THE Intelligence_Brief SHALL present, separately for each commodity in the Commodity_Scope, the Quantified_Economies ranked by Scenario_Exposure_Index from highest to lowest (at most 5, and only those for which verified country-level observations exist, with no fabricated entries), each labelled "Calculated" and accompanied by the Scenario_Exposure_Disclaimer.
4. WHEN the user opens the Intelligence_Brief, THE Intelligence_Brief SHALL present, in a section labelled with the Qualitative_Label, every Qualitative_Dependency for the Commodity_Scope, including when no Quantified_Economy exists for a commodity, unranked and with no numeric exposure value.
5. IF a commodity in the Commodity_Scope has zero Quantified_Economies, THEN THE Intelligence_Brief SHALL present a notice that no verified country-level data is available for that commodity and SHALL still present all other Intelligence_Brief content.
6. WHILE Historical_Mode is active, WHEN the user opens the Intelligence_Brief, THE Intelligence_Brief SHALL present each Baseline_Transit_Flow used by the Active_Scenario, labelled "Historical", with its source name, data reference period, unit, Observation_Age, and, where the Annual_To_Daily_Step is applied, the Period_Day_Count (labelled "Hypothetical", with 365 or 366 days stated for a calendar-year period) and the resulting Baseline_Daily_Flow (labelled "Calculated").
7. WHEN the user opens the Intelligence_Brief, THE Intelligence_Brief SHALL present every Source_Record, assumption, and modelling limitation relevant to the Active_Scenario, with no entries omitted or truncated, and the Reference_Statement.
8. WHEN the user opens the Intelligence_Brief, THE Intelligence_Brief SHALL display the Analysis_Date, the Build_Date, and the Curated_Dataset version identifier.
9. THE Intelligence_Brief SHALL use neutral analytical language and SHALL NOT include predictions, probabilities of events, or financial forecasts.

### Requirement 12: Data Integrity and Content Boundaries

**Priority:** MVP-Core

**User Story:** As a project owner, I want strict content boundaries, so that RIPPLE never presents invented or misleading intelligence.

#### Acceptance Criteria

1. THE Terminal SHALL display every numeric figure with exactly one Class_Label, being "Historical", "Hypothetical", or "Calculated" (or, only in Illustrative_Demo_Mode, "Illustrative" in place of "Historical"), shown as visible text adjacent to the figure.
2. THE Terminal SHALL present no real-time or simulated live shipping data, vessel tracking, or live price data.
3. IF a causal relationship or dependency has no verified Source_Record in the Curated_Dataset, THEN THE Terminal SHALL omit it from every View.
4. THE Terminal SHALL present no economic loss values, price values, or financial forecast values in any currency or unit.
5. WHEREVER Scenario_Exposure_Index is shown (Scenario Lab, graph nodes, Intelligence_Brief, and Evidence_Panel), THE Terminal SHALL display it with the Scenario_Exposure_Disclaimer.
6. THE Terminal SHALL NOT use the words "loss", "shortfall", or "at risk of losing", or the word "impact" in a predictive sense, in any text describing Scenario_Exposure_Index or Hypothetically_Reduced_Flow.
7. THE Terminal SHALL display the Analysis_Date in the application header or footer of every View, and SHALL display the Curated_Dataset version identifier and Build_Date in the application footer of every View.
8. THE Terminal SHALL display the Observation_Age beside every Historical_Observation, in the form "reference period ended N years and M months before the analysis date".
9. WHEN an Observation_Age exceeds the Stale_Threshold, THE Terminal SHALL display the Older_Period_Notice beside that observation, SHALL keep the observation available for display and Scenario_Engine calculations, and SHALL NOT state or imply that the observation is inaccurate, where the Stale_Threshold is a configurable constant with a default of 12 months, to be confirmed by the user.
10. THE Terminal SHALL display the Reference_Statement on every View at all times, without requiring user interaction. In Illustrative_Demo_Mode the Demo_Reference_Statement is displayed instead.
11. IF the Curated_Dataset version or Build_Date cannot be read, THEN THE Terminal SHALL display in the footer an indication that the dataset version is unavailable and SHALL continue to display all other content.
12. FOR ALL valid Active_Scenario values, THE Terminal SHALL produce Calculated_Outcomes derived only from Historical_Observations and Hypothetical_Assumptions present in the Curated_Dataset (Historical_Mode) or the Demo_Dataset (Illustrative_Demo_Mode) and the Active_Scenario.

### Requirement 13: Visual Design

**Priority:** MVP-Supporting

**User Story:** As a user, I want a dark intelligence-terminal look with readable typography, so that the tool feels credible and is comfortable to read.

#### Acceptance Criteria

1. THE Terminal SHALL render every View with a dark background whose relative luminance is 0.05 or lower, and SHALL use amber and cyan as the only two accent hues.
2. THE Terminal SHALL render body text at a font size of 16 px or larger and a line height of 1.4 or more times the font size.
3. THE Terminal SHALL use an original visual identity and SHALL NOT reproduce the interface layout, logos, or branding of Bloomberg Terminal or of fictional film or game interfaces.
4. WHERE the user's system requests reduced motion, THE Terminal SHALL disable all animation that is not essential to conveying a state change.
5. THE Terminal SHALL present the visual direction of an immersive, credible, premium dark geopolitical intelligence terminal, with an obsidian background, restrained amber and cyan accents, readable typography, interactive maritime geography, trade relationships, and transparent scenario analysis.

### Requirement 14: Accessibility

**Priority:** MVP-Core

**User Story:** As a user with accessibility needs, I want the application to be operable and understandable with assistive technology, so that I can use all features.

#### Acceptance Criteria

1. THE Terminal SHALL target WCAG 2.2 Level AA for every View, verified by an automated accessibility scan reporting 0 Level A or AA violations and by a manual keyboard and screen reader check of each View.
2. THE Terminal SHALL provide a contrast ratio of at least 4.5:1 for normal text and at least 3:1 for large text, interface components, and graphical objects, in every enabled component state.
3. THE Terminal SHALL make every interactive control reachable and operable using the keyboard alone, in a Tab order that follows the visual reading order of the View.
4. WHILE an interactive control has keyboard focus, THE Terminal SHALL display a focus indicator with a contrast ratio of at least 3:1 against adjacent colours and a thickness of at least 2 CSS pixels, and the focused control SHALL NOT be fully hidden by other content.
5. THE Terminal SHALL provide the landmarks header, nav, main, and footer exactly once each in every View, and exactly one level-one heading per View.
6. THE Terminal SHALL provide a "Skip to main content" link as the first focusable element in every View, and WHEN the link is activated, THE Terminal SHALL move keyboard focus to the main landmark.
7. THE Terminal SHALL provide a non-empty accessible name for every form control, map control, and graph control.
8. WHEN a View change completes, THE Terminal SHALL announce the new View name through a polite live region.
9. WHEN a scenario recalculation completes, THE Terminal SHALL announce a summary of the result of at most 150 characters through a polite live region, reporting each commodity separately in its own unit.
10. THE Terminal SHALL provide text alternatives for the map (Requirement 3 criterion 8), every chart (Requirement 8 criterion 6), and the Dependency_Graph (Requirement 9 criterion 9).
11. WHEN keyboard focus enters the Map_Component, THE Terminal SHALL allow the user to move focus out of the Map_Component to the next focusable element with a single press of the Tab key or Escape key.
12. THE Terminal SHALL handle invalid numeric input in form controls exclusively through Scenario_Input_Validation (Requirement 6 criteria 5 to 9) and SHALL NOT apply any other error-handling rule to Disruption_Magnitude or Disruption_Duration.

### Requirement 15: Responsive Layout

**Priority:** MVP-Supporting

**User Story:** As a user on any device, I want the application to work on phone, tablet, and desktop, so that I can use it wherever I am.

#### Acceptance Criteria

1. THE Terminal SHALL render all four Views with no horizontal page scrollbar at every viewport width from 320 px to 2560 px inclusive.
2. WHILE the viewport width is below 768 px, THE Terminal SHALL stack panels in a single vertical column and present the Evidence_Panel as a dismissible drawer that is closed by default.
3. WHILE the viewport width is 768 px or greater, THE Terminal SHALL present the Evidence_Panel beside the primary content with no overlap.
4. WHILE the primary input is a coarse pointer, THE Terminal SHALL size every interactive control to at least 44 by 44 CSS pixels.

### Requirement 16: Performance and Lightweight Architecture

**Priority:** MVP-Supporting

**User Story:** As a solo developer, I want a lightweight static architecture with measurable performance targets, so that I can build, host, and ship it before the deadline without making unverified claims.

#### Acceptance Criteria

1. THE Terminal SHALL be a client-side single-page application built with React and TypeScript, and SHALL use MapLibre GL JS for mapping.
2. THE Terminal SHALL bundle the Curated_Dataset as static files served from the same origin as the Terminal, SHALL require no application backend, and SHALL build into static files that need no server-side code execution.
3. THE Terminal SHALL send no runtime requests to any third-party API, and SHALL send requests to external origins only to retrieve basemap tiles.
4. THE project SHALL define these Performance_Targets, to be measured: view navigation completes within 300 ms; Scenario_Engine recalculation completes within 50 ms at the 95th percentile over 100 consecutive changes; and the Overview content displays within 4 seconds on a simulated mid-range mobile device (4x CPU throttling) over a simulated 4G connection (9 Mbps download, 170 ms round-trip latency) with an empty cache.
5. THE project SHALL record the measured result of each Performance_Target in the repository, with the measurement method, the device or environment, and the measurement date.
6. THE project SHALL NOT state in the README, the UI, or the submission materials that any Performance_Target is achieved until criterion 5 is satisfied for that target.
7. IF a Curated_Dataset file fails to load, THEN THE Terminal SHALL display an error message identifying the failed file by name, SHALL keep the Navigation_Bar operable, and SHALL keep all other successfully loaded Curated_Dataset content available.

### Requirement 17: Extensibility Constraints

**Priority:** MVP-Supporting

**User Story:** As a project owner, I want the architecture to allow more chokepoints, trade datasets, and analysis modules after the hackathon, so that the MVP is a foundation and not a dead end.

#### Acceptance Criteria

1. THE Curated_Dataset SHALL key every record by Chokepoint_Id, Commodity_Id, dataset identifier, and Source_Record identifier, as applicable to the record type.
2. THE Curated_Dataset SHALL include a Schema_Version, and THE build SHALL fail and report the unsupported value IF the Schema_Version is missing or is not a version the build supports.
3. THE Scenario_Engine SHALL accept as input a Chokepoint_Id, a Commodity_Id, a Baseline_Transit_Flow with unit and time basis, a Disruption_Magnitude, a Disruption_Duration, and dependency records, and SHALL contain no reference to the Strait of Hormuz, to oil, or to LNG in its interface or formulas.
4. THE project SHALL allow a record set for an additional chokepoint, commodity, or trade dataset to be added to the Curated_Dataset without any change to the names, types, or order of the Scenario_Engine inputs and outputs.
5. THE MVP SHALL NOT implement additional chokepoints, additional commodities, additional trade datasets, or advanced analysis modules, including any of the Future_Modules.
6. THE Curated_Dataset schema and the Scenario_Engine interface SHALL NOT preclude these named Future_Modules after Kiroween: additional chokepoints, aviation, trade flows, DOMINO consequence modelling, and PARADOX evidence analysis.
7. THE MVP SHALL implement none of the Future_Modules, and THE Terminal SHALL NOT present any Future_Module as an available feature.

### Requirement 18: Testability and Quality Gates

**Priority:** MVP-Core

**User Story:** As a solo developer, I want automated tests for the core logic, so that I can trust calculations and data as I build quickly.

#### Acceptance Criteria

1. THE project SHALL include automated unit tests for the Scenario_Engine in which each of Requirement 7 criteria 1 to 6 and 11 to 13, 17, and 18 is covered by at least one test case asserting an exact expected output value for a fixed input.
2. THE project SHALL include property-based tests that run at least 100 generated Active_Scenario inputs per property, drawn from the full valid range of each field, and verify that Scenario_Engine outputs are deterministic, are between 0 and the full Baseline_Daily_Flow per day inclusive, and are non-decreasing as Disruption_Magnitude increases and as Disruption_Duration increases.
3. THE project SHALL include property-based tests that run at least 100 generated Active_Scenario inputs per property and verify that decoding the URL encoding of an Active_Scenario returns every field value equal to the original (round-trip).
4. THE project SHALL include unit tests that verify every rule of Scenario_Input_Validation (Requirement 6 criteria 1 to 10) for both control input and URL parameters, using the same test cases for both.
5. THE project SHALL include schema-validation tests that fail, and identify the offending record or edge, IF any figure lacks a Verification_Status of "verified", or any Source_Record or Graph_Edge has a missing, empty, or null required field.
6. THE project SHALL include automated accessibility checks that run against each View and fail IF the tooling reports one or more WCAG 2.2 AA violations on that View.
7. THE project SHALL include an end-to-end test that sets the Active_Scenario to a non-default value in the Scenario Lab, navigates to every View, and verifies on each View that every Active_Scenario field value equals the value set.
8. IF any test defined in criteria 1 to 7 or criterion 9 fails, THEN THE project SHALL report the test run as failed with a non-zero exit status and SHALL identify each failing test by name.
9. THE project SHALL include property-based tests of at least 100 generated inputs each for these App_Mode rules: Historical_Mode never displays a Demo_Dataset value, the URL round-trip including the App_Mode, and the separation of the Curated_Dataset and the Demo_Dataset; and SHALL include unit tests for the demo labelling, the mode preservation across reset and View changes, and the correction of an invalid `mode` parameter.

### Requirement 19: Kiro Usage and Hackathon Submission

**Priority:** MVP-Core

**User Story:** As a hackathon entrant, I want Kiro usage preserved in the repository, so that judges can see how Kiro shaped the project.

#### Acceptance Criteria

1. THE project repository SHALL include the `.kiro` directory, committed to version control, with no `.gitignore` rule that matches the `.kiro` directory or any file inside it.
2. THE `.kiro` directory SHALL contain the specification documents `requirements.md`, `design.md`, and `tasks.md` for this feature, each as a non-empty file.
3. THE project repository SHALL include a `README.md` at the repository root containing a separate heading for each of: a description of RIPPLE, the Frankenstein theme connection, how Kiro was used, setup instructions, and the data source list.
4. THE project repository SHALL include a `LICENSE` file at the repository root containing the full text of one open-source licence recognised by the Open Source Initiative (OSI).
5. THE README SHALL state the Curated_Dataset version identifier, the reference period and licence of each data source, the Reference_Statement, and every limitation listed in Requirement 10 criterion 8.
6. WHEN a user follows the README setup instructions on a machine that meets the listed prerequisites, THE README SHALL enable the user to start RIPPLE without any step that the README does not describe.
7. IF the README omits any item required by criteria 3, 5 and 8, THEN THE project repository SHALL be treated as failing this requirement.
8. THE README SHALL include a judging note stating that Historical_Mode is the default, that Illustrative_Demo_Mode uses synthetic and fictional data only, and how to open it (`?mode=demo`).

### Requirement 20: MVP Scope Boundaries and Build Order

**Priority:** MVP-Core

**User Story:** As a solo developer, I want a clear scope boundary and build order, so that the MVP stays achievable before the deadline.

#### Acceptance Criteria

1. THE Terminal SHALL support exactly one chokepoint (the Strait of Hormuz) and exactly two commodities (oil and LNG) in the MVP.
2. THE Terminal SHALL provide no user account creation, no sign-in, no server-side storage of saved scenarios, and no analysis that combines more than one chokepoint in the MVP.
3. THE project SHALL define a build order of four phases, each assigned the requirements listed here. Phase 1 delivers the application shell, Overview, and Scenario Lab foundation with Requirements 1, 2, 5, 6, 7, and 17. Phase 2 completes the four-View workflow and the MVP user journey with Requirements 3, 8, 10, 11, and 22. The Requirement 22 data, schema, separation-check, URL-codec, and mode-state foundations are built in Phase 1 waves, and the demo user interface follows the Historical four-View journey in Phase 2 order. Phase 3 delivers Requirements 9, 13, 15, 16, and 19. Phase 4 delivers Requirement 21.
4. THE project SHALL apply Requirements 4, 12, 14, and 18 (the Continuous_Requirements covering dataset verification, source traceability, content boundaries, accessibility, and automated tests) in every phase, and each phase SHALL satisfy their criteria for the features that phase delivers, including the dataset records, source records, accessibility checks, and automated tests for those features.
5. WHEN a phase is scheduled to start, THE project SHALL have every requirement assigned to the previous phase meet its acceptance criteria, and SHALL have the criteria of the Continuous_Requirements that apply to the features delivered so far met, or have any exception recorded with a reason in the project's build-order document.
6. THE project SHALL NOT block a phase on any criterion of a Continuous_Requirement that applies only to a feature not yet delivered in that phase or an earlier phase.
7. THE project SHALL complete the four-View workflow (Overview, Explore, Scenario Lab, Intelligence Brief) by the end of Phase 2, before starting any work on Requirements 9, 13, 15, 16 (criteria 4 to 7), 19, or 21.
8. THE project SHALL apply Requirement 16 criteria 1 to 3 (architecture) from Phase 1 and Requirement 16 criteria 4 to 7 (measurement and reporting) in Phase 3.

### Requirement 21: Stretch Enhancements

**Priority:** Stretch

**User Story:** As a user, I want additional conveniences once the MVP user journey is complete, so that RIPPLE is more polished without delaying the core delivery.

#### Acceptance Criteria

1. WHERE advanced graph search is provided, THE Dependency_Graph SHALL list Graph_Nodes whose name contains the entered text (case-insensitive substring match), select a matching Graph_Node on user confirmation, and display a "no matching node" message while retaining the current selection IF nothing matches.
2. WHERE print output is provided, THE Intelligence_Brief SHALL produce a print layout containing all content of Requirement 11 criteria 1 to 8 with Class_Labels retained on each value.
3. WHERE a copy-link control is provided, THE Intelligence_Brief SHALL copy a URL that restores the same Active_Scenario, and, IF the copy fails, THEN THE Intelligence_Brief SHALL display the full URL as selectable text with a notice that the copy failed.
4. WHERE the Evidence_Panel drawer (Requirement 15 criterion 2) is open, THE Terminal SHALL close it WHEN the user presses the Escape key or taps outside the drawer, and SHALL return focus to the control that opened it.
5. WHERE extended layout support is provided, THE Terminal SHALL keep all content and functionality operable at 200 percent page zoom on a 1280 px wide viewport, and SHALL preserve the current View, scroll position, and entered input when the viewport width crosses 768 px.
6. WHERE extended charts are provided, THE Scenario Lab SHALL show up to 10 Quantified_Economies per Scenario_Exposure_Index chart in place of the MVP limit of 5.
7. WHERE a design-token set is provided, THE Terminal SHALL source all colour, spacing, and font-size values from that set.
8. WHERE multi-hop simulation or multi-hop path exploration is provided, THE Dependency_Graph SHALL highlight only paths composed of Graph_Edges that each have a verified Source_Record, and SHALL display no numeric value for any Graph_Node more than one hop from the selected node unless a verified Source_Record provides it.
9. WHERE complex graph animations are provided, THE Terminal SHALL disable them WHEN the user's system requests reduced motion.

### Requirement 22: Illustrative Demo Mode

**Priority:** MVP-Supporting

**User Story:** As a hackathon judge, I want an explicitly labelled demonstration mode with synthetic data, so that I can try a working Scenario Lab without mistaking its figures for historical data.

#### Acceptance Criteria

1. THE Terminal SHALL provide exactly two App_Modes, Historical_Mode and Illustrative_Demo_Mode, SHALL use Historical_Mode as the default, and SHALL enter Illustrative_Demo_Mode only WHEN the user activates the Mode_Toggle or WHEN the loaded URL contains `mode=demo`.
2. WHILE Historical_Mode is active, THE Terminal SHALL NOT request, read, display, or calculate with any Demo_Dataset value, the Illustrative_Label, the Demo_Marker, or the Demo_Banner_Text, and SHALL display "Source unavailable" or "not calculable" as specified in Requirements 4.10 and 7.15 in place of an unavailable Baseline_Transit_Flow or Source_Record, without substituting any Demo_Dataset value.
3. WHEN the user activates the Mode_Toggle, THE Terminal SHALL change the App_Mode, keep every Active_Scenario value and the current View unchanged, update the URL without adding a browser history entry, and announce the matching Mode_Announcement through a polite live region. WHEN the user activates the scenario reset control, THE Terminal SHALL leave the App_Mode unchanged.
4. THE Terminal SHALL display the Mode_Toggle in the header of every View as a keyboard-operable button whose accessible name equals its visible label. WHILE Illustrative_Demo_Mode is active, THE Demo_Banner SHALL contain a control labelled "Return to Historical mode", and WHEN that control is activated, THE Terminal SHALL switch to Historical_Mode and move keyboard focus to the Mode_Toggle.
5. WHILE Illustrative_Demo_Mode is active, THE Terminal SHALL display the Demo_Banner containing the Demo_Banner_Text at the top of every View, non-dismissible, remaining visible while the View scrolls, and distinguishable from other content by text and a non-colour border pattern in addition to colour.
6. WHILE Illustrative_Demo_Mode is active, THE Terminal SHALL display, on the Overview, the Scenario Lab, the Evidence_Panel, and the Intelligence_Brief, every numeric figure with exactly one Class_Label ("Illustrative" for synthetic baseline flows and share inputs, "Hypothetical" for scenario parameters and the Period_Day_Count, "Calculated" for Scenario_Engine outputs), the Demo_Marker adjacent to every figure labelled "Hypothetical" or "Calculated", and the Demo_No_Source_Text next to each synthetic input, and SHALL NOT display the Class_Label "Historical", any Observation_Age, the Older_Period_Notice, or any Source_Record title.
7. WHILE Illustrative_Demo_Mode is active, THE Terminal SHALL begin every chart title and data-table caption with the Demo_Title_Prefix, SHALL begin the document title with "[Illustrative demo] ", and SHALL begin each scenario-result announcement with "Illustrative demo." while keeping the announcement to at most 150 characters including that prefix.
8. WHILE Illustrative_Demo_Mode is active, THE Terminal SHALL display the Demo_Reference_Statement in place of the Reference_Statement on every View, SHALL display the Scenario_Exposure_Disclaimer wherever Scenario_Exposure_Index is shown, and SHALL add a definition of the Illustrative_Label of no more than 25 words, readable without interaction, to the Overview class definitions.
9. THE Terminal SHALL compute every Calculated_Outcome in both App_Modes with the same Scenario_Engine and the same input types, SHALL pass no App_Mode indicator to the Scenario_Engine, and SHALL apply the same defaults (25, 7, `both`), the same ranges, and the same Scenario_Input_Validation in both App_Modes.
10. THE Demo_Dataset SHALL contain only Synthetic_Records whose identifiers begin with `demo-`, economies whose names contain "(fictional)", units that contain "demo", and baseline flow and share values that are multiples of 10, each with a fictional assumption statement, and SHALL contain no URL, no date, no Verification_Status, no source record reference, and no text naming the IEA, EIA, UNCTAD, Vortexa, Kpler, or OPEC.
11. IF a Curated_Dataset record carries a `synthetic` key or an identifier beginning with `demo-`, or a Demo_Dataset record violates criterion 10 or shares an identifier with the Curated_Dataset, or a JSON file under `public/data/` outside `demo/` contains a `synthetic` key, THEN THE build SHALL fail, report the record identifier and field name, and produce no build output.
12. IF the Demo_Dataset file fails to load or validate in Illustrative_Demo_Mode, THEN THE Terminal SHALL display an error naming the file, SHALL display "Demo data unavailable" in place of each demo figure, SHALL stay in Illustrative_Demo_Mode, and SHALL use no Curated_Dataset value in place of a demo figure.
13. THE Terminal SHALL hold the App_Mode only in the URL parameter `mode`, writing `mode=demo` in Illustrative_Demo_Mode and omitting the parameter in Historical_Mode, SHALL carry it in every Navigation_Bar link and call-to-action, and SHALL store it in no browser storage. IF the `mode` URL parameter is present and is not exactly `historical` or `demo`, THEN THE Terminal SHALL replace it with `historical`, keep every valid parameter unchanged, display a notice naming `mode` and its default, and announce the notice through a live region.
14. WHILE Illustrative_Demo_Mode is active, THE Evidence_Panel SHALL, for a Demo_Dataset item, display the Demo_Data_Notice, the Demo_No_Source_Text in place of Source_Records, the fictional assumptions of the item, and every limitation of Requirement 10 criterion 8 plus "synthetic data" and "fictional economies", and SHALL NOT display a Verification_Status, licence, attribution, source link, or Observation_Age for that item.
15. WHILE Illustrative_Demo_Mode is active, THE Intelligence_Brief SHALL begin with the Demo_Brief_Header, end with the Demo_Brief_Footer, display the Demo_Banner and the labelling of criteria 6 and 7, present the statement "No qualitative dependencies are defined in the demo data." in place of the Qualitative_Label section, and, WHERE print output or a copy-link control is provided, SHALL carry the header, footer, and `mode=demo` into that output.
16. WHILE Illustrative_Demo_Mode is active, THE Terminal SHALL apply the content boundaries of Requirement 12 criteria 2, 4, 5, and 6 to every demo text and figure, and THE Explore View SHALL display the Demo_Banner, keep the map geometry, layers, feature detail cards, and Source_Records unchanged, display no Demo_Dataset value, Illustrative_Label, or Demo_Marker on the map or on a feature detail card, and state no dependency of any real economy or flow on any demo value.
