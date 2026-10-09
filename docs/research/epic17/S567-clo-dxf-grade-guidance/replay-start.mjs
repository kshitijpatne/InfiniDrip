import { execFileSync } from 'node:child_process';

for (const name of ['S567-start-add-evidence.json', 'S567-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S567-clo-dxf-grade-guidance/${name}`], { stdio: 'inherit' });
}
