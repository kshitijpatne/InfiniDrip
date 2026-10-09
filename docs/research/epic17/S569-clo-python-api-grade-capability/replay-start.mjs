import { execFileSync } from 'node:child_process';

for (const name of ['S569-start-add-evidence.json', 'S569-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S569-clo-python-api-grade-capability/${name}`], { stdio: 'inherit' });
}
