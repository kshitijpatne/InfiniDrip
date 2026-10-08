import { execFileSync } from 'node:child_process';
for (const name of ['S556-start-add-evidence.json', 'S556-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S556-v03-current-gate-reconciliation/${name}`], { stdio: 'inherit' });
}
