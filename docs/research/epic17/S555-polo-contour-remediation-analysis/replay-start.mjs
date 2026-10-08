import { execFileSync } from 'node:child_process';

for (const name of ['S555-start-add-evidence.json', 'S555-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S555-polo-contour-remediation-analysis/${name}`], { stdio: 'inherit' });
}
