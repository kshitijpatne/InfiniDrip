import { execFileSync } from 'node:child_process';
for (const name of ['S561-start-add-evidence.json', 'S561-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S561-grade-fixture-path-review/${name}`], { stdio: 'inherit' });
}
