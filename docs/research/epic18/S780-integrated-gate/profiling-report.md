# Slice 780 — app coverage worker profile

The repository rule calls for comparing the current Vitest worker setting with
one worker after memory pressure was recorded during S778's broad
app.test.ts coverage attempt. This profile used the same app test file and
coverage include for both runs:

    npm exec -- vitest run src/ui/app.test.ts --coverage --coverage.include=src/ui/app.ts

The current-setting run started at approximately 2026-10-13 19:33:35 UTC and
was stopped at 481 seconds, the same eight-minute diagnostic boundary used in
the prior attempt. Its Vitest process tree peaked at 3,347 MiB private memory
across 19 processes. System free physical memory ranged from roughly 560 to
820 MiB during observation. No test summary or coverage report was produced.
The runner output and measured values are retained in
app-coverage-current.stdout.txt and app-coverage-current-profile.json; stderr
is empty.

The one-worker run used the identical test and coverage arguments, adding
--maxWorkers=1 --minWorkers=1. It reached the same 480-second cap and was
stopped by the profile script at 481.6 seconds. The process tree peaked at
3,242.8 MiB private memory and 3,122.2 MiB working set across 7 processes. It
also produced no test summary or coverage report. Its command, timestamps,
measurements and logs are in app-coverage-one-worker-profile.json and the
matching stdout/stderr files.

One worker used about 104 MiB (3.1%) less peak private memory and reduced the
observed process count from 19 to 7. Neither run completed, so this profile
does not establish comparative full-run duration or a passing app coverage
result. Keep the checked-in worker defaults unchanged. For the single settled
global gate, use a one-worker command-line override to limit concurrent
workers across the full suite; record the full run's actual duration and
coverage result separately.

## Next action

Run the single full repository coverage gate with 100% statement, branch,
function and line thresholds using a one-worker override, preserving complete
output. Then proceed with the integrated build, release/readiness,
browser/Electron/package and actual-output gates only after diagnosing any
full-gate failure.
