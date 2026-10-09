import { execFileSync } from 'node:child_process';
for (const name of ['S561-exit-add-evidence.json', 'S561-exit-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S561-grade-fixture-path-review/${name}`], { stdio: 'inherit' });
}
