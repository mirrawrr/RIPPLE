# Testing notes

## Property-based tests (fast-check)

- fast-check is a dev dependency only. Nothing under `src/` may import it or anything under `tests/` (checked in `tests/generators.test.ts`).
- Shared arbitraries live in `tests/generators.ts`. Global settings (at least 100 runs) are in `tests/fc-config.ts`, loaded by Vitest through `tests/setup.ts`.

## Reproducing a failure

A failing property prints a line like `Property failed after 12 tests { seed: 1234567, path: "11:0:2", endOnFailure: true }`.
Set `FC_SEED` to the printed seed to replay the same generated sequence, which reproduces the failure and its shrinking.

Command Prompt:

```
set FC_SEED=1234567& npm test
```

PowerShell (use `npm.cmd` if `npm.ps1` is blocked by the execution policy):

```
$env:FC_SEED=1234567; npm.cmd test
```

Clear the variable afterwards (`set FC_SEED=` in Command Prompt, `Remove-Item Env:FC_SEED` in PowerShell). `FC_SEED` must be an integer.

fast-check's `path` option cannot be set globally. To jump straight to the shrunk counterexample, pass `{ seed, path }` to the failing `fc.assert` temporarily.
