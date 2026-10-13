# Slice 780 — global coverage confirmation record

## Qualifying integrated gate

The first settled full-repository run is the qualifying S780 coverage gate.
It completed with exit code 0 using:

```text
npm run coverage -- --maxWorkers=1 --minWorkers=1
```

The run passed all 179 test files and all 3,161 tests. Global statement,
branch, function, and line coverage were each 100%. Vitest reported 1,183.79
seconds (19 minutes 43.79 seconds), including 1,033.65 seconds in tests. The
full output is `global-coverage-attempt.txt`; the immutable, board-linked
summary is `global-coverage-report.md`.

## Additional confirmation attempt

After the qualifying run, an optional second full run was started to confirm
the result. It was stopped after Vitest reported one timeout while the single
worker was under high memory load. The test
`src/ui/project-manager.test.ts` — “validates T02 collection actions and edits
each sample/QA observation field” — exceeded its 15-second limit at 16.011
seconds. At that point 395 passing test results had been emitted. The run was
incomplete and produced no global coverage report; it is not a second gate.
Its full partial output is retained in
`global-coverage-confirmation-interrupted.txt`.

The exact timed-out case then passed in isolation in 3.889 seconds:

```text
.\node_modules\.bin\vitest.cmd run src/ui/project-manager.test.ts -t 'validates T02 collection actions and edits each sample/QA observation field' --maxWorkers=1 --minWorkers=1 --testTimeout=15000
```

The focused diagnostic output is `project-manager-timeout-diagnostic.txt`.
This matches the same test's 7.962-second pass in the qualifying full run.
The timeout occurred during high memory use and is consistent with a
load-sensitive timeout, but the available evidence does not prove its cause.
No test, timeout, coverage threshold, Vitest setting, product source,
dependency, or test configuration was changed to hide or relax it.

## Gate disposition

The first full run remains the single qualifying integrated gate. Since it
passed and no production source, in-suite test, test configuration, or
dependency changed after it, the optional interrupted run does not invalidate
that result and does not justify repeating the expensive full gate. Board,
documentation, and isolated S780 evidence-harness edits are not included in
the tested application. Any later source, test, configuration, or dependency
change before merge would require a new full gate.
