# Implementation security notes

Date: 2026

## Dependency advisories found at Task 1.1

`npm audit` after the Task 1.1 scaffold reported advisories affecting:

- **maplibre-gl 5.24.1**: XSS sanitizer bypass. Fixed in 6.x, which is a breaking upgrade.
- **Vitest 3.2.7** (via `@vitest/mocker` and `tinypool`): dev-only. Fixed in Vitest 5.x, which is a breaking upgrade.

## Required follow-up

- Review and resolve the maplibre-gl advisory with a compatible patched version before the MapLibre map task (11.4) is marked complete.
- Upgrade Vitest to a patched version and verify compatibility with the installed Vite and TypeScript versions before relying on the test infrastructure in CI. Task 17.6 is the latest point; earlier is preferred.
- Do not run `npm audit fix --force` blindly.
- Re-run `npm audit` after each dependency change and record the results in this file.
