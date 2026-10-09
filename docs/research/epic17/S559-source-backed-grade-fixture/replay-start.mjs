import { execFileSync } from 'node:child_process';
for (const name of ['S559-start-add-evidence.json', 'S559-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S559-source-backed-grade-fixture/${name}`], { stdio: 'inherit' });
}
