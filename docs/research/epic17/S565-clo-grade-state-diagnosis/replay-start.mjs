import { execFileSync } from 'node:child_process';
for (const name of ['S565-start-add-evidence.json', 'S565-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S565-clo-grade-state-diagnosis/${name}`], { stdio: 'inherit' });
}
