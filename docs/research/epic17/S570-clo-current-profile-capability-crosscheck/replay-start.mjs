import { execFileSync } from 'node:child_process';

for (const name of ['S570-start-add-evidence.json', 'S570-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S570-clo-current-profile-capability-crosscheck/${name}`], { stdio: 'inherit' });
}
