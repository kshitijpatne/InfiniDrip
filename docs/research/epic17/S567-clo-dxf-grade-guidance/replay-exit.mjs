import { execFileSync } from 'node:child_process';

for (const name of ['S567-exit-add-evidence.json', 'S567-exit-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S567-clo-dxf-grade-guidance/${name}`], { stdio: 'inherit' });
}
