import { execFileSync } from 'node:child_process';
for (const name of ['S562-exit-add-evidence.json', 'S562-exit-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S562-grade-point-topology-map/${name}`], { stdio: 'inherit' });
}
