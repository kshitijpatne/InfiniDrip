import { execFileSync } from 'node:child_process';

for (const name of ['S554-exit-add-evidence.json', 'S554-exit-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S554-new-receiver-candidate-screen/${name}`], { stdio: 'inherit' });
}
