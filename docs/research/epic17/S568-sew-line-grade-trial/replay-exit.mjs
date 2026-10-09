import { execFileSync } from 'node:child_process';

for (const name of ['S568-exit-add-evidence.json', 'S568-exit-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S568-sew-line-grade-trial/${name}`], { stdio: 'inherit' });
}
