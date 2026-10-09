import { execFileSync } from 'node:child_process';
for (const name of ['S563-exit-add-evidence.json', 'S563-exit-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S563-clo-dxf-astm-size-probe/${name}`], { stdio: 'inherit' });
}
