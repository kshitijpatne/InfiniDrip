import { execFileSync } from 'node:child_process';

for (const name of ['S555-exit-add-evidence.json', 'S555-exit-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S555-polo-contour-remediation-analysis/${name}`], { stdio: 'inherit' });
}
