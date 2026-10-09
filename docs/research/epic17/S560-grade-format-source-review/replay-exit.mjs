import { execFileSync } from 'node:child_process';
for (const name of ['S560-exit-add-evidence.json', 'S560-exit-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S560-grade-format-source-review/${name}`], { stdio: 'inherit' });
}
