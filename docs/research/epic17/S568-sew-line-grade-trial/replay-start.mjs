import { execFileSync } from 'node:child_process';

for (const name of ['S568-start-add-evidence.json', 'S568-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S568-sew-line-grade-trial/${name}`], { stdio: 'inherit' });
}
