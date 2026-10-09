import { execFileSync } from 'node:child_process';

for (const name of ['S566-start-add-evidence.json', 'S566-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S566-clo-sew-line-attribution/${name}`], { stdio: 'inherit' });
}
