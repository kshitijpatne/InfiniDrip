import { execFileSync } from 'node:child_process';
for (const name of ['S557-start-add-evidence.json', 'S557-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S557-mark-and-grade-evidence-audit/${name}`], { stdio: 'inherit' });
}
