import { execFileSync } from 'node:child_process';
for (const name of ['S558-exit-add-evidence.json', 'S558-exit-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S558-clo-profile-authoritative-evidence/${name}`], { stdio: 'inherit' });
}
